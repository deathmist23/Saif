import React, { useEffect } from 'react';
import { X, Download, ExternalLink, FileText } from 'lucide-react';
import { Language, ProfileInfo, UI_CHROME } from '../../data/portfolioData';

interface CvPreviewModalProps {
  isOpen: boolean;
  profile: ProfileInfo;
  lang: Language;
  onClose: () => void;
  onDownloadSuccess: () => void;
}

export const CvPreviewModal: React.FC<CvPreviewModalProps> = ({
  isOpen,
  profile,
  lang,
  onClose,
  onDownloadSuccess,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const copy = UI_CHROME[lang].modal;

  const handleDownloadPdf = async () => {
    try {
      const response = await fetch(profile.cvPdfSrc);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = profile.cvFileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
      onDownloadSuccess();
    } catch {
      const link = document.createElement('a');
      link.href = profile.cvPdfSrc;
      link.download = profile.cvFileName;
      link.click();
      onDownloadSuccess();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cv-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-4xl w-full h-[88vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-[#F8FAFC]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#0F1F3D] text-white flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 id="cv-modal-title" className="font-display text-base sm:text-lg font-bold text-[#0F1F3D] truncate">
                {copy.cvModalTitle} — {profile.name}
              </h3>
              <p className="text-xs text-slate-500 truncate">{profile.cvFileName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={profile.cvPdfSrc}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex min-h-[40px] px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{copy.openNewTab}</span>
            </a>

            <button
              type="button"
              onClick={handleDownloadPdf}
              className="min-h-[40px] px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{copy.downloadFile}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label={copy.close}
              className="min-h-[40px] min-w-[40px] rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-slate-100">
          <object
            data={profile.cvPdfSrc}
            type="application/pdf"
            aria-label={copy.cvModalTitle}
            className="w-full h-full"
          >
            <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50">
              <FileText className="w-10 h-10 text-[#0F1F3D] mb-3" />
              <p className="text-sm font-semibold text-slate-800 mb-1">
                {copy.cvModalTitle} — {profile.name}
              </p>
              <p className="text-xs text-slate-600 mb-4 max-w-md">
                {lang === 'id'
                  ? 'Pratinjau PDF tidak didukung langsung oleh browser ini. Silakan unduh atau buka di tab baru.'
                  : 'Inline PDF preview is unavailable in this browser. Please download or open it in a new tab.'}
              </p>
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="min-h-[40px] px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>{copy.downloadFile}</span>
              </button>
            </div>
          </object>
        </div>
      </div>
    </div>
  );
};
