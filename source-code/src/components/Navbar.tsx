import {useState, type MouseEvent} from 'react';
import {ArrowUpRight, FileText, Menu, X} from 'lucide-react';
import {UI_COPY, type Lang} from '../data/portfolioData';

export type NavSectionId = 'top' | 'pengalaman' | 'kompetensi' | 'sertifikasi' | 'kontak';

interface NavbarProps {
  brandName: string;
  lang: Lang;
  activeSection: NavSectionId;
  onSelectSection: (section: NavSectionId) => void;
  onOpenCv: () => void;
}

export function Navbar({
  brandName,
  lang,
  activeSection,
  onSelectSection,
  onOpenCv,
}: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const copy = UI_COPY[lang].nav;

  const navLinks: {id: NavSectionId; href: string; label: string}[] = [
    {id: 'top', href: '#top', label: copy.overview},
    {id: 'pengalaman', href: '#pengalaman', label: copy.experience},
    {id: 'kompetensi', href: '#kompetensi', label: copy.competencies},
    {id: 'sertifikasi', href: '#sertifikasi', label: copy.certifications},
    {id: 'kontak', href: '#kontak', label: copy.contact},
  ];

  const activeItem = navLinks.find((item) => item.id === activeSection) || navLinks[0];

  const handleNavClick = (
    e: MouseEvent<HTMLAnchorElement>,
    sectionId: NavSectionId,
    closeDrawer = false,
  ) => {
    e.preventDefault();
    onSelectSection(sectionId);
    if (closeDrawer) {
      setMobileOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-300/80 bg-white/95 backdrop-blur-sm">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-[#0B192C] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
      >
        {lang === 'id' ? 'Lewati ke konten utama' : 'Skip to main content'}
      </a>

      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:gap-8">
        {/* Zone 1: Single-line brand wordmark */}
        <a
          href="#top"
          onClick={(e) => handleNavClick(e, 'top', true)}
          className="font-display text-lg font-bold tracking-tight text-[var(--portfolio-text-heading)] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--portfolio-brand-accent)]"
        >
          {brandName}
        </a>

        {/* Zone 2: 5 concise single-line nav links with locked, flicker-free active underline */}
        <nav aria-label="Navigasi Utama" className="hidden items-center gap-1.5 md:flex">
          {navLinks.map((link) => {
            const isActive = link.id === activeSection;
            return (
              <a
                key={link.id}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.id)}
                aria-current={isActive ? 'location' : undefined}
                className={`relative rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--portfolio-brand-accent)] ${
                  isActive
                    ? 'bg-[var(--portfolio-nav-active-bg)] text-[var(--portfolio-brand-accent)]'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-[var(--portfolio-text-primary)]'
                }`}
              >
                <span>{link.label}</span>
                <span
                  aria-hidden="true"
                  className={`absolute right-2.5 bottom-0 left-2.5 h-[3px] rounded-full transition-opacity duration-150 ${
                    isActive
                      ? 'bg-[var(--portfolio-brand-accent)] opacity-100'
                      : 'bg-transparent opacity-0'
                  }`}
                />
              </a>
            );
          })}
        </nav>

        {/* Zone 3: Mobile active section cue + Primary CV button + Mobile drawer toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="border-b-2 border-[var(--portfolio-brand-accent)] pb-0.5 text-xs font-bold text-[var(--portfolio-brand-accent)] md:hidden"
            aria-live="polite"
          >
            {activeItem.label}
          </span>

          <button
            type="button"
            onClick={onOpenCv}
            className="hidden min-h-[40px] items-center gap-2 rounded-lg bg-[var(--portfolio-bg-dark)] px-4 py-2 text-sm font-semibold text-white transition-opacity duration-150 hover:opacity-90 whitespace-nowrap shrink-0 sm:inline-flex focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--portfolio-brand-accent)]"
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span>{copy.viewCv}</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={mobileOpen}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 text-slate-800 md:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--portfolio-brand-accent)]"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 md:hidden">
          <nav aria-label="Navigasi Mobile" className="flex flex-col gap-1.5">
            {navLinks.map((link) => {
              const isActive = link.id === activeSection;
              return (
                <a
                  key={link.id}
                  href={link.href}
                  aria-current={isActive ? 'location' : undefined}
                  onClick={(e) => handleNavClick(e, link.id, true)}
                  className={`relative flex h-12 items-center justify-between overflow-hidden rounded-lg border px-3.5 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'border-[var(--portfolio-brand-accent)] bg-[var(--portfolio-nav-active-bg)] text-[var(--portfolio-brand-accent)]'
                      : 'border-transparent text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <span>{link.label}</span>
                  <span className="inline-flex items-center gap-1.5 text-xs">
                    {isActive ? (
                      <span className="font-bold">{copy.activeBadge}</span>
                    ) : (
                      <ArrowUpRight className="h-4 w-4 text-slate-500" />
                    )}
                  </span>
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute right-0 bottom-0 left-0 h-[3px] bg-[var(--portfolio-brand-accent)]"
                    />
                  )}
                </a>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onOpenCv();
              }}
              className="mt-1 flex h-12 items-center justify-center gap-2 rounded-lg bg-[var(--portfolio-bg-dark)] px-4 text-sm font-semibold text-white"
            >
              <FileText className="h-4 w-4" />
              <span>{copy.viewCv}</span>
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
