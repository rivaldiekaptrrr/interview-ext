/* ── AI Interview Copilot ── Shared Type Definitions ── */

/** Supported AI provider identifiers */
export type AIProvider = 'openai' | 'gemini' | 'claude' | 'custom';

/** Subscription tier (BYOK for developer phase, pro/enterprise for future) */
export type PlanTier = 'byok' | 'pro' | 'enterprise';

/** Response language */
export type ResponseLanguage = 'id' | 'en' | 'auto';

/** UI Interface Language */
export type UILanguage = 'en' | 'id';

/** Answer tone / style */
export type AnswerTone = 'star' | 'concise' | 'technical';

/** Provider-specific default configuration */
export interface ProviderDefaults {
  baseUrl: string;
  placeholder: string;
  models: string[];
}

/** All provider defaults */
export const PROVIDER_DEFAULTS: Record<AIProvider, ProviderDefaults> = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    placeholder: 'sk-...',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  },
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    placeholder: 'AIza...',
    models: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'],
  },
  claude: {
    baseUrl: 'https://api.anthropic.com/v1',
    placeholder: 'sk-ant-...',
    models: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022'],
  },
  custom: {
    baseUrl: 'http://localhost:11434/v1',
    placeholder: 'your-api-key',
    models: ['custom-model'],
  },
};

/** Extension settings persisted in chrome.storage.local */
export interface ExtensionSettings {
  provider: AIProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
  plan: PlanTier;
}

/** User context / resume data */
export interface UserContext {
  resumeText: string;
  targetRole: string;
  companyName: string;
  language: ResponseLanguage;
  tone: AnswerTone;
}

/** Floating widget state */
export interface FloatingWidgetState {
  isListening: boolean;
  autoTrigger: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMinimized: boolean;
  isVisible: boolean;
  opacity: number;
}

/** A single transcript entry captured from Google Meet captions */
export interface TranscriptEntry {
  speaker: string;
  text: string;
  timestamp: number;
  isSelf: boolean;
}

/** AI answer with dual-mode content */
export interface AIAnswer {
  id: string;
  question: string;
  bulletPoints: string[];
  fullScript: string;
  timestamp: number;
  isLoading: boolean;
  error?: string;
}

/** Message types for chrome.runtime messaging */
export type MessageType =
  | 'TRANSCRIPT_UPDATE'
  | 'TRIGGER_AI_ANSWER'
  | 'AI_ANSWER_RESPONSE'
  | 'AI_ANSWER_CHUNK'
  | 'AI_ANSWER_ERROR'
  | 'TOGGLE_WIDGET'
  | 'ANSWER_NOW'
  | 'UPDATE_SETTINGS'
  | 'UPDATE_CONTEXT'
  | 'GET_STATE';

/** Base message structure for cross-context communication */
export interface ExtensionMessage {
  type: MessageType;
  payload?: unknown;
}

/** Transcript update payload */
export interface TranscriptUpdatePayload {
  entries: TranscriptEntry[];
  fullTranscript: string;
}

/** AI answer request payload */
export interface AIAnswerRequestPayload {
  question: string;
  conversationHistory: TranscriptEntry[];
  preferredLanguage?: ResponseLanguage;
}

/** AI answer streaming chunk */
export interface AIAnswerChunkPayload {
  id: string;
  chunk: string;
  done: boolean;
}

/** Default settings */
export const DEFAULT_SETTINGS: ExtensionSettings = {
  provider: 'openai',
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 800,
  plan: 'byok',
};

/** Default user context */
export const DEFAULT_CONTEXT: UserContext = {
  resumeText: '',
  targetRole: '',
  companyName: '',
  language: 'en',
  tone: 'star',
};

/** Default widget state */
export const DEFAULT_WIDGET_STATE: FloatingWidgetState = {
  isListening: true,
  autoTrigger: true,
  position: { x: 20, y: 20 },
  size: { width: 380, height: 420 },
  isMinimized: false,
  isVisible: true,
  opacity: 0.85,
};
