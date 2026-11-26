import {useCallback, useEffect, useRef, useState, type FormEvent} from 'react';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  Award,
  Check,
  CheckCircle2,
  Copy,
  FileText,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  Plane,
  Printer,
  Send,
  ShieldCheck,
  Ship,
  Type,
} from 'lucide-react';
import {
  AIRCRAFT_SPECS,
  DEFAULT_PORTFOLIO_DATA,
  DEFAULT_THEME_CONFIG,
  INCOTERMS_SPECS,
  UI_COPY,
  mergePortfolioData,
  normalizeHexColor,
  type ExperienceItem,
  type Lang,
  type PortfolioData,
} from './data/portfolioData';
import {Navbar, type NavSectionId} from './components/Navbar';
import {ExperienceModal} from './components/ExperienceModal';
import {CvModal} from './components/CvModal';
import {ResilientImage} from './components/ResilientImage';
import {AdminEditorModal} from './components/AdminEditorModal';

const STORAGE_DATA_KEY = 'saif_portfolio_data_v1';
const STORAGE_PIN_KEY = 'saif_portfolio_admin_pin_v1';
const STORAGE_LARGE_TEXT_KEY = 'saif_portfolio_large_text_v1';
const DEFAULT_PIN = '2026';

export default function App() {
  const [data, setData] = useState<PortfolioData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_DATA_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<PortfolioData>;
        if (parsed && parsed.profile && Array.isArray(parsed.experiences)) {
          return mergePortfolioData(parsed);
        }
      }
    } catch {
      // Fallback to default data
    }
    return DEFAULT_PORTFOLIO_DATA;
  });

  const [adminPin, setAdminPin] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_PIN_KEY) || DEFAULT_PIN;
    } catch {
      return DEFAULT_PIN;
    }
  });

  const [lang, setLang] = useState<Lang>('id');
  const [activeSection, setActiveSection] = useState<NavSectionId>('top');
  const [visitorLargeText, setVisitorLargeText] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_LARGE_TEXT_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [expFilter, setExpFilter] = useState<'all' | 'aviation' | 'exim' | 'it'>('all');
  const [activeCompId, setActiveCompId] = useState<string>(data.competencies[0]?.id || 'aviation');
  const [selectedAircraftCode, setSelectedAircraftCode] = useState<string>(AIRCRAFT_SPECS[0].code);
  const [selectedIncotermCode, setSelectedIncotermCode] = useState<string>(INCOTERMS_SPECS[1].code);

  const [selectedExp, setSelectedExp] = useState<ExperienceItem | null>(null);
  const [isCvOpen, setIsCvOpen] = useState(false);

  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('admin') === '1';
    }
    return false;
  });
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);

  const [toast, setToast] = useState<string | null>(null);
  const [inqName, setInqName] = useState('');
  const [inqEmail, setInqEmail] = useState('');
  const [inqMessage, setInqMessage] = useState('');
  const [isSendingMsg, setIsSendingMsg] = useState(false);
  const [msgStatus, setMsgStatus] = useState<{
    type: 'success' | 'fallback' | 'error';
    text: string;
  } | null>(null);

  // Optional fetch of static portfolio-data.json if no local admin edits exist yet
  useEffect(() => {
    if (window.location.protocol === 'file:') return;
    const hasLocalOverride = localStorage.getItem(STORAGE_DATA_KEY);
    if (hasLocalOverride) return;
    fetch('./portfolio-data.json')
      .then((res) => (res.ok ? res.json() : null))
      .then((remoteData: Partial<PortfolioData> | null) => {
        if (remoteData && remoteData.profile && Array.isArray(remoteData.experiences)) {
          setData(mergePortfolioData(remoteData));
        }
      })
      .catch(() => {
        // Ignore when running without static portfolio-data.json
      });
  }, []);

  // Apply CSS Theme Variables & Custom CSS dynamically
  useEffect(() => {
    const theme = {
      ...DEFAULT_THEME_CONFIG,
      ...(data.theme || {}),
    };
    const effectiveFontSize = theme.baseFontSizePx + (visitorLargeText ? 2 : 0);
    const rootStyle = document.documentElement.style;
    rootStyle.setProperty('--portfolio-font-size-base', `${effectiveFontSize}px`);
    rootStyle.setProperty('--portfolio-line-height-body', String(theme.lineHeight));
    rootStyle.setProperty(
      '--portfolio-bg-page',
      normalizeHexColor(theme.bgPage, DEFAULT_THEME_CONFIG.bgPage),
    );
    rootStyle.setProperty(
      '--portfolio-bg-surface',
      normalizeHexColor(theme.bgSurface, DEFAULT_THEME_CONFIG.bgSurface),
    );
    rootStyle.setProperty(
      '--portfolio-bg-dark',
      normalizeHexColor(theme.bgDark, DEFAULT_THEME_CONFIG.bgDark),
    );
    rootStyle.setProperty(
      '--portfolio-text-heading',
      normalizeHexColor(theme.textHeading, DEFAULT_THEME_CONFIG.textHeading),
    );
    rootStyle.setProperty(
      '--portfolio-text-heading-dark',
      normalizeHexColor(theme.textHeadingDark, DEFAULT_THEME_CONFIG.textHeadingDark),
    );
    rootStyle.setProperty(
      '--portfolio-text-primary',
      normalizeHexColor(theme.textPrimary, DEFAULT_THEME_CONFIG.textPrimary),
    );
    rootStyle.setProperty(
      '--portfolio-text-secondary',
      normalizeHexColor(theme.textSecondary, DEFAULT_THEME_CONFIG.textSecondary),
    );
    rootStyle.setProperty(
      '--portfolio-brand-accent',
      normalizeHexColor(theme.brandAccent, DEFAULT_THEME_CONFIG.brandAccent),
    );
    rootStyle.setProperty('--portfolio-radius-card', `${theme.cardRadiusPx}px`);

    let styleEl = document.getElementById('portfolio-custom-css') as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'portfolio-custom-css';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = theme.customCss || '';
  }, [data.theme, visitorLargeText]);

  const scrollLockRef = useRef<{target: NavSectionId; until: number} | null>(null);

  const navigateToSection = useCallback((sectionId: NavSectionId) => {
    setActiveSection(sectionId);
    scrollLockRef.current = {
      target: sectionId,
      until: Date.now() + 950,
    };

    if (typeof window !== 'undefined') {
      const hash = `#${sectionId}`;
      try {
        window.history.replaceState(null, '', hash);
      } catch {
        // Ignore history restrictions on file://
      }

      if (sectionId === 'top') {
        window.scrollTo({top: 0, behavior: 'smooth'});
        return;
      }

      const targetEl = document.getElementById(sectionId);
      if (targetEl) {
        const headerOffset = 76;
        const targetTop = Math.max(
          0,
          targetEl.getBoundingClientRect().top + window.scrollY - headerOffset,
        );
        window.scrollTo({top: targetTop, behavior: 'smooth'});
      }
    }
  }, []);

  // ScrollSpy to highlight current section in the Navigation Bar
  useEffect(() => {
    const sectionOrder: NavSectionId[] = [
      'top',
      'pengalaman',
      'kompetensi',
      'sertifikasi',
      'kontak',
    ];

    const hash = window.location.hash.replace('#', '') as NavSectionId;
    if (sectionOrder.includes(hash) && hash !== 'top') {
      setActiveSection(hash);
    }

    const releaseLock = () => {
      scrollLockRef.current = null;
    };

    const detectActiveSection = () => {
      const lock = scrollLockRef.current;
      if (lock) {
        if (Date.now() < lock.until) {
          setActiveSection(lock.target);
          return;
        }
        scrollLockRef.current = null;
      }

      if (window.scrollY < 90) {
        setActiveSection('top');
        return;
      }
      const nearBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 72;
      if (nearBottom) {
        setActiveSection('kontak');
        return;
      }

      const markerY = 165;
      let current: NavSectionId = 'top';
      for (const id of sectionOrder) {
        if (id === 'top') continue;
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= markerY) {
          current = id;
        }
      }
      setActiveSection(current);
    };

    detectActiveSection();
    window.addEventListener('scroll', detectActiveSection, {passive: true});
    window.addEventListener('resize', detectActiveSection, {passive: true});
    window.addEventListener('wheel', releaseLock, {passive: true});
    window.addEventListener('touchstart', releaseLock, {passive: true});
    return () => {
      window.removeEventListener('scroll', detectActiveSection);
      window.removeEventListener('resize', detectActiveSection);
      window.removeEventListener('wheel', releaseLock);
      window.removeEventListener('touchstart', releaseLock);
    };
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 3400);
  };

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(lang === 'id' ? `${label} berhasil disalin: ${text}` : `${label} copied: ${text}`);
    } catch {
      showToast(lang === 'id' ? `Silakan salin manual: ${text}` : `Copy manually: ${text}`);
    }
  };

  const handleSaveAdminData = (nextData: PortfolioData) => {
    setData(nextData);
    try {
      localStorage.setItem(STORAGE_DATA_KEY, JSON.stringify(nextData));
    } catch {
      showToast('Peringatan: kapasitas penyimpanan browser penuh untuk file besar.');
    }
  };

  const handleResetDefault = () => {
    setData(DEFAULT_PORTFOLIO_DATA);
    setSelectedExp(null);
    setExpFilter('all');
    setActiveCompId(DEFAULT_PORTFOLIO_DATA.competencies[0]?.id || 'aviation');
    try {
      localStorage.removeItem(STORAGE_DATA_KEY);
    } catch {
      // Ignore
    }
  };

  const handleUpdatePin = (newPin: string) => {
    setAdminPin(newPin);
    try {
      localStorage.setItem(STORAGE_PIN_KEY, newPin);
    } catch {
      // Ignore
    }
  };

  const buildDirectLinks = () => {
    const cleanName = inqName.trim() || (lang === 'id' ? 'Pengunjung Web' : 'Website Visitor');
    const cleanReplyEmail = inqEmail.trim();
    const cleanBody =
      inqMessage.trim() ||
      (lang === 'id'
        ? `Halo ${data.profile.name}, saya tertarik untuk menghubungi Anda terkait peluang kerja.`
        : `Hi ${data.profile.name}, I would like to connect regarding a job opportunity.`);

    const subjectText = `[Portofolio ${data.profile.name}] Pesan dari ${cleanName}`;
    const fullBody = `Halo ${data.profile.name},\n\nNama: ${cleanName}${
      cleanReplyEmail ? `\nEmail Balasan: ${cleanReplyEmail}` : ''
    }\n\nPesan:\n${cleanBody}\n`;

    const mailtoUrl = `mailto:${data.profile.email}?subject=${encodeURIComponent(subjectText)}&body=${encodeURIComponent(fullBody)}`;
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(data.profile.email)}&su=${encodeURIComponent(subjectText)}&body=${encodeURIComponent(fullBody)}`;

    const rawDigits = data.profile.phone.replace(/\D/g, '');
    const waPhone = rawDigits.startsWith('0')
      ? `62${rawDigits.slice(1)}`
      : rawDigits.startsWith('62')
        ? rawDigits
        : `62${rawDigits}`;
    const waText = `Halo ${data.profile.name}, saya ${cleanName}${
      cleanReplyEmail ? ` (${cleanReplyEmail})` : ''
    }.\n\n${cleanBody}`;
    const whatsappUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(waText)}`;

    return {mailtoUrl, gmailUrl, whatsappUrl};
  };

  const handleInquirySubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = inqName.trim();
    const trimmedEmail = inqEmail.trim();
    const trimmedMessage = inqMessage.trim();

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      setMsgStatus({
        type: 'error',
        text:
          lang === 'id'
            ? 'Mohon lengkapi nama, email Anda, dan pesan terlebih dahulu.'
            : 'Please fill in your name, email address, and message.',
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setMsgStatus({
        type: 'error',
        text:
          lang === 'id'
            ? 'Format email belum valid. Contoh: nama@perusahaan.com'
            : 'Please enter a valid email address (e.g. name@company.com).',
      });
      return;
    }

    const {mailtoUrl} = buildDirectLinks();

    if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
      setMsgStatus({
        type: 'fallback',
        text:
          lang === 'id'
            ? 'Mode file lokal (offline) tidak bisa mengirim otomatis. Silakan klik tombol Gmail Web atau WhatsApp di bawah agar pesan langsung terkirim.'
            : 'Offline local file mode cannot send automatically. Please use the Gmail Web or WhatsApp button below to send directly.',
      });
      window.location.href = mailtoUrl;
      return;
    }

    setIsSendingMsg(true);
    setMsgStatus(null);

    try {
      const response = await fetch(
        `https://formsubmit.co/ajax/${encodeURIComponent(data.profile.email)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            name: trimmedName,
            email: trimmedEmail,
            message: trimmedMessage,
            _subject: `[Portofolio ${data.profile.name}] Pesan dari ${trimmedName}`,
            _replyto: trimmedEmail,
            _template: 'table',
          }),
        },
      );

      const result = (await response.json().catch(() => null)) as {
        success?: boolean | string;
        message?: string;
      } | null;

      const isSuccess =
        response.ok && (result?.success === true || result?.success === 'true');

      if (isSuccess) {
        setInqName('');
        setInqEmail('');
        setInqMessage('');
        setMsgStatus({
          type: 'success',
          text:
            lang === 'id'
              ? `Pesan berhasil diteruskan ke email ${data.profile.email}. Balasan dapat langsung dikirim ke ${trimmedEmail}. (Khusus pengiriman pertama kali, cek kotak masuk / Spam di ${data.profile.email} untuk klik tombol Activate Form satu kali.)`
              : `Message forwarded directly to ${data.profile.email}. Replies go straight to ${trimmedEmail}. (On first-ever submission, check ${data.profile.email} inbox/spam once to click Activate Form.)`,
        });
        showToast(
          lang === 'id'
            ? `Pesan terkirim ke ${data.profile.email}`
            : `Message sent to ${data.profile.email}`,
        );
      } else {
        const needsActivation = String(result?.message || '')
          .toLowerCase()
          .includes('activat');
        setMsgStatus({
          type: 'fallback',
          text: needsActivation
            ? lang === 'id'
              ? `Link aktivasi penerimaan pesan baru saja dikirim ke ${data.profile.email}. Sementara menunggu aktivasi 1x tersebut, Anda bisa langsung kirim pesan lewat Gmail Web atau WhatsApp di bawah.`
              : `A one-time activation link was just sent to ${data.profile.email}. Meanwhile, you can send right away via Gmail Web or WhatsApp below.`
            : lang === 'id'
              ? 'Pengiriman otomatis sedang tidak tersedia. Klik Gmail Web, WhatsApp, atau Aplikasi Email di bawah untuk langsung mengirim isi pesan Anda.'
              : 'Automatic forwarding is temporarily unavailable. Click Gmail Web, WhatsApp, or Mail App below to send your message directly.',
        });
      }
    } catch {
      setMsgStatus({
        type: 'fallback',
        text:
          lang === 'id'
            ? 'Koneksi ke layanan penerus email terganggu. Klik Gmail Web, WhatsApp, atau Aplikasi Email di bawah—isi pesan Anda sudah disiapkan otomatis.'
            : 'Connection to the email forwarding service was interrupted. Use Gmail Web, WhatsApp, or Mail App below with your message pre-filled.',
      });
    } finally {
      setIsSendingMsg(false);
    }
  };

  const copy = UI_COPY[lang];
  const {profile, hero, metrics, marqueeItems, education, experiences, competencies, certifications} =
    data;

  const filteredExperiences =
    expFilter === 'all' ? experiences : experiences.filter((item) => item.category === expFilter);
  const activeComp = competencies.find((item) => item.id === activeCompId) || competencies[0];

  const activeAircraft =
    AIRCRAFT_SPECS.find((item) => item.code === selectedAircraftCode) || AIRCRAFT_SPECS[0];
  const activeIncoterm =
    INCOTERMS_SPECS.find((item) => item.code === selectedIncotermCode) || INCOTERMS_SPECS[0];

  const initials =
    profile.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 3)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'SA';

  const toggleVisitorTextSize = () => {
    setVisitorLargeText((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_LARGE_TEXT_KEY, next ? '1' : '0');
      } catch {
        // Ignore
      }
      showToast(
        next
          ? lang === 'id'
            ? 'Ukuran teks diperbesar agar lebih nyaman dibaca.'
            : 'Larger text size enabled for comfortable reading.'
          : lang === 'id'
            ? 'Ukuran teks dikembalikan ke standar.'
            : 'Text size reset to standard.',
      );
      return next;
    });
  };

  return (
    <div
      id="top"
      className="min-h-screen flex flex-col bg-[var(--portfolio-bg-page)] text-[var(--portfolio-text-primary)]"
    >
      <Navbar
        brandName={profile.name}
        lang={lang}
        activeSection={activeSection}
        onSelectSection={navigateToSection}
        onOpenCv={() => setIsCvOpen(true)}
      />

      {/* Subtle Floating Admin Bar when unlocked */}
      {isAdminUnlocked && (
        <div className="border-b border-blue-200 bg-blue-50/90 px-4 py-2 text-xs text-[#0B192C]">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 sm:px-2">
            <div className="flex items-center gap-2 font-medium">
              <ShieldCheck className="h-4 w-4 text-[#2563EB]" />
              <span>Mode Admin Aktif — Anda memegang akses penuh untuk menyunting isi portofolio.</span>
            </div>
            <button
              type="button"
              onClick={() => setIsAdminOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-[#0B192C] px-3 py-1 text-xs font-semibold text-white hover:bg-[#1E3A6E]"
            >
              <Pencil className="h-3 w-3" />
              <span>Buka Editor</span>
            </button>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-5 bottom-5 z-50 flex max-w-sm items-center gap-2.5 rounded-xl border border-slate-700 bg-[#0B192C] px-4 py-3 text-xs font-medium text-white shadow-xl sm:text-sm"
        >
          <Check className="h-4 w-4 text-sky-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <main id="main-content" className="flex-1">
        {/* Hero Section: Split Screen + 4-Column Metric Strip */}
        <section className="mx-auto max-w-6xl px-4 pt-10 pb-10 sm:px-6 sm:pt-14">
          <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
            {/* Left Typographic Anchor */}
            <div className="portfolio-surface flex flex-col justify-between border border-slate-200 p-6 sm:p-9 lg:col-span-7">
              <div>
                <p className="text-sm font-semibold tracking-tight text-[var(--portfolio-brand-accent)]">
                  {hero.kicker[lang]}
                </p>

                <h1 className="mt-3 max-w-2xl font-display text-[clamp(2rem,3.6vw,3.1rem)] font-bold leading-[1.12] tracking-tight text-[var(--portfolio-text-heading)]">
                  {hero.headline[lang]}
                </h1>

                <p className="mt-5 max-w-[65ch] text-base leading-relaxed text-[var(--portfolio-text-secondary)]">
                  {hero.lead[lang]}
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <a
                    href="#pengalaman"
                    onClick={(e) => {
                      e.preventDefault();
                      navigateToSection('pengalaman');
                    }}
                    className="inline-flex min-h-[46px] items-center gap-2 rounded-lg bg-[var(--portfolio-brand-accent)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--portfolio-brand-accent)]"
                  >
                    <span>{copy.hero.primaryCta}</span>
                    <ArrowRight className="h-4 w-4" />
                  </a>

                  <button
                    type="button"
                    onClick={() => setIsCvOpen(true)}
                    className="inline-flex min-h-[46px] items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-[var(--portfolio-text-primary)] transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--portfolio-brand-accent)]"
                  >
                    <FileText className="h-4 w-4 text-slate-700" />
                    <span>{copy.hero.secondaryCta}</span>
                  </button>
                </div>
              </div>

              {/* Clean unboxed contact strip */}
              <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-200 pt-5 text-sm text-[var(--portfolio-text-secondary)]">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-slate-600" />
                  <span>{profile.location}</span>
                </span>
                <span aria-hidden="true" className="text-slate-400">
                  ·
                </span>
                <a
                  href={`mailto:${profile.email}`}
                  className="font-medium underline-offset-4 transition-colors hover:text-[var(--portfolio-brand-accent)] hover:underline"
                >
                  {profile.email}
                </a>
                <span aria-hidden="true" className="text-slate-400">
                  ·
                </span>
                <a
                  href={profile.phoneHref}
                  className="font-mono-tabular font-medium underline-offset-4 transition-colors hover:text-[var(--portfolio-brand-accent)] hover:underline"
                >
                  {profile.phone}
                </a>
                <span aria-hidden="true" className="text-slate-400">
                  ·
                </span>
                <a
                  href={profile.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium underline-offset-4 transition-colors hover:text-[var(--portfolio-brand-accent)] hover:underline"
                >
                  <span>LinkedIn</span>
                  <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Right Visual & Domain Dossier */}
            <div className="portfolio-dark-panel relative flex flex-col justify-between overflow-hidden p-6 text-white sm:p-7 lg:col-span-5 lg:h-full">
              {/* Subtle architectural aviation vector linework */}
              <svg
                aria-hidden="true"
                viewBox="0 0 360 120"
                className="pointer-events-none absolute -right-8 -bottom-4 h-36 w-72 text-white/[0.06]"
                fill="none"
              >
                <path
                  d="M10 95 C 90 95, 130 30, 220 35 C 280 38, 315 20, 350 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
                <circle cx="10" cy="95" r="4" fill="currentColor" />
                <circle cx="220" cy="35" r="4" fill="currentColor" />
                <circle cx="350" cy="12" r="4" fill="currentColor" />
              </svg>

              <div className="relative z-10">
                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-5">
                  <span className="text-xs font-medium text-slate-300">
                    {copy.hero.dossierLabel}
                  </span>

                  {/* Bilingual Switch */}
                  <div
                    role="group"
                    aria-label={copy.hero.languageLabel}
                    className="inline-flex items-center rounded-lg border border-white/10 bg-white/10 p-0.5"
                  >
                    <button
                      type="button"
                      onClick={() => setLang('id')}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors whitespace-nowrap ${
                        lang === 'id' ? 'bg-white text-[#0B192C]' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      ID
                    </button>
                    <button
                      type="button"
                      onClick={() => setLang('en')}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors whitespace-nowrap ${
                        lang === 'en' ? 'bg-white text-[#0B192C]' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      EN
                    </button>
                  </div>
                </div>

                {/* Portrait + Identity */}
                <div className="mt-6 flex items-center gap-4">
                  <div className="h-24 w-24 overflow-hidden rounded-xl border border-white/20 bg-slate-800 shrink-0 sm:h-28 sm:w-28">
                    <ResilientImage
                      src={profile.portraitSrc}
                      alt={profile.name}
                      fallbackTitle={profile.name}
                      fallbackMonogram={initials}
                      className="h-full w-full object-cover object-top"
                      fallbackClassName="h-full w-full bg-gradient-to-br from-[#13294B] to-[#0B192C]"
                    />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-display text-xl font-bold tracking-tight text-[var(--portfolio-text-heading-dark)] sm:text-2xl">
                      {profile.name}
                    </h2>
                    <p className="mt-1 text-xs text-slate-300 sm:text-sm">{education.schoolName}</p>
                    <p className="mt-2 text-xs font-medium text-sky-300">
                      {hero.dossierStatus[lang]}
                    </p>
                  </div>
                </div>
              </div>

              {/* Technical Spec List */}
              <dl className="relative z-10 mt-6 space-y-3 border-t border-white/15 pt-5 text-sm">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-slate-200 shrink-0">{copy.hero.baseLabel}</dt>
                  <dd className="text-right font-medium text-white">{profile.location}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 border-t border-white/15 pt-2.5">
                  <dt className="text-slate-200 shrink-0">{copy.hero.aircraftLabel}</dt>
                  <dd className="text-right font-mono-tabular text-white">
                    {hero.aircraftSummary}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 border-t border-white/15 pt-2.5">
                  <dt className="text-slate-200 shrink-0">{copy.hero.eximLabel}</dt>
                  <dd className="text-right font-mono-tabular text-white">
                    {hero.eximSummary}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* 4-Column Metric Strip */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => (
              <div
                key={metric.id}
                className="portfolio-surface flex flex-col justify-between border border-slate-200 p-5"
              >
                <div>
                  <p className="font-display text-2xl font-bold tracking-tight tabular-nums text-[var(--portfolio-text-primary)] sm:text-3xl">
                    {metric.value[lang]}
                  </p>
                  <p className="mt-1 text-base font-semibold text-[var(--portfolio-text-primary)]">
                    {metric.label[lang]}
                  </p>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[var(--portfolio-text-secondary)]">
                  {metric.detail[lang]}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Subtle Operational Marquee Divider */}
        <div className="overflow-hidden border-y border-slate-200 bg-[var(--portfolio-bg-surface)] py-3.5 select-none">
          <div className="animate-marquee">
            {[...marqueeItems[lang], ...marqueeItems[lang]].map((item, idx) => (
              <span
                key={idx}
                className="mx-5 inline-flex items-center text-sm font-medium text-[var(--portfolio-text-secondary)] whitespace-nowrap"
              >
                <span>{item}</span>
                <span aria-hidden="true" className="ml-5 text-slate-300">
                  ·
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Section 1: Experience & Field Operations */}
        <section id="pengalaman" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
          <div className="flex flex-col justify-between gap-6 border-b border-slate-200 pb-8 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-[var(--portfolio-brand-accent)]">
                {copy.sections.experienceIndex}
              </p>
              <h2 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-[var(--portfolio-text-heading)] sm:text-3xl">
                {copy.sections.experienceTitle}
              </h2>
              <p className="mt-2 text-base leading-relaxed text-[var(--portfolio-text-secondary)]">
                {copy.sections.experienceLead}
              </p>
            </div>

            <div
              role="tablist"
              aria-label="Filter pengalaman kerja"
              className="flex flex-wrap items-center gap-1 self-start rounded-xl bg-slate-200/80 p-1 lg:self-end"
            >
              {[
                {id: 'all', label: `${copy.sections.filterAll} (${experiences.length})`},
                {id: 'aviation', label: copy.sections.filterAviation},
                {id: 'exim', label: copy.sections.filterExim},
                {id: 'it', label: copy.sections.filterIt},
              ].map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  type="button"
                  aria-selected={expFilter === tab.id}
                  onClick={() => setExpFilter(tab.id as typeof expFilter)}
                  className={`min-h-[40px] rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                    expFilter === tab.id
                      ? 'bg-white text-[var(--portfolio-text-primary)] shadow-xs'
                      : 'text-slate-700 hover:text-[var(--portfolio-text-primary)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {filteredExperiences.map((exp, idx) => {
              const isLeadSpan = expFilter === 'all' && idx === 0;
              return (
                <article
                  key={exp.id}
                  className={`portfolio-surface flex flex-col justify-between border border-slate-200 p-6 transition-colors hover:border-slate-300 sm:p-7 ${
                    isLeadSpan ? 'md:col-span-2' : ''
                  }`}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-[var(--portfolio-text-secondary)]">
                      <span className="font-semibold text-[var(--portfolio-brand-accent)]">
                        {exp.categoryLabel[lang]}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">{exp.period}</span>
                      <span aria-hidden="true">·</span>
                      <span>{exp.location}</span>
                    </div>

                    <div className="mt-2.5 flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline">
                      <h3 className="font-display text-xl font-bold tracking-tight text-[var(--portfolio-text-heading)] sm:text-2xl">
                        {exp.role[lang]}
                      </h3>
                      <span className="text-sm font-semibold text-[var(--portfolio-text-primary)] shrink-0">
                        {exp.organization}
                      </span>
                    </div>

                    <p className="mt-3 max-w-[75ch] text-base leading-relaxed text-[var(--portfolio-text-secondary)]">
                      {exp.summary[lang]}
                    </p>

                    <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-[var(--portfolio-text-primary)] sm:text-base">
                      {exp.highlights[lang].slice(0, isLeadSpan ? 3 : 2).map((point, hIdx) => (
                        <li key={hIdx} className="flex items-start gap-2.5 leading-relaxed">
                          <CheckCircle2 className="mt-1 h-4 w-4 text-[var(--portfolio-brand-accent)] shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 flex flex-col justify-between gap-4 border-t border-slate-200/80 pt-4 sm:flex-row sm:items-center">
                    <p className="font-mono-tabular text-xs leading-relaxed text-slate-700 sm:text-sm">
                      {exp.systemsAndTools.join(' · ')}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedExp(exp)}
                      className="inline-flex min-h-[42px] items-center gap-1.5 self-start rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[var(--portfolio-text-primary)] transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0 sm:self-auto"
                    >
                      <span>{copy.sections.readDetail}</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Section 2: Competency Matrix + Interactive Aviation Fleet & EXIM Incoterms Explorer */}
        <section
          id="kompetensi"
          className="scroll-mt-20 border-y border-slate-200 bg-[var(--portfolio-bg-surface)] py-16"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-[var(--portfolio-brand-accent)]">
                {copy.sections.competencyIndex}
              </p>
              <h2 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-[var(--portfolio-text-heading)] sm:text-3xl">
                {copy.sections.competencyTitle}
              </h2>
              <p className="mt-2 text-base leading-relaxed text-[var(--portfolio-text-secondary)]">
                {copy.sections.competencyLead}
              </p>
            </div>

            <div
              role="tablist"
              aria-label="Domain kompetensi"
              className="mt-8 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4"
            >
              {competencies.map((comp, idx) => {
                const isActive = comp.id === activeComp?.id;
                return (
                  <button
                    key={comp.id}
                    role="tab"
                    type="button"
                    aria-selected={isActive}
                    onClick={() => setActiveCompId(comp.id)}
                    className={`min-h-[56px] rounded-xl border px-4 py-3.5 text-left transition-all ${
                      isActive
                        ? 'border-[#0B192C] bg-[#0B192C] text-white'
                        : 'border-slate-200 bg-[#F8FAFC] text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span
                      className={`block font-mono-tabular text-xs ${
                        isActive ? 'text-sky-300' : 'text-slate-600'
                      }`}
                    >
                      0{idx + 1}.
                    </span>
                    <span className="mt-0.5 block text-sm font-semibold leading-snug">
                      {comp.title[lang]}
                    </span>
                  </button>
                );
              })}
            </div>

            {activeComp && (
              <div className="mt-6 grid grid-cols-1 gap-8 rounded-2xl border border-slate-200 bg-[var(--portfolio-bg-page)] p-6 sm:p-8 lg:grid-cols-12">
                <div className="lg:col-span-7">
                  <h3 className="font-serif-editorial text-xl font-semibold text-[var(--portfolio-text-heading)] sm:text-2xl">
                    {activeComp.title[lang]}
                  </h3>
                  <p className="mt-2 text-base leading-relaxed text-[var(--portfolio-text-secondary)]">
                    {activeComp.subtitle[lang]}
                  </p>

                  <ul className="mt-6 space-y-3">
                    {activeComp.capabilities[lang].map((cap, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 text-sm leading-relaxed text-[var(--portfolio-text-primary)] sm:text-base"
                      >
                        <CheckCircle2 className="mt-1 h-4 w-4 text-[var(--portfolio-brand-accent)] shrink-0" />
                        <span>{cap}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="self-start rounded-xl border border-slate-200 bg-white p-5 lg:col-span-5">
                  <h4 className="border-b border-slate-200 pb-3 text-xs font-semibold text-slate-700">
                    {lang === 'id'
                      ? 'Spesifikasi Standar & Perangkat'
                      : 'Standards & Operational Specifications'}
                  </h4>
                  <dl className="divide-y divide-slate-100">
                    {activeComp.specs.map((spec, idx) => (
                      <div key={`${spec.code}-${idx}`} className="py-3.5 first:pt-3 last:pb-1">
                        <dt className="font-mono-tabular text-xs font-semibold text-[var(--portfolio-brand-accent)]">
                          {spec.code}
                        </dt>
                        <dd className="mt-0.5 text-sm font-medium text-[var(--portfolio-text-primary)]">
                          {spec.detail[lang]}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            )}

            {/* Domain-Native Interactive Reference: Aviation Fleet & EXIM Incoterms 2020 */}
            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Interactive Aircraft Handling Matrix */}
              <div className="rounded-2xl border border-slate-200 bg-[var(--portfolio-bg-page)] p-6">
                <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-2.5">
                    <Plane className="h-4 w-4 text-[var(--portfolio-brand-accent)]" />
                    <h3 className="font-display text-base font-bold text-[var(--portfolio-text-heading)]">
                      {lang === 'id'
                        ? 'Referensi Penanganan Armada (Ground Ops)'
                        : 'Aircraft Ramp Handling Reference'}
                    </h3>
                  </div>
                  <span className="font-mono-tabular text-xs font-semibold text-slate-700">
                    4 TIPE
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {AIRCRAFT_SPECS.map((ac) => (
                    <button
                      key={ac.code}
                      type="button"
                      onClick={() => setSelectedAircraftCode(ac.code)}
                      className={`min-h-[38px] rounded-lg px-3.5 py-1.5 font-mono-tabular text-xs font-semibold transition-colors ${
                        ac.code === activeAircraft.code
                          ? 'bg-[var(--portfolio-bg-dark)] text-white'
                          : 'border border-slate-300 bg-white text-slate-800 hover:border-slate-400'
                      }`}
                    >
                      {ac.code}
                    </button>
                  ))}
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-display text-base font-bold text-[var(--portfolio-text-primary)]">
                      {activeAircraft.name}
                    </span>
                    <span className="font-mono-tabular text-xs font-semibold text-[var(--portfolio-brand-accent)]">
                      {activeAircraft.role[lang]}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--portfolio-text-secondary)]">
                    {activeAircraft.groundFocus[lang]}
                  </p>
                </div>
              </div>

              {/* Interactive EXIM Incoterms 2020 Matrix */}
              <div className="rounded-2xl border border-slate-200 bg-[var(--portfolio-bg-page)] p-6">
                <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-2.5">
                    <Ship className="h-4 w-4 text-[var(--portfolio-brand-accent)]" />
                    <h3 className="font-display text-base font-bold text-[var(--portfolio-text-heading)]">
                      {lang === 'id'
                        ? 'Simulasi Matriks Incoterms 2020 (EXIM)'
                        : 'Incoterms 2020 Responsibility Matrix'}
                    </h3>
                  </div>
                  <span className="font-mono-tabular text-xs font-semibold text-slate-700">
                    EXW · FOB · CFR · CIF
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {INCOTERMS_SPECS.map((term) => (
                    <button
                      key={term.code}
                      type="button"
                      onClick={() => setSelectedIncotermCode(term.code)}
                      className={`min-h-[38px] rounded-lg px-3.5 py-1.5 font-mono-tabular text-xs font-semibold transition-colors ${
                        term.code === activeIncoterm.code
                          ? 'bg-[var(--portfolio-brand-accent)] text-white'
                          : 'border border-slate-300 bg-white text-slate-800 hover:border-slate-400'
                      }`}
                    >
                      {term.code}
                    </button>
                  ))}
                </div>

                <div className="mt-4 space-y-2.5 rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-display text-base font-bold text-[var(--portfolio-text-primary)]">
                      {activeIncoterm.code} — {activeIncoterm.fullName}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      {activeIncoterm.mode[lang]}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-sm leading-relaxed text-[var(--portfolio-text-secondary)]">
                    <p>
                      <strong className="text-[var(--portfolio-text-primary)]">
                        {lang === 'id' ? 'Tanggung Jawab Penjual: ' : 'Seller Scope: '}
                      </strong>
                      {activeIncoterm.sellerScope[lang]}
                    </p>
                    <p>
                      <strong className="text-[var(--portfolio-text-primary)]">
                        {lang === 'id' ? 'Peralihan Risiko: ' : 'Risk Transfer: '}
                      </strong>
                      {activeIncoterm.riskTransfer[lang]}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Education & Official Certifications */}
        <section id="sertifikasi" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-8 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-[var(--portfolio-brand-accent)]">
                {copy.sections.educationIndex}
              </p>
              <h2 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-[var(--portfolio-text-heading)] sm:text-3xl">
                {copy.sections.educationTitle}
              </h2>
              <p className="mt-2 text-base leading-relaxed text-[var(--portfolio-text-secondary)]">
                {copy.sections.educationLead}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsCvOpen(true)}
              className="inline-flex min-h-[44px] items-center gap-2 self-start rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[var(--portfolio-text-primary)] transition-colors hover:bg-slate-50 whitespace-nowrap shrink-0 sm:self-auto"
            >
              <FileText className="h-4 w-4 text-[var(--portfolio-brand-accent)]" />
              <span>{copy.sections.previewCvBtn}</span>
            </button>
          </div>

          {/* Education Block */}
          <div className="portfolio-surface mt-8 flex flex-col justify-between gap-6 border border-slate-200 p-6 sm:p-8 md:flex-row md:items-center">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--portfolio-bg-dark)] text-white shrink-0">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <p className="font-mono-tabular text-sm font-medium text-slate-700">
                  {education.schoolPeriod}
                </p>
                <h3 className="mt-1 font-display text-xl font-bold text-[var(--portfolio-text-heading)]">
                  {education.schoolName}
                </h3>
                <p className="mt-0.5 text-sm font-semibold text-[var(--portfolio-brand-accent)]">
                  {education.major[lang]}
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--portfolio-text-secondary)] sm:text-base">
                  {education.points[lang].map((pt, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span aria-hidden="true" className="font-bold text-slate-600">
                        ·
                      </span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Credentials Grid */}
          <h3 className="mt-10 mb-4 text-base font-bold text-[var(--portfolio-text-heading)]">
            {copy.sections.certSubheading}
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {certifications.map((cert) => (
              <div
                key={cert.id}
                className="portfolio-surface flex flex-col justify-between border border-slate-200 p-5"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs font-medium text-slate-700 sm:text-sm">
                    <span className="truncate">{cert.issuer}</span>
                    <Award className="h-4 w-4 text-[var(--portfolio-brand-accent)] shrink-0" />
                  </div>
                  <h4 className="mt-2 font-display text-base font-bold leading-snug text-[var(--portfolio-text-heading)]">
                    {cert.title}
                  </h4>
                </div>
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-200/80 pt-3 text-xs font-medium text-slate-700 sm:text-sm">
                  <span>{cert.domain[lang]}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-tabular shrink-0">{cert.yearOrContext}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4: Availability & Direct Contact */}
        <section id="kontak" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-16 sm:px-6">
          {(() => {
            const {mailtoUrl, gmailUrl, whatsappUrl} = buildDirectLinks();
            return (
              <div className="portfolio-dark-panel grid grid-cols-1 items-start gap-8 p-6 text-white sm:p-10 lg:grid-cols-12">
                <div className="space-y-5 lg:col-span-5">
                  <div>
                    <p className="text-xs font-semibold text-sky-300">
                      {copy.sections.contactIndex}
                    </p>
                    <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-[var(--portfolio-text-heading-dark)] sm:text-3xl">
                      {copy.sections.contactTitle}
                    </h2>
                    <p className="mt-3 max-w-[48ch] text-sm leading-relaxed text-slate-300 sm:text-base">
                      {copy.sections.contactLead}
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-1 text-sm">
                    <div className="flex items-center gap-3 text-slate-200">
                      <Mail className="h-4 w-4 text-sky-300 shrink-0" />
                      <span className="break-all">{profile.email}</span>
                    </div>
                    <div className="flex items-center gap-3 font-mono-tabular text-slate-200">
                      <Phone className="h-4 w-4 text-sky-300 shrink-0" />
                      <span>{profile.phone}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-200">
                      <MapPin className="h-4 w-4 text-sky-300 shrink-0" />
                      <span>{profile.shortLocation || profile.location}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2.5 pt-1">
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[42px] items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-500 whitespace-nowrap"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>{copy.sections.whatsappCta}</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => handleCopy(profile.email, 'Email')}
                      className="inline-flex min-h-[42px] items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/20 whitespace-nowrap"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>{copy.sections.copyEmail}</span>
                    </button>
                    <a
                      href={profile.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[42px] items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/20 whitespace-nowrap"
                    >
                      <span>{copy.sections.openLinkedIn}</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setIsCvOpen(true)}
                      className="inline-flex min-h-[42px] items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#1D4ED8] whitespace-nowrap"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      <span>{copy.sections.downloadCv}</span>
                    </button>
                  </div>
                </div>

                <form
                  onSubmit={handleInquirySubmit}
                  className="space-y-4 rounded-xl bg-white p-6 text-slate-900 lg:col-span-7"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="font-display text-lg font-bold text-[var(--portfolio-text-heading)]">
                      {copy.sections.formTitle}
                    </h3>
                    <span className="text-xs font-medium text-slate-600">{profile.email}</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="inq-name"
                        className="mb-1 block text-xs font-semibold text-slate-700"
                      >
                        {copy.sections.formName}
                      </label>
                      <input
                        id="inq-name"
                        type="text"
                        required
                        value={inqName}
                        onChange={(e) => setInqName(e.target.value)}
                        placeholder={lang === 'id' ? 'Contoh: Budi / HRD PT...' : 'e.g. Alex Pratama'}
                        className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#2563EB] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="inq-email"
                        className="mb-1 block text-xs font-semibold text-slate-700"
                      >
                        {copy.sections.formEmail}
                      </label>
                      <input
                        id="inq-email"
                        type="email"
                        required
                        value={inqEmail}
                        onChange={(e) => setInqEmail(e.target.value)}
                        placeholder="nama@perusahaan.com"
                        className="min-h-[44px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#2563EB] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="inq-msg"
                      className="mb-1 block text-xs font-semibold text-slate-700"
                    >
                      {copy.sections.formMessage}
                    </label>
                    <textarea
                      id="inq-msg"
                      rows={3}
                      required
                      value={inqMessage}
                      onChange={(e) => setInqMessage(e.target.value)}
                      placeholder={
                        lang === 'id'
                          ? 'Tulis nama perusahaan, posisi, atau pesan Anda...'
                          : 'Share company name, role, or your inquiry...'
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-[#2563EB] focus:outline-none"
                    />
                  </div>

                  {msgStatus && (
                    <div
                      role="status"
                      aria-live="polite"
                      className={`flex items-start gap-2.5 rounded-lg border p-3 text-xs leading-relaxed sm:text-sm ${
                        msgStatus.type === 'success'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                          : msgStatus.type === 'error'
                            ? 'border-rose-200 bg-rose-50 text-rose-950'
                            : 'border-amber-200 bg-amber-50 text-amber-950'
                      }`}
                    >
                      {msgStatus.type === 'success' ? (
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                      ) : (
                        <AlertCircle
                          className={`mt-0.5 h-4 w-4 shrink-0 ${
                            msgStatus.type === 'error' ? 'text-rose-700' : 'text-amber-700'
                          }`}
                        />
                      )}
                      <span>{msgStatus.text}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSendingMsg}
                    className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-lg bg-[#0B192C] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1E3A6E] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSendingMsg ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{copy.sections.formSending}</span>
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        <span>{copy.sections.formSubmit}</span>
                      </>
                    )}
                  </button>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-3 text-xs text-slate-700">
                    <span className="font-medium">{copy.sections.formAltLabel}</span>
                    <div className="flex flex-wrap items-center gap-3 font-semibold">
                      <a
                        href={gmailUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--portfolio-brand-accent)] underline-offset-4 hover:underline whitespace-nowrap"
                      >
                        {copy.sections.formGmail}
                      </a>
                      <span aria-hidden="true" className="text-slate-300">
                        ·
                      </span>
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-700 underline-offset-4 hover:underline whitespace-nowrap"
                      >
                        {copy.sections.whatsappCta}
                      </a>
                      <span aria-hidden="true" className="text-slate-300">
                        ·
                      </span>
                      <a
                        href={mailtoUrl}
                        className="text-slate-800 underline-offset-4 hover:underline whitespace-nowrap"
                      >
                        {copy.sections.formMailApp}
                      </a>
                    </div>
                  </div>
                </form>
              </div>
            );
          })()}
        </section>
      </main>

      {/* Clean Minimal Footer with Accessibility Text-Size Toggle & Quiet Admin Mode Access */}
      <footer className="border-t border-slate-300/80 bg-[var(--portfolio-bg-surface)] px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-[var(--portfolio-text-secondary)] sm:flex-row">
          <p className="font-medium">
            {profile.name} · {profile.location}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={toggleVisitorTextSize}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50"
            >
              <Type className="h-3.5 w-3.5 text-[var(--portfolio-brand-accent)]" />
              <span>{visitorLargeText ? copy.footer.textLarge : copy.footer.textStandard}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsCvOpen(true)}
              className="font-medium transition-colors hover:text-[var(--portfolio-brand-accent)]"
            >
              {copy.nav.viewCv}
            </button>
            <span aria-hidden="true">·</span>
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                navigateToSection('top');
              }}
              className="font-medium transition-colors hover:text-[var(--portfolio-brand-accent)]"
            >
              {copy.footer.backToTop}
            </a>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setIsAdminOpen(true)}
              className="inline-flex items-center gap-1 font-medium text-slate-700 transition-colors hover:text-[var(--portfolio-brand-accent)]"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>{copy.footer.adminMode}</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Experience Scope Modal */}
      <ExperienceModal item={selectedExp} lang={lang} onClose={() => setSelectedExp(null)} />

      {/* Printable Official CV Modal */}
      <CvModal
        isOpen={isCvOpen}
        data={data}
        lang={lang}
        onClose={() => setIsCvOpen(false)}
        onActionToast={showToast}
      />

      {/* Self-Managed Admin Editor Modal */}
      <AdminEditorModal
        isOpen={isAdminOpen}
        data={data}
        adminPin={adminPin}
        isUnlocked={isAdminUnlocked}
        onUnlock={() => setIsAdminUnlocked(true)}
        onLock={() => {
          setIsAdminUnlocked(false);
          setIsAdminOpen(false);
          showToast('Sesi Admin dikunci.');
        }}
        onUpdatePin={handleUpdatePin}
        onSaveData={handleSaveAdminData}
        onResetDefault={handleResetDefault}
        onClose={() => setIsAdminOpen(false)}
        onToast={showToast}
      />
    </div>
  );
}
