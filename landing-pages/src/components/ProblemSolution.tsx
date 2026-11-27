import { Check, Minus } from 'lucide-react';
import type { LandingCopy } from '../i18n/types';

interface ProblemSolutionProps {
  copy: LandingCopy['problemSolution'];
}

export function ProblemSolution({ copy }: ProblemSolutionProps) {
  return (
    <section className="border-b border-[#e2e8f0] bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-[-0.02em] text-[#0f172a] sm:text-3xl">
            {copy.heading}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[#475569]">{copy.lead}</p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-[#0f172a]">{copy.beforeTitle}</h3>
            <ul className="mt-5 space-y-3.5">
              {copy.beforePoints.map((point) => (
                <li key={point} className="flex items-start gap-3 text-[0.95rem] leading-relaxed text-[#475569]">
                  <Minus className="mt-1 h-4 w-4 shrink-0 text-[#94a3b8]" aria-hidden="true" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-[#c7d2fe] bg-[#eef2ff]/45 p-6 sm:p-8">
            <h3 className="text-lg font-semibold text-[#0f172a]">{copy.afterTitle}</h3>
            <ul className="mt-5 space-y-3.5">
              {copy.afterPoints.map((point) => (
                <li key={point} className="flex items-start gap-3 text-[0.95rem] leading-relaxed text-[#0f172a]">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-[#059669]" aria-hidden="true" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
