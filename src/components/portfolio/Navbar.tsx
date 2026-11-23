import React from 'react';
import { FileText } from 'lucide-react';
import { Language, UI_CHROME } from '../../data/portfolioData';

interface NavbarProps {
  brandName: string;
  lang: Language;
  onOpenCv: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ brandName, lang, onOpenCv }) => {
  const copy = UI_CHROME[lang].nav;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          className="font-display text-lg font-bold tracking-tight text-[#0F1F3D] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2563EB]"
        >
          {brandName}
        </a>

        {/* Zone 2: 4 concise single-line text nav links */}
        <nav
          aria-label="Navigasi Utama"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
        >
          <a
            href="#top"
            className="hover:text-[#0F1F3D] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            {copy.overview}
          </a>
          <a
            href="#pengalaman"
            className="hover:text-[#0F1F3D] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            {copy.experience}
          </a>
          <a
            href="#kompetensi"
            className="hover:text-[#0F1F3D] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            {copy.competencies}
          </a>
          <a
            href="#sertifikasi"
            className="hover:text-[#0F1F3D] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            {copy.certifications}
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenCv}
            className="min-h-[40px] px-4 py-2 rounded-lg bg-[#0F1F3D] hover:bg-[#1E3A6E] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
          >
            <FileText className="w-4 h-4 shrink-0" />
            <span>{copy.viewCv}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
