/* ── Floating Widget ── 
 * Draggable, resizable, collapsible widget injected via Shadow DOM.
 * Shows AI-generated answers in dual-mode (bullet points + full script).
 * ──────────────────────────────────────────────────────────────────────── */

import type { AIAnswer, FloatingWidgetState, UILanguage } from '../lib/types';
import { DEFAULT_WIDGET_STATE } from '../lib/types';
import { loadWidgetState, saveWidgetState, loadUILanguage } from '../lib/storage';
import { getI18n, type Translations } from '../lib/i18n';
import widgetCSS from './widget.css?inline';

const SVG_LOGO = `<svg class="widget-svg-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="5.5" fill="#4F46E5"/><path d="M5.5 10.5V13.5M8.75 7.5V16.5M12 4.5V19.5M15.25 7.5V16.5M18.5 10.5V13.5" stroke="#FFFFFF" stroke-width="2.3" stroke-linecap="round"/><circle cx="18.5" cy="5.5" r="2.2" fill="#38BDF8"/><circle cx="18.5" cy="5.5" r="0.9" fill="#FFFFFF"/></svg>`;
const SVG_PLAY = `<svg class="ctrl-svg" viewBox="0 0 24 24" fill="currentColor"><polygon points="6 4 20 12 6 20 6 4"/></svg>`;
const SVG_STOP = `<svg class="ctrl-svg" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>`;
const SVG_AUTO = `<svg class="ctrl-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-1.19"/></svg>`;
const SVG_ANSWER = `<svg class="ctrl-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`;
const SVG_MIC = `<svg class="ctrl-svg mic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`;
const SVG_EMPTY = `<svg class="empty-vector" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="8" width="36" height="28" rx="4"/><path d="M14 18h20M14 24h14M14 30h8"/><circle cx="34" cy="27" r="2" fill="currentColor"/></svg>`;
const SVG_ALERT = `<svg class="alert-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
const SVG_MINIMIZE = `<svg class="header-action-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
const SVG_CLOSE = `<svg class="header-action-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

export class FloatingWidget {
  private shadowHost: HTMLDivElement;
  private shadowRoot: ShadowRoot;
  private state: FloatingWidgetState = { ...DEFAULT_WIDGET_STATE };
  private answers: AIAnswer[] = [];
  private streamingText: string = '';
  private isStreaming: boolean = false;
  private latestTranscript: string = '';
  public uiLang: UILanguage = 'en';
  private isRtcActive: boolean = false;

  private get t(): Translations {
    return getI18n(this.uiLang);
  }

  // Drag state
  private isDragging: boolean = false;
  private dragOffset = { x: 0, y: 0 };
  private resizeObserver: ResizeObserver | null = null;
  private resizeSaveTimer: ReturnType<typeof setTimeout> | null = null;

  // Callbacks
  private onStartStop: ((listening: boolean) => void) | null = null;
  private onAnswerNow: (() => void) | null = null;
  private onAutoToggle: ((enabled: boolean) => void) | null = null;

  constructor() {
    // Create the Shadow DOM host with full viewport coverage and pointer-events: none
    // (Only inner widget elements will have pointer-events: auto)
    this.shadowHost = document.createElement('div');
    this.shadowHost.id = 'ai-interview-assistant-root';
    this.shadowHost.style.cssText =
      'all: initial; position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2147483647;';
    document.body.appendChild(this.shadowHost);

    this.shadowRoot = this.shadowHost.attachShadow({ mode: 'open' });

    // Inject styles
    const styleEl = document.createElement('style');
    styleEl.textContent = widgetCSS;
    this.shadowRoot.appendChild(styleEl);

    // Load persisted state and render
    this.init();
  }

  private async init() {
    this.uiLang = await loadUILanguage();
    this.state = await loadWidgetState();
    if (typeof this.state.opacity !== 'number' || this.state.opacity > 0.85) {
      this.state.opacity = 0.85;
    }
    this.clampPositionToViewport();
    this.render();
    this.setupDragListeners();

    try {
      chrome.storage?.onChanged?.addListener((changes, area) => {
        if (area === 'local' && changes['ui_language']) {
          this.uiLang = (changes['ui_language'].newValue as UILanguage) || 'en';
          this.persistAndRender();
        }
      });
    } catch {
      // Ignore if not in Chrome Extension background context
    }
  }

  private clampPositionToViewport(): void {
    const width = this.state.size?.width || 380;
    const height = this.state.size?.height || 420;
    const maxX = Math.max(10, window.innerWidth - width - 10);
    const maxY = Math.max(10, window.innerHeight - height - 10);

    if (typeof this.state.position?.x !== 'number' || isNaN(this.state.position.x)) {
      this.state.position = { x: 20, y: 20 };
    }
    if (typeof this.state.position?.y !== 'number' || isNaN(this.state.position.y)) {
      this.state.position.y = 20;
    }

    this.state.position.x = Math.max(10, Math.min(maxX, this.state.position.x));
    this.state.position.y = Math.max(10, Math.min(maxY, this.state.position.y));
  }

  /* ── Public API ── */

  /** Reset position to safe default coordinates */
  resetPosition(): void {
    this.state.position = { x: 20, y: 20 };
    this.state.size = { width: 380, height: 420 };
    this.state.opacity = 0.85;
    this.state.isMinimized = false;
    this.state.isVisible = true;
    this.persistAndRender();
  }

  setCallbacks(cbs: {
    onStartStop: (listening: boolean) => void;
    onAnswerNow: () => void;
    onAutoToggle: (enabled: boolean) => void;
  }) {
    this.onStartStop = cbs.onStartStop;
    this.onAnswerNow = cbs.onAnswerNow;
    this.onAutoToggle = cbs.onAutoToggle;
  }

  /** Toggle widget visibility (Boss Key) */
  toggle(): void {
    this.state.isVisible = !this.state.isVisible;
    this.persistAndRender();
  }

  /** Update the latest transcript preview */
  updateTranscript(text: string): void {
    this.latestTranscript = text;
    this.renderTranscriptBar();
  }

  /** Update WebRTC live status (internal state) */
  setRtcActive(active: boolean): void {
    this.isRtcActive = active;
  }

  /** Set streaming state — show the raw streaming text */
  setStreaming(active: boolean, text?: string): void {
    this.isStreaming = active;
    if (text !== undefined) this.streamingText = text;
    this.renderAnswerArea();
  }

  /** Append a streaming chunk */
  appendStreamChunk(chunk: string): void {
    this.streamingText += chunk;
    this.isStreaming = true;
    this.renderAnswerArea();
  }

  /** Push a completed answer */
  pushAnswer(answer: AIAnswer): void {
    this.isStreaming = false;
    this.streamingText = '';
    // Put newest on top
    this.answers.unshift(answer);
    // Keep only last 10 answers
    if (this.answers.length > 10) this.answers.pop();
    this.renderAnswerArea();
  }

  /** Show an error */
  showError(error: string): void {
    this.isStreaming = false;
    this.streamingText = '';
    this.isDragging = false;
    this.renderError(error);
  }

  /** Clear error banner and restore regular answer area */
  clearError(): void {
    this.renderAnswerArea();
  }

  /** Update listening state */
  setListening(listening: boolean): void {
    this.state.isListening = listening;
    this.persistAndRender();
  }

  /** Destroy the widget */
  destroy(): void {
    this.shadowHost.remove();
  }

  /* ── Rendering ── */

  private render(): void {
    // Clear existing content (keep styles)
    const existing = this.shadowRoot.querySelector('.assistant-widget');
    if (existing) existing.remove();
    const existingPill = this.shadowRoot.querySelector('.assistant-pill');
    if (existingPill) existingPill.remove();

    if (this.state.isMinimized) {
      this.renderPill();
      return;
    }

    const widget = document.createElement('div');
    widget.className = `assistant-widget ${this.state.isVisible ? '' : 'hidden'}`;
    widget.style.cssText = `
      left: ${this.state.position.x}px;
      top: ${this.state.position.y}px;
      width: ${this.state.size.width}px;
      height: ${this.state.size.height}px;
      opacity: ${this.state.opacity};
    `;

    widget.innerHTML = `
      ${this.renderHeaderHTML()}
      ${this.renderControlsHTML()}
      ${this.renderTranscriptBarHTML()}
      <div class="answer-area" id="answer-area">
        ${this.renderEmptyHTML()}
      </div>
    `;

    this.shadowRoot.appendChild(widget);
    this.attachEventListeners(widget);
    this.renderAnswerArea();
    this.renderTranscriptBar();
    this.setupResizeObserver();
  }

  private renderPill(): void {
    const pill = document.createElement('div');
    pill.className = 'assistant-pill';
    pill.style.cssText = `
      left: ${this.state.position.x}px;
      top: ${this.state.position.y}px;
    `;
    pill.innerHTML = `
      <span class="pulse ${this.state.isListening ? '' : 'idle'}"></span>
      <span class="pill-icon-svg">${SVG_LOGO}</span>
      <span class="pill-text">${this.t.hudPillText}</span>
    `;
    pill.addEventListener('click', () => {
      this.state.isMinimized = false;
      this.persistAndRender();
    });
    this.shadowRoot.appendChild(pill);
  }

  private setupResizeObserver(): void {
    if (typeof ResizeObserver === 'undefined') return;
    this.resizeObserver?.disconnect();

    const widget = this.shadowRoot.querySelector('.assistant-widget') as HTMLElement;
    if (!widget) return;

    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width >= 240 && height >= 140) {
          this.state.size.width = Math.round(width);
          this.state.size.height = Math.round(height);
          if (this.resizeSaveTimer) clearTimeout(this.resizeSaveTimer);
          this.resizeSaveTimer = setTimeout(() => {
            saveWidgetState(this.state);
          }, 350);
        }
      }
    });

    this.resizeObserver.observe(widget);
  }

  private renderHeaderHTML(): string {
    const statusClass = this.state.isListening ? 'listening' : 'stopped';
    const statusText = this.state.isListening ? this.t.hudListening : this.t.hudStopped;

    return `
      <div class="widget-header" id="drag-handle">
        <div class="header-logo">${SVG_LOGO}</div>
        <span class="header-title">${this.t.hudTitle}</span>
        <span class="header-status ${statusClass}">
          <span class="status-indicator"></span>
          ${statusText}
        </span>
        <div class="header-actions">
          <button class="header-btn" id="btn-minimize" title="${this.t.hudMinimize}">${SVG_MINIMIZE}</button>
          <button class="header-btn" id="btn-hide" title="${this.t.hudClose}">${SVG_CLOSE}</button>
        </div>
      </div>
    `;
  }

  private renderControlsHTML(): string {
    const listenIcon = this.state.isListening ? SVG_STOP : SVG_PLAY;
    const listenLabel = this.state.isListening ? this.t.hudBtnStop : this.t.hudBtnStart;
    const listenClass = this.state.isListening ? 'active' : '';
    const autoClass = this.state.autoTrigger ? 'active' : '';

    return `
      <div class="controls-bar">
        <button class="btn-control ${listenClass}" id="btn-listen" title="${this.state.isListening ? this.t.hudBtnStop : this.t.hudBtnStart}">
          ${listenIcon}
          <span>${listenLabel}</span>
        </button>
        <button class="btn-control ${autoClass}" id="btn-auto" title="${this.t.hudBtnAuto}">
          ${SVG_AUTO}
          <span>${this.t.hudBtnAuto}</span>
        </button>
        <button class="btn-answer-now" id="btn-answer-now" title="${this.t.hudBtnAnswerNow}">
          ${SVG_ANSWER}
          <span>${this.t.hudBtnAnswerNow}</span>
        </button>
      </div>
    `;
  }

  private renderTranscriptBarHTML(): string {
    const text = this.latestTranscript || this.t.hudTranscriptWaiting;

    return `
      <div class="transcript-bar" id="transcript-bar">
        <div class="transcript-badge">
          ${SVG_MIC}
          <span class="transcript-badge-text">${this.t.hudTranscriptBadge}</span>
        </div>
        <div class="transcript-text" id="transcript-text-el">${this.escapeHTML(text)}</div>
      </div>
    `;
  }

  private renderTranscriptBar(): void {
    const bar = this.shadowRoot.querySelector('#transcript-text-el') as HTMLElement | null;
    if (bar) {
      bar.textContent = this.latestTranscript || this.t.hudTranscriptWaiting;
      bar.scrollTop = bar.scrollHeight;
    }
  }

  private renderEmptyHTML(): string {
    return `
      <div class="answer-empty">
        <div class="empty-icon">${SVG_EMPTY}</div>
        <div class="empty-title">${this.t.hudEmptyTitle}</div>
        <div class="empty-sub">
          ${this.t.hudEmptyDesc}
        </div>
      </div>
    `;
  }

  private renderAnswerArea(): void {
    const area = this.shadowRoot.querySelector('#answer-area') as HTMLElement | null;
    if (!area) return;

    if (this.isStreaming) {
      area.innerHTML = `
        <div class="answer-card">
          <div class="answer-script streaming-text">
            ${this.escapeHTML(this.streamingText)}<span class="streaming-cursor"></span>
          </div>
        </div>
      `;
      area.scrollTop = area.scrollHeight;
      return;
    }

    if (this.answers.length === 0) {
      area.innerHTML = this.renderEmptyHTML();
      return;
    }

    area.innerHTML = this.answers
      .map((answer, idx) => this.renderAnswerCardHTML(answer, idx))
      .join('');
  }

  private renderAnswerCardHTML(answer: AIAnswer, _idx: number): string {
    if (answer.isLoading) {
      return `
        <div class="answer-card">
          <div class="loading-dots">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
        </div>
      `;
    }

    if (answer.error) {
      return `<div class="error-banner">${SVG_ALERT}<span>${this.escapeHTML(answer.error)}</span></div>`;
    }

    const scriptText = answer.fullScript || answer.bulletPoints.join('\n\n') || '';

    return `
      <div class="answer-card">
        ${
          answer.question
            ? `<div class="answer-question">
                 <span class="q-label">${this.t.hudQuestionLabel}</span>
                 <span class="q-body">${this.escapeHTML(answer.question)}</span>
               </div>`
            : ''
        }
        <div class="answer-script">${this.escapeHTML(scriptText)}</div>
      </div>
    `;
  }

  private renderError(error: string): void {
    const area = this.shadowRoot.querySelector('#answer-area');
    if (!area) return;
    area.innerHTML = `
      <div class="error-banner">
        <div class="error-banner-main">
          ${SVG_ALERT}
          <span class="error-banner-text">${this.escapeHTML(error)}</span>
        </div>
        <button class="error-dismiss-btn" id="btn-dismiss-error" title="${this.t.hudClose || 'Dismiss'}">
          ${SVG_CLOSE}
        </button>
      </div>
    `;

    const dismissBtn = area.querySelector('#btn-dismiss-error');
    dismissBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.clearError();
    });
  }

  /* ── Event Listeners ── */

  private attachEventListeners(widget: Element): void {
    widget.querySelector('#btn-minimize')?.addEventListener('click', () => {
      this.state.isMinimized = true;
      this.persistAndRender();
    });

    widget.querySelector('#btn-hide')?.addEventListener('click', () => {
      this.toggle();
    });

    widget.querySelector('#btn-listen')?.addEventListener('click', () => {
      this.state.isListening = !this.state.isListening;
      this.onStartStop?.(this.state.isListening);
      this.persistAndRender();
    });

    widget.querySelector('#btn-auto')?.addEventListener('click', () => {
      this.state.autoTrigger = !this.state.autoTrigger;
      this.onAutoToggle?.(this.state.autoTrigger);
      this.persistAndRender();
    });

    widget.querySelector('#btn-answer-now')?.addEventListener('click', () => {
      this.onAnswerNow?.();
    });
  }

  /* ── Drag & Drop ── */

  private setupDragListeners(): void {
    this.shadowRoot.addEventListener('mousedown', (e: Event) => {
      const me = e as MouseEvent;
      // Only drag with left mouse button (button 0)
      if (me.button !== 0) return;

      const target = me.target as HTMLElement | null;
      if (!target) return;

      // Do not initiate drag if clicking buttons, inputs, or control bars
      if (
        target.closest('.header-btn') ||
        target.closest('.header-actions') ||
        target.closest('.btn-control') ||
        target.closest('.btn-answer-now')
      ) {
        return;
      }

      const handle = target.closest('#drag-handle');
      if (!handle) return;

      // Prevent text selection highlight from hijacking mouse movement
      me.preventDefault();
      this.isDragging = true;
      this.dragOffset = {
        x: me.clientX - this.state.position.x,
        y: me.clientY - this.state.position.y,
      };

      const onMove = (ev: MouseEvent) => {
        if (!this.isDragging) return;
        ev.preventDefault();

        const rawX = ev.clientX - this.dragOffset.x;
        const rawY = ev.clientY - this.dragOffset.y;

        const widget = this.shadowRoot.querySelector('.assistant-widget') as HTMLElement | null;
        const width = widget?.offsetWidth || this.state.size.width || 380;
        const minX = 0;
        const maxX = Math.max(0, window.innerWidth - width);
        const minY = 0;
        const maxY = Math.max(0, window.innerHeight - 50);

        this.state.position.x = Math.max(minX, Math.min(maxX, rawX));
        this.state.position.y = Math.max(minY, Math.min(maxY, rawY));

        if (widget) {
          widget.style.left = `${this.state.position.x}px`;
          widget.style.top = `${this.state.position.y}px`;
        }
      };

      const onUp = () => {
        if (this.isDragging) {
          this.isDragging = false;
          try {
            saveWidgetState(this.state);
          } catch {}
        }
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    });
  }

  /* ── Utilities ── */

  private persistAndRender(): void {
    try {
      saveWidgetState(this.state);
    } catch {}
    this.render();
  }

  private escapeHTML(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
