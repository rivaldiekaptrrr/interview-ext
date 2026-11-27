import { ShieldCheck } from 'lucide-react';
import type { LandingCopy } from '../i18n/types';

interface UseCaseScenariosProps {
  copy: LandingCopy['scenarios'];
}

export function UseCaseScenarios({ copy }: UseCaseScenariosProps) {
  return (
    <section id="scenarios" className="border-b border-[#e2e8f0] bg-[#f8fafc] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-[-0.02em] text-[#0f172a] sm:text-3xl">
            {copy.heading}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[#475569]">{copy.lead}</p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {copy.items.map((item) => (
            <article
              key={item.id}
              className="flex flex-col justify-between rounded-2xl border border-[#e2e8f0] bg-white p-6"
            >
              <div>
                <p className="text-xs font-semibold text-[#4f46e5]">{item.audience}</p>
                <h3 className="mt-2 text-lg font-semibold leading-snug text-[#0f172a]">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-[0.95rem] leading-relaxed text-[#475569]">
                  {item.description}
                </p>
              </div>
            </article>
          ))}
        </div>

        {/* Trust Architecture Band (Verifiable product facts, zero fabricated ratings or user counts) */}
        <div className="mt-12 rounded-2xl border border-[#e2e8f0] bg-white p-6 sm:p-8">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-[#059669]" aria-hidden="true" />
            <h3 className="text-lg font-semibold text-[#0f172a]">{copy.trustHeading}</h3>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {copy.trustPillars.map((pillar) => (
              <div key={pillar.title}>
                <h4 className="text-sm font-semibold text-[#0f172a]">{pillar.title}</h4>
                <p className="mt-1.5 text-sm leading-relaxed text-[#475569]">
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
