import type { LandingCopy } from '../i18n/types';

interface HowItWorksProps {
  copy: LandingCopy['howItWorks'];
}

export function HowItWorks({ copy }: HowItWorksProps) {
  return (
    <section id="how-it-works" className="border-b border-[#e2e8f0] bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-[-0.02em] text-[#0f172a] sm:text-3xl">
            {copy.heading}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[#475569]">{copy.lead}</p>
        </div>

        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {copy.steps.map((step) => (
            <li
              key={step.stepNumber}
              className="rounded-2xl border border-[#e2e8f0] bg-[#f8fafc] p-6"
            >
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#4f46e5] text-sm font-bold text-white">
                {step.stepNumber}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[#0f172a]">{step.title}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-[#475569]">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
