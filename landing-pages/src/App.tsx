import { useEffect, useState } from 'react';
import { Capabilities } from './components/Capabilities';
import { FaqSection } from './components/FaqSection';
import { FinalCta } from './components/FinalCta';
import { Footer } from './components/Footer';
import { HeroSimulator } from './components/HeroSimulator';
import { HowItWorks } from './components/HowItWorks';
import { Navbar } from './components/Navbar';
import { ProblemSolution } from './components/ProblemSolution';
import { TermsModal } from './components/TermsModal';
import { UseCaseScenarios } from './components/UseCaseScenarios';
import { trackEvent } from './config/links';
import { enCopy } from './i18n/en';
import { idCopy } from './i18n/id';
import type { Locale } from './i18n/types';

export function App() {
  const [locale, setLocale] = useState<Locale>('en');
  const [showPlaceholderBanner, setShowPlaceholderBanner] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  const copy = locale === 'en' ? enCopy : idCopy;

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const handleLocaleChange = (next: Locale) => {
    setLocale(next);
    trackEvent('language_switch', { locale: next });
  };

  const handleOpenTerms = () => {
    setTermsOpen(true);
    trackEvent('terms_modal_open', { locale });
  };

  const handleTriggerPlaceholder = () => {
    setShowPlaceholderBanner(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#334155]">
      <Navbar
        locale={locale}
        onLocaleChange={handleLocaleChange}
        copy={copy.nav}
        onPlaceholderInstall={handleTriggerPlaceholder}
      />

      <main id="main-content">
        <HeroSimulator
          locale={locale}
          hero={copy.hero}
          simulator={copy.simulator}
          showPlaceholderBanner={showPlaceholderBanner}
          onTriggerPlaceholder={handleTriggerPlaceholder}
          onDismissPlaceholder={() => setShowPlaceholderBanner(false)}
        />

        <ProblemSolution copy={copy.problemSolution} />

        <Capabilities copy={copy.capabilities} />

        <HowItWorks copy={copy.howItWorks} />

        <UseCaseScenarios copy={copy.scenarios} />

        <FaqSection locale={locale} copy={copy.faq} />

        <FinalCta
          locale={locale}
          copy={copy.finalCta}
          onPlaceholderInstall={handleTriggerPlaceholder}
        />
      </main>

      <Footer nav={copy.nav} footer={copy.footer} onOpenTerms={handleOpenTerms} />

      <TermsModal
        open={termsOpen}
        onClose={() => setTermsOpen(false)}
        copy={copy.termsModal}
      />
    </div>
  );
}

export default App;
