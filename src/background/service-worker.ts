/* ── Background Service Worker ── Message broker, AI dispatch, storage sync ── */

import { sendChatCompletion } from '../lib/ai-client';
import { buildSystemPrompt, buildUserPrompt, parseAIResponse } from '../lib/prompt-builder';
import { loadSettings, loadContext } from '../lib/storage';
import type {
  ExtensionMessage,
  AIAnswerRequestPayload,
  AIAnswerChunkPayload,
} from '../lib/types';

/* ── Keyboard Shortcut Commands ── */
chrome.commands.onCommand.addListener((command) => {
  if (command === 'toggle-widget' || command === 'answer-now') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (tab?.id && tab.url?.includes('meet.google.com')) {
        const type = command === 'toggle-widget' ? 'TOGGLE_WIDGET' : 'ANSWER_NOW';
        chrome.tabs.sendMessage(tab.id, { type } as ExtensionMessage);
      }
    });
  }
});

/* ── Message Listener ── Handles all cross-context messages ── */
chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    switch (message.type) {
      case 'TRIGGER_AI_ANSWER':
        handleAIAnswer(message.payload as AIAnswerRequestPayload, _sender.tab?.id)
          .then((result) => sendResponse({ success: true, data: result }))
          .catch((err) => sendResponse({ success: false, error: err.message }));
        return true; // Keep channel open for async response

      case 'GET_STATE':
        Promise.all([loadSettings(), loadContext()])
          .then(([settings, context]) =>
            sendResponse({ success: true, data: { settings, context } })
          )
          .catch((err) => sendResponse({ success: false, error: err.message }));
        return true;

      default:
        return false;
    }
  }
);

/* ── AI Answer Handler ── */
async function handleAIAnswer(
  payload: AIAnswerRequestPayload,
  tabId?: number
): Promise<{ bulletPoints: string[]; fullScript: string }> {
  const [settings, context] = await Promise.all([loadSettings(), loadContext()]);

  if (!settings.apiKey) {
    throw new Error('API Key belum dikonfigurasi. Buka Settings di popup ekstensi.');
  }

  const effectiveLanguage = payload.preferredLanguage || context.language || 'auto';
  const effectiveContext = { ...context, language: effectiveLanguage };

  const systemPrompt = buildSystemPrompt(effectiveContext, payload.question);
  const userPrompt = buildUserPrompt(payload.question, payload.conversationHistory, effectiveLanguage);

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    { role: 'user' as const, content: userPrompt },
  ];

  const answerId = `answer-${Date.now()}`;
  let fullResponse = '';

  // Stream chunks to the content script if tab is available
  const onChunk = tabId
    ? (chunk: string, done: boolean) => {
        const chunkPayload: AIAnswerChunkPayload = {
          id: answerId,
          chunk,
          done,
        };
        chrome.tabs.sendMessage(tabId, {
          type: 'AI_ANSWER_CHUNK' as const,
          payload: chunkPayload,
        });
      }
    : undefined;

  try {
    fullResponse = await sendChatCompletion(settings, messages, onChunk);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    if (tabId) {
      chrome.tabs.sendMessage(tabId, {
        type: 'AI_ANSWER_ERROR' as const,
        payload: { id: answerId, error: errorMessage },
      });
    }
    throw err;
  }

  // Parse the completed response
  const parsed = parseAIResponse(fullResponse);

  // Send the final parsed answer
  if (tabId) {
    chrome.tabs.sendMessage(tabId, {
      type: 'AI_ANSWER_RESPONSE' as const,
      payload: {
        id: answerId,
        question: payload.question,
        bulletPoints: parsed.bulletPoints,
        fullScript: parsed.fullScript,
      },
    });
  }

  return parsed;
}

/* ── Extension Install / Update ── */
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('[AI Interview Copilot] Extension installed successfully.');
  }
});
