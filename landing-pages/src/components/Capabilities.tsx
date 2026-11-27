import type { LandingCopy } from '../i18n/types';

interface CapabilitiesProps {
  copy: LandingCopy['capabilities'];
}

export function Capabilities({ copy }: CapabilitiesProps) {
  return (
    <section id="features" className="border-b border-[#e2e8f0] bg-[#f8fafc] py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-[-0.02em] text-[#0f172a] sm:text-3xl">
            {copy.heading}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[#475569]">{copy.lead}</p>
        </div>

        {/* Real Product Screenshot Visual */}
        <figure className="mt-10 overflow-hidden rounded-2xl border border-[#cbd5e1] bg-white shadow-sm">
          <img
            src="/images/easyinterview-meet-preview.png"
            alt={copy.screenshotAlt}
            width={1280}
            height={800}
            loading="lazy"
            className="h-auto w-full object-cover"
          />
          <figcaption className="border-t border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-xs text-[#64748b]">
            {copy.screenshotCaption}
          </figcaption>
        </figure>

        {/* Architectural Spec Grid (No identical tinted square icon bloat or 01/02/03 slop) */}
        <div className="mt-10 divide-y divide-[#e2e8f0] rounded-2xl border border-[#e2e8f0] bg-white md:grid md:grid-cols-2 md:divide-y-0">
          {copy.items.map((item, idx) => {
            const isFullSpan = idx === copy.items.length - 1 && copy.items.length % 2 === 1;
            return (
              <div
                key={item.id}
                className={`p-6 sm:p-7 ${
                  isFullSpan
                    ? 'md:col-span-2 md:border-t md:border-[#e2e8f0]'
                    : idx >= 2
                      ? 'md:border-t md:border-[#e2e8f0]'
                      : ''
                } ${idx % 2 === 0 && !isFullSpan ? 'md:border-r md:border-[#e2e8f0]' : ''}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold text-[#0f172a]">{item.title}</h3>
                  {item.shortcutKeys && (
                    <div className="flex items-center gap-1.5">
                      {item.shortcutKeys.map((keyCombo) => (
                        <kbd
                          key={keyCombo}
                          className="rounded-md border border-[#cbd5e1] bg-[#f8fafc] px-2 py-0.5 text-xs font-semibold text-[#334155]"
                        >
                          {keyCombo}
                        </kbd>
                      ))}
                    </div>
                  )}
                </div>
                <p className="mt-2.5 max-w-[60ch] text-[0.95rem] leading-relaxed text-[#475569]">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
