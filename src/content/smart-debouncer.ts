/* ── Smart Debouncer & Question Heuristic Engine ──
 * Detects when the interviewer has finished asking a question
 * by combining silence detection + question-pattern heuristics.
 * ──────────────────────────────────────────────────────────── */

export type OnQuestionDetected = (question: string) => void;

/** Question indicator patterns */
const QUESTION_KEYWORDS_ID = [
  'apa', 'bagaimana', 'mengapa', 'kenapa', 'ceritakan', 'jelaskan',
  'berikan contoh', 'gimana', 'seberapa', 'kapan', 'dimana', 'siapa',
  'apakah', 'bisakah', 'boleh', 'coba', 'tolong jelaskan', 'menurut',
  'pengalaman', 'pernah', 'describe', 'tell me', 'how', 'what', 'why',
];

const QUESTION_KEYWORDS_EN = [
  'what', 'how', 'why', 'when', 'where', 'who', 'which',
  'tell me', 'describe', 'explain', 'can you', 'could you',
  'have you', 'do you', 'did you', 'are you', 'walk me through',
  'give me an example', 'share', 'elaborate',
];

export class SmartDebouncer {
  private silenceTimer: ReturnType<typeof setTimeout> | null = null;
  private lastUpdateTime: number = 0;
  private pendingText: string = '';
  private onQuestionDetected: OnQuestionDetected;
  private silenceThresholdMs: number;
  private isEnabled: boolean = true;
  private lastTriggeredText: string = '';

  constructor(
    onQuestionDetected: OnQuestionDetected,
    silenceThresholdMs: number = 1600 // 1.6 seconds silence default
  ) {
    this.onQuestionDetected = onQuestionDetected;
    this.silenceThresholdMs = silenceThresholdMs;
  }

  /** Feed new transcript text (called every time captions update) */
  feed(text: string, isSelf: boolean): void {
    if (!this.isEnabled || isSelf) return;

    this.pendingText = text;
    this.lastUpdateTime = Date.now();

    // Reset the silence timer every time new text arrives
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
    }

    // Start a new silence timer
    this.silenceTimer = setTimeout(() => {
      this.evaluateAndTrigger();
    }, this.silenceThresholdMs);
  }

  /** Manually trigger an answer regardless of heuristics */
  forceAnswer(): void {
    if (this.pendingText && this.pendingText !== this.lastTriggeredText) {
      this.lastTriggeredText = this.pendingText;
      this.onQuestionDetected(this.pendingText);
      this.pendingText = '';
    }
  }

  /** Enable or disable the debouncer */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled && this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  /** Update silence threshold */
  setThreshold(ms: number): void {
    this.silenceThresholdMs = ms;
  }

  /** Clean up timers */
  destroy(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  /* ── Private ── */

  private evaluateAndTrigger(): void {
    const text = this.pendingText.trim();
    if (!text || text === this.lastTriggeredText) return;

    // Minimum 3 words to avoid nuisance triggers on filler words like "ya", "oke", "halo"
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length < 3) return;

    console.log('[AI Interview Copilot] Auto-answering detected speech:', text);
    this.lastTriggeredText = text;
    this.onQuestionDetected(text);
    this.pendingText = '';
  }
}
