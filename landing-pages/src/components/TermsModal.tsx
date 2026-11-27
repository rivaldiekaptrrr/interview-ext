import { X } from 'lucide-react';
import { useEffect } from 'react';
import type { LandingCopy } from '../i18n/types';

interface TermsModalProps {
  open: boolean;
  onClose: () => void;
  copy: LandingCopy['termsModal'];
}

export function TermsModal({ open, onClose, copy }: TermsModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f172a]/50 p-4 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-2xl sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#e2e8f0] pb-4">
          <div>
            <h2 id="terms-modal-title" className="text-xl font-bold text-[#0f172a]">
              {copy.title}
            </h2>
            <p className="mt-1 text-xs text-[#64748b]">{copy.updated}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={copy.closeButton}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#e2e8f0] text-[#475569] hover:bg-[#f8fafc] hover:text-[#0f172a]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-[#334155]">{copy.intro}</p>

        <div className="mt-5 space-y-4">
          {copy.sections.map((section) => (
            <section key={section.heading}>
              <h3 className="text-sm font-semibold text-[#0f172a]">{section.heading}</h3>
              <p className="mt-1 text-sm leading-relaxed text-[#475569]">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-6 flex justify-end border-t border-[#e2e8f0] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#4f46e5] px-5 text-sm font-semibold text-white hover:bg-[#4338ca]"
          >
            {copy.closeButton}
          </button>
        </div>
      </div>
    </div>
  );
}
