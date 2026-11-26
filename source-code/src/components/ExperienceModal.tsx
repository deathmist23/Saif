import {useEffect} from 'react';
import {Calendar, CheckCircle2, Layers, MapPin, X} from 'lucide-react';
import {UI_COPY, type ExperienceItem, type Lang} from '../data/portfolioData';

interface ExperienceModalProps {
  item: ExperienceItem | null;
  lang: Lang;
  onClose: () => void;
}

export function ExperienceModal({item, lang, onClose}: ExperienceModalProps) {
  useEffect(() => {
    if (!item) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [item, onClose]);

  if (!item) return null;
  const copy = UI_COPY[lang].modal;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exp-modal-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-[#F8FAFC] px-6 py-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
              <span>{item.categoryLabel[lang]}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 font-mono-tabular">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                {item.period}
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                {item.location}
              </span>
            </div>
            <h3
              id="exp-modal-title"
              className="mt-1.5 font-display text-xl font-bold text-[#0B192C] sm:text-2xl"
            >
              {item.role[lang]}
            </h3>
            <p className="mt-0.5 text-sm font-semibold text-[#2563EB]">{item.organization}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={copy.close}
            className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <p className="text-sm leading-relaxed text-slate-700 sm:text-base">
            {item.summary[lang]}
          </p>

          <div>
            <h4 className="mb-3 text-xs font-bold tracking-wide text-slate-500">
              {copy.responsibilities}
            </h4>
            <ul className="space-y-3">
              {item.highlights[lang].map((point, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 text-sm leading-relaxed text-slate-700"
                >
                  <CheckCircle2 className="mt-1 h-4 w-4 text-[#2563EB] shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 gap-6 border-t border-slate-200 pt-4 sm:grid-cols-2">
            <div>
              <h4 className="mb-2.5 flex items-center gap-1.5 text-xs font-bold tracking-wide text-slate-500">
                <Layers className="h-3.5 w-3.5 text-[#0B192C]" />
                <span>{copy.systems}</span>
              </h4>
              <ul className="space-y-1.5 font-mono-tabular text-xs text-slate-700">
                {item.systemsAndTools.map((sys, idx) => (
                  <li key={idx} className="border-b border-slate-100 py-1 last:border-b-0">
                    {sys}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
              <h4 className="mb-2 text-xs font-bold tracking-wide text-slate-500">
                {copy.outcome}
              </h4>
              <p className="text-sm font-medium leading-relaxed text-[#0B192C]">
                {item.keyOutcome[lang]}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-200 bg-[#F8FAFC] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] rounded-lg bg-[#0B192C] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1E3A6E]"
          >
            {copy.close}
          </button>
        </div>
      </div>
    </div>
  );
}
