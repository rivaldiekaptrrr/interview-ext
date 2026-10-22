/* ── Chrome Storage Helper ── Type-safe wrapper around chrome.storage.local ── */

import {
  ExtensionSettings,
  UserContext,
  FloatingWidgetState,
  UILanguage,
  DEFAULT_SETTINGS,
  DEFAULT_CONTEXT,
  DEFAULT_WIDGET_STATE,
} from './types';

const STORAGE_KEYS = {
  settings: 'ext_settings',
  context: 'user_context',
  widgetState: 'widget_state',
  uiLanguage: 'ui_language',
} as const;

/** Load extension settings from chrome.storage.local */
export async function loadSettings(): Promise<ExtensionSettings> {
  return new Promise((resolve) => {
    try {
      if (!chrome.storage?.local) {
        resolve({ ...DEFAULT_SETTINGS });
        return;
      }
      chrome.storage.local.get(STORAGE_KEYS.settings, (result) => {
        if (chrome.runtime?.lastError) {
          resolve({ ...DEFAULT_SETTINGS });
          return;
        }
        const stored = result?.[STORAGE_KEYS.settings];
        resolve(stored ? { ...DEFAULT_SETTINGS, ...stored } : { ...DEFAULT_SETTINGS });
      });
    } catch {
      resolve({ ...DEFAULT_SETTINGS });
    }
  });
}

/** Save extension settings */
export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  return new Promise((resolve) => {
    try {
      if (!chrome.storage?.local) {
        resolve();
        return;
      }
      chrome.storage.local.set({ [STORAGE_KEYS.settings]: settings }, () => {
        if (chrome.runtime?.lastError) {
          /* swallow invalidated context error */
        }
        resolve();
      });
    } catch {
      resolve();
    }
  });
}

/** Load user context / resume data */
export async function loadContext(): Promise<UserContext> {
  return new Promise((resolve) => {
    try {
      if (!chrome.storage?.local) {
        resolve({ ...DEFAULT_CONTEXT });
        return;
      }
      chrome.storage.local.get(STORAGE_KEYS.context, (result) => {
        if (chrome.runtime?.lastError) {
          resolve({ ...DEFAULT_CONTEXT });
          return;
        }
        const stored = result?.[STORAGE_KEYS.context];
        resolve(stored ? { ...DEFAULT_CONTEXT, ...stored } : { ...DEFAULT_CONTEXT });
      });
    } catch {
      resolve({ ...DEFAULT_CONTEXT });
    }
  });
}

/** Save user context / resume data */
export async function saveContext(context: UserContext): Promise<void> {
  return new Promise((resolve) => {
    try {
      if (!chrome.storage?.local) {
        resolve();
        return;
      }
      chrome.storage.local.set({ [STORAGE_KEYS.context]: context }, () => {
        if (chrome.runtime?.lastError) {
          /* swallow invalidated context error */
        }
        resolve();
      });
    } catch {
      resolve();
    }
  });
}

/** Load floating widget state */
export async function loadWidgetState(): Promise<FloatingWidgetState> {
  return new Promise((resolve) => {
    try {
      if (!chrome.storage?.local) {
        resolve({ ...DEFAULT_WIDGET_STATE });
        return;
      }
      chrome.storage.local.get(STORAGE_KEYS.widgetState, (result) => {
        if (chrome.runtime?.lastError) {
          resolve({ ...DEFAULT_WIDGET_STATE });
          return;
        }
        const stored = result?.[STORAGE_KEYS.widgetState];
        resolve(stored ? { ...DEFAULT_WIDGET_STATE, ...stored } : { ...DEFAULT_WIDGET_STATE });
      });
    } catch {
      resolve({ ...DEFAULT_WIDGET_STATE });
    }
  });
}

/** Save floating widget state */
export async function saveWidgetState(state: FloatingWidgetState): Promise<void> {
  return new Promise((resolve) => {
    try {
      if (!chrome.storage?.local) {
        resolve();
        return;
      }
      chrome.storage.local.set({ [STORAGE_KEYS.widgetState]: state }, () => {
        if (chrome.runtime?.lastError) {
          /* swallow invalidated context error */
        }
        resolve();
      });
    } catch {
      resolve();
    }
  });
}

/** Load UI language (defaults to 'en') */
export async function loadUILanguage(): Promise<UILanguage> {
  return new Promise((resolve) => {
    try {
      if (!chrome.storage?.local) {
        resolve('en');
        return;
      }
      chrome.storage.local.get(STORAGE_KEYS.uiLanguage, (result) => {
        if (chrome.runtime?.lastError) {
          resolve('en');
          return;
        }
        resolve((result?.[STORAGE_KEYS.uiLanguage] as UILanguage) || 'en');
      });
    } catch {
      resolve('en');
    }
  });
}

/** Save UI language */
export async function saveUILanguage(lang: UILanguage): Promise<void> {
  return new Promise((resolve) => {
    try {
      if (!chrome.storage?.local) {
        resolve();
        return;
      }
      chrome.storage.local.set({ [STORAGE_KEYS.uiLanguage]: lang }, () => {
        if (chrome.runtime?.lastError) {
          /* swallow invalidated context error */
        }
        resolve();
      });
    } catch {
      resolve();
    }
  });
}

