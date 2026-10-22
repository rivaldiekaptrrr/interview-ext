/* ── Content Script ── Main entry point injected into Google Meet ──
 * Orchestrates: TranscriptListener → SmartDebouncer → Service Worker → FloatingWidget
 * ───────────────────────────────────────────────────────────────────────────────────── */

import { TranscriptListener } from './transcript-listener';
import { SmartDebouncer } from './smart-debouncer';
import { FloatingWidget } from './floating-widget';
import type {
  ExtensionMessage,
  AIAnswerChunkPayload,
  AIAnswer,
  TranscriptEntry,
} from '../lib/types';

// ── Singleton instances ──
let listener: TranscriptListener | null = null;
let debouncer: SmartDebouncer | null = null;
let widget: FloatingWidget | null = null;
let conversationHistory: TranscriptEntry[] = [];

/**
 * Initialize the content script on Google Meet pages
 */
function init(): void {
  // Prevent double-initialization
  if (document.getElementById('ai-interview-assistant-root')) return;

  console.log('[AI Interview Assistant] Initializing on Google Meet...');

  // ── 1. Create the Floating Widget ──
  widget = new FloatingWidget();

  // ── 2. Create the Smart Debouncer ──
  debouncer = new SmartDebouncer((question: string) => {
    triggerAIAnswer(question);
  });

  // ── 3. Create the Transcript Listener ──
  listener = new TranscriptListener((entries, latestText) => {
    conversationHistory = entries;

    // Update widget transcript preview
    widget?.updateTranscript(latestText);

    // Feed text to the debouncer (strictly non-self speech)
    const latestEntry = entries[entries.length - 1];
    if (latestEntry && !latestEntry.isSelf) {
      debouncer?.feed(latestEntry.text, false);
    }
  });

  listener.setRtcStatusCallback((active) => {
    widget?.setRtcActive(active);
  });

  // ── 4. Wire up Widget Callbacks ──
  widget.setCallbacks({
    onStartStop: (listening: boolean) => {
      if (listening) {
        listener?.start();
        debouncer?.setEnabled(true);
      } else {
        listener?.stop();
        debouncer?.setEnabled(false);
      }
    },
    onAnswerNow: () => {
      widget?.clearError();
      const targetText =
        listener?.getLatestInterviewerText() || listener?.getLatestNonEmptyText() || '';
      if (targetText) {
        triggerAIAnswer(targetText);
      } else {
        debouncer?.forceAnswer(targetText);
      }
    },
    onAutoToggle: (enabled: boolean) => {
      debouncer?.setEnabled(enabled);
    },
  });

  // ── Start listening automatically ──
  listener.start();

  // ── 5. Listen for Messages from Background Service Worker ──
  chrome.runtime.onMessage.addListener((message: ExtensionMessage) => {
    switch (message.type) {
      case 'TOGGLE_WIDGET':
        widget?.toggle();
        break;

      case 'ANSWER_NOW':
        debouncer?.forceAnswer();
        break;

      case 'AI_ANSWER_CHUNK': {
        const chunk = message.payload as AIAnswerChunkPayload;
        if (chunk.done) {
          // Streaming complete — wait for the parsed answer
          widget?.setStreaming(false);
        } else {
          widget?.appendStreamChunk(chunk.chunk);
        }
        break;
      }

      case 'AI_ANSWER_RESPONSE': {
        const answer = message.payload as AIAnswer;
        widget?.pushAnswer({
          ...answer,
          isLoading: false,
          timestamp: Date.now(),
        });
        break;
      }

      case 'AI_ANSWER_ERROR': {
        const error = message.payload as { id: string; error: string };
        widget?.showError(error.error);
        break;
      }
    }
  });

  console.log('[AI Interview Assistant] Ready! Use Alt+H to toggle widget visibility.');
}

/**
 * Send a question to the background service worker for AI processing
 */
function triggerAIAnswer(question: string): void {
  if (!question.trim()) return;

  // Guard: if extension context was invalidated (e.g. extension updated/reloaded in background)
  if (!chrome.runtime?.id) {
    console.warn('[EasyInterview] Extension context invalidated. Please refresh this Google Meet tab.');
    widget?.showError('Extension reloaded. Please refresh this Google Meet page.');
    return;
  }

  console.log('[EasyInterview] Triggering AI for:', question.substring(0, 80) + '...');

  // Show streaming state in widget
  widget?.setStreaming(true, '');

  try {
    chrome.runtime.sendMessage(
      {
        type: 'TRIGGER_AI_ANSWER',
        payload: {
          question,
          conversationHistory: conversationHistory.slice(-10),
        },
      } as ExtensionMessage,
      (response) => {
        if (chrome.runtime?.lastError) {
          console.warn('[EasyInterview] Connection error:', chrome.runtime.lastError.message);
          widget?.showError(`Connection error: ${chrome.runtime.lastError.message}`);
          return;
        }
        if (response && !response.success) {
          widget?.showError(response.error || 'Unknown error');
        }
      }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn('[EasyInterview] Failed to trigger AI answer:', msg);
    widget?.showError('Extension connection lost. Please refresh this page.');
  }
}

/* ── Wait for Google Meet page to be ready, then initialize ── */
if (document.readyState === 'complete') {
  init();
} else {
  window.addEventListener('load', init);
}
