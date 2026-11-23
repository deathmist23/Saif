/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  Check,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  FolderGit2,
  GraduationCap,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Send,
} from 'lucide-react';
import {
  clearLocalPortfolioState,
  DEFAULT_PORTFOLIO_STATE,
  ExperienceCategory,
  ExperienceItem,
  Language,
  loadLocalPortfolioState,
  PortfolioState,
  saveLocalPortfolioState,
  UI_CHROME,
} from './data/portfolioData';
import { Navbar } from './components/portfolio/Navbar';
import { ExperienceModal } from './components/portfolio/ExperienceModal';
import { CvPreviewModal } from './components/portfolio/CvPreviewModal';
import { EditorTab, PortfolioEditorModal } from './components/portfolio/PortfolioEditorModal';

export default function App() {
  const [lang, setLang] = useState<Language>('id');
  const [portfolio, setPortfolio] = useState<PortfolioState>(() => {
    return loadLocalPortfolioState() || DEFAULT_PORTFOLIO_STATE;
  });
  const [filter, setFilter] = useState<ExperienceCategory>('all');
  const [activeDomainId, setActiveDomainId] = useState<string>(
    () => portfolio.competencies[0]?.id || DEFAULT_PORTFOLIO_STATE.competencies[0].id
  );
  const [selectedExperience, setSelectedExperience] = useState<ExperienceItem | null>(null);
  const [isCvModalOpen, setIsCvModalOpen] = useState<boolean>(false);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [editorInitialTab, setEditorInitialTab] = useState<EditorTab>('profile');
  const [portraitFailed, setPortraitFailed] = useState<boolean>(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Contact form state
  const [senderName, setSenderName] = useState<string>('');
  const [senderCompany, setSenderCompany] = useState<string>('');
  const [senderMessage, setSenderMessage] = useState<string>('');

  // Load committed portfolio-data.json from GitHub repo if user has no local edits
  useEffect(() => {
    const localState = loadLocalPortfolioState();
    if (localState) return;
    fetch('portfolio-data.json')
      .then((res) => (res.ok ? res.json() : null))
      .then((json: PortfolioState | null) => {
        if (json && json.profile && Array.isArray(json.experiences)) {
          setPortfolio(json);
        }
      })
      .catch(() => {
        // Fallback silently to bundled DEFAULT_PORTFOLIO_STATE
      });
  }, []);

  // Reset portrait error flag if portraitSrc changes
  useEffect(() => {
    setPortraitFailed(false);
  }, [portfolio.profile.portraitSrc]);

  const copy = UI_CHROME[lang];
  const { profile, hero, metrics, marqueeItems, education, experiences, competencies, certifications } =
    portfolio;

  const notify = (msg: string) => {
    setFeedbackNotice(msg);
    setTimeout(() => {
      setFeedbackNotice((current) => (current === msg ? null : current));
    }, 3500);
  };

  const handleSavePortfolioState = (next: PortfolioState) => {
    setPortfolio(next);
    saveLocalPortfolioState(next);
    if (!next.competencies.some((d) => d.id === activeDomainId) && next.competencies[0]) {
      setActiveDomainId(next.competencies[0].id);
    }
  };

  const handleResetPortfolioState = () => {
    clearLocalPortfolioState();
    setPortfolio(DEFAULT_PORTFOLIO_STATE);
    setActiveDomainId(DEFAULT_PORTFOLIO_STATE.competencies[0].id);
    notify(
      lang === 'id'
        ? 'Portofolio dikembalikan ke data CV awal.'
        : 'Portfolio restored to default CV data.'
    );
  };

  const openEditorOnTab = (tab: EditorTab) => {
    setEditorInitialTab(tab);
    setIsEditorOpen(true);
  };

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify(
        lang === 'id' ? `${label} berhasil disalin: ${text}` : `${label} copied: ${text}`
      );
    } catch {
      notify(lang === 'id' ? `Silakan salin manual: ${text}` : `Copy manually: ${text}`);
    }
  };

  const handleDownloadCvDirect = async () => {
    try {
      const res = await fetch(profile.cvPdfSrc);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = profile.cvFileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      notify(lang === 'id' ? 'CV resmi PDF berhasil diunduh.' : 'Official CV PDF downloaded.');
    } catch {
      setIsCvModalOpen(true);
    }
  };

  const handleComposeMail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim() || !senderMessage.trim()) {
      notify(
        lang === 'id'
          ? 'Mohon isi nama dan pesan Anda terlebih dahulu.'
          : 'Please enter your name and message first.'
      );
      return;
    }
    const subject = encodeURIComponent(
      `[Portofolio ${profile.name}] Peluang / Pesan dari ${senderName.trim()}${
        senderCompany.trim() ? ` (${senderCompany.trim()})` : ''
      }`
    );
    const body = encodeURIComponent(
      `Halo ${profile.name},\n\nNama: ${senderName.trim()}\nPerusahaan/Instansi: ${
        senderCompany.trim() || '-'
      }\n\nPesan:\n${senderMessage.trim()}\n`
    );
    window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`;
    notify(
      lang === 'id'
        ? `Membuka aplikasi email dengan draf pesan untuk ${profile.name}.`
        : `Opening your email client with a drafted message for ${profile.name}.`
    );
  };

  const filteredExperiences =
    filter === 'all' ? experiences : experiences.filter((item) => item.category === filter);

  const activeDomain =
    competencies.find((d) => d.id === activeDomainId) || competencies[0];

  const initials = profile.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 3)
    .map((n) => n[0]?.toUpperCase())
    .join('');

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      {/* Strict 3-zone Top Bar */}
      <Navbar brandName={profile.name} lang={lang} onOpenCv={() => setIsCvModalOpen(true)} />

      {/* Transient feedback banner (non-blocking) */}
      {feedbackNotice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 bg-[#0F1F3D] text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2.5 text-xs sm:text-sm font-medium max-w-sm"
        >
          <Check className="w-4 h-4 text-sky-400 shrink-0" />
          <span>{feedbackNotice}</span>
        </div>
      )}

      <main className="flex-1">
        {/* HERO SPLIT SECTION */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Column: Typography Hierarchy & CTAs */}
            <div className="lg:col-span-7 flex flex-col justify-between bg-white border border-slate-200 rounded-2xl p-6 sm:p-9">
              <div>
                <p className="text-xs sm:text-sm font-medium text-[#2563EB] tracking-tight">
                  {hero.kicker[lang]}
                </p>

                <h1 className="font-display font-bold text-[#0F1F3D] tracking-tight leading-[1.1] mt-3 max-w-2xl [text-wrap:balance] text-[clamp(2.1rem,3.8vw,3.25rem)]">
                  {hero.headline[lang]}
                </h1>

                <p className="text-sm sm:text-base text-slate-600 leading-relaxed mt-5 max-w-[65ch]">
                  {hero.lead[lang]}
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <a
                    href="#pengalaman"
                    className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>{copy.hero.primaryCta}</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>

                  <button
                    type="button"
                    onClick={() => setIsCvModalOpen(true)}
                    className="min-h-[44px] px-5 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-[#0F1F3D] text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
                  >
                    <FileText className="w-4 h-4 text-slate-600" />
                    <span>{copy.hero.secondaryCta}</span>
                  </button>
                </div>
              </div>

              {/* Clean unboxed inline contact metadata */}
              <div className="mt-8 pt-5 border-t border-slate-200 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{profile.location}</span>
                </span>
                <span aria-hidden="true" className="text-slate-300">
                  ·
                </span>
                <a
                  href={`mailto:${profile.email}`}
                  className="hover:text-[#2563EB] transition-colors font-medium"
                >
                  {profile.email}
                </a>
                <span aria-hidden="true" className="text-slate-300">
                  ·
                </span>
                <a
                  href={profile.phoneHref}
                  className="hover:text-[#2563EB] transition-colors font-mono-tabular font-medium"
                >
                  {profile.phone}
                </a>
                <span aria-hidden="true" className="text-slate-300">
                  ·
                </span>
                <a
                  href={profile.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-[#2563EB] transition-colors font-medium"
                >
                  <span>LinkedIn</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Right Column: Matching-height Operational Dossier */}
            <div className="lg:col-span-5 bg-[#0F1F3D] text-white rounded-2xl p-6 sm:p-7 flex flex-col justify-between lg:h-full">
              <div>
                <div className="flex items-center justify-between gap-2 pb-5 border-b border-white/10">
                  <span className="text-xs font-medium text-slate-300">
                    {copy.hero.dossierLabel}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openEditorOnTab('profile')}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                      title={lang === 'id' ? 'Edit isi portofolio' : 'Edit portfolio content'}
                    >
                      <Pencil className="w-3 h-3" />
                      <span>{copy.hero.editPortfolioBtn}</span>
                    </button>

                    {/* Language Switcher outside top navbar */}
                    <div
                      role="group"
                      aria-label={copy.hero.languageLabel}
                      className="inline-flex items-center p-0.5 rounded-lg bg-white/10 border border-white/10"
                    >
                      <button
                        type="button"
                        onClick={() => setLang('id')}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                          lang === 'id'
                            ? 'bg-white text-[#0F1F3D]'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        ID
                      </button>
                      <button
                        type="button"
                        onClick={() => setLang('en')}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                          lang === 'en'
                            ? 'bg-white text-[#0F1F3D]'
                            : 'text-slate-300 hover:text-white'
                        }`}
                      >
                        EN
                      </button>
                    </div>
                  </div>
                </div>

                {/* Portrait + Identity Lockup */}
                <div className="mt-6 flex items-center gap-4">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden border border-white/20 bg-slate-800 shrink-0 flex items-center justify-center">
                    {!portraitFailed ? (
                      <img
                        src={profile.portraitSrc}
                        alt={profile.name}
                        referrerPolicy="no-referrer"
                        onError={() => setPortraitFailed(true)}
                        className="w-full h-full object-cover object-top"
                      />
                    ) : (
                      <span className="font-display text-2xl font-bold text-white tracking-wider">
                        {initials || 'SA'}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <h2 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {profile.name}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 mt-1">
                      {education.schoolName}
                    </p>
                    <p className="text-xs text-sky-300 font-medium mt-2">
                      {hero.dossierStatus[lang]}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tabular Key Specifications */}
              <dl className="mt-6 pt-5 border-t border-white/10 space-y-3 text-xs">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-slate-400 shrink-0">{copy.hero.baseLabel}</dt>
                  <dd className="text-right font-medium text-slate-100">
                    {profile.location}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 pt-2.5 border-t border-white/10">
                  <dt className="text-slate-400 shrink-0">{copy.hero.aircraftLabel}</dt>
                  <dd className="text-right font-mono-tabular text-slate-100">
                    {hero.aircraftSummary}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 pt-2.5 border-t border-white/10">
                  <dt className="text-slate-400 shrink-0">{copy.hero.eximLabel}</dt>
                  <dd className="text-right font-mono-tabular text-slate-100">
                    {hero.eximSummary}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* 4-COLUMN KEY METRICS ROW BELOW HERO SPLIT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {metrics.map((metric) => (
              <div
                key={metric.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between"
              >
                <div>
                  <p className="font-display font-bold tabular-nums text-2xl sm:text-3xl text-[#0F1F3D] tracking-tight">
                    {metric.value[lang]}
                  </p>
                  <p className="text-sm font-semibold text-slate-800 mt-1">{metric.label[lang]}</p>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed mt-2">{metric.detail[lang]}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SUBTLE EDITORIAL MARQUEE DIVIDER */}
        <div className="border-y border-slate-200 bg-white py-3.5 overflow-hidden select-none">
          <div className="animate-marquee">
            {[...marqueeItems[lang], ...marqueeItems[lang]].map((text, idx) => (
              <span
                key={idx}
                className="inline-flex items-center text-xs sm:text-sm font-medium text-slate-600 whitespace-nowrap mx-5"
              >
                <span>{text}</span>
                <span aria-hidden="true" className="ml-5 text-slate-300">
                  ·
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* SECTION 01: WORK EXPERIENCE & TRAINING */}
        <section id="pengalaman" className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-slate-200">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold text-[#2563EB]">
                {copy.sections.experienceIndex}
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0F1F3D] tracking-tight mt-1.5 [text-wrap:balance]">
                {copy.sections.experienceTitle}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed mt-2">
                {copy.sections.experienceLead}
              </p>
            </div>

            {/* Interactive Segmented Filter Control */}
            <div
              role="tablist"
              aria-label="Filter pengalaman kerja"
              className="flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-xl self-start lg:self-end"
            >
              {[
                {
                  id: 'all' as ExperienceCategory,
                  label: `${copy.sections.filterAll} (${experiences.length})`,
                },
                { id: 'aviation' as ExperienceCategory, label: copy.sections.filterAviation },
                { id: 'exim' as ExperienceCategory, label: copy.sections.filterExim },
                { id: 'it' as ExperienceCategory, label: copy.sections.filterIt },
              ].map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  type="button"
                  aria-selected={filter === tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                    filter === tab.id
                      ? 'bg-white text-[#0F1F3D] shadow-xs'
                      : 'text-slate-600 hover:text-[#0F1F3D]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Experience Bento Grid */}
          {filteredExperiences.length === 0 ? (
            <div className="mt-8 bg-white border border-slate-200 rounded-2xl p-8 text-center">
              <p className="text-sm text-slate-600">
                {lang === 'id'
                  ? 'Belum ada pengalaman di kategori ini.'
                  : 'No experiences listed under this category yet.'}
              </p>
              <button
                type="button"
                onClick={() => openEditorOnTab('experience')}
                className="mt-3 min-h-[38px] px-4 py-1.5 rounded-lg bg-[#0F1F3D] text-white text-xs font-semibold"
              >
                {lang === 'id' ? 'Tambah Pengalaman' : 'Add Experience'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              {filteredExperiences.map((exp, index) => {
                const spanFull = filter === 'all' && index === 0;
                return (
                  <article
                    key={exp.id}
                    className={`bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 flex flex-col justify-between transition-colors hover:border-slate-300 ${
                      spanFull ? 'md:col-span-2' : ''
                    }`}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
                        <span className="text-[#2563EB] font-semibold">
                          {exp.categoryLabel[lang]}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-tabular">{exp.period}</span>
                        <span aria-hidden="true">·</span>
                        <span>{exp.location}</span>
                      </div>

                      <div className="mt-2.5 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                        <h3 className="font-display text-xl sm:text-2xl font-bold text-[#0F1F3D] tracking-tight">
                          {exp.role[lang]}
                        </h3>
                        <span className="text-sm font-semibold text-slate-700 shrink-0">
                          {exp.organization}
                        </span>
                      </div>

                      <p className="text-sm text-slate-600 leading-relaxed mt-3 max-w-[75ch]">
                        {exp.summary[lang]}
                      </p>

                      <ul className="mt-4 space-y-2 text-sm text-slate-700">
                        {exp.highlights[lang].slice(0, spanFull ? 3 : 2).map((point, i) => (
                          <li key={i} className="flex items-start gap-2.5 leading-relaxed">
                            <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0 mt-1" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <p className="text-xs text-slate-500 font-mono-tabular leading-relaxed">
                        {exp.systemsAndTools.join(' · ')}
                      </p>

                      <button
                        type="button"
                        onClick={() => setSelectedExperience(exp)}
                        className="min-h-[40px] px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-[#0F1F3D] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
                      >
                        <span>{copy.sections.readDetail}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* SECTION 02: TECHNICAL COMPETENCY MATRIX */}
        <section id="kompetensi" className="bg-white border-y border-slate-200 py-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold text-[#2563EB]">
                {copy.sections.competencyIndex}
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0F1F3D] tracking-tight mt-1.5 [text-wrap:balance]">
                {copy.sections.competencyTitle}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed mt-2">
                {copy.sections.competencyLead}
              </p>
            </div>

            <div
              role="tablist"
              aria-label="Domain kompetensi"
              className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2"
            >
              {competencies.map((domain, index) => {
                const isActive = domain.id === activeDomain?.id;
                return (
                  <button
                    key={domain.id}
                    role="tab"
                    type="button"
                    aria-selected={isActive}
                    onClick={() => setActiveDomainId(domain.id)}
                    className={`text-left px-4 py-3.5 rounded-xl border transition-all min-h-[56px] ${
                      isActive
                        ? 'bg-[#0F1F3D] text-white border-[#0F1F3D]'
                        : 'bg-[#F8FAFC] text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span
                      className={`text-xs font-mono-tabular block ${
                        isActive ? 'text-sky-300' : 'text-slate-400'
                      }`}
                    >
                      0{index + 1}.
                    </span>
                    <span className="text-sm font-semibold block mt-0.5 leading-snug">
                      {domain.title[lang]}
                    </span>
                  </button>
                );
              })}
            </div>

            {activeDomain && (
              <div className="mt-6 bg-[#F8FAFC] border border-slate-200 rounded-2xl p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-7">
                  <h3 className="font-serif-editorial text-xl sm:text-2xl font-semibold text-[#0F1F3D]">
                    {activeDomain.title[lang]}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mt-2">
                    {activeDomain.subtitle[lang]}
                  </p>

                  <ul className="mt-6 space-y-3">
                    {activeDomain.capabilities[lang].map((cap, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 text-sm text-slate-700 leading-relaxed"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0 mt-1" />
                        <span>{cap}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 self-start">
                  <h4 className="text-xs font-semibold text-slate-500 pb-3 border-b border-slate-100">
                    {lang === 'id'
                      ? 'Spesifikasi Standar & Perangkat'
                      : 'Standards & Operational Specifications'}
                  </h4>
                  <dl className="divide-y divide-slate-100">
                    {activeDomain.specs.map((spec, sIdx) => (
                      <div key={`${spec.code}-${sIdx}`} className="py-3.5 first:pt-3 last:pb-1">
                        <dt className="font-mono-tabular text-xs font-medium text-[#2563EB]">
                          {spec.code}
                        </dt>
                        <dd className="text-sm text-slate-800 font-medium mt-0.5">
                          {spec.detail[lang]}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SECTION 03: EDUCATION & CERTIFICATIONS */}
        <section id="sertifikasi" className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-8 border-b border-slate-200">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold text-[#2563EB]">
                {copy.sections.educationIndex}
              </p>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0F1F3D] tracking-tight mt-1.5 [text-wrap:balance]">
                {copy.sections.educationTitle}
              </h2>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed mt-2">
                {copy.sections.educationLead}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsCvModalOpen(true)}
              className="min-h-[42px] px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-[#0F1F3D] text-xs font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
            >
              <FileText className="w-4 h-4 text-[#2563EB]" />
              <span>{copy.sections.previewCvBtn}</span>
            </button>
          </div>

          {/* Education Highlight Card */}
          <div className="mt-8 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#0F1F3D] text-white flex items-center justify-center shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-mono-tabular text-slate-500">
                  {education.schoolPeriod}
                </p>
                <h3 className="font-display text-xl font-bold text-[#0F1F3D] mt-1">
                  {education.schoolName}
                </h3>
                <p className="text-sm font-semibold text-[#2563EB] mt-0.5">
                  {education.major[lang]}
                </p>
                <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
                  {education.points[lang].map((pt, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span aria-hidden="true" className="text-slate-400">
                        ·
                      </span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* 3-Column Certifications Grid */}
          <h3 className="text-sm font-semibold text-slate-700 mt-10 mb-4">
            {copy.sections.certSubheading}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {certifications.map((cert) => (
              <div
                key={cert.id}
                className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span className="truncate">{cert.issuer}</span>
                    <Award className="w-4 h-4 text-[#2563EB] shrink-0" />
                  </div>
                  <h4 className="font-display text-base font-bold text-[#0F1F3D] mt-2 leading-snug">
                    {cert.title}
                  </h4>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs text-slate-500">
                  <span>{cert.domain[lang]}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-tabular shrink-0">{cert.yearOrContext}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 04: CONTACT & AVAILABILITY */}
        <section id="kontak" className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
          <div className="bg-[#0F1F3D] text-white rounded-2xl p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-6 space-y-6">
              <div>
                <p className="text-xs font-semibold text-sky-300">
                  {copy.sections.contactIndex}
                </p>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight mt-2 [text-wrap:balance]">
                  {copy.sections.contactTitle}
                </h2>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed mt-3 max-w-[55ch]">
                  {copy.sections.contactLead}
                </p>
              </div>

              <div className="space-y-3 text-sm pt-2">
                <div className="flex items-center gap-3 text-slate-200">
                  <Mail className="w-4 h-4 text-sky-300 shrink-0" />
                  <span>{profile.email}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-200 font-mono-tabular">
                  <Phone className="w-4 h-4 text-sky-300 shrink-0" />
                  <span>{profile.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-200">
                  <MapPin className="w-4 h-4 text-sky-300 shrink-0" />
                  <span>{profile.location}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => handleCopy(profile.email, 'Email')}
                  className="min-h-[40px] px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copy.sections.copyEmail}</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleCopy(profile.phone, lang === 'id' ? 'Nomor HP' : 'Phone')
                  }
                  className="min-h-[40px] px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copy.sections.copyPhone}</span>
                </button>

                <a
                  href={profile.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[40px] px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <span>{copy.sections.openLinkedIn}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={handleDownloadCvDirect}
                  className="min-h-[40px] px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{copy.sections.downloadCv}</span>
                </button>
              </div>
            </div>

            {/* Direct Inquiry Composer */}
            <form
              onSubmit={handleComposeMail}
              className="lg:col-span-6 bg-white text-slate-900 rounded-xl p-6 space-y-4"
            >
              <h3 className="font-display text-lg font-bold text-[#0F1F3D]">
                {copy.sections.formTitle}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="inq-name" className="block text-xs font-semibold text-slate-700 mb-1">
                    {copy.sections.formName}
                  </label>
                  <input
                    id="inq-name"
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder={lang === 'id' ? 'Contoh: Budi Santoso' : 'e.g. Alex Pratama'}
                    className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
                <div>
                  <label htmlFor="inq-company" className="block text-xs font-semibold text-slate-700 mb-1">
                    {copy.sections.formCompany}
                  </label>
                  <input
                    id="inq-company"
                    type="text"
                    value={senderCompany}
                    onChange={(e) => setSenderCompany(e.target.value)}
                    placeholder={lang === 'id' ? 'Nama Perusahaan' : 'Company Name'}
                    className="w-full min-h-[42px] px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="inq-msg" className="block text-xs font-semibold text-slate-700 mb-1">
                  {copy.sections.formMessage}
                </label>
                <textarea
                  id="inq-msg"
                  rows={3}
                  value={senderMessage}
                  onChange={(e) => setSenderMessage(e.target.value)}
                  placeholder={
                    lang === 'id'
                      ? 'Sampaikan detail posisi, jadwal wawancara, atau penempatan...'
                      : 'Share role details, interview schedule, or location...'
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <button
                type="submit"
                className="w-full min-h-[44px] px-5 py-2.5 rounded-lg bg-[#0F1F3D] hover:bg-[#1E3A6E] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>{copy.sections.formSubmit}</span>
              </button>
            </form>
          </div>
        </section>
      </main>

      {/* Quiet Editorial Footer with Owner Edit & GitHub Upload Actions */}
      <footer className="border-t border-slate-200 bg-white py-6 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            {profile.name} · {profile.location}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => openEditorOnTab('profile')}
              className="inline-flex items-center gap-1.5 hover:text-[#0F1F3D] font-semibold transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>{copy.footer.editLabel}</span>
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => openEditorOnTab('github')}
              className="inline-flex items-center gap-1.5 hover:text-[#2563EB] font-semibold transition-colors"
            >
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>{copy.footer.githubZipLabel}</span>
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setIsCvModalOpen(true)}
              className="hover:text-[#0F1F3D] font-medium transition-colors"
            >
              {copy.nav.viewCv}
            </button>
            <span aria-hidden="true">·</span>
            <a href="#top" className="hover:text-[#0F1F3D] font-medium transition-colors">
              {copy.footer.backToTop}
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ExperienceModal
        item={selectedExperience}
        lang={lang}
        onClose={() => setSelectedExperience(null)}
      />

      <CvPreviewModal
        isOpen={isCvModalOpen}
        profile={profile}
        lang={lang}
        onClose={() => setIsCvModalOpen(false)}
        onDownloadSuccess={() =>
          notify(lang === 'id' ? 'CV resmi PDF berhasil diunduh.' : 'Official CV PDF downloaded.')
        }
      />

      <PortfolioEditorModal
        isOpen={isEditorOpen}
        initialTab={editorInitialTab}
        state={portfolio}
        lang={lang}
        onSaveState={handleSavePortfolioState}
        onResetState={handleResetPortfolioState}
        onNotify={notify}
        onClose={() => setIsEditorOpen(false)}
      />
    </div>
  );
}
