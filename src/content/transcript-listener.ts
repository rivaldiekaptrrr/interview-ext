/* ── Google Meet Transcript Listener ── 
 * Hybrid Engine:
 * 1. Primary: WebRTC DataChannel Interceptor (inject-rtc.ts -> rtc-decoder.ts)
 *    - Captures pure binary Protobuf frames directly from Google Meet WebRTC wire.
 *    - 100% immune to UI/CSS changes and works silently without subtitles on screen.
 *    - Resolves speaker identity directly from meeting participant roster.
 * 2. Fallback: MutationObserver DOM caption scraper
 *    - Automatically activates if WebRTC captions are disabled or unavailable.
 * Includes strict UI noise filtering to ignore settings, menus, and language pickers.
 * ──────────────────────────────────────────────────────────────────── */

import type { TranscriptEntry } from '../lib/types';
import {
  decodeCaptionBuffer,
  decodeCollectionsDetails,
  type ParticipantInfo,
  type ParsedCaption,
} from './rtc-decoder';

type OnTranscriptUpdate = (entries: TranscriptEntry[], latestText: string) => void;

export interface RtcAudioHint {
  peakLocal: number;
  peakRemote: number;
  hasLocalStats?: boolean;
  hasRemoteStats?: boolean;
  remoteActiveSsrcs?: string[];
}

const DEFAULT_SELF_LABELS = new Set([
  'you',
  'anda',
  'me',
  'saya',
  'kandidat',
  'candidate',
]);

const RESUME_NON_NAME_WORDS = new Set([
  'curriculum', 'vitae', 'resume', 'cv', 'summary', 'profile', 'profil',
  'about', 'tentang', 'experience', 'pengalaman', 'education', 'pendidikan',
  'skills', 'keahlian', 'projects', 'proyek', 'contact', 'kontak',
  'engineer', 'developer', 'programmer', 'manager', 'analyst', 'designer',
  'architect', 'specialist', 'consultant', 'intern', 'internship', 'student',
  'graduate', 'software', 'firmware', 'hardware', 'iot', 'frontend', 'backend',
  'fullstack', 'mobile', 'android', 'ios', 'web', 'data', 'cloud', 'devops',
  'jakarta', 'bandung', 'surabaya', 'yogyakarta', 'semarang', 'medan', 'indonesia',
]);

/**
 * Extract plausible candidate name hints from the header of a resume/CV.
 */
export function extractCandidateNameHints(resumeText: string): string[] {
  if (!resumeText) return [];
  const lines = resumeText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 6);

  const hints: string[] = [];
  for (const line of lines) {
    if (line.length < 3 || line.length > 50) continue;
    if (/[@:/\\|•·\d]/.test(line)) continue;
    if (/https?|www\.|linkedin|github|gmail|yahoo|outlook/i.test(line)) continue;

    const words = line.split(/\s+/).filter(Boolean);
    if (words.length < 1 || words.length > 4) continue;

    // Must be purely alphabetic name-like words (allowing dots/apostrophes/hyphens)
    const allNameWords = words.every((w) => /^[A-Za-z\u00C0-\u024F.'-]{2,}$/.test(w));
    if (!allNameWords) continue;

    const hasNonNameKeyword = words.some((w) =>
      RESUME_NON_NAME_WORDS.has(w.toLowerCase().replace(/[.'-]/g, ''))
    );
    if (hasNonNameKeyword) continue;

    hints.push(line);
    break;
  }

  return hints;
}

/**
 * Pure helper to determine if a speaker label belongs to the local user ("self").
 */
export function isSelfSpeakerName(
  speaker: string,
  selfHints: Iterable<string>
): boolean {
  if (!speaker) return false;
  const rawLower = speaker.trim().toLowerCase();
  if (!rawLower) return false;

  if (/\((?:you|anda)\)\s*$/i.test(rawLower)) {
    return true;
  }

  const normalizedSpeaker = rawLower.replace(/\((?:you|anda)\)/gi, '').trim();
  if (!normalizedSpeaker) return false;

  if (DEFAULT_SELF_LABELS.has(normalizedSpeaker)) {
    return true;
  }

  if (
    normalizedSpeaker === 'interviewer' ||
    normalizedSpeaker === 'pewawancara' ||
    normalizedSpeaker === 'unknown'
  ) {
    return false;
  }

  const speakerWords = normalizedSpeaker.split(/\s+/).filter(Boolean);
  const speakerNoSpace = normalizedSpeaker.replace(/[^a-z0-9]/g, '');

  for (const rawHint of selfHints) {
    if (!rawHint) continue;
    const hint = rawHint.trim().toLowerCase();
    if (!hint || DEFAULT_SELF_LABELS.has(hint)) continue;

    // Email hint (e.g. from WIZ_global_data): compare local-part safely
    if (hint.includes('@')) {
      const localClean = hint.split('@')[0].replace(/[^a-z]/g, '');
      if (localClean.length >= 5) {
        if (speakerNoSpace.length >= 5 && localClean.startsWith(speakerNoSpace)) {
          return true;
        }
        const firstSpeakerWord = speakerWords[0]?.replace(/[^a-z]/g, '') || '';
        if (firstSpeakerWord.length >= 4 && localClean.startsWith(firstSpeakerWord)) {
          return true;
        }
      }
      continue;
    }

    if (normalizedSpeaker === hint) return true;
    if (
      normalizedSpeaker.startsWith(`${hint} `) ||
      hint.startsWith(`${normalizedSpeaker} `)
    ) {
      return true;
    }

    const hintWords = hint.split(/\s+/).filter(Boolean);
    const firstHintWord = hintWords[0] || '';
    if (firstHintWord.length >= 4 && speakerWords.includes(firstHintWord)) {
      return true;
    }
  }

  return false;
}

/** Generate canonical lookup keys for a Google Meet WebRTC deviceId */
export function normalizeDeviceIdKeys(deviceId: string): string[] {
  if (!deviceId) return [];
  const trimmed = deviceId.trim();
  const keys = new Set<string>([trimmed]);

  const noPrefix = trimmed.replace(/^devices\//, '');
  if (noPrefix) keys.add(noPrefix);

  const devicesIdx = trimmed.lastIndexOf('devices/');
  if (devicesIdx !== -1) {
    const fromDevices = trimmed.slice(devicesIdx);
    const afterDevices = trimmed.slice(devicesIdx + 'devices/'.length);
    if (fromDevices) keys.add(fromDevices);
    if (afterDevices) keys.add(afterDevices);
  }

  const lastSegment = trimmed.split('/').pop();
  if (lastSegment) keys.add(lastSegment);

  return Array.from(keys);
}

/** Selectors where real spoken speech words live in Google Meet DOM */
const SPEECH_TEXT_SELECTORS = [
  '.ygicle',                    // Google Meet main caption line
  '.VbkSUe',                    // Google Meet dynamic subtitle span
  '.iTTPOb',                    // Google Meet live speech text container
  '.bh44bd',                    // Google Meet alternative subtitle text
  '.caption-text',              // Simulator caption text
  '[jsname="tgaKEf"]',          // Google Meet speech segment
  '[jsname="YSxPC"]',           // Google Meet subtitle container
];

/** Selectors for speaker names */
const SPEAKER_NAME_SELECTORS = [
  '.NWpY1d',                     // Google Meet speaker header (standard)
  '.zs7s8d.jxFHg',               // Exact speaker name in Google Meet (Notulen selector)
  '.zs7s8d',                     // Primary speaker name in captions
  '.KcIKyf',                     // Alternative speaker class
  '.jT5TUd',                     // Modern Meet speaker header
  '.caption-speaker',            // Simulator speaker name
  '[data-sender-name]',          // Data-attribute speaker
];

/**
 * Elements that are control UI and must NOT be interpreted as speech.
 */
const IGNORED_ELEMENT_SELECTORS = [
  'button',
  '[role="button"]',
  '[role="menu"]',
  '[role="menuitem"]',
  '[role="listbox"]',
  '[role="option"]',
  '[role="dialog"]',
  '[role="radiogroup"]',
  '[role="toolbar"]',
  '[role="tablist"]',
  'ul',
  'li',
  '.google-symbols',
  '.material-icons',
  '.google-material-icons',
  '[class*="material-symbols"]',
  '.VfPpkd-Bz112c-LgbsSe',
  '[aria-label*="setting" i]',
  '[aria-label*="font" i]',
  '[aria-label*="jump" i]',
];

/**
 * Detects if a text string is actually Google Meet UI/Settings noise
 * rather than real human speech.
 */
function isGoogleMeetUINoise(text: string): boolean {
  if (!text) return true;
  const lower = text.toLowerCase();

  // Instant triggers for Meet caption UI controls
  if (
    lower.includes('format_size') ||
    lower.includes('font size') ||
    lower.includes('font color') ||
    lower.includes('open caption settings') ||
    lower.includes('jump to bottom') ||
    lower.includes('default default') ||
    lower.includes('tiny tiny') ||
    lower.includes('small small') ||
    lower.includes('medium medium') ||
    lower.includes('large large') ||
    lower.includes('huge huge') ||
    lower.includes('jumbo jumbo') ||
    lower.includes('white white black black')
  ) {
    return true;
  }

  // Count BETA tags (Meet displays BETA next to experimental caption languages)
  if (lower.split('beta').length >= 3) {
    return true;
  }

  // Multi-language menu detector
  const languageHits = [
    'afrikaans', 'albanian', 'amharic', 'arabic', 'azerbaijani', 'bengali',
    'bulgarian', 'burmese', 'catalan', 'cantonese', 'mandarin', 'czech',
    'dutch', 'filipino', 'finnish', 'galician', 'georgian', 'gujarati',
    'hebrew', 'hindi', 'hungarian', 'icelandic', 'indonesian', 'javanese',
    'kannada', 'kazakh', 'khmer', 'kinyarwanda', 'korean', 'latvian',
    'lithuanian', 'macedonian', 'malay', 'malayalam', 'marathi', 'mongolian',
    'nepali', 'norwegian', 'persian', 'polish', 'portuguese', 'romanian',
    'russian', 'serbian', 'sesotho', 'sinhala', 'slovak', 'slovenian',
    'spanish', 'sundanese', 'swahili', 'swedish', 'tamil', 'telugu',
    'thai', 'turkish', 'ukrainian', 'urdu', 'uzbek', 'vietnamese', 'xhosa', 'zulu'
  ];

  let langCount = 0;
  for (const lang of languageHits) {
    if (lower.includes(lang)) {
      langCount++;
      if (langCount >= 3) return true;
    }
  }

  return false;
}

export class TranscriptListener {
  private observer: MutationObserver | null = null;
  private entries: TranscriptEntry[] = [];
  private onUpdate: OnTranscriptUpdate;
  private selfName: string = '';
  private selfNames: Set<string> = new Set();
  private cvNameHints: Set<string> = new Set();
  private lastText: string = '';
  private lastSpeaker: string = '';
  private lastRtcMessageId: string = '';
  private isRunning: boolean = false;
  private rafId: number | null = null;

  // ── WebRTC Interception state ──
  private isRtcActive: boolean = false;
  private lastRtcCaptionTime: number = 0;
  private lastUnmutedAt: number = 0;
  private participants: Map<string, ParticipantInfo> = new Map();
  private ssrcToDeviceId: Map<string, string> = new Map();
  private selfDeviceIds: Set<string> = new Set();
  private remoteDeviceIds: Set<string> = new Set();
  private windowMessageHandler: (event: MessageEvent) => void;
  private onRtcStatusChange?: (active: boolean) => void;

  constructor(onUpdate: OnTranscriptUpdate) {
    this.onUpdate = onUpdate;
    this.windowMessageHandler = this.handleWindowMessage.bind(this);
  }

  /** Set candidate name/email hints (session = Meet account/tile, resume = CV fallback) */
  setSelfNameHints(
    hints: string[],
    source: 'session' | 'resume' = 'resume'
  ): void {
    for (const h of hints) {
      const cleaned = h?.trim();
      if (cleaned && !DEFAULT_SELF_LABELS.has(cleaned.toLowerCase())) {
        if (source === 'session') {
          this.selfNames.add(cleaned);
          if (!this.selfName || this.selfName === 'You' || this.selfName === 'Anda') {
            this.selfName = cleaned;
          }
        } else {
          this.cvNameHints.add(cleaned);
        }
      }
    }
    this.reclassifyStoredParticipants();
  }

  /** Set status change callback for WebRTC live indicator */
  setRtcStatusCallback(cb: (active: boolean) => void): void {
    this.onRtcStatusChange = cb;
  }

  /** Is WebRTC active and currently streaming speech */
  isWebRtcActive(): boolean {
    return this.isRtcActive && Date.now() - this.lastRtcCaptionTime < 10000;
  }

  /** Start observing Google Meet captions (WebRTC + DOM fallback) */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    // Detect user's own display name in Meet
    this.detectSelfName();

    // 1. Listen for WebRTC raw frames dispatched by inject-rtc.ts
    window.addEventListener('message', this.windowMessageHandler);

    // Ask MAIN world hook to replay any collections/self-hints captured before start()
    try {
      window.postMessage({ source: 'interview-ext-replay-request' }, '*');
    } catch {}

    // 2. Attach DOM observer as immediate secondary/fallback
    this.attachObserver();

    // Initial check in case captions are already on screen
    this.scheduleCheck();
  }

  /** Stop the listener */
  stop(): void {
    this.isRunning = false;

    window.removeEventListener('message', this.windowMessageHandler);

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  /** Get all collected transcript entries */
  getEntries(): TranscriptEntry[] {
    return [...this.entries];
  }

  /** Get latest captured non-empty speech text */
  getLatestNonEmptyText(): string {
    if (this.lastText) return this.lastText;
    if (this.entries.length > 0) return this.entries[this.entries.length - 1].text;
    return '';
  }

  /** Get latest non-self text */
  getLatestInterviewerText(): string {
    const nonSelf = this.entries.filter((e) => !e.isSelf);
    return nonSelf.length > 0 ? nonSelf[nonSelf.length - 1].text : '';
  }

  /** Clear history */
  clear(): void {
    this.entries = [];
    this.lastText = '';
    this.lastSpeaker = '';
    this.lastRtcMessageId = '';
  }

  /* ── WebRTC Message Handling ── */

  private registerParticipant(p: ParticipantInfo): void {
    if (!p.deviceId) return;
    for (const key of normalizeDeviceIdKeys(p.deviceId)) {
      this.participants.set(key, p);
    }
    if (p.deviceName && this.isSessionSelfSpeaker(p.deviceName)) {
      for (const key of normalizeDeviceIdKeys(p.deviceId)) {
        this.selfDeviceIds.add(key);
        this.remoteDeviceIds.delete(key);
      }
    }
  }

  private findParticipant(deviceId: string): ParticipantInfo | undefined {
    for (const key of normalizeDeviceIdKeys(deviceId)) {
      const p = this.participants.get(key);
      if (p) return p;
    }
    return undefined;
  }

  private markDeviceSelf(deviceId: string): void {
    for (const key of normalizeDeviceIdKeys(deviceId)) {
      this.selfDeviceIds.add(key);
      this.remoteDeviceIds.delete(key);
    }
  }

  private markDeviceRemote(deviceId: string): void {
    for (const key of normalizeDeviceIdKeys(deviceId)) {
      if (!this.selfDeviceIds.has(key)) {
        this.remoteDeviceIds.add(key);
      }
    }
  }

  private isDeviceKnownSelf(deviceId: string): boolean {
    return normalizeDeviceIdKeys(deviceId).some((k) => this.selfDeviceIds.has(k));
  }

  private isDeviceKnownRemote(deviceId: string): boolean {
    return normalizeDeviceIdKeys(deviceId).some((k) => this.remoteDeviceIds.has(k));
  }

  private reclassifyStoredParticipants(): void {
    for (const p of this.participants.values()) {
      if (p.deviceName && this.isSessionSelfSpeaker(p.deviceName)) {
        this.markDeviceSelf(p.deviceId);
      }
    }
  }

  private async handleWindowMessage(event: MessageEvent): Promise<void> {
    if (!this.isRunning || event.source !== window || !event.data) return;

    const { source, buffer, isV2, audioHint, email, displayName } = event.data;

    // ── 0. Handle Self Identity Hints from MAIN world ──
    if (source === 'interview-ext-self-hint') {
      const hints: string[] = [];
      if (typeof displayName === 'string' && displayName.trim()) hints.push(displayName.trim());
      if (typeof email === 'string' && email.trim()) hints.push(email.trim());
      if (hints.length > 0) this.setSelfNameHints(hints, 'session');
      return;
    }

    // ── A. Handle Participant Roster & Media SSRC Updates ──
    if (
      source === 'interview-ext-collections' ||
      source === 'interview-ext-collections-fetch'
    ) {
      if (buffer instanceof ArrayBuffer) {
        const { participants, streams } = await decodeCollectionsDetails(buffer);
        for (const p of participants) {
          this.registerParticipant(p);
        }
        for (const st of streams) {
          if (st.streamType === 1 && st.ssrc && st.deviceId) {
            const p = this.findParticipant(st.deviceId);
            if (!p?.parentDeviceId) {
              this.ssrcToDeviceId.set(st.ssrc, st.deviceId);
            }
          }
        }
        // Re-scan DOM tiles so newly synced participants can be matched against [data-participant-id]
        this.detectSelfName();
      }
      return;
    }

    // ── B. Handle Binary Caption Frames from WebRTC ──
    if (source === 'interview-ext-caption') {
      if (buffer instanceof ArrayBuffer) {
        const captions = await decodeCaptionBuffer(buffer, Boolean(isV2));
        if (captions && captions.length > 0) {
          const wasActive = this.isWebRtcActive();
          this.isRtcActive = true;
          this.lastRtcCaptionTime = Date.now();

          if (!wasActive && this.onRtcStatusChange) {
            this.onRtcStatusChange(true);
          }

          for (const cap of captions) {
            this.handleRtcCaption(cap, audioHint);
          }
        }
      }
    }
  }

  /** Match speaker against authoritative Meet session hints only (not CV fallback) */
  private isSessionSelfSpeaker(speaker: string): boolean {
    const hints = new Set<string>(this.selfNames);
    if (this.selfName) hints.add(this.selfName);
    return isSelfSpeakerName(speaker, hints);
  }

  /** Helper to determine if a speaker name refers to the local user */
  private isSelfSpeaker(speaker: string): boolean {
    if (this.isSessionSelfSpeaker(speaker)) return true;
    // Only fall back to CV name hints when Meet's own local deviceId is not already locked to another tile
    if (this.selfDeviceIds.size === 0 && this.cvNameHints.size > 0) {
      return isSelfSpeakerName(speaker, this.cvNameHints);
    }
    return false;
  }

  /** Inspect Google Meet's microphone button to see if local user is currently muted */
  private isLocalMicMuted(): boolean | null {
    if (typeof document === 'undefined') return null;
    const micBtn = document.querySelector(
      'button[data-is-muted][aria-label*="mikrofon" i], button[data-is-muted][aria-label*="microphone" i], button[jsname="hw0c9"][data-is-muted]'
    );
    if (micBtn) {
      const attr = micBtn.getAttribute('data-is-muted');
      if (attr === 'true') return true;
      if (attr === 'false') {
        this.lastUnmutedAt = Date.now();
        return false;
      }
    }
    return null;
  }

  /** Check live DOM caption nodes to corroborate speaker identity for a given caption text */
  private findDomSpeakerForText(text: string): string | null {
    if (typeof document === 'undefined' || !text) return null;
    const targetLower = text.trim().toLowerCase();
    const probe = targetLower.slice(-Math.min(targetLower.length, 24));
    if (probe.length < 4) return null;

    const speechNodes = document.querySelectorAll(SPEECH_TEXT_SELECTORS.join(', '));
    for (let i = speechNodes.length - 1; i >= 0; i--) {
      const el = speechNodes[i];
      if (this.isElementIgnored(el)) continue;
      const fullLineEl = el.closest('.ygicle, [jsname="tgaKEf"], .iTTPOb, .bh44bd') || el;
      const nodeText = (fullLineEl.textContent || '').trim().toLowerCase();
      if (!nodeText) continue;

      if (
        nodeText === targetLower ||
        nodeText.includes(probe) ||
        targetLower.includes(nodeText.slice(-Math.min(nodeText.length, 24)))
      ) {
        const sp = this.extractSpeakerForSpeechElement(fullLineEl);
        if (sp && sp !== 'Interviewer') {
          return sp;
        }
      }
    }
    return null;
  }

  /** Process a decoded WebRTC caption frame */
  private handleRtcCaption(cap: ParsedCaption, audioHint?: RtcAudioHint): void {
    if (!cap.text || cap.text.trim().length === 0) return;

    // Keep scanning DOM until both self name & self deviceId have been locked in
    if (this.selfNames.size === 0 || this.selfDeviceIds.size === 0) {
      this.detectSelfName();
    }

    // Correlate any active remote audio SSRCs (from RTCRtpReceiver.getContributingSources / getSynchronizationSources)
    if (audioHint?.remoteActiveSsrcs && audioHint.remoteActiveSsrcs.length > 0) {
      for (const ssrc of audioHint.remoteActiveSsrcs) {
        const remoteDev = this.ssrcToDeviceId.get(ssrc);
        if (remoteDev) {
          this.markDeviceRemote(remoteDev);
        }
      }
    }

    const cleanText = cap.text.trim();
    const micMuted = this.isLocalMicMuted();
    const sustainedMute =
      micMuted === true &&
      (this.lastUnmutedAt === 0 || Date.now() - this.lastUnmutedAt > 1500);

    const knownSelf = this.isDeviceKnownSelf(cap.deviceId);
    const knownRemote = this.isDeviceKnownRemote(cap.deviceId);
    let speaker = this.resolveSpeakerName(cap.deviceId);
    let isSelf = !knownRemote && (knownSelf || this.isSelfSpeaker(speaker));
    let classifyReason = knownRemote
      ? 'knownRemote'
      : knownSelf
      ? 'knownSelf'
      : isSelf
      ? 'selfName'
      : 'roster';

    // Physical mute override: a mic muted > 1.5s cannot physically generate speech captions
    if (sustainedMute) {
      isSelf = false;
      if (!knownSelf && cap.deviceId) {
        this.markDeviceRemote(cap.deviceId);
      }
      if (speaker === 'You') {
        speaker = this.findParticipant(cap.deviceId)?.deviceName || 'Interviewer';
      }
      classifyReason = 'micMuted';
    } else if (!isSelf && !knownRemote && cap.deviceId) {
      // 1. Check live DOM captions if subtitles are visible on screen
      const domSpeaker = this.findDomSpeakerForText(cleanText);
      if (domSpeaker) {
        if (this.isSelfSpeaker(domSpeaker)) {
          if (speaker !== 'Interviewer' && speaker !== 'You') {
            this.selfNames.add(speaker);
          }
          speaker = 'You';
          isSelf = true;
          classifyReason = 'domSelf';
          this.markDeviceSelf(cap.deviceId);
        } else {
          speaker = domSpeaker;
          classifyReason = 'domRemote';
          this.registerParticipant({ deviceId: cap.deviceId, deviceName: domSpeaker });
        }
      } else if (
        audioHint &&
        audioHint.hasLocalStats &&
        audioHint.hasRemoteStats &&
        speaker === 'Interviewer'
      ) {
        // 2. Acoustic direction correlation ONLY when deviceId is still unresolved AND both stats exist
        const localOnlySpeaking =
          audioHint.peakLocal >= 0.015 &&
          audioHint.peakRemote < 0.004 &&
          audioHint.peakLocal > audioHint.peakRemote * 3;
        const remoteOnlySpeaking =
          audioHint.peakRemote >= 0.015 &&
          audioHint.peakLocal < 0.004 &&
          audioHint.peakRemote > audioHint.peakLocal * 3;

        if (localOnlySpeaking) {
          speaker = 'You';
          isSelf = true;
          classifyReason = `audioLocal(L=${audioHint.peakLocal.toFixed(3)},R=${audioHint.peakRemote.toFixed(3)})`;
        } else if (remoteOnlySpeaking) {
          isSelf = false;
          classifyReason = `audioRemote(L=${audioHint.peakLocal.toFixed(3)},R=${audioHint.peakRemote.toFixed(3)})`;
        }
      }
    }

    this.handleExtractedUtterance(speaker, cleanText, isSelf, 'WebRTC', cap.messageId, classifyReason);
  }

  /** Resolve deviceId to a human readable speaker name */
  private resolveSpeakerName(deviceId: string): string {
    if (!deviceId) return 'Interviewer';
    if (this.isDeviceKnownSelf(deviceId)) return 'You';
    if (this.isDeviceKnownRemote(deviceId)) {
      return this.findParticipant(deviceId)?.deviceName || 'Interviewer';
    }

    const p = this.findParticipant(deviceId);
    if (p && p.deviceName) {
      if (this.isSessionSelfSpeaker(p.deviceName)) {
        this.markDeviceSelf(deviceId);
        return 'You';
      }
      if (this.selfDeviceIds.size === 0 && this.isSelfSpeaker(p.deviceName)) {
        return 'You';
      }
      return p.deviceName;
    }

    return 'Interviewer';
  }

  /* ── DOM Scraper Observer & Handling ── */

  private detectSelfName(): void {
    const addHint = (candidate: string | null | undefined) => {
      const cleaned = candidate?.replace(/\((?:You|Anda)\)/gi, '').trim();
      if (cleaned && !DEFAULT_SELF_LABELS.has(cleaned.toLowerCase())) {
        this.selfNames.add(cleaned);
        if (!this.selfName || this.selfName === 'You' || this.selfName === 'Anda') {
          this.selfName = cleaned;
        }
      }
    };

    if (typeof document === 'undefined') return;

    // 1. Check Google Account button/avatar in Meet UI (name + optional email)
    const accountEls = document.querySelectorAll(
      'button[aria-label*="Google Account" i], button[aria-label*="Akun Google" i], a[aria-label*="Google Account" i], a[aria-label*="Akun Google" i], img[alt*="Google Account" i], img[alt*="Akun Google" i]'
    );
    accountEls.forEach((accountEl) => {
      const label =
        accountEl.getAttribute('aria-label') || accountEl.getAttribute('alt') || '';
      const nameMatch = label.match(/(?:Google Account|Akun Google):\s*([^(\n\r]+)/i);
      if (nameMatch?.[1]) addHint(nameMatch[1]);
      const emailMatch = label.match(/([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/);
      if (emailMatch?.[1]) addHint(emailMatch[1]);
    });

    // 2. Check participant chips with (You) or (Anda)
    const selfChips = document.querySelectorAll(
      '[aria-label*="(You)" i], [aria-label*="(Anda)" i], span[title*="(You)" i], span[title*="(Anda)" i]'
    );
    selfChips.forEach((chip) => {
      const chipText =
        chip.getAttribute('aria-label') ||
        chip.getAttribute('title') ||
        chip.textContent ||
        '';
      if (chipText) addHint(chipText);
    });

    // 3. Scan [data-participant-id] Meet tiles directly (links DOM self-tile -> WebRTC deviceId!)
    // Google Meet ONLY renders visual_effects / Backgrounds and effects / Reframe controls on YOUR own tile.
    const tiles = document.querySelectorAll(
      '[data-participant-id], [data-requested-participant-id]'
    );
    tiles.forEach((tile) => {
      const devId =
        tile.getAttribute('data-participant-id') ||
        tile.getAttribute('data-requested-participant-id');
      if (!devId) return;

      const hasSelfControls = Boolean(
        tile.querySelector(
          'button[aria-label*="Backgrounds and effects" i], button[aria-label*="Latar belakang" i], button[aria-label*="visual effects" i], button[aria-label*="efek visual" i], button[aria-label*="Reframe" i], button[aria-label*="Bingkai ulang" i], button[aria-label*="Minimize" i], button[aria-label*="Perkecil" i]'
        )
      ) || /\b(?:visual_effects|Backgrounds and effects|Latar belakang dan efek|Apply visual effects)\b/i.test(
        tile.textContent || ''
      );

      const isExplicitSelf =
        hasSelfControls ||
        tile.getAttribute('data-is-self') === 'true' ||
        Boolean(tile.querySelector('[data-is-self="true"]'));

      const labelEls = tile.querySelectorAll(
        '.XEazBc.adnwBd .EY8ABd-OWXEXe-TAWMXe, .zWGUib, .dwSJ2e, .cS7aqe, [data-self-name]'
      );
      let tileIsSelf = isExplicitSelf;
      labelEls.forEach((lbl) => {
        const txt = (
          lbl.getAttribute('data-self-name') ||
          lbl.textContent ||
          ''
        ).trim();
        if (!txt) return;
        if (
          /^(?:you|anda|me|saya)$/i.test(txt) ||
          /\((?:you|anda)\)/i.test(txt) ||
          this.isSessionSelfSpeaker(txt)
        ) {
          tileIsSelf = true;
          addHint(txt);
        }
      });

      if (tileIsSelf) {
        this.markDeviceSelf(devId);
        const selfParticipant = this.findParticipant(devId);
        if (selfParticipant?.deviceName) {
          addHint(selfParticipant.deviceName);
        }
      }
    });

    // 4. Strictly read explicit [data-is-self="true"] markers (never assume [data-self-name] alone is local user!)
    const explicitSelfTile = document.querySelector('[data-is-self="true"]');
    if (explicitSelfTile) {
      const devId =
        explicitSelfTile.getAttribute('data-participant-id') ||
        explicitSelfTile.closest('[data-participant-id]')?.getAttribute('data-participant-id');
      if (devId) this.markDeviceSelf(devId);
    }

    if (!this.selfName) {
      this.selfName = 'You';
    }

    if (this.selfNames.size > 0 || this.selfDeviceIds.size > 0) {
      this.reclassifyStoredParticipants();
    }
  }

  private attachObserver(): void {
    if (this.observer) return;

    this.observer = new MutationObserver(() => {
      this.scheduleCheck();
    });

    // Observe document.body subtree
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  private scheduleCheck(): void {
    if (!this.isRunning) return;
    if (this.rafId !== null) return;

    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      this.processCaptions();
    });
  }

  private isElementIgnored(el: Element): boolean {
    return IGNORED_ELEMENT_SELECTORS.some((sel) => {
      try {
        return el.matches(sel) || Boolean(el.closest(sel));
      } catch {
        return false;
      }
    });
  }

  /** Extract speaker label tightly scoped to a specific speech element */
  private extractSpeakerForSpeechElement(activeSpeechEl: Element): string {
    const readNameFromEl = (nameEl: Element | null): string => {
      if (!nameEl) return '';
      const attr = nameEl.getAttribute('data-sender-name');
      const raw = attr || nameEl.textContent || '';
      return raw.replace(/:$/, '').trim();
    };

    // 1. Check strict per-utterance block classes (never outer all-speaker region containers)
    const perSpeakerBlock = activeSpeechEl.closest(
      '.nMcdL, .TBMuR, [jscontroller="D1tKje"], .nMxRnf, [data-sender-name], .caption-bubble'
    );
    if (perSpeakerBlock) {
      if (perSpeakerBlock.hasAttribute('data-sender-name')) {
        const attrName = readNameFromEl(perSpeakerBlock);
        if (attrName) return attrName;
      }
      for (const sel of SPEAKER_NAME_SELECTORS) {
        const nameEl = perSpeakerBlock.querySelector(sel);
        const extracted = readNameFromEl(nameEl);
        if (extracted) return extracted;
      }
    }

    // 2. Walk up max 4 levels stopping BEFORE outer multi-speaker containers
    let cur: Element | null = activeSpeechEl.parentElement;
    for (let depth = 0; depth < 4 && cur; depth++) {
      if (
        cur.matches('[role="region"], .a4cQT, [jsname="dsyhDe"], body, html')
      ) {
        break;
      }
      for (const sel of SPEAKER_NAME_SELECTORS) {
        const matches = cur.querySelectorAll(sel);
        if (matches.length === 1) {
          const extracted = readNameFromEl(matches[0]);
          if (extracted) return extracted;
        }
      }
      cur = cur.parentElement;
    }

    // 3. Inside multi-speaker caption region, pick the LAST speaker label preceding activeSpeechEl
    const region = activeSpeechEl.closest('[role="region"], .a4cQT, [jsname="dsyhDe"]');
    if (region) {
      const allLabels = region.querySelectorAll(SPEAKER_NAME_SELECTORS.join(', '));
      for (let i = allLabels.length - 1; i >= 0; i--) {
        const lbl = allLabels[i];
        const pos = lbl.compareDocumentPosition(activeSpeechEl);
        // lbl precedes activeSpeechEl or contains it
        if (
          (pos & Node.DOCUMENT_POSITION_FOLLOWING) !== 0 ||
          (pos & Node.DOCUMENT_POSITION_CONTAINED_BY) !== 0
        ) {
          const extracted = readNameFromEl(lbl);
          if (extracted) return extracted;
        }
      }
    }

    return 'Interviewer';
  }

  private processCaptions(): void {
    if (!this.isRunning) return;

    // Refresh local mic mute timestamp on DOM updates
    this.isLocalMicMuted();

    // ── Primary Source Check ──
    // If WebRTC is actively delivering captions in real-time, yield to WebRTC
    // to prevent duplicate transcript entries from DOM scraping!
    if (this.isWebRtcActive()) {
      return;
    }

    if (this.selfNames.size === 0) {
      this.detectSelfName();
    }

    // ── Fallback Strategy A: Direct Speech Elements (.ygicle, .VbkSUe, .iTTPOb, etc.) ──
    const speechNodes = document.querySelectorAll(SPEECH_TEXT_SELECTORS.join(', '));

    if (speechNodes.length > 0) {
      let activeSpeechEl: Element | null = null;
      let speechText = '';

      // Traverse from newest/last speech node to oldest
      for (let i = speechNodes.length - 1; i >= 0; i--) {
        const el = speechNodes[i];
        if (this.isElementIgnored(el)) continue;

        // If this element is a span inside a .ygicle or [jsname="tgaKEf"], use the full container line
        const fullLineEl = el.closest('.ygicle, [jsname="tgaKEf"], .iTTPOb, .bh44bd') || el;
        const text = fullLineEl.textContent?.trim() || '';

        if (text && text.length > 1 && !isGoogleMeetUINoise(text)) {
          activeSpeechEl = fullLineEl;
          speechText = text;
          break;
        }
      }

      if (activeSpeechEl && speechText) {
        const speaker = this.extractSpeakerForSpeechElement(activeSpeechEl);
        const isSelf = this.isSelfSpeaker(speaker);

        this.handleExtractedUtterance(speaker, speechText, isSelf, 'DOM');
        return;
      }
    }

    // ── Fallback Strategy B: Container Search ([jsname="dsyhDe"], [jsname="YSxPC"], .a4cQT, etc.) ──
    const containerSelectors = [
      '[jsname="dsyhDe"]',
      '[role="region"][aria-label*="caption" i]',
      '[role="region"][aria-label*="subtitle" i]',
      '[role="region"][aria-label*="teks" i]',
      '[jsname="YSxPC"]',
      '.a4cQT',
      '.caption-bubble',
    ];

    for (const sel of containerSelectors) {
      const container = document.querySelector(sel);
      if (!container) continue;

      // Collect ONLY clean leaf text nodes that are NOT in buttons, menus, dialogs, icons
      const textParts: string[] = [];
      let lastSpeechLeaf: Element | null = null;
      const spans = container.querySelectorAll('span, div');

      spans.forEach((node) => {
        if (node.children.length > 0) return; // Only process leaf nodes
        if (this.isElementIgnored(node)) return;

        const isSpeaker = SPEAKER_NAME_SELECTORS.some(
          (sSel) => node.matches(sSel) || Boolean(node.closest(sSel))
        );
        if (isSpeaker) return;

        const text = node.textContent?.trim();
        if (text && !textParts.includes(text) && !isGoogleMeetUINoise(text)) {
          textParts.push(text);
          lastSpeechLeaf = node;
        }
      });

      const rawText = textParts.join(' ').trim();
      if (rawText && !isGoogleMeetUINoise(rawText)) {
        const speaker = lastSpeechLeaf
          ? this.extractSpeakerForSpeechElement(lastSpeechLeaf)
          : 'Interviewer';
        const isSelf = this.isSelfSpeaker(speaker);

        this.handleExtractedUtterance(speaker, rawText, isSelf, 'DOM');
        return;
      }
    }
  }

  private handleExtractedUtterance(
    speaker: string,
    text: string,
    isSelf: boolean,
    source: 'WebRTC' | 'DOM' = 'DOM',
    messageId: string = '',
    reason: string = source.toLowerCase()
  ): void {
    if (!text) return;

    // Safety Filter: Discard any UI settings noise
    if (isGoogleMeetUINoise(text)) {
      return;
    }

    // Skip if identical to last state
    if (text === this.lastText && speaker === this.lastSpeaker) {
      return;
    }

    this.lastText = text;
    this.lastSpeaker = speaker;

    console.log(
      `[AI Interview Assistant] Live speech captured [${source}]: [${speaker}] "${text}" (isSelf: ${isSelf}, via: ${reason})`
    );

    // Update or append transcript entry
    const lastEntry = this.entries[this.entries.length - 1];
    const sameMessageStream =
      Boolean(messageId) && messageId === this.lastRtcMessageId;
    if (
      lastEntry &&
      lastEntry.isSelf === isSelf &&
      lastEntry.speaker === speaker &&
      (sameMessageStream || Date.now() - lastEntry.timestamp < 6000)
    ) {
      lastEntry.text = text;
      lastEntry.timestamp = Date.now();
    } else {
      this.entries.push({
        speaker,
        text,
        timestamp: Date.now(),
        isSelf,
      });

      if (this.entries.length > 50) {
        this.entries = this.entries.slice(-50);
      }
    }

    if (messageId) {
      this.lastRtcMessageId = messageId;
    }

    this.onUpdate(this.entries, text);
  }
}
