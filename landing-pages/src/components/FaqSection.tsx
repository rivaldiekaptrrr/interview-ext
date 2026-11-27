import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { trackEvent } from '../config/links';
import type { LandingCopy, Locale } from '../i18n/types';

interface FaqSectionProps {
  locale: Locale;
  copy: LandingCopy['faq'];
}

export function FaqSection({ locale, copy }: FaqSectionProps) {
  const [openId, setOpenId] = useState<string | null>(copy.items[0]?.id ?? null);

  const toggleItem = (id: string) => {
    const next = openId === id ? null : id;
    setOpenId(next);
    if (next) {
      trackEvent('faq_expand', { questionId: id, locale });
    }
  };

  return (
    <section id="faq" className="border-b border-[#e2e8f0] bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-[-0.02em] text-[#0f172a] sm:text-3xl">
            {copy.heading}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[#475569]">{copy.lead}</p>
        </div>

        <div className="mt-10 divide-y divide-[#e2e8f0] rounded-2xl border border-[#e2e8f0] bg-[#f8fafc]">
          {copy.items.map((item) => {
            const isOpen = openId === item.id;
            const panelId = `faq-panel-${item.id}`;
            const buttonId = `faq-button-${item.id}`;

            return (
              <div key={item.id} className="px-5 py-1 sm:px-6">
                <h3>
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggleItem(item.id)}
                    className="flex min-h-[56px] w-full items-center justify-between gap-4 py-3 text-left text-[1rem] font-semibold text-[#0f172a] transition-colors hover:text-[#4f46e5]"
                  >
                    <span>{item.question}</span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-[#64748b] transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-[#4f46e5]' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  hidden={!isOpen}
                  className="pb-5 text-[0.95rem] leading-relaxed text-[#475569]"
                >
                  {item.answer}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
