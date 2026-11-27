/**
 * Centralized destination links and analytics helpers for the EasyInterview landing page.
 *
 * Replace CHROME_WEB_STORE_URL once the Chrome Web Store listing is published.
 */
export const CHROME_WEB_STORE_URL = '#install-extension';

export const PRIVACY_POLICY_URL = 'https://rivaldiekaptrrr.github.io/interview-ext/';

export const SUPPORT_EMAIL = 'rivaldiekaputr@gmail.com';

export type AnalyticsEventName =
  | 'cta_install_click'
  | 'simulator_question_select'
  | 'simulator_view_switch'
  | 'language_switch'
  | 'faq_expand'
  | 'terms_modal_open';

export function trackEvent(
  name: AnalyticsEventName,
  params?: Record<string, string | number | boolean>
): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('easyinterview:analytics', {
      detail: { name, params: params ?? {}, timestamp: Date.now() },
    })
  );
}
