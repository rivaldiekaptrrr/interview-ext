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
  if (document.getElementById('ai-interview-copilot-root')) return;

  console.log('[AI Interview Copilot] Initializing on Google Meet...');

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

    // Feed non-self text to the debouncer
    const latestEntry = entries[entries.length - 1];
    if (latestEntry && !latestEntry.isSelf) {
      debouncer?.feed(latestEntry.text, false);
    }
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
      debouncer?.forceAnswer();
    },
    onAutoToggle: (enabled: boolean) => {
      debouncer?.setEnabled(enabled);
    },
  });

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

  console.log('[AI Interview Copilot] Ready! Use Alt+H to toggle widget visibility.');
}

/**
 * Send a question to the background service worker for AI processing
 */
function triggerAIAnswer(question: string): void {
  if (!question.trim()) return;

  console.log('[AI Interview Copilot] Triggering AI for:', question.substring(0, 80) + '...');

  // Show streaming state in widget
  widget?.setStreaming(true, '');

  // Send to background service worker
  chrome.runtime.sendMessage(
    {
      type: 'TRIGGER_AI_ANSWER',
      payload: {
        question,
        conversationHistory: conversationHistory.slice(-10),
      },
    } as ExtensionMessage,
    (response) => {
      if (chrome.runtime.lastError) {
        widget?.showError(`Connection error: ${chrome.runtime.lastError.message}`);
        return;
      }
      if (response && !response.success) {
        widget?.showError(response.error || 'Unknown error');
      }
    }
  );
}

/* ── Wait for Google Meet page to be ready, then initialize ── */
if (document.readyState === 'complete') {
  init();
} else {
  window.addEventListener('load', init);
}
