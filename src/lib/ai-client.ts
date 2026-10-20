/* ── Multi-Provider AI Client ── Unified interface for OpenAI, Gemini, Claude, Custom ── */

import { ExtensionSettings } from './types';

/** Generic chat message format */
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Streaming callback */
type OnChunk = (chunk: string, done: boolean) => void;

/** Send a chat completion request to the configured provider */
export async function sendChatCompletion(
  settings: ExtensionSettings,
  messages: ChatMessage[],
  onChunk?: OnChunk
): Promise<string> {
  switch (settings.provider) {
    case 'openai':
    case 'custom':
      return sendOpenAICompatible(settings, messages, onChunk);
    case 'gemini':
      return sendGemini(settings, messages, onChunk);
    case 'claude':
      return sendClaude(settings, messages, onChunk);
    default:
      throw new Error(`Unknown provider: ${settings.provider}`);
  }
}

/* ────────────────────────────────────────────────────────────────────────────
 * OpenAI-Compatible (OpenAI, Groq, DeepSeek, OpenRouter, Ollama, etc.)
 * ──────────────────────────────────────────────────────────────────────────── */
async function sendOpenAICompatible(
  settings: ExtensionSettings,
  messages: ChatMessage[],
  onChunk?: OnChunk
): Promise<string> {
  const url = `${settings.baseUrl.replace(/\/$/, '')}/chat/completions`;
  const body = {
    model: settings.model,
    messages,
    temperature: settings.temperature,
    max_tokens: settings.maxTokens,
    stream: !!onChunk,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errBody}`);
  }

  if (onChunk && response.body) {
    return streamSSE(response.body, (data) => {
      if (data === '[DONE]') {
        onChunk('', true);
        return '';
      }
      try {
        const parsed = JSON.parse(data);
        const content = parsed.choices?.[0]?.delta?.content || '';
        if (content) onChunk(content, false);
        return content;
      } catch {
        return '';
      }
    });
  }

  const json = await response.json();
  return json.choices?.[0]?.message?.content || '';
}

/* ────────────────────────────────────────────────────────────────────────────
 * Google Gemini (Generative Language API)
 * ──────────────────────────────────────────────────────────────────────────── */
async function sendGemini(
  settings: ExtensionSettings,
  messages: ChatMessage[],
  onChunk?: OnChunk
): Promise<string> {
  const baseUrl = settings.baseUrl.replace(/\/$/, '');
  const streamSuffix = onChunk ? 'streamGenerateContent?alt=sse&' : 'generateContent?';
  const url = `${baseUrl}/models/${settings.model}:${streamSuffix}key=${settings.apiKey}`;

  // Convert messages to Gemini format
  const systemInstruction = messages.find((m) => m.role === 'system');
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const body: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: settings.temperature,
      maxOutputTokens: settings.maxTokens,
    },
  };

  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction.content }] };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errBody}`);
  }

  if (onChunk && response.body) {
    return streamSSE(response.body, (data) => {
      try {
        const parsed = JSON.parse(data);
        const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (content) onChunk(content, false);
        // Check if generation is complete
        const finishReason = parsed.candidates?.[0]?.finishReason;
        if (finishReason && finishReason !== 'STOP') {
          onChunk('', true);
        }
        return content;
      } catch {
        return '';
      }
    });
  }

  const json = await response.json();
  return json.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

/* ────────────────────────────────────────────────────────────────────────────
 * Anthropic Claude (Messages API)
 * ──────────────────────────────────────────────────────────────────────────── */
async function sendClaude(
  settings: ExtensionSettings,
  messages: ChatMessage[],
  onChunk?: OnChunk
): Promise<string> {
  const url = `${settings.baseUrl.replace(/\/$/, '')}/messages`;

  const systemMessage = messages.find((m) => m.role === 'system');
  const chatMessages = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role, content: m.content }));

  const body: Record<string, unknown> = {
    model: settings.model,
    max_tokens: settings.maxTokens,
    messages: chatMessages,
    stream: !!onChunk,
  };

  if (systemMessage) {
    body.system = systemMessage.content;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': settings.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Claude API error ${response.status}: ${errBody}`);
  }

  if (onChunk && response.body) {
    return streamSSE(response.body, (data) => {
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'content_block_delta') {
          const content = parsed.delta?.text || '';
          if (content) onChunk(content, false);
          return content;
        }
        if (parsed.type === 'message_stop') {
          onChunk('', true);
        }
        return '';
      } catch {
        return '';
      }
    });
  }

  const json = await response.json();
  return json.content?.[0]?.text || '';
}

/* ────────────────────────────────────────────────────────────────────────────
 * SSE Stream Reader
 * ──────────────────────────────────────────────────────────────────────────── */
async function streamSSE(
  body: ReadableStream<Uint8Array>,
  processData: (data: string) => string
): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data: ')) {
        const data = trimmed.slice(6);
        if (data) {
          fullText += processData(data);
        }
      }
    }
  }

  return fullText;
}

/* ────────────────────────────────────────────────────────────────────────────
 * Connection Tester
 * ──────────────────────────────────────────────────────────────────────────── */
export async function testConnection(
  settings: ExtensionSettings
): Promise<{ success: boolean; message: string; latencyMs: number }> {
  if (!settings.apiKey && settings.provider !== 'custom') {
    return {
      success: false,
      message: 'API Key belum diisi. Masukkan API Key terlebih dahulu.',
      latencyMs: 0,
    };
  }

  if (!settings.baseUrl || !settings.baseUrl.trim()) {
    return {
      success: false,
      message: 'Base URL belum diisi.',
      latencyMs: 0,
    };
  }

  const startTime = performance.now();
  try {
    const testMessages: ChatMessage[] = [
      {
        role: 'user',
        content: 'Hi! Reply with only the word "OK" to confirm connection.',
      },
    ];

    // Minimal token config for fast response
    const testSettings: ExtensionSettings = {
      ...settings,
      maxTokens: 15,
      temperature: 0.1,
    };

    const reply = await sendChatCompletion(testSettings, testMessages);
    const latencyMs = Math.round(performance.now() - startTime);

    const snippet = reply.trim().replace(/\n/g, ' ').slice(0, 40);
    return {
      success: true,
      message: `Model "${settings.model}" merespons ("${snippet || 'OK'}") dalam ${latencyMs}ms.`,
      latencyMs,
    };
  } catch (err: unknown) {
    const latencyMs = Math.round(performance.now() - startTime);
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: errorMsg,
      latencyMs,
    };
  }
}

