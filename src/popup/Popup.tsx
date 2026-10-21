import React, { useEffect, useState, useCallback } from 'react';
import {
  type ExtensionSettings,
  type UserContext,
  type AIProvider,
  type ResponseLanguage,
  type AnswerTone,
  type UILanguage,
  PROVIDER_DEFAULTS,
  DEFAULT_SETTINGS,
  DEFAULT_CONTEXT,
} from '../lib/types';
import { loadSettings, saveSettings, loadContext, saveContext, loadUILanguage, saveUILanguage } from '../lib/storage';
import { getI18n, type Translations } from '../lib/i18n';
import { testConnection } from '../lib/ai-client';
import { checkGitHubUpdate, type UpdateCheckResult } from '../lib/update-checker';
import { IconOpenAI, IconClaude, IconGemini, IconBrandLogo } from './AILogos';

type Tab = 'settings' | 'context';
type Theme = 'light' | 'dark';

/* ═══════════════════════════════════════════════════════════════════════════
 * Professional Vector Icons (Zero Emojis — Clean Minimalist SVG)
 * ═══════════════════════════════════════════════════════════════════════════ */

function IconLogo({ className = 'w-4 h-4' }: { className?: string }) {
  return <IconBrandLogo className={className} />;
}

function IconSun({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function IconMoon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function IconScreen({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  );
}

function IconChevronRight({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function IconSettings({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function IconDocument({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function IconEye({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconEyeOff({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function IconZap({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function IconSave({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}

function IconInfo({ className = 'hint-icon' }: { className?: string }) {
  return (
    <svg
      className={className}
      width={14}
      height={14}
      style={{ width: 14, height: 14, minWidth: 14, minHeight: 14, maxWidth: 14, maxHeight: 14, flexShrink: 0 }}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function IconCheck({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// Provider Badges (OpenAI, Gemini, Claude imported from ./AILogos)

function IconCustomCode({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Main Popup Component
 * ═══════════════════════════════════════════════════════════════════════════ */

export function Popup() {
  const [activeTab, setActiveTab] = useState<Tab>('settings');
  const [theme, setTheme] = useState<Theme>('light');
  const [uiLang, setUiLang] = useState<UILanguage>('en');
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [context, setContext] = useState<UserContext>(DEFAULT_CONTEXT);
  const [toast, setToast] = useState('');
  const [isOnMeet, setIsOnMeet] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  const t = getI18n(uiLang);

  // ── Load stored data, language & theme on mount ──
  useEffect(() => {
    loadSettings().then(setSettings);
    loadContext().then(setContext);
    loadUILanguage().then(setUiLang);

    // Default theme is explicitly light
    chrome.storage.local.get('ui_theme', (res) => {
      const savedTheme: Theme = res.ui_theme === 'dark' ? 'dark' : 'light';
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    });

    // Check if current active tab is Google Meet
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs[0]?.url || '';
      setIsOnMeet(url.includes('meet.google.com'));
    });

    // Silent background check for GitHub release updates
    checkGitHubUpdate().then((res) => {
      if (res?.hasUpdate) {
        setUpdateInfo(res);
      }
    });
  }, []);

  // ── Manual Update Check Handler ──
  const handleManualUpdateCheck = async () => {
    if (isCheckingUpdate) return;
    setIsCheckingUpdate(true);
    showToast(t.checkingUpdateToast);
    const res = await checkGitHubUpdate();
    setIsCheckingUpdate(false);
    if (res?.hasUpdate) {
      setUpdateInfo(res);
    } else {
      showToast(t.upToDateToast.replace('{version}', t.version));
    }
  };

  // ── Theme toggle ──
  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    chrome.storage.local.set({ ui_theme: nextTheme });
  };

  // ── Language change ──
  const handleLanguageChange = async (newLang: UILanguage) => {
    setUiLang(newLang);
    await saveUILanguage(newLang);
    setContext((prev) => {
      const updated = { ...prev, language: newLang as ResponseLanguage };
      saveContext(updated);
      return updated;
    });
  };

  // ── Toast helper ──
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }, []);

  // ── Provider change ──
  const handleProviderChange = (provider: AIProvider) => {
    const defaults = PROVIDER_DEFAULTS[provider];
    setSettings((prev) => ({
      ...prev,
      provider,
      baseUrl: defaults.baseUrl,
      model: defaults.models[0],
    }));
  };

  // ── Save Settings ──
  const handleSaveSettings = async () => {
    await saveSettings(settings);
    showToast(t.toastSettingsSaved);
  };

  // ── Save Context ──
  const handleSaveContext = async () => {
    await saveContext(context);
    showToast(t.toastContextSaved);
  };

  return (
    <div className="popup-container">
      {/* ── App Header ── */}
      <header className="popup-header">
        <div className="header-left">
          <div className="logo-badge">
            <IconLogo className="logo-svg" />
          </div>
          <div className="title-group">
            <div className="brand-line">
              <h1 className="brand-name">{t.brandName}</h1>
              <span
                className="version-pill clickable"
                onClick={handleManualUpdateCheck}
                title={uiLang === 'en' ? 'Click to check for updates' : 'Klik untuk periksa pembaruan'}
              >
                {t.version}
              </span>
            </div>
            <p className="brand-tagline">{t.brandTagline}</p>
          </div>
        </div>

        <div className="header-actions">
          {/* Language Toggle Pill */}
          <div className="lang-toggle-pill" role="group" aria-label="Language selection">
            <button
              type="button"
              className={`lang-btn ${uiLang === 'en' ? 'active' : ''}`}
              onClick={() => handleLanguageChange('en')}
              title="Switch to English"
            >
              EN
            </button>
            <button
              type="button"
              className={`lang-btn ${uiLang === 'id' ? 'active' : ''}`}
              onClick={() => handleLanguageChange('id')}
              title="Ganti ke Bahasa Indonesia"
            >
              ID
            </button>
          </div>

          {/* Status Pill */}
          <div className={`status-pill ${isOnMeet ? 'online' : 'standby'}`}>
            <span className="status-dot" />
            <span className="status-text">{isOnMeet ? (uiLang === 'en' ? 'In Google Meet' : 'Di Google Meet') : (uiLang === 'en' ? 'Standby' : 'Standby')}</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === 'light' ? t.themeDark : t.themeLight}
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? <IconMoon /> : <IconSun />}
          </button>
        </div>
      </header>

      {/* ── In-App Update Notice Banner (Clean Minimalist Design) ── */}
      {updateInfo?.hasUpdate && (
        <div className="update-notice-banner">
          <div className="update-notice-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ width: 14, height: 14, minWidth: 14, minHeight: 14 }}
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </div>
          <div className="update-notice-body">
            <div className="update-notice-title">
              <span className="update-pill">{t.updateBadge}</span>
              <span className="update-version-label">{updateInfo.latestVersion}</span>
            </div>
            <p className="update-notice-desc">
              {t.updateAvailableDesc.replace('{version}', updateInfo.latestVersion)}
            </p>
          </div>
          <div className="update-notice-actions">
            <button
              type="button"
              className="btn-update-download"
              onClick={() => chrome.tabs.create({ url: updateInfo.downloadUrl })}
              title={t.btnDownloadUpdate}
            >
              {t.btnDownloadUpdate}
            </button>
            <button
              type="button"
              className="btn-update-dismiss"
              onClick={() => setUpdateInfo(null)}
              title="Dismiss"
              aria-label="Dismiss"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ width: 12, height: 12, minWidth: 12, minHeight: 12 }}
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Interactive Demo Simulator Banner ── */}
      <div
        className="demo-card-banner"
        onClick={() => {
          chrome.tabs.create({ url: chrome.runtime.getURL('demo/simulator.html') });
        }}
        role="button"
        tabIndex={0}
        title={t.demoBannerTitle}
      >
        <div className="demo-banner-icon-box">
          <IconScreen className="demo-screen-svg" />
        </div>
        <div className="demo-banner-content">
          <div className="demo-banner-title">
            <span>{t.demoBannerBtn}</span>
            <span className="demo-badge">{t.demoBannerBadge}</span>
          </div>
          <p className="demo-banner-desc">{t.demoBannerDesc}</p>
        </div>
        <div className="demo-banner-arrow">
          <IconChevronRight />
        </div>
      </div>

      {/* ── Segmented Tab Switcher ── */}
      <nav className="tab-segmented-control" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'settings'}
          className={`tab-segment ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <IconSettings className="tab-svg" />
          <span className="tab-text">{t.tabSettings}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'context'}
          className={`tab-segment ${activeTab === 'context' ? 'active' : ''}`}
          onClick={() => setActiveTab('context')}
        >
          <IconDocument className="tab-svg" />
          <span className="tab-text">{t.tabContext}</span>
          {context.resumeText.trim().length > 0 && <span className="tab-dot" title="Resume entered" />}
        </button>
      </nav>

      {/* ── Tab Content Area ── */}
      <main className="tab-panel-container">
        {activeTab === 'settings' ? (
          <SettingsTab
            settings={settings}
            onChange={setSettings}
            onProviderChange={handleProviderChange}
            onSave={handleSaveSettings}
            t={t}
            uiLang={uiLang}
          />
        ) : (
          <ContextTab
            context={context}
            onChange={setContext}
            onSave={handleSaveContext}
            t={t}
            uiLang={uiLang}
          />
        )}
      </main>

      {/* ── Floating Toast ── */}
      <div className={`toast-notification ${toast ? 'show' : ''}`}>
        <span className="toast-check-icon"><IconCheck /></span>
        <span className="toast-text">{toast}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Settings Tab Component
 * ═══════════════════════════════════════════════════════════════════════════ */
function SettingsTab({
  settings,
  onChange,
  onProviderChange,
  onSave,
  t,
  uiLang,
}: {
  settings: ExtensionSettings;
  onChange: React.Dispatch<React.SetStateAction<ExtensionSettings>>;
  onProviderChange: (p: AIProvider) => void;
  onSave: () => void;
  t: Translations;
  uiLang: UILanguage;
}) {
  const providers: { id: AIProvider; iconComponent: React.ReactNode; label: string }[] = [
    { id: 'openai', iconComponent: <IconOpenAI />, label: 'OpenAI' },
    { id: 'gemini', iconComponent: <IconGemini />, label: 'Gemini' },
    { id: 'claude', iconComponent: <IconClaude />, label: 'Claude' },
    { id: 'custom', iconComponent: <IconCustomCode />, label: 'Custom' },
  ];

  const currentDefaults = PROVIDER_DEFAULTS[settings.provider];

  const [showPassword, setShowPassword] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
  } | null>(null);

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testConnection(settings);
      setTestResult(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setTestResult({
        success: false,
        message: `${uiLang === 'en' ? 'Connection failed' : 'Koneksi gagal'}: ${msg}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="tab-pane-content">
      {/* ── Provider Selection ── */}
      <section className="form-section">
        <label className="section-label">{t.providerSectionTitle}</label>
        <div className="provider-grid">
          {providers.map((p) => {
            const isSelected = settings.provider === p.id;
            return (
              <button
                key={p.id}
                type="button"
                className={`provider-card ${isSelected ? 'selected' : ''}`}
                onClick={() => {
                  onProviderChange(p.id);
                  setTestResult(null);
                }}
              >
                <div className="provider-card-top">
                  <span className="provider-vector-icon">{p.iconComponent}</span>
                  {isSelected && (
                    <span className="provider-check-badge">
                      <IconCheck />
                    </span>
                  )}
                </div>
                <div className="provider-info">
                  <span className="provider-name">{p.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Base URL & API Key ── */}
      <section className="form-section">
        <div className="form-group">
          <label className="form-label">
            <span>{t.baseUrlLabel}</span>
            <span className="label-tag">API Endpoint</span>
          </label>
          <input
            className="input-field"
            type="text"
            value={settings.baseUrl}
            onChange={(e) => {
              onChange((s) => ({ ...s, baseUrl: e.target.value }));
              setTestResult(null);
            }}
            placeholder={currentDefaults.baseUrl}
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <span>{t.apiKeyLabel}</span>
            <span className="label-tag">{t.apiKeyHelp}</span>
          </label>
          <div className="input-with-action">
            <input
              className="input-field input-password"
              type={showPassword ? 'text' : 'password'}
              value={settings.apiKey}
              onChange={(e) => {
                onChange((s) => ({ ...s, apiKey: e.target.value }));
                setTestResult(null);
              }}
              placeholder={currentDefaults.placeholder}
            />
            <button
              type="button"
              className="input-icon-btn"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? (uiLang === 'en' ? 'Hide Key' : 'Sembunyikan Key') : (uiLang === 'en' ? 'Show Key' : 'Tampilkan Key')}
            >
              {showPassword ? <IconEyeOff /> : <IconEye />}
            </button>
          </div>
        </div>
      </section>

      {/* ── Model & Token ── */}
      <section className="form-section form-row-grid">
        <div className="form-group">
          <label className="form-label">{t.modelLabel}</label>
          {settings.provider === 'custom' ? (
            <input
              className="input-field"
              type="text"
              value={settings.model}
              onChange={(e) => {
                onChange((s) => ({ ...s, model: e.target.value }));
                setTestResult(null);
              }}
              placeholder={t.customModelPlaceholder}
            />
          ) : (
            <div className="select-wrapper">
              <select
                className="select-field"
                value={settings.model}
                onChange={(e) => {
                  onChange((s) => ({ ...s, model: e.target.value }));
                  setTestResult(null);
                }}
              >
                {currentDefaults.models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">{t.maxTokensLabel}</label>
          <input
            className="input-field"
            type="number"
            min={100}
            max={4096}
            step={100}
            value={settings.maxTokens}
            onChange={(e) =>
              onChange((s) => ({ ...s, maxTokens: parseInt(e.target.value, 10) || 800 }))
            }
          />
        </div>
      </section>

      {/* ── Temperature Slider ── */}
      <section className="form-section">
        <div className="slider-header">
          <label className="form-label" style={{ marginBottom: 0 }}>
            {t.temperatureLabel}
          </label>
          <span className="slider-value-badge">{settings.temperature.toFixed(2)}</span>
        </div>
        <div className="slider-container">
          <input
            type="range"
            className="range-slider"
            min={0}
            max={1}
            step={0.05}
            value={settings.temperature}
            onChange={(e) =>
              onChange((s) => ({ ...s, temperature: parseFloat(e.target.value) }))
            }
          />
        </div>
        <div className="slider-hints">
          <span>0.0 ({uiLang === 'en' ? 'Precise & Focused' : 'Presisi & Konsisten'})</span>
          <span>1.0 ({uiLang === 'en' ? 'Creative & Elaborate' : 'Variatif & Kreatif'})</span>
        </div>
      </section>

      {/* ── Test Connection Result Banner ── */}
      {testResult && (
        <div className={`result-alert-box ${testResult.success ? 'success' : 'error'}`}>
          <div className="result-alert-header">
            <span className="result-badge-icon">
              {testResult.success ? <IconCheck /> : '✕'}
            </span>
            <span className="result-title">
              {testResult.success ? (uiLang === 'en' ? 'Connection Successful' : 'Koneksi Berhasil') : (uiLang === 'en' ? 'Connection Failed' : 'Koneksi Gagal')}
            </span>
            {testResult.latencyMs !== undefined && testResult.latencyMs > 0 && (
              <span className="latency-pill">{testResult.latencyMs} ms</span>
            )}
          </div>
          <p className="result-alert-message">{testResult.message}</p>
        </div>
      )}

      {/* ── Action Buttons ── */}
      <footer className="footer-actions">
        <button
          type="button"
          className="btn-secondary"
          onClick={handleTest}
          disabled={isTesting}
          title={uiLang === 'en' ? 'Test Base URL and API Key connectivity' : 'Uji koneksi Base URL dan API Key'}
        >
          {isTesting ? (
            <>
              <span className="spinner-icon" /> {t.btnTesting}
            </>
          ) : (
            <>
              <IconZap /> {t.btnTestConnection}
            </>
          )}
        </button>

        <button
          type="button"
          className="btn-primary"
          onClick={onSave}
          disabled={isTesting}
        >
          <IconSave /> {t.btnSaveSettings}
        </button>
      </footer>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Context Tab Component
 * ═══════════════════════════════════════════════════════════════════════════ */
function ContextTab({
  context,
  onChange,
  onSave,
  t,
  uiLang,
}: {
  context: UserContext;
  onChange: React.Dispatch<React.SetStateAction<UserContext>>;
  onSave: () => void;
  t: Translations;
  uiLang: UILanguage;
}) {
  const charCount = context.resumeText.length;
  const wordCount = context.resumeText.trim() ? context.resumeText.trim().split(/\s+/).length : 0;

  return (
    <div className="tab-pane-content">
      {/* ── Resume / Portfolio Experience ── */}
      <section className="form-section">
        <div className="resume-header-row">
          <label className="form-label" style={{ marginBottom: 0 }}>
            <span>{t.resumeSectionTitle}</span>
          </label>
          <span className="char-badge">
            {wordCount} {uiLang === 'en' ? 'words' : 'kata'} • {charCount} {uiLang === 'en' ? 'chars' : 'karakter'}
          </span>
        </div>
        <p className="field-subtext">{t.resumeHint}</p>
        <textarea
          className="textarea-field resume-textarea"
          value={context.resumeText}
          onChange={(e) => onChange((c) => ({ ...c, resumeText: e.target.value }))}
          rows={6}
          placeholder={t.resumePlaceholder}
        />
      </section>

      {/* ── Target Role & Company ── */}
      <section className="form-section form-row-grid">
        <div className="form-group">
          <label className="form-label">{t.targetRoleLabel}</label>
          <input
            className="input-field"
            type="text"
            value={context.targetRole}
            onChange={(e) => onChange((c) => ({ ...c, targetRole: e.target.value }))}
            placeholder={t.targetRolePlaceholder}
          />
        </div>
        <div className="form-group">
          <label className="form-label">{t.companyNameLabel}</label>
          <input
            className="input-field"
            type="text"
            value={context.companyName}
            onChange={(e) => onChange((c) => ({ ...c, companyName: e.target.value }))}
            placeholder={t.companyNamePlaceholder}
          />
        </div>
      </section>

      {/* ── Language & Tone Preferences ── */}
      <section className="form-section form-row-grid">
        <div className="form-group">
          <label className="form-label">{t.answerLangLabel}</label>
          <div className="select-wrapper">
            <select
              className="select-field"
              value={context.language}
              onChange={(e) =>
                onChange((c) => ({ ...c, language: e.target.value as ResponseLanguage }))
              }
            >
              <option value="auto">{t.answerLangAuto}</option>
              <option value="en">{t.answerLangEn}</option>
              <option value="id">{t.answerLangId}</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">{t.answerToneLabel}</label>
          <div className="select-wrapper">
            <select
              className="select-field"
              value={context.tone}
              onChange={(e) =>
                onChange((c) => ({ ...c, tone: e.target.value as AnswerTone }))
              }
            >
              <option value="star">{t.toneStar}</option>
              <option value="concise">{t.toneConcise}</option>
              <option value="technical">{t.toneTechnical}</option>
            </select>
          </div>
        </div>
      </section>

      {/* ── Save Action ── */}
      <footer className="footer-actions">
        <button type="button" className="btn-primary full-width" onClick={onSave}>
          <IconSave /> {t.btnSaveContext}
        </button>
      </footer>

      {/* ── Helpful Hint Card ── */}
      <div className="hint-card">
        <IconInfo className="hint-icon" />
        <div className="hint-text">
          <strong>{uiLang === 'en' ? 'Context Tip:' : 'Tip Konteks:'}</strong>{' '}
          {uiLang === 'en'
            ? 'The more concrete metrics you provide in your resume (e.g. "reduced latency by 35%"), the more credible and compelling the AI answer scripts will be.'
            : 'Semakin spesifik metrik hasil proyek (misal: "meningkatkan retensi 25%"), semakin tajam dan kredibel naskah jawaban yang disusun oleh asisten AI.'}
        </div>
      </div>
    </div>
  );
}
