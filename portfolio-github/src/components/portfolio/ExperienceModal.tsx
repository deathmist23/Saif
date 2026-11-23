import React, { useEffect } from 'react';
import { X, CheckCircle2, MapPin, Calendar, Layers } from 'lucide-react';
import { ExperienceItem, Language, UI_CHROME } from '../../data/portfolioData';

interface ExperienceModalProps {
  item: ExperienceItem | null;
  lang: Language;
  onClose: () => void;
}

export const ExperienceModal: React.FC<ExperienceModalProps> = ({ item, lang, onClose }) => {
  useEffect(() => {
    if (!item) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [item, onClose]);

  if (!item) return null;

  const modalCopy = UI_CHROME[lang].modal;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exp-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-slate-200 flex items-start justify-between gap-4 bg-[#F8FAFC]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
              <span>{item.categoryLabel[lang]}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 font-mono-tabular">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {item.period}
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {item.location}
              </span>
            </div>
            <h3 id="exp-modal-title" className="font-display text-xl sm:text-2xl font-bold text-[#0F1F3D] mt-1.5">
              {item.role[lang]}
            </h3>
            <p className="text-sm font-semibold text-[#2563EB] mt-0.5">{item.organization}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={modalCopy.close}
            className="min-h-[40px] min-w-[40px] rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center shrink-0 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <p className="text-sm sm:text-base text-slate-700 leading-relaxed">{item.summary[lang]}</p>

          <div>
            <h4 className="text-xs font-bold tracking-wide text-slate-500 uppercase mb-3">
              {modalCopy.responsibilities}
            </h4>
            <ul className="space-y-3">
              {item.highlights[lang].map((point, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-slate-700 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0 mt-1" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs font-bold tracking-wide text-slate-500 uppercase mb-2.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#0F1F3D]" />
                <span>{modalCopy.systems}</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700 font-mono-tabular">
                {item.systemsAndTools.map((tool, i) => (
                  <li key={i} className="py-1 border-b border-slate-100 last:border-b-0">
                    {tool}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200">
              <h4 className="text-xs font-bold tracking-wide text-slate-500 uppercase mb-2">
                {modalCopy.outcome}
              </h4>
              <p className="text-sm text-[#0F1F3D] font-medium leading-relaxed">
                {item.keyOutcome[lang]}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-[#F8FAFC] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] px-5 py-2 rounded-lg bg-[#0F1F3D] hover:bg-[#1E3A6E] text-white text-sm font-semibold transition-colors"
          >
            {modalCopy.close}
          </button>
        </div>
      </div>
    </div>
  );
};
