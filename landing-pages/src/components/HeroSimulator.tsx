import { Eye, EyeOff, Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import meetCallPhoto from '../../assets/foto1.jpg';
import { CHROME_WEB_STORE_URL, trackEvent } from '../config/links';
import type { LandingCopy, Locale } from '../i18n/types';

interface HeroSimulatorProps {
  locale: Locale;
  hero: LandingCopy['hero'];
  simulator: LandingCopy['simulator'];
  showPlaceholderBanner: boolean;
  onTriggerPlaceholder: () => void;
  onDismissPlaceholder: () => void;
}

export function HeroSimulator({
  locale,
  hero,
  simulator,
  showPlaceholderBanner,
  onTriggerPlaceholder,
  onDismissPlaceholder,
}: HeroSimulatorProps) {
  const [selectedQuestionIdx, setSelectedQuestionIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'bullets' | 'script'>('bullets');
  const [revealedCount, setRevealedCount] = useState(4);
  const [isDrafting, setIsDrafting] = useState(false);
  const [hudHidden, setHudHidden] = useState(false);

  const activeQuestion = simulator.questions[selectedQuestionIdx] ?? simulator.questions[0];
  const activeLines = viewMode === 'bullets' ? activeQuestion.bullets : activeQuestion.script;

  // Stream lines sequentially when switching questions without shifting container size
  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setIsDrafting(false);
      setRevealedCount(activeLines.length);
      return;
    }

    setIsDrafting(true);
    setRevealedCount(1);

    const timers: number[] = [];
    for (let step = 2; step <= activeLines.length; step += 1) {
      const timer = window.setTimeout(() => {
        setRevealedCount(step);
        if (step === activeLines.length) {
          setIsDrafting(false);
        }
      }, (step - 1) * 320);
      timers.push(timer);
    }

    if (activeLines.length <= 1) {
      setIsDrafting(false);
    }

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [selectedQuestionIdx, locale, viewMode, activeLines.length]);

  const handleSelectQuestion = (idx: number) => {
    setHudHidden(false);
    setSelectedQuestionIdx(idx);
    trackEvent('simulator_question_select', {
      questionId: simulator.questions[idx]?.id ?? 'unknown',
      locale,
    });
  };

  const handleSwitchView = (next: 'bullets' | 'script') => {
    setViewMode(next);
    trackEvent('simulator_view_switch', { view: next, locale });
  };

  const handleAnswerNow = () => {
    setIsDrafting(false);
    setRevealedCount(activeLines.length);
  };

  const handleInstallClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    trackEvent('cta_install_click', { location: 'hero', locale });
    if (CHROME_WEB_STORE_URL.startsWith('#')) {
      event.preventDefault();
      onTriggerPlaceholder();
    }
  };

  return (
    <section className="relative overflow-hidden border-b border-[#e2e8f0] bg-[#f8fafc] pt-8 pb-14 sm:pt-12 sm:pb-20">
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
        {showPlaceholderBanner && (
          <div
            role="status"
            className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-[#c7d2fe] bg-[#eef2ff] px-4 py-3 text-sm text-[#3730a3]"
          >
            <p>{hero.placeholderBanner}</p>
            <button
              type="button"
              onClick={onDismissPlaceholder}
              aria-label={hero.placeholderClose}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#3730a3] hover:bg-white/70"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="grid items-start gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Left column: Persuade thesis & conversion block */}
          <div className="lg:col-span-5 lg:pt-6">
            <h1 className="text-[2rem] leading-[1.12] font-bold tracking-[-0.025em] text-[#0f172a] sm:text-[2.6rem]">
              {hero.headline}
            </h1>

            <p className="mt-5 max-w-[54ch] text-[1.0625rem] leading-[1.65] text-[#334155]">
              {hero.subheadline}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href={CHROME_WEB_STORE_URL}
                onClick={handleInstallClick}
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#4f46e5] px-6 py-3 text-[0.95rem] font-semibold text-white shadow-sm transition-colors hover:bg-[#4338ca]"
              >
                {hero.primaryCta}
              </a>

              <a
                href="#how-it-works"
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-[#cbd5e1] bg-white px-5 py-3 text-sm font-semibold text-[#0f172a] transition-colors hover:border-[#94a3b8] hover:bg-[#f1f5f9]"
              >
                {hero.secondaryCta}
              </a>
            </div>

            <p className="mt-4 max-w-[48ch] text-sm leading-relaxed text-[#64748b]">
              {hero.postClickNote}
            </p>
          </div>

          {/* Right column: Full uncropped Google Meet frame (2784x1504) with Top-Left Floating HUD Popup */}
          <div className="lg:col-span-7">
            <div className="overflow-hidden rounded-2xl border border-[#cbd5e1] bg-white shadow-[0_20px_50px_-14px_rgba(15,23,42,0.14)]">
              <div className="flex items-center justify-between border-b border-[#e2e8f0] bg-[#f8fafc] px-4 py-2.5">
                <span className="text-xs font-semibold text-[#0f172a]">{simulator.callTitle}</span>
              </div>

              {/* Stage preserving exact 2784x1504 aspect ratio with zero image cropping */}
              <div className="relative w-full bg-white">
                <img
                  src={meetCallPhoto}
                  alt={simulator.photoAlt}
                  width={2784}
                  height={1504}
                  fetchPriority="high"
                  className="block aspect-[2784/1504] h-auto w-full"
                />

                {/* Top-Left Floating HUD Popup (overlaid on sm+ desktop/tablet, docked cleanly below on small mobile) */}
                {hudHidden ? (
                  <div className="border-t border-[#e2e8f0] bg-[#f8fafc] p-3 sm:absolute sm:top-[11.5%] sm:left-3 sm:z-20 sm:border-0 sm:bg-transparent sm:p-0">
                    <button
                      type="button"
                      onClick={() => setHudHidden(false)}
                      className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-[#c7d2fe] bg-white/95 px-3.5 py-2 text-xs font-semibold text-[#3730a3] shadow-lg backdrop-blur-md hover:bg-[#eef2ff]"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>{simulator.showHudButton}</span>
                    </button>
                  </div>
                ) : (
                  <div className="border-t border-[#e2e8f0] bg-[#f1f5f9] p-3 sm:absolute sm:top-[11.5%] sm:left-3 sm:z-20 sm:flex sm:max-h-[74%] sm:w-[46%] sm:min-w-[275px] sm:max-w-[345px] sm:flex-col sm:border-0 sm:bg-transparent sm:p-0">
                    <div className="hud-frosted flex flex-col overflow-hidden rounded-xl border border-[#cbd5e1] shadow-[0_14px_34px_-8px_rgba(15,23,42,0.28)] sm:max-h-full">
                      {/* Compact Popup Header */}
                      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#e2e8f0] px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <img
                            src="/favicon.png"
                            alt=""
                            width={18}
                            height={18}
                            className="h-4.5 w-4.5 rounded"
                          />
                          <span className="text-xs font-bold text-[#0f172a]">
                            {simulator.hudTitle}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                              isDrafting
                                ? 'border-[#c7d2fe] bg-[#eef2ff] text-[#3730a3]'
                                : 'border-[#a7f3d0] bg-[#ecfdf5] text-[#059669]'
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isDrafting ? 'bg-[#4f46e5]' : 'bg-[#10b981]'
                              }`}
                            />
                            {isDrafting ? simulator.statusDrafting : simulator.statusListening}
                          </span>

                          <button
                            type="button"
                            onClick={() => setHudHidden(true)}
                            title={simulator.hideButtonTitle}
                            aria-label={simulator.hideButtonTitle}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
                          >
                            <EyeOff className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Compact Controls Row */}
                      <div className="flex shrink-0 items-center justify-between gap-1.5 border-b border-[#f1f5f9] px-3 py-1.5">
                        <div
                          role="tablist"
                          aria-label="Answer format"
                          className="inline-flex rounded-lg bg-[#f1f5f9] p-0.5"
                        >
                          <button
                            type="button"
                            role="tab"
                            aria-selected={viewMode === 'bullets'}
                            onClick={() => handleSwitchView('bullets')}
                            className={`min-h-[28px] rounded-md px-2 text-[11px] font-semibold transition-colors ${
                              viewMode === 'bullets'
                                ? 'bg-white text-[#0f172a] shadow-xs'
                                : 'text-[#64748b] hover:text-[#0f172a]'
                            }`}
                          >
                            {simulator.tabBullets}
                          </button>
                          <button
                            type="button"
                            role="tab"
                            aria-selected={viewMode === 'script'}
                            onClick={() => handleSwitchView('script')}
                            className={`min-h-[28px] rounded-md px-2 text-[11px] font-semibold transition-colors ${
                              viewMode === 'script'
                                ? 'bg-white text-[#0f172a] shadow-xs'
                                : 'text-[#64748b] hover:text-[#0f172a]'
                            }`}
                          >
                            {simulator.tabScript}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={handleAnswerNow}
                          className="inline-flex min-h-[28px] items-center gap-1 rounded-md bg-[#4f46e5] px-2 text-[11px] font-semibold text-white hover:bg-[#4338ca]"
                        >
                          <Sparkles className="h-3 w-3" />
                          <span>{simulator.answerNowButton}</span>
                        </button>
                      </div>

                      {/* Scrollable Question & Streaming Answer Body */}
                      <div className="simulator-scroll flex-1 overflow-y-auto px-3 py-2.5">
                        <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1.5">
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-[#4f46e5]">
                            {simulator.questionHeading}
                          </span>
                          <p className="mt-0.5 text-[11.5px] leading-snug text-[#334155]">
                            {activeQuestion.question}
                          </p>
                        </div>

                        <div
                          aria-live="polite"
                          className="mt-2 space-y-1.5 text-[11.5px] leading-[1.5] text-[#0f172a]"
                        >
                          {viewMode === 'bullets' ? (
                            <ul className="space-y-1">
                              {activeLines.slice(0, revealedCount).map((line, idx) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#4f46e5]" />
                                  <span>{line}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="space-y-1.5">
                              {activeLines.slice(0, revealedCount).map((line, idx) => (
                                <p key={idx}>{line}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Compact Shortcut Hint Bar */}
                      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-[#e2e8f0] bg-[#f8fafc]/80 px-3 py-1.5 text-[10px] text-[#64748b]">
                        <span className="truncate">{activeQuestion.interviewerName}</span>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <span>
                            <kbd className="rounded border border-[#cbd5e1] bg-white px-1 py-0.5 font-semibold text-[#334155]">
                              Alt+H
                            </kbd>{' '}
                            {simulator.shortcutHintHide}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Interactive Preset Question Selector */}
              <div className="border-t border-[#e2e8f0] bg-white px-4 py-3">
                <p className="text-xs font-medium text-[#64748b]">{simulator.promptInstruction}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {simulator.questions.map((item, idx) => {
                    const isSelected = idx === selectedQuestionIdx;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectQuestion(idx)}
                        aria-pressed={isSelected}
                        className={`min-h-[40px] rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                          isSelected
                            ? 'border-[#4f46e5] bg-[#eef2ff] text-[#3730a3]'
                            : 'border-[#e2e8f0] bg-[#f8fafc] text-[#334155] hover:border-[#cbd5e1] hover:bg-[#f1f5f9]'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
