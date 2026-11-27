import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { CHROME_WEB_STORE_URL, trackEvent } from '../config/links';
import type { LandingCopy, Locale } from '../i18n/types';

interface NavbarProps {
  locale: Locale;
  onLocaleChange: (next: Locale) => void;
  copy: LandingCopy['nav'];
  onPlaceholderInstall: () => void;
}

export function Navbar({
  locale,
  onLocaleChange,
  copy,
  onPlaceholderInstall,
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleInstallClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    trackEvent('cta_install_click', { location: 'navbar', locale });
    if (CHROME_WEB_STORE_URL.startsWith('#')) {
      event.preventDefault();
      onPlaceholderInstall();
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#e2e8f0] bg-white/90 backdrop-blur-md">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-[#4f46e5] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        {copy.skipToContent}
      </a>

      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a
          href="#"
          className="flex min-h-[44px] items-center gap-2.5 rounded-lg pr-2 font-semibold tracking-tight text-[#0f172a]"
        >
          <img
            src="/favicon.png"
            alt="EasyInterview logo"
            width={28}
            height={28}
            className="h-7 w-7 rounded-lg"
          />
          <span className="text-[1.0625rem] font-bold">EasyInterview</span>
        </a>

        <nav aria-label="Primary navigation" className="hidden items-center gap-7 md:flex">
          <a
            href="#features"
            className="text-sm font-medium text-[#475569] transition-colors hover:text-[#0f172a]"
          >
            {copy.features}
          </a>
          <a
            href="#how-it-works"
            className="text-sm font-medium text-[#475569] transition-colors hover:text-[#0f172a]"
          >
            {copy.howItWorks}
          </a>
          <a
            href="#scenarios"
            className="text-sm font-medium text-[#475569] transition-colors hover:text-[#0f172a]"
          >
            {copy.scenarios}
          </a>
          <a
            href="#faq"
            className="text-sm font-medium text-[#475569] transition-colors hover:text-[#0f172a]"
          >
            {copy.faq}
          </a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <div
            role="group"
            aria-label={copy.langToggleAria}
            className="inline-flex h-11 items-center rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-1"
          >
            <button
              type="button"
              onClick={() => onLocaleChange('en')}
              aria-pressed={locale === 'en'}
              className={`min-h-[34px] min-w-[40px] rounded-lg px-2.5 text-xs font-semibold transition-colors ${
                locale === 'en'
                  ? 'bg-white text-[#0f172a] shadow-xs'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => onLocaleChange('id')}
              aria-pressed={locale === 'id'}
              className={`min-h-[34px] min-w-[40px] rounded-lg px-2.5 text-xs font-semibold transition-colors ${
                locale === 'id'
                  ? 'bg-white text-[#0f172a] shadow-xs'
                  : 'text-[#64748b] hover:text-[#0f172a]'
              }`}
            >
              ID
            </button>
          </div>

          <a
            href={CHROME_WEB_STORE_URL}
            onClick={handleInstallClick}
            className="hidden min-h-[44px] items-center justify-center rounded-xl bg-[#4f46e5] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#4338ca] sm:inline-flex"
          >
            {copy.cta}
          </a>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#e2e8f0] text-[#334155] hover:bg-[#f8fafc] md:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-[#e2e8f0] bg-white px-4 py-3 md:hidden">
          <nav aria-label="Mobile navigation" className="flex flex-col gap-1">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-[44px] items-center rounded-lg px-2 text-sm font-medium text-[#334155] hover:bg-[#f8fafc]"
            >
              {copy.features}
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-[44px] items-center rounded-lg px-2 text-sm font-medium text-[#334155] hover:bg-[#f8fafc]"
            >
              {copy.howItWorks}
            </a>
            <a
              href="#scenarios"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-[44px] items-center rounded-lg px-2 text-sm font-medium text-[#334155] hover:bg-[#f8fafc]"
            >
              {copy.scenarios}
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-[44px] items-center rounded-lg px-2 text-sm font-medium text-[#334155] hover:bg-[#f8fafc]"
            >
              {copy.faq}
            </a>
            <a
              href={CHROME_WEB_STORE_URL}
              onClick={(e) => {
                setMobileMenuOpen(false);
                handleInstallClick(e);
              }}
              className="mt-2 flex min-h-[44px] items-center justify-center rounded-xl bg-[#4f46e5] px-4 text-sm font-semibold text-white hover:bg-[#4338ca] sm:hidden"
            >
              {copy.cta}
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
