import {useEffect} from 'react';
import {Download, FileText, Printer, X} from 'lucide-react';
import {UI_COPY, type Lang, type PortfolioData} from '../data/portfolioData';

interface CvModalProps {
  isOpen: boolean;
  data: PortfolioData;
  lang: Lang;
  onClose: () => void;
  onActionToast: (message: string) => void;
}

export function CvModal({isOpen, data, lang, onClose, onActionToast}: CvModalProps) {
  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const copy = UI_COPY[lang].modal;
  const {profile, hero, education, experiences, competencies, certifications} = data;
  const hasCustomPdf = Boolean(profile.cvPdfSrc && profile.cvPdfSrc.trim().length > 0);

  const handlePrint = () => {
    window.print();
    onActionToast(
      lang === 'id'
        ? 'Membuka dialog cetak — pilih "Save as PDF" untuk menyimpan file.'
        : 'Opening print dialog — choose "Save as PDF" to export.',
    );
  };

  return (
    <div
      id="printable-cv-modal-root"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs print:static print:block print:bg-transparent print:p-0"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cv-modal-title"
      onClick={onClose}
    >
      <div
        className="flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl print:block print:h-auto print:max-w-none print:overflow-visible print:rounded-none print:border-0 print:shadow-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-[#F8FAFC] px-6 py-4 print:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B192C] text-white shrink-0">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3
                id="cv-modal-title"
                className="truncate font-display text-base font-bold text-[#0B192C] sm:text-lg"
              >
                {copy.cvModalTitle} — {profile.name}
              </h3>
              <p className="truncate text-xs text-slate-500">
                {hasCustomPdf ? profile.cvFileName : 'ATS-Ready Curriculum Vitae'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {hasCustomPdf && (
              <a
                href={profile.cvPdfSrc}
                download={profile.cvFileName}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 whitespace-nowrap"
              >
                <Download className="h-3.5 w-3.5" />
                <span>{lang === 'id' ? 'Unduh PDF' : 'Download PDF'}</span>
              </a>
            )}
            <button
              type="button"
              onClick={handlePrint}
              className="flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#1D4ED8] whitespace-nowrap"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>{copy.printPdf}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label={copy.close}
              className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-100 p-4 sm:p-8 print:overflow-visible print:bg-white print:p-0">
          <div
            id="printable-cv-sheet"
            className="mx-auto max-w-3xl space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-xs sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none"
          >
            {/* Header */}
            <div className="border-b border-slate-200 pb-5">
              <h1 className="font-display text-2xl font-bold text-[#0B192C] sm:text-3xl">
                {profile.name}
              </h1>
              <p className="mt-1 text-sm font-medium text-[#2563EB]">{hero.kicker[lang]}</p>
              <p className="mt-2 font-mono-tabular text-xs text-slate-600">
                {profile.location} · {profile.email} · {profile.phone} · {profile.linkedinHandle}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">{hero.lead[lang]}</p>
            </div>

            {/* Work Experience */}
            <div>
              <h2 className="border-b border-slate-200 pb-1.5 font-display text-sm font-bold tracking-wide text-[#0B192C]">
                {lang === 'id' ? 'PENGALAMAN KERJA & PELATIHAN' : 'WORK EXPERIENCE & TRAINING'}
              </h2>
              <div className="mt-3 space-y-4">
                {experiences.map((exp) => (
                  <div key={exp.id} className="space-y-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="text-sm font-bold text-slate-900">
                        {exp.role[lang]} — <span className="font-semibold text-[#2563EB]">{exp.organization}</span>
                      </h3>
                      <span className="font-mono-tabular text-xs text-slate-500">
                        {exp.period} · {exp.location}
                      </span>
                    </div>
                    <ul className="list-disc space-y-1 pl-4 text-xs leading-relaxed text-slate-700">
                      {exp.highlights[lang].slice(0, 3).map((hl, idx) => (
                        <li key={idx}>{hl}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Education */}
            <div>
              <h2 className="border-b border-slate-200 pb-1.5 font-display text-sm font-bold tracking-wide text-[#0B192C]">
                {lang === 'id' ? 'PENDIDIKAN' : 'EDUCATION'}
              </h2>
              <div className="mt-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-900">{education.schoolName}</h3>
                  <span className="font-mono-tabular text-xs text-slate-500">
                    {education.schoolPeriod}
                  </span>
                </div>
                <p className="text-xs font-semibold text-[#2563EB]">{education.major[lang]}</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-slate-700">
                  {education.points[lang].map((pt, idx) => (
                    <li key={idx}>{pt}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Competencies & Certifications */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <h2 className="border-b border-slate-200 pb-1.5 font-display text-sm font-bold tracking-wide text-[#0B192C]">
                  {lang === 'id' ? 'KOMPETENSI INTI' : 'CORE COMPETENCIES'}
                </h2>
                <ul className="mt-2.5 space-y-1.5 text-xs text-slate-700">
                  {competencies.map((comp) => (
                    <li key={comp.id}>
                      <span className="font-semibold text-slate-900">{comp.title[lang]}:</span>{' '}
                      {comp.specs.map((s) => s.code).join(', ')}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h2 className="border-b border-slate-200 pb-1.5 font-display text-sm font-bold tracking-wide text-[#0B192C]">
                  {lang === 'id' ? 'SERTIFIKASI' : 'CERTIFICATIONS'}
                </h2>
                <ul className="mt-2.5 space-y-1 text-xs text-slate-700">
                  {certifications.map((cert) => (
                    <li key={cert.id}>
                      <span className="font-semibold text-slate-900">{cert.title}</span> —{' '}
                      {cert.issuer}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
