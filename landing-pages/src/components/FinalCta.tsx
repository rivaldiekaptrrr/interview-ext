import { CHROME_WEB_STORE_URL, trackEvent } from '../config/links';
import type { LandingCopy, Locale } from '../i18n/types';

interface FinalCtaProps {
  locale: Locale;
  copy: LandingCopy['finalCta'];
  onPlaceholderInstall: () => void;
}

export function FinalCta({ locale, copy, onPlaceholderInstall }: FinalCtaProps) {
  const handleInstallClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    trackEvent('cta_install_click', { location: 'final_band', locale });
    if (CHROME_WEB_STORE_URL.startsWith('#')) {
      event.preventDefault();
      onPlaceholderInstall();
    }
  };

  return (
    <section className="bg-[#f8fafc] py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[#c7d2fe] bg-[#eef2ff] px-6 py-12 text-center sm:px-12">
          <h2 className="mx-auto max-w-2xl text-2xl font-bold tracking-[-0.02em] text-[#0f172a] sm:text-3xl">
            {copy.heading}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-[#334155]">
            {copy.description}
          </p>
          <div className="mt-7 flex justify-center">
            <a
              href={CHROME_WEB_STORE_URL}
              onClick={handleInstallClick}
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#4f46e5] px-7 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#4338ca]"
            >
              {copy.button}
            </a>
          </div>
          <p className="mt-3 text-sm text-[#475569]">{copy.note}</p>
        </div>
      </div>
    </section>
  );
}
