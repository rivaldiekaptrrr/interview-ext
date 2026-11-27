import { PRIVACY_POLICY_URL, SUPPORT_EMAIL } from '../config/links';
import type { LandingCopy } from '../i18n/types';

interface FooterProps {
  nav: LandingCopy['nav'];
  footer: LandingCopy['footer'];
  onOpenTerms: () => void;
}

export function Footer({ nav, footer, onOpenTerms }: FooterProps) {
  return (
    <footer className="border-t border-[#e2e8f0] bg-white py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5">
              <img
                src="/favicon.png"
                alt="EasyInterview logo"
                width={26}
                height={26}
                className="h-6.5 w-6.5 rounded-lg"
              />
              <span className="text-base font-bold text-[#0f172a]">EasyInterview</span>
            </div>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#475569]">
              {footer.tagline}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[#0f172a]">{footer.navHeading}</h3>
            <ul className="mt-3 space-y-2 text-sm text-[#475569]">
              <li>
                <a href="#features" className="inline-flex min-h-[36px] items-center hover:text-[#0f172a]">
                  {nav.features}
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="inline-flex min-h-[36px] items-center hover:text-[#0f172a]">
                  {nav.howItWorks}
                </a>
              </li>
              <li>
                <a href="#scenarios" className="inline-flex min-h-[36px] items-center hover:text-[#0f172a]">
                  {nav.scenarios}
                </a>
              </li>
              <li>
                <a href="#faq" className="inline-flex min-h-[36px] items-center hover:text-[#0f172a]">
                  {nav.faq}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[#0f172a]">{footer.legalHeading}</h3>
            <ul className="mt-3 space-y-2 text-sm text-[#475569]">
              <li>
                <a
                  href={PRIVACY_POLICY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[36px] items-center hover:text-[#0f172a]"
                >
                  {footer.privacyPolicy}
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenTerms}
                  className="inline-flex min-h-[36px] items-center text-left hover:text-[#0f172a]"
                >
                  {footer.termsOfService}
                </button>
              </li>
              <li>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="inline-flex min-h-[36px] items-center break-all hover:text-[#0f172a]"
                >
                  {footer.supportLabel} ({SUPPORT_EMAIL})
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-[#e2e8f0] pt-6 text-xs text-[#64748b]">
          <p>{footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
}
