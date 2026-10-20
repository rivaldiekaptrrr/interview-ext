/* ── Google Meet Transcript Listener ── 
 * Uses MutationObserver to capture live captions from Google Meet DOM.
 * Distinguishes between interviewer and candidate speech.
 * Includes strict UI noise filtering to ignore settings, menus, and language pickers.
 * ──────────────────────────────────────────────────────────────────── */

import type { TranscriptEntry } from '../lib/types';

type OnTranscriptUpdate = (entries: TranscriptEntry[], latestText: string) => void;

/** Selectors where real spoken speech words live */
const SPEECH_TEXT_SELECTORS = [
  '.iTTPOb',                    // Google Meet live speech text container
  '.VbkSUe',                    // Google Meet dynamic subtitle span
  '.ygicle',                    // Google Meet caption line
  '.bh44bd',                    // Google Meet alternative subtitle text
  '.caption-text',              // Simulator caption text
  '[jsname="tgaKEf"]',          // Google Meet speech segment
];

/** Selectors for speaker names */
const SPEAKER_NAME_SELECTORS = [
  '.zs7s8d',                     // Primary speaker name in captions
  '.NWpY1d',                     // Google Meet speaker header
  '.KcIKyf',                     // Alternative speaker class
  '.jT5TUd',                     // Modern Meet speaker header
  '.caption-speaker',            // Simulator speaker name
  '[data-sender-name]',          // Data-attribute speaker
];

/** Selectors for elements that MUST BE COMPLETELY IGNORED (UI controls, menus, settings, icons) */
const IGNORED_ELEMENT_SELECTORS = [
  'button',
  '[role="button"]',
  '[role="menu"]',
  '[role="menuitem"]',
  '[role="listbox"]',
  '[role="option"]',
  '[role="dialog"]',
  '[role="radiogroup"]',
  'ul',
  'li',
  '.google-symbols',
  '.material-icons',
  '.google-material-icons',
  '[class*="material-symbols"]',
  '[class*="VfPpkd"]',           // Google Material component buttons/toggles
  '[aria-label*="setting" i]',
  '[aria-label*="font" i]',
  '[aria-label*="jump" i]',
  '[aria-label*="caption" i]',
  '[aria-label*="closed caption" i]',
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

  // Count BETA tags (Meet displays BETA next to many caption languages)
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

  constructor(onUpdate: OnTranscriptUpdate) {
    this.onUpdate = onUpdate;
  }

  /** Start observing Google Meet captions */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    // Detect user's own display name in Meet
    this.detectSelfName();

    // Start listening on document.body so toggling CC on/off works seamlessly
    this.attachObserver();

    // Initial check in case captions are already on screen
    this.scheduleCheck();
  }

  /** Stop the observer */
  stop(): void {
    this.isRunning = false;
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

  /* ── Private ── */

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

    // Observe document.body subtree so that when Google Meet creates, destroys,
    // or modifies caption nodes as users talk or toggle CC, we never lose track.
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

  private processCaptions(): void {
    if (!this.isRunning) return;

    // ── Strategy A: Direct Speech Elements (.iTTPOb, .VbkSUe, .ygicle, .caption-text, etc.) ──
    const speechNodes = document.querySelectorAll(SPEECH_TEXT_SELECTORS.join(', '));

    if (speechNodes.length > 0) {
      // Find the last visible speech node
      let activeSpeechEl: Element | null = null;
      for (let i = speechNodes.length - 1; i >= 0; i--) {
        const el = speechNodes[i];
        // Ensure not inside ignored UI
        const isIgnored = IGNORED_ELEMENT_SELECTORS.some(
          (sel) => el.matches(sel) || Boolean(el.closest(sel))
        );
        if (!isIgnored && el.textContent?.trim()) {
          activeSpeechEl = el;
          break;
        }
      }

      if (activeSpeechEl) {
        // Find associated speaker
        const containerBlock =
          activeSpeechEl.closest(
            '.TBMuR, [jscontroller="D1tKje"], .nMxRnf, [data-sender-name], .a4cQT, .caption-bubble'
          ) || activeSpeechEl.parentElement;

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

        const rawText = activeSpeechEl.textContent?.trim() || '';
        this.handleExtractedUtterance(speaker, rawText);
        return;
      }
    }

    // ── Strategy B: Fallback Container Search ([jsname="YSxPC"], .a4cQT, etc.) ──
    const containerSelectors = ['[jsname="YSxPC"]', '.a4cQT', '[jsname="tgaKEf"]'];
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

        const isIgnored = IGNORED_ELEMENT_SELECTORS.some(
          (iSel) => node.matches(iSel) || Boolean(node.closest(iSel))
        );
        if (isIgnored) return;

        const isSpeaker = SPEAKER_NAME_SELECTORS.some(
          (sSel) => node.matches(sSel) || Boolean(node.closest(sSel))
        );
        if (isSpeaker) return;

        const text = node.textContent?.trim();
        if (text && !textParts.includes(text)) {
          textParts.push(text);
        }
      });

      const rawText = textParts.join(' ').trim();
      if (rawText) {
        this.handleExtractedUtterance(speaker, rawText);
        return;
      }
    }
  }

  private handleExtractedUtterance(speaker: string, text: string): void {
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

    const isSelf =
      speaker === this.selfName ||
      speaker.toLowerCase() === 'you' ||
      speaker.toLowerCase() === 'anda';

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
