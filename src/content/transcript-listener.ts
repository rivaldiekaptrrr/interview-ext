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
  decodeCollectionsBuffer,
  type ParticipantInfo,
  type ParsedCaption,
} from './rtc-decoder';

type OnTranscriptUpdate = (entries: TranscriptEntry[], latestText: string) => void;

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
  private lastText: string = '';
  private lastSpeaker: string = '';
  private isRunning: boolean = false;
  private rafId: number | null = null;

  // ── WebRTC Interception state ──
  private isRtcActive: boolean = false;
  private lastRtcCaptionTime: number = 0;
  private participants: Map<string, ParticipantInfo> = new Map();
  private windowMessageHandler: (event: MessageEvent) => void;
  private onRtcStatusChange?: (active: boolean) => void;

  constructor(onUpdate: OnTranscriptUpdate) {
    this.onUpdate = onUpdate;
    this.windowMessageHandler = this.handleWindowMessage.bind(this);
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
  }

  /* ── WebRTC Message Handling ── */

  private async handleWindowMessage(event: MessageEvent): Promise<void> {
    if (!this.isRunning || event.source !== window || !event.data) return;

    const { source, buffer, isV2 } = event.data;

    // ── A. Handle Participant Roster Updates ──
    if (
      source === 'interview-ext-collections' ||
      source === 'interview-ext-collections-fetch'
    ) {
      if (buffer instanceof ArrayBuffer) {
        const found = await decodeCollectionsBuffer(buffer);
        for (const p of found) {
          this.participants.set(p.deviceId, p);
          // Also map short ID without devices/ prefix
          const shortId = p.deviceId.replace(/^devices\//, '');
          this.participants.set(shortId, p);
        }
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
            this.handleRtcCaption(cap);
          }
        }
      }
    }
  }

  /** Process a decoded WebRTC caption frame */
  private handleRtcCaption(cap: ParsedCaption): void {
    if (!cap.text || cap.text.trim().length === 0) return;

    // Resolve speaker name from participant directory
    let speaker = this.resolveSpeakerName(cap.deviceId);

    // Determine if this is the user or the interviewer
    const isSelf =
      speaker.toLowerCase() === this.selfName.toLowerCase() ||
      speaker.toLowerCase() === 'you' ||
      speaker.toLowerCase() === 'anda';

    this.handleExtractedUtterance(speaker, cap.text.trim(), isSelf, 'WebRTC');
  }

  /** Resolve deviceId to a human readable speaker name */
  private resolveSpeakerName(deviceId: string): string {
    if (!deviceId) return 'Interviewer';

    const p =
      this.participants.get(deviceId) ||
      this.participants.get(deviceId.replace(/^devices\//, ''));

    if (p && p.deviceName) return p.deviceName;

    // Check if deviceId matches self
    if (this.selfName && this.selfName !== 'You') {
      return 'Interviewer';
    }

    return 'Interviewer';
  }

  /* ── DOM Scraper Observer & Handling ── */

  private detectSelfName(): void {
    const selfIndicators = [
      document.querySelector('[data-self-name]'),
      document.querySelector('[data-resolution-cap]')?.closest('[data-participant-id]'),
      document.querySelector('[aria-label*="Your screen" i]'),
    ];

    for (const el of selfIndicators) {
      if (el) {
        const name = el.getAttribute('data-self-name') || el.textContent?.trim();
        if (name) {
          this.selfName = name;
          break;
        }
      }
    }

    if (!this.selfName) {
      this.selfName = 'You';
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

  private processCaptions(): void {
    if (!this.isRunning) return;

    // ── Primary Source Check ──
    // If WebRTC is actively delivering captions in real-time, yield to WebRTC
    // to prevent duplicate transcript entries from DOM scraping!
    if (this.isWebRtcActive()) {
      return;
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
        // Find associated speaker
        const containerBlock =
          activeSpeechEl.closest(
            '.TBMuR, [jscontroller="D1tKje"], [jsname="dsyhDe"], .nMcdL, .nMxRnf, [data-sender-name], [role="region"], .a4cQT, .caption-bubble'
          ) ||
          activeSpeechEl.parentElement?.parentElement?.parentElement ||
          activeSpeechEl.parentElement?.parentElement ||
          activeSpeechEl.parentElement;

        let speaker = 'Interviewer';
        if (containerBlock) {
          for (const sel of SPEAKER_NAME_SELECTORS) {
            const nameEl = containerBlock.querySelector(sel);
            if (nameEl?.textContent) {
              speaker = nameEl.textContent.replace(/:$/, '').trim();
              break;
            }
          }
        }

        const isSelf =
          speaker === this.selfName ||
          speaker.toLowerCase() === 'you' ||
          speaker.toLowerCase() === 'anda';

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

      // Extract speaker
      let speaker = 'Interviewer';
      for (const sSel of SPEAKER_NAME_SELECTORS) {
        const nameEl = container.querySelector(sSel);
        if (nameEl?.textContent) {
          speaker = nameEl.textContent.replace(/:$/, '').trim();
          break;
        }
      }

      // Collect ONLY clean leaf text nodes that are NOT in buttons, menus, dialogs, icons
      const textParts: string[] = [];
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
        }
      });

      const rawText = textParts.join(' ').trim();
      if (rawText && !isGoogleMeetUINoise(rawText)) {
        const isSelf =
          speaker === this.selfName ||
          speaker.toLowerCase() === 'you' ||
          speaker.toLowerCase() === 'anda';

        this.handleExtractedUtterance(speaker, rawText, isSelf, 'DOM');
        return;
      }
    }
  }

  private handleExtractedUtterance(
    speaker: string,
    text: string,
    isSelf: boolean,
    source: 'WebRTC' | 'DOM' = 'DOM'
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
      `[AI Interview Assistant] Live speech captured [${source}]: [${speaker}] "${text}" (isSelf: ${isSelf})`
    );

    // Update or append transcript entry
    const lastEntry = this.entries[this.entries.length - 1];
    if (lastEntry && lastEntry.speaker === speaker && Date.now() - lastEntry.timestamp < 6000) {
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

    this.onUpdate(this.entries, text);
  }
}
