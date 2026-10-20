/* ── Google Meet Transcript Listener ── 
 * Uses MutationObserver to scrape live captions from Google Meet DOM.
 * Distinguishes between interviewer and candidate speech.
 * ──────────────────────────────────────────────────────────────────── */

import type { TranscriptEntry } from '../lib/types';

type OnTranscriptUpdate = (entries: TranscriptEntry[], latestText: string) => void;

/** Selectors for Google Meet caption elements (updated for current Meet UI) */
const CAPTION_CONTAINER_SELECTORS = [
  '[jsname="YSxPC"]',            // Primary caption container
  '[jsname="tgaKEf"]',           // Alternative caption container
  '.a4cQT',                      // Closed caption area class
  '[data-message-text]',         // Data-attribute based captions
  '.iOzk7',                      // Another observed caption class
];

const SPEAKER_NAME_SELECTORS = [
  '.zs7s8d',                     // Speaker name in captions
  '.KcIKyf',                     // Alternative speaker class
  '[data-sender-name]',          // Data-attribute speaker
];

export class TranscriptListener {
  private observer: MutationObserver | null = null;
  private entries: TranscriptEntry[] = [];
  private onUpdate: OnTranscriptUpdate;
  private selfName: string = '';
  private lastText: string = '';
  private lastSpeaker: string = '';
  private isRunning: boolean = false;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(onUpdate: OnTranscriptUpdate) {
    this.onUpdate = onUpdate;
  }

  /** Start observing Google Meet captions */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;

    // Try to detect the user's own display name
    this.detectSelfName();

    // Attempt to find and observe the caption container
    this.tryObserve();
  }

  /** Stop the observer */
  stop(): void {
    this.isRunning = false;
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  /** Get all collected transcript entries */
  getEntries(): TranscriptEntry[] {
    return [...this.entries];
  }

  /** Get the latest non-self (interviewer) text */
  getLatestInterviewerText(): string {
    const nonSelf = this.entries.filter((e) => !e.isSelf);
    return nonSelf.length > 0 ? nonSelf[nonSelf.length - 1].text : '';
  }

  /** Clear transcript history */
  clear(): void {
    this.entries = [];
  }

  /* ── Private ── */

  private detectSelfName(): void {
    // Google Meet shows "You" or the user's name in various spots
    const selfIndicators = [
      document.querySelector('[data-self-name]'),
      document.querySelector('[data-resolution-cap]')?.closest('[data-participant-id]'),
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

    // Fallback: "You" is the default self identifier in Meet captions
    if (!this.selfName) {
      this.selfName = 'You';
    }
  }

  private tryObserve(): void {
    if (!this.isRunning) return;

    // Search for the caption container in the DOM
    let captionContainer: Element | null = null;
    for (const selector of CAPTION_CONTAINER_SELECTORS) {
      captionContainer = document.querySelector(selector);
      if (captionContainer) break;
    }

    if (captionContainer) {
      this.attachObserver(captionContainer);
    } else {
      // Captions might not be enabled yet, observe the body for their appearance
      this.observeBodyForCaptions();
    }
  }

  private observeBodyForCaptions(): void {
    const bodyObserver = new MutationObserver(() => {
      for (const selector of CAPTION_CONTAINER_SELECTORS) {
        const el = document.querySelector(selector);
        if (el) {
          bodyObserver.disconnect();
          this.attachObserver(el);
          return;
        }
      }
    });

    bodyObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Also set a retry timer as a safety net
    this.retryTimer = setTimeout(() => {
      if (this.isRunning && !this.observer) {
        bodyObserver.disconnect();
        this.tryObserve();
      }
    }, 5000);
  }

  private attachObserver(container: Element): void {
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          this.processCaptionUpdate(container);
        }
      }
    });

    this.observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // Process whatever is already visible
    this.processCaptionUpdate(container);
  }

  private processCaptionUpdate(container: Element): void {
    // Extract speaker name
    let speaker = 'Interviewer';
    for (const selector of SPEAKER_NAME_SELECTORS) {
      const nameEl = container.querySelector(selector);
      if (nameEl?.textContent) {
        speaker = nameEl.textContent.trim();
        break;
      }
    }

    // Extract caption text — look at all text spans inside the container
    const textSpans = container.querySelectorAll('span');
    let captionText = '';
    textSpans.forEach((span) => {
      // Skip speaker name spans
      const isNameSpan = SPEAKER_NAME_SELECTORS.some(
        (sel) => span.matches(sel) || span.closest(sel)
      );
      if (!isNameSpan && span.textContent) {
        captionText += span.textContent + ' ';
      }
    });
    captionText = captionText.trim();

    // Fallback: use container textContent minus known speaker names
    if (!captionText) {
      captionText = (container.textContent || '').replace(speaker, '').trim();
    }

    // Skip if no meaningful change or empty
    if (!captionText || (captionText === this.lastText && speaker === this.lastSpeaker)) {
      return;
    }

    this.lastText = captionText;
    this.lastSpeaker = speaker;

    const isSelf =
      speaker === this.selfName ||
      speaker.toLowerCase() === 'you' ||
      speaker.toLowerCase() === 'anda';

    // Check if we should update the last entry (same speaker, extending sentence)
    const lastEntry = this.entries[this.entries.length - 1];
    if (lastEntry && lastEntry.speaker === speaker && Date.now() - lastEntry.timestamp < 5000) {
      // Update existing entry (speaker is still talking)
      lastEntry.text = captionText;
      lastEntry.timestamp = Date.now();
    } else {
      // New utterance
      this.entries.push({
        speaker,
        text: captionText,
        timestamp: Date.now(),
        isSelf,
      });

      // Keep buffer manageable (last 50 entries)
      if (this.entries.length > 50) {
        this.entries = this.entries.slice(-50);
      }
    }

    this.onUpdate(this.entries, captionText);
  }
}
