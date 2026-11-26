import {useEffect, useState, type ChangeEvent, type FormEvent} from 'react';
import {
  Check,
  Download,
  KeyRound,
  Lock,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  DEFAULT_THEME_CONFIG,
  mergePortfolioData,
  normalizeHexColor,
  type CertificationItem,
  type ExperienceCategory,
  type ExperienceItem,
  type PortfolioData,
  type ThemeConfig,
} from '../data/portfolioData';

interface AdminEditorModalProps {
  isOpen: boolean;
  data: PortfolioData;
  adminPin: string;
  isUnlocked: boolean;
  onUnlock: () => void;
  onLock: () => void;
  onUpdatePin: (newPin: string) => void;
  onSaveData: (nextData: PortfolioData) => void;
  onResetDefault: () => void;
  onClose: () => void;
  onToast: (msg: string) => void;
}

type AdminTab = 'profile' | 'experiences' | 'credentials' | 'theme' | 'publish';

export function AdminEditorModal({
  isOpen,
  data,
  adminPin,
  isUnlocked,
  onUnlock,
  onLock,
  onUpdatePin,
  onSaveData,
  onResetDefault,
  onClose,
  onToast,
}: AdminEditorModalProps) {
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [activeTab, setActiveTab] = useState<AdminTab>('profile');
  const [draft, setDraft] = useState<PortfolioData>(data);
  const [selectedExpId, setSelectedExpId] = useState<string>(data.experiences[0]?.id || '');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [showAdvancedCss, setShowAdvancedCss] = useState(false);
  const [hasServerZips, setHasServerZips] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const merged = mergePortfolioData(data);
    setDraft(merged);
    setSelectedExpId((prev) =>
      merged.experiences.some((e) => e.id === prev) ? prev : merged.experiences[0]?.id || '',
    );
  }, [data, isOpen]);

  useEffect(() => {
    if (!isOpen || !isUnlocked || typeof window === 'undefined') return;
    if (window.location.protocol === 'file:') {
      setHasServerZips(false);
      return;
    }
    let cancelled = false;
    fetch('./downloads/saif-al-daffa-portofolio.zip', {method: 'HEAD'})
      .then((res) => {
        if (cancelled) return;
        const ct = (res.headers.get('content-type') || '').toLowerCase();
        setHasServerZips(res.ok && !ct.includes('text/html'));
      })
      .catch(() => {
        if (!cancelled) setHasServerZips(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, isUnlocked]);

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

  const handleUnlockSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === adminPin) {
      setPinError('');
      setPinInput('');
      onUnlock();
      onToast('Mode Admin aktif. Anda dapat mengedit seluruh isi portofolio.');
    } else {
      setPinError('PIN Admin tidak cocok. Coba lagi.');
    }
  };

  const handleCommitDraft = () => {
    onSaveData(draft);
    onToast('Perubahan disimpan ke browser dan langsung tampil di portofolio.');
  };

  const handlePortraitUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setDraft((prev) => ({
          ...prev,
          profile: {...prev.profile, portraitSrc: reader.result as string},
        }));
        onToast('Foto profil dimuat. Klik "Simpan Perubahan" untuk menerapkan.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCvUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setDraft((prev) => ({
          ...prev,
          profile: {
            ...prev.profile,
            cvPdfSrc: reader.result as string,
            cvFileName: file.name,
          },
        }));
        onToast(`File CV "${file.name}" dimuat. Klik "Simpan Perubahan".`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleExportJson = () => {
    onSaveData(draft);
    const jsonString = JSON.stringify(draft, null, 2);
    const blob = new Blob([jsonString], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'portfolio-data.json';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    onToast('File portfolio-data.json berhasil diekspor.');
  };

  const handleDownloadAsset = async (path: string, filename: string) => {
    try {
      onToast(`Menyiapkan ${filename}...`);
      const res = await fetch(path);
      const ct = (res.headers.get('content-type') || '').toLowerCase();
      const expectsHtml = filename.toLowerCase().endsWith('.html');
      if (!res.ok || (!expectsHtml && ct.includes('text/html'))) {
        throw new Error('File unduhan tidak tersedia di hosting ini.');
      }
      const blob = await res.blob();
      if (blob.size < 1000) {
        throw new Error('Ukuran file tidak valid.');
      }
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      onToast(`File ${filename} berhasil diunduh.`);
    } catch {
      onToast(
        'File paket tidak tersedia di server ini. Gunakan "Unduh portfolio-data.json" untuk menyimpan data Anda.',
      );
    }
  };

  const handleImportJson = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as Partial<PortfolioData>;
        if (!parsed.profile || !Array.isArray(parsed.experiences)) {
          throw new Error('Format JSON tidak valid.');
        }
        const safeData = mergePortfolioData(parsed);
        setDraft(safeData);
        onSaveData(safeData);
        setSelectedExpId(safeData.experiences[0]?.id || '');
        onToast('Data portofolio berhasil diimpor dan diterapkan.');
      } catch {
        onToast('Gagal membaca file JSON. Pastikan formatnya sesuai portfolio-data.json.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const currentTheme: ThemeConfig = {
    ...DEFAULT_THEME_CONFIG,
    ...(draft.theme || {}),
  };

  const updateTheme = (patch: Partial<ThemeConfig>) => {
    setDraft((prev) => ({
      ...prev,
      theme: {
        ...DEFAULT_THEME_CONFIG,
        ...(prev.theme || {}),
        ...patch,
      },
    }));
  };

  const handleExportThemeCss = () => {
    const cssText = `/* Pengaturan Tampilan Portofolio (Ukuran Huruf & Warna) - Saif Al Daffa */
:root {
  --portfolio-font-size-base: ${currentTheme.baseFontSizePx}px; /* Ukuran huruf utama */
  --portfolio-line-height-body: ${currentTheme.lineHeight}; /* Jarak antarbaris tulisan */
  --portfolio-bg-page: ${currentTheme.bgPage}; /* Warna latar belakang halaman */
  --portfolio-bg-surface: ${currentTheme.bgSurface}; /* Warna kotak konten */
  --portfolio-bg-dark: ${currentTheme.bgDark}; /* Warna kotak profil & kontak (gelap) */
  --portfolio-text-heading: ${currentTheme.textHeading}; /* Warna teks khusus judul utama & bagian */
  --portfolio-text-heading-dark: ${currentTheme.textHeadingDark}; /* Warna judul di kotak gelap */
  --portfolio-text-primary: ${currentTheme.textPrimary}; /* Warna tulisan isi utama */
  --portfolio-text-secondary: ${currentTheme.textSecondary}; /* Warna tulisan keterangan */
  --portfolio-brand-accent: ${currentTheme.brandAccent}; /* Warna tombol utama & menu aktif */
  --portfolio-radius-card: ${currentTheme.cardRadiusPx}px; /* Kelengkungan sudut kotak */
}

${currentTheme.customCss || ''}`.trim();
    const blob = new Blob([cssText], {type: 'text/css'});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'theme-tokens.css';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    onToast('File pengaturan tampilan (theme-tokens.css) berhasil diunduh.');
  };

  const handleAddExperience = () => {
    const newId = `exp-${Date.now()}`;
    const newExp: ExperienceItem = {
      id: newId,
      category: 'aviation',
      categoryLabel: {id: 'Aviasi & Ground Ops', en: 'Aviation & Ground Ops'},
      period: '2026',
      location: 'Surabaya',
      organization: 'Nama Perusahaan / Instansi',
      role: {id: 'Posisi / Jabatan Baru', en: 'New Role / Position'},
      summary: {
        id: 'Ringkasan tanggung jawab utama di posisi ini.',
        en: 'Summary of primary responsibilities in this role.',
      },
      highlights: {
        id: ['Pencapaian atau tugas lapangan pertama.', 'Koordinasi operasional harian.'],
        en: ['First key field responsibility.', 'Daily operational coordination.'],
      },
      systemsAndTools: ['SOP', 'Microsoft Excel'],
      keyOutcome: {
        id: 'Hasil terukur yang dicapai.',
        en: 'Measurable outcome achieved.',
      },
    };
    setDraft((prev) => ({
      ...prev,
      experiences: [newExp, ...prev.experiences],
    }));
    setSelectedExpId(newId);
  };

  const handleDeleteExperience = (id: string) => {
    setDraft((prev) => {
      const next = prev.experiences.filter((item) => item.id !== id);
      if (selectedExpId === id) {
        setSelectedExpId(next[0]?.id || '');
      }
      return {...prev, experiences: next};
    });
  };

  const updateExperience = (id: string, updater: (item: ExperienceItem) => ExperienceItem) => {
    setDraft((prev) => ({
      ...prev,
      experiences: prev.experiences.map((item) => (item.id === id ? updater(item) : item)),
    }));
  };

  const handleAddCertification = () => {
    const nextCert: CertificationItem = {
      id: `cert-${Date.now()}`,
      title: 'Nama Sertifikasi / Pelatihan Baru',
      issuer: 'Lembaga Penerbit',
      domain: {id: 'Bidang Kompetensi', en: 'Competency Domain'},
      yearOrContext: '2026',
    };
    setDraft((prev) => ({
      ...prev,
      certifications: [nextCert, ...prev.certifications],
    }));
  };

  const activeExp = draft.experiences.find((item) => item.id === selectedExpId) || null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-modal-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-[#0B192C] px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
              <Lock className="h-4 w-4 text-sky-300" />
            </div>
            <div>
              <h2 id="admin-modal-title" className="font-display text-base font-bold sm:text-lg">
                Panel Admin Portofolio
              </h2>
              <p className="text-xs text-slate-300">
                Kelola profil, pengalaman kerja, sertifikasi &amp; ekspor JSON
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isUnlocked && (
              <button
                type="button"
                onClick={onLock}
                className="min-h-[38px] rounded-lg border border-white/20 px-3 text-xs font-medium text-slate-200 hover:bg-white/10"
              >
                Kunci Sesi
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup Panel Admin"
              className="flex min-h-[38px] min-w-[38px] items-center justify-center rounded-lg border border-white/20 text-slate-200 hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* PIN Gate vs Unlocked Editor */}
        {!isUnlocked ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 sm:p-12">
            <form
              onSubmit={handleUnlockSubmit}
              className="w-full max-w-sm space-y-5 rounded-2xl border border-slate-200 bg-[#F8FAFC] p-6"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#2563EB]">
                  <KeyRound className="h-4 w-4" />
                  <span>Akses Khusus Pemilik</span>
                </div>
                <h3 className="font-display text-xl font-bold text-[#0B192C]">
                  Masukkan PIN Admin
                </h3>
                <p className="text-xs leading-relaxed text-slate-600">
                  PIN bawaan adalah <span className="font-mono-tabular font-semibold">2026</span>.
                  Anda dapat mengganti PIN pribadi setelah masuk ke editor.
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="admin-pin-input" className="block text-xs font-semibold text-slate-700">
                  PIN Admin
                </label>
                <input
                  id="admin-pin-input"
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Masukkan PIN..."
                  autoFocus
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3.5 font-mono-tabular text-sm text-slate-900 focus:border-[#2563EB] focus:outline-none"
                />
              </div>

              {pinError && (
                <p role="alert" className="text-xs font-medium text-rose-600">
                  {pinError}
                </p>
              )}

              <button
                type="submit"
                className="min-h-[44px] w-full rounded-lg bg-[#0B192C] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1E3A6E]"
              >
                Buka Editor Admin
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-6 py-2.5">
              {[
                {id: 'profile', label: 'Profil & Hero'},
                {id: 'experiences', label: `Pengalaman (${draft.experiences.length})`},
                {id: 'credentials', label: `Sertifikasi & KPI (${draft.certifications.length})`},
                {id: 'theme', label: 'Tampilan & Warna'},
                {id: 'publish', label: 'Publikasi & Keamanan'},
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as AdminTab)}
                  className={`rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-[#0B192C] text-white'
                      : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Editor Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Nama Lengkap
                      </label>
                      <input
                        type="text"
                        value={draft.profile.name}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            profile: {...prev.profile, name: e.target.value},
                          }))
                        }
                        className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Domisili Lengkap
                      </label>
                      <input
                        type="text"
                        value={draft.profile.location}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            profile: {...prev.profile, location: e.target.value},
                          }))
                        }
                        className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Email Kontak
                      </label>
                      <input
                        type="email"
                        value={draft.profile.email}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            profile: {...prev.profile, email: e.target.value},
                          }))
                        }
                        className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Nomor Telepon / WhatsApp
                      </label>
                      <input
                        type="text"
                        value={draft.profile.phone}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            profile: {
                              ...prev.profile,
                              phone: e.target.value,
                              phoneHref: `tel:${e.target.value.replace(/[^+\d]/g, '')}`,
                            },
                          }))
                        }
                        className="h-10 w-full rounded-lg border border-slate-300 px-3 font-mono-tabular text-sm"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-xs font-semibold text-slate-700">
                        URL LinkedIn
                      </label>
                      <input
                        type="url"
                        value={draft.profile.linkedinUrl}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            profile: {...prev.profile, linkedinUrl: e.target.value},
                          }))
                        }
                        className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                      />
                    </div>
                  </div>

                  {/* Photo & CV Uploads */}
                  <div className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-[#F8FAFC] p-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <span className="block text-xs font-semibold text-slate-700">
                        Foto Profil (PNG/JPG)
                      </span>
                      <label className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-800 hover:bg-slate-50">
                        <Upload className="h-3.5 w-3.5 text-[#2563EB]" />
                        <span>Pilih Foto dari Perangkat</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePortraitUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div className="space-y-2">
                      <span className="block text-xs font-semibold text-slate-700">
                        File CV Resmi (PDF Opsional)
                      </span>
                      <label className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-semibold text-slate-800 hover:bg-slate-50">
                        <Upload className="h-3.5 w-3.5 text-[#2563EB]" />
                        <span>Lampirkan File PDF CV</span>
                        <input
                          type="file"
                          accept="application/pdf"
                          onChange={handleCvUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Hero Texts */}
                  <div className="space-y-4 border-t border-slate-200 pt-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="font-display text-sm font-bold text-[#0B192C]">
                        Teks Utama Hero (Bahasa Indonesia &amp; Inggris)
                      </h3>
                      <button
                        type="button"
                        onClick={() => setActiveTab('theme')}
                        className="text-xs font-semibold text-[#1D4ED8] underline-offset-4 hover:underline"
                      >
                        Atur Warna &amp; Ukuran Teks Lengkap
                      </button>
                    </div>

                    {/* Quick Heading Color Picker right beside Headline editor */}
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-[#F8FAFC] px-4 py-3">
                      <div>
                        <span className="block text-xs font-bold text-[#0B192C]">
                          Warna Teks Bagian Judul
                        </span>
                        <span className="block text-[11px] text-slate-600">
                          Langsung ubah warna judul utama &amp; judul tiap bagian website:
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {[
                          {label: 'Hitam Pekat', hex: '#0F172A'},
                          {label: 'Biru Dongker', hex: '#0B192C'},
                          {label: 'Biru Utama', hex: '#1D4ED8'},
                          {label: 'Hijau Tua', hex: '#047857'},
                          {label: 'Merah Marun', hex: '#9F1239'},
                        ].map((swatch) => (
                          <button
                            key={swatch.hex}
                            type="button"
                            title={swatch.label}
                            onClick={() => updateTheme({textHeading: swatch.hex})}
                            className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-105 ${
                              currentTheme.textHeading.toUpperCase() === swatch.hex
                                ? 'border-[#1D4ED8] ring-2 ring-blue-200'
                                : 'border-white shadow-xs'
                            }`}
                            style={{backgroundColor: swatch.hex}}
                            aria-label={`Pilih warna judul ${swatch.label}`}
                          />
                        ))}
                        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-50">
                          <input
                            type="color"
                            value={normalizeHexColor(
                              currentTheme.textHeading,
                              DEFAULT_THEME_CONFIG.textHeading,
                            )}
                            onChange={(e) => updateTheme({textHeading: e.target.value})}
                            className="h-5 w-6 cursor-pointer border-0 bg-transparent p-0"
                            aria-label="Pilih warna teks judul bebas"
                          />
                          <span className="font-mono-tabular text-[11px]">
                            {currentTheme.textHeading.toUpperCase()}
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">
                          Kicker / Bidang Utama (ID)
                        </label>
                        <input
                          type="text"
                          value={draft.hero.kicker.id}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              hero: {
                                ...prev.hero,
                                kicker: {...prev.hero.kicker, id: e.target.value},
                              },
                            }))
                          }
                          className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">
                          Kicker / Main Domain (EN)
                        </label>
                        <input
                          type="text"
                          value={draft.hero.kicker.en}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              hero: {
                                ...prev.hero,
                                kicker: {...prev.hero.kicker, en: e.target.value},
                              },
                            }))
                          }
                          className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">
                          Headline Utama (ID)
                        </label>
                        <textarea
                          rows={2}
                          value={draft.hero.headline.id}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              hero: {
                                ...prev.hero,
                                headline: {...prev.hero.headline, id: e.target.value},
                              },
                            }))
                          }
                          className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">
                          Main Headline (EN)
                        </label>
                        <textarea
                          rows={2}
                          value={draft.hero.headline.en}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              hero: {
                                ...prev.hero,
                                headline: {...prev.hero.headline, en: e.target.value},
                              },
                            }))
                          }
                          className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">
                          Ringkasan Diri (ID)
                        </label>
                        <textarea
                          rows={3}
                          value={draft.hero.lead.id}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              hero: {
                                ...prev.hero,
                                lead: {...prev.hero.lead, id: e.target.value},
                              },
                            }))
                          }
                          className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">
                          Profile Summary (EN)
                        </label>
                        <textarea
                          rows={3}
                          value={draft.hero.lead.en}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              hero: {
                                ...prev.hero,
                                lead: {...prev.hero.lead, en: e.target.value},
                              },
                            }))
                          }
                          className="w-full rounded-lg border border-slate-300 p-2.5 text-sm"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">
                          Status Kesiapan (ID)
                        </label>
                        <input
                          type="text"
                          value={draft.hero.dossierStatus.id}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              hero: {
                                ...prev.hero,
                                dossierStatus: {...prev.hero.dossierStatus, id: e.target.value},
                              },
                            }))
                          }
                          className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-slate-700">
                          Availability Status (EN)
                        </label>
                        <input
                          type="text"
                          value={draft.hero.dossierStatus.en}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              hero: {
                                ...prev.hero,
                                dossierStatus: {...prev.hero.dossierStatus, en: e.target.value},
                              },
                            }))
                          }
                          className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'experiences' && (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                  <div className="space-y-3 lg:col-span-4">
                    <button
                      type="button"
                      onClick={handleAddExperience}
                      className="flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-lg bg-[#2563EB] px-3 text-xs font-semibold text-white hover:bg-[#1D4ED8]"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Tambah Pengalaman</span>
                    </button>

                    <div className="space-y-1.5">
                      {draft.experiences.map((exp) => (
                        <button
                          key={exp.id}
                          type="button"
                          onClick={() => setSelectedExpId(exp.id)}
                          className={`w-full rounded-lg border p-3 text-left transition-colors ${
                            exp.id === selectedExpId
                              ? 'border-[#0B192C] bg-[#0B192C] text-white'
                              : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                          }`}
                        >
                          <div className="truncate text-xs font-bold">{exp.role.id}</div>
                          <div
                            className={`mt-0.5 truncate text-[11px] ${
                              exp.id === selectedExpId ? 'text-sky-300' : 'text-slate-500'
                            }`}
                          >
                            {exp.organization} · {exp.period}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-8">
                    {activeExp ? (
                      <div className="space-y-4 rounded-xl border border-slate-200 bg-[#F8FAFC] p-5">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                          <h3 className="font-display text-sm font-bold text-[#0B192C]">
                            Edit Detail Pengalaman
                          </h3>
                          <button
                            type="button"
                            onClick={() => handleDeleteExperience(activeExp.id)}
                            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Hapus</span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-700">
                              Jabatan / Peran (ID)
                            </label>
                            <input
                              type="text"
                              value={activeExp.role.id}
                              onChange={(e) =>
                                updateExperience(activeExp.id, (item) => ({
                                  ...item,
                                  role: {...item.role, id: e.target.value},
                                }))
                              }
                              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-700">
                              Role / Position (EN)
                            </label>
                            <input
                              type="text"
                              value={activeExp.role.en}
                              onChange={(e) =>
                                updateExperience(activeExp.id, (item) => ({
                                  ...item,
                                  role: {...item.role, en: e.target.value},
                                }))
                              }
                              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-700">
                              Perusahaan / Lembaga
                            </label>
                            <input
                              type="text"
                              value={activeExp.organization}
                              onChange={(e) =>
                                updateExperience(activeExp.id, (item) => ({
                                  ...item,
                                  organization: e.target.value,
                                }))
                              }
                              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-700">
                              Kategori Bidang
                            </label>
                            <select
                              value={activeExp.category}
                              onChange={(e) => {
                                const cat = e.target.value as ExperienceCategory;
                                const labelMap: Record<ExperienceCategory, {id: string; en: string}> = {
                                  aviation: {id: 'Aviasi & Ground Ops', en: 'Aviation & Ground Ops'},
                                  exim: {id: 'EXIM & Gudang', en: 'EXIM & Warehouse'},
                                  it: {id: 'IT & Layanan', en: 'IT & Service'},
                                };
                                updateExperience(activeExp.id, (item) => ({
                                  ...item,
                                  category: cat,
                                  categoryLabel: labelMap[cat],
                                }));
                              }}
                              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                            >
                              <option value="aviation">Aviasi &amp; Ground Ops</option>
                              <option value="exim">EXIM &amp; Gudang</option>
                              <option value="it">IT &amp; Layanan</option>
                            </select>
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-700">
                              Periode Tahun
                            </label>
                            <input
                              type="text"
                              value={activeExp.period}
                              onChange={(e) =>
                                updateExperience(activeExp.id, (item) => ({
                                  ...item,
                                  period: e.target.value,
                                }))
                              }
                              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 font-mono-tabular text-sm"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-700">
                              Lokasi Penempatan
                            </label>
                            <input
                              type="text"
                              value={activeExp.location}
                              onChange={(e) =>
                                updateExperience(activeExp.id, (item) => ({
                                  ...item,
                                  location: e.target.value,
                                }))
                              }
                              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-700">
                              Ringkasan Singkat (ID)
                            </label>
                            <textarea
                              rows={2}
                              value={activeExp.summary.id}
                              onChange={(e) =>
                                updateExperience(activeExp.id, (item) => ({
                                  ...item,
                                  summary: {...item.summary, id: e.target.value},
                                }))
                              }
                              className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-700">
                              Short Summary (EN)
                            </label>
                            <textarea
                              rows={2}
                              value={activeExp.summary.en}
                              onChange={(e) =>
                                updateExperience(activeExp.id, (item) => ({
                                  ...item,
                                  summary: {...item.summary, en: e.target.value},
                                }))
                              }
                              className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-700">
                              Poin Tugas &amp; Tanggung Jawab ID (1 baris = 1 poin)
                            </label>
                            <textarea
                              rows={4}
                              value={(activeExp.highlights?.id || []).join('\n')}
                              onChange={(e) =>
                                updateExperience(activeExp.id, (item) => ({
                                  ...item,
                                  highlights: {
                                    ...item.highlights,
                                    id: e.target.value.split('\n').filter((line) => line.trim() !== ''),
                                  },
                                }))
                              }
                              className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs leading-relaxed"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-700">
                              Responsibilities EN (1 line = 1 bullet)
                            </label>
                            <textarea
                              rows={4}
                              value={(activeExp.highlights?.en || []).join('\n')}
                              onChange={(e) =>
                                updateExperience(activeExp.id, (item) => ({
                                  ...item,
                                  highlights: {
                                    ...item.highlights,
                                    en: e.target.value.split('\n').filter((line) => line.trim() !== ''),
                                  },
                                }))
                              }
                              className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs leading-relaxed"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-700">
                            Sistem / Peralatan (pisahkan dengan tanda koma)
                          </label>
                          <input
                            type="text"
                            value={(activeExp.systemsAndTools || []).join(', ')}
                            onChange={(e) =>
                              updateExperience(activeExp.id, (item) => ({
                                ...item,
                                systemsAndTools: e.target.value
                                  .split(',')
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                              }))
                            }
                            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 font-mono-tabular text-xs"
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-700">
                              Dampak &amp; Pencapaian Utama (ID)
                            </label>
                            <input
                              type="text"
                              value={activeExp.keyOutcome.id}
                              onChange={(e) =>
                                updateExperience(activeExp.id, (item) => ({
                                  ...item,
                                  keyOutcome: {...item.keyOutcome, id: e.target.value},
                                }))
                              }
                              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                            />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-700">
                              Key Outcome (EN)
                            </label>
                            <input
                              type="text"
                              value={activeExp.keyOutcome.en}
                              onChange={(e) =>
                                updateExperience(activeExp.id, (item) => ({
                                  ...item,
                                  keyOutcome: {...item.keyOutcome, en: e.target.value},
                                }))
                              }
                              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">Pilih atau tambah pengalaman baru.</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'credentials' && (
                <div className="space-y-8">
                  {/* Metrics Editor */}
                  <div className="space-y-3">
                    <h3 className="font-display text-sm font-bold text-[#0B192C]">
                      4 Kartu Statistik Utama (Hero Metrics)
                    </h3>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {draft.metrics.map((metric, index) => (
                        <div
                          key={metric.id}
                          className="space-y-2 rounded-xl border border-slate-200 bg-[#F8FAFC] p-4"
                        >
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={metric.value.id}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDraft((prev) => ({
                                  ...prev,
                                  metrics: prev.metrics.map((m, idx) =>
                                    idx === index ? {...m, value: {...m.value, id: val}} : m,
                                  ),
                                }));
                              }}
                              placeholder="Angka (mis: 2+ Tahun)"
                              className="h-9 w-1/2 rounded-lg border border-slate-300 bg-white px-2.5 font-mono-tabular text-xs font-bold"
                            />
                            <input
                              type="text"
                              value={metric.label.id}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDraft((prev) => ({
                                  ...prev,
                                  metrics: prev.metrics.map((m, idx) =>
                                    idx === index ? {...m, label: {...m.label, id: val}} : m,
                                  ),
                                }));
                              }}
                              placeholder="Label Metrik"
                              className="h-9 w-1/2 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold"
                            />
                          </div>
                          <input
                            type="text"
                            value={metric.detail.id}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraft((prev) => ({
                                ...prev,
                                metrics: prev.metrics.map((m, idx) =>
                                  idx === index ? {...m, detail: {...m.detail, id: val}} : m,
                                ),
                              }));
                            }}
                            placeholder="Keterangan singkat"
                            className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Certifications Editor */}
                  <div className="space-y-3 border-t border-slate-200 pt-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-sm font-bold text-[#0B192C]">
                        Daftar Sertifikasi &amp; Pelatihan
                      </h3>
                      <button
                        type="button"
                        onClick={handleAddCertification}
                        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-[#2563EB] px-3 text-xs font-semibold text-white hover:bg-[#1D4ED8]"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Tambah Sertifikasi</span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {draft.certifications.map((cert, index) => (
                        <div
                          key={cert.id}
                          className="grid grid-cols-1 items-center gap-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] p-3.5 sm:grid-cols-12"
                        >
                          <input
                            type="text"
                            value={cert.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraft((prev) => ({
                                ...prev,
                                certifications: prev.certifications.map((c, idx) =>
                                  idx === index ? {...c, title: val} : c,
                                ),
                              }));
                            }}
                            placeholder="Nama Sertifikat"
                            className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold sm:col-span-4"
                          />
                          <input
                            type="text"
                            value={cert.issuer}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraft((prev) => ({
                                ...prev,
                                certifications: prev.certifications.map((c, idx) =>
                                  idx === index ? {...c, issuer: val} : c,
                                ),
                              }));
                            }}
                            placeholder="Penerbit"
                            className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs sm:col-span-3"
                          />
                          <input
                            type="text"
                            value={cert.domain.id}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraft((prev) => ({
                                ...prev,
                                certifications: prev.certifications.map((c, idx) =>
                                  idx === index ? {...c, domain: {...c.domain, id: val}} : c,
                                ),
                              }));
                            }}
                            placeholder="Bidang"
                            className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs sm:col-span-2"
                          />
                          <input
                            type="text"
                            value={cert.yearOrContext}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraft((prev) => ({
                                ...prev,
                                certifications: prev.certifications.map((c, idx) =>
                                  idx === index ? {...c, yearOrContext: val} : c,
                                ),
                              }));
                            }}
                            placeholder="Tahun / Lokasi"
                            className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 font-mono-tabular text-xs sm:col-span-2"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setDraft((prev) => ({
                                ...prev,
                                certifications: prev.certifications.filter((c) => c.id !== cert.id),
                              }))
                            }
                            aria-label="Hapus sertifikat"
                            className="inline-flex h-9 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 sm:col-span-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'theme' && (
                <div className="space-y-6">
                  {/* Live Mini Preview */}
                  <div
                    className="rounded-xl border border-slate-300 p-5"
                    style={{
                      backgroundColor: currentTheme.bgPage,
                      fontSize: `${currentTheme.baseFontSizePx}px`,
                      lineHeight: currentTheme.lineHeight,
                    }}
                  >
                    <div className="mb-3 flex items-center justify-between text-xs font-semibold text-slate-600">
                      <span>Pratinjau Langsung Tampilan Website Anda</span>
                      <span className="font-mono-tabular">
                        Huruf {currentTheme.baseFontSizePx}px · Spasi {currentTheme.lineHeight}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-12">
                      <div
                        className="border border-slate-200 p-4 sm:col-span-7"
                        style={{
                          backgroundColor: currentTheme.bgSurface,
                          borderRadius: `${currentTheme.cardRadiusPx}px`,
                        }}
                      >
                        <p
                          className="text-base font-bold"
                          style={{color: currentTheme.textHeading}}
                        >
                          Contoh Teks Judul Halaman &amp; Bagian
                        </p>
                        <p
                          className="mt-1 text-xs"
                          style={{color: currentTheme.textSecondary}}
                        >
                          Seperti inilah keterbacaan teks keterangan di bawah judul portofolio Anda.
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span
                            className="inline-block rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                            style={{backgroundColor: currentTheme.brandAccent}}
                          >
                            Tombol Utama
                          </span>
                          <span
                            className="inline-block border-b-2 px-2 py-1 text-xs font-bold"
                            style={{
                              color: currentTheme.brandAccent,
                              borderColor: currentTheme.brandAccent,
                            }}
                          >
                            Menu Sedang Aktif
                          </span>
                        </div>
                      </div>
                      <div
                        className="p-4 text-white sm:col-span-5"
                        style={{
                          backgroundColor: currentTheme.bgDark,
                          borderRadius: `${currentTheme.cardRadiusPx}px`,
                        }}
                      >
                        <p
                          className="text-sm font-bold"
                          style={{color: currentTheme.textHeadingDark}}
                        >
                          Judul Kotak Profil &amp; Kontak
                        </p>
                        <p className="mt-1 text-xs text-slate-200">
                          Tampilan panel gelap untuk foto profil dan formulir kontak.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 1-Click Color Theme Presets */}
                  <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-display text-sm font-bold text-[#0B192C]">
                          1. Pilih Tema Warna Siap Pakai (Sekali Klik)
                        </h3>
                        <p className="text-xs text-slate-600">
                          Klik salah satu pilihan di bawah jika ingin langsung mengganti suasana warna
                          website tanpa perlu pusing memilih satu per satu.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          updateTheme(DEFAULT_THEME_CONFIG);
                          onToast('Tampilan dikembalikan ke setelan awal.');
                        }}
                        className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Kembalikan Awal</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                      {[
                        {
                          name: 'Biru Penerbangan (Bawaan)',
                          desc: 'Tegas, bersih & profesional',
                          patch: {
                            bgPage: '#F8FAFC',
                            bgSurface: '#FFFFFF',
                            bgDark: '#0B192C',
                            textHeading: '#0F172A',
                            textHeadingDark: '#FFFFFF',
                            textPrimary: '#0F172A',
                            textSecondary: '#334155',
                            brandAccent: '#1D4ED8',
                          },
                        },
                        {
                          name: 'Hangat & Lembut',
                          desc: 'Nyaman untuk membaca lama',
                          patch: {
                            bgPage: '#FAF8F5',
                            bgSurface: '#FFFFFF',
                            bgDark: '#1E293B',
                            textHeading: '#1C1917',
                            textHeadingDark: '#FEFCE8',
                            textPrimary: '#1C1917',
                            textSecondary: '#44403C',
                            brandAccent: '#0369A1',
                          },
                        },
                        {
                          name: 'Hijau Korporat',
                          desc: 'Tenang & berwibawa',
                          patch: {
                            bgPage: '#F4F7F6',
                            bgSurface: '#FFFFFF',
                            bgDark: '#0F2922',
                            textHeading: '#064E3B',
                            textHeadingDark: '#FFFFFF',
                            textPrimary: '#0F172A',
                            textSecondary: '#334155',
                            brandAccent: '#047857',
                          },
                        },
                        {
                          name: 'Kontras Ekstra Tegas',
                          desc: 'Tulisan hitam pekat maksimal',
                          patch: {
                            bgPage: '#F1F5F9',
                            bgSurface: '#FFFFFF',
                            bgDark: '#090D16',
                            textHeading: '#020617',
                            textHeadingDark: '#FFFFFF',
                            textPrimary: '#020617',
                            textSecondary: '#1E293B',
                            brandAccent: '#1E40AF',
                          },
                        },
                      ].map((preset) => {
                        const isSelected =
                          currentTheme.bgDark.toUpperCase() === preset.patch.bgDark.toUpperCase() &&
                          currentTheme.brandAccent.toUpperCase() ===
                            preset.patch.brandAccent.toUpperCase();
                        return (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => {
                              updateTheme(preset.patch);
                              onToast(`Tema "${preset.name}" diterapkan.`);
                            }}
                            className={`rounded-xl border p-3 text-left transition-colors ${
                              isSelected
                                ? 'border-[#1D4ED8] bg-[#EFF6FF]'
                                : 'border-slate-200 bg-[#F8FAFC] hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-1.5">
                              <span
                                className="h-3.5 w-3.5 rounded-full border border-black/15"
                                style={{backgroundColor: preset.patch.bgDark}}
                              />
                              <span
                                className="h-3.5 w-3.5 rounded-full border border-black/15"
                                style={{backgroundColor: preset.patch.brandAccent}}
                              />
                              <span
                                className="h-3.5 w-3.5 rounded-full border border-black/15"
                                style={{backgroundColor: preset.patch.bgPage}}
                              />
                            </div>
                            <p className="mt-2 text-xs font-bold text-[#0B192C]">{preset.name}</p>
                            <p className="text-[11px] text-slate-600">{preset.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Font Size & Spacing */}
                  <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-5 space-y-4">
                    <div>
                      <h3 className="font-display text-sm font-bold text-[#0B192C]">
                        2. Atur Ukuran Tulisan &amp; Kenyamanan Membaca
                      </h3>
                      <p className="text-xs text-slate-600">
                        Pilih ukuran huruf agar tulisan mudah dibaca oleh semua kalangan.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {[
                        {label: 'Normal (16px)', size: 16, lh: 1.65},
                        {label: 'Nyaman Semua Kalangan (17px)', size: 17, lh: 1.7},
                        {label: 'Besar / Mudah Dibaca Orang Tua (19px)', size: 19, lh: 1.8},
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() =>
                            updateTheme({baseFontSizePx: preset.size, lineHeight: preset.lh})
                          }
                          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                            currentTheme.baseFontSizePx === preset.size
                              ? 'border-[#1D4ED8] bg-[#EFF6FF] text-[#1D4ED8]'
                              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <label className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-700">
                          <span>Ukuran Huruf Utama</span>
                          <span className="font-mono-tabular text-[#1D4ED8]">
                            {currentTheme.baseFontSizePx}px
                          </span>
                        </label>
                        <input
                          type="range"
                          min={14}
                          max={22}
                          step={0.5}
                          value={currentTheme.baseFontSizePx}
                          onChange={(e) =>
                            updateTheme({baseFontSizePx: Number(e.target.value)})
                          }
                          className="w-full accent-[#1D4ED8]"
                        />
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>Kecil</span>
                          <span>Besar</span>
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-700">
                          <span>Jarak Spasi Antarbaris</span>
                          <span className="font-mono-tabular text-[#1D4ED8]">
                            {currentTheme.lineHeight}
                          </span>
                        </label>
                        <input
                          type="range"
                          min={1.4}
                          max={2.1}
                          step={0.05}
                          value={currentTheme.lineHeight}
                          onChange={(e) => updateTheme({lineHeight: Number(e.target.value)})}
                          className="w-full accent-[#1D4ED8]"
                        />
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>Rapat</span>
                          <span>Lega</span>
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-700">
                          <span>Bentuk Sudut Kotak</span>
                          <span className="font-mono-tabular text-[#1D4ED8]">
                            {currentTheme.cardRadiusPx}px
                          </span>
                        </label>
                        <input
                          type="range"
                          min={4}
                          max={28}
                          step={2}
                          value={currentTheme.cardRadiusPx}
                          onChange={(e) =>
                            updateTheme({cardRadiusPx: Number(e.target.value)})
                          }
                          className="w-full accent-[#1D4ED8]"
                        />
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>Kotak Tegas</span>
                          <span>Melengkung</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dedicated Title / Heading Color Controls */}
                  <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
                    <div>
                      <h3 className="font-display text-sm font-bold text-[#0B192C]">
                        3. Edit Warna Teks Bagian Judul
                      </h3>
                      <p className="text-xs text-slate-600">
                        Atur warna khusus untuk teks judul utama, judul setiap bagian (Pengalaman,
                        Kompetensi, Sertifikasi), dan judul di kotak gelap.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2 rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
                        <label className="block text-xs font-bold text-slate-900">
                          Warna Judul Halaman &amp; Tiap Bagian
                        </label>
                        <p className="text-[11px] text-slate-600">
                          Berlaku untuk judul besar Hero, nama bagian, dan judul pengalaman kerja.
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {[
                            {name: 'Hitam', hex: '#0F172A'},
                            {name: 'Dongker', hex: '#0B192C'},
                            {name: 'Biru', hex: '#1D4ED8'},
                            {name: 'Hijau', hex: '#047857'},
                            {name: 'Marun', hex: '#9F1239'},
                            {name: 'Cokelat', hex: '#78350F'},
                          ].map((sw) => (
                            <button
                              key={sw.hex}
                              type="button"
                              onClick={() => updateTheme({textHeading: sw.hex})}
                              className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors ${
                                currentTheme.textHeading.toUpperCase() === sw.hex
                                  ? 'border-[#1D4ED8] bg-[#EFF6FF] text-[#1D4ED8]'
                                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <span
                                className="h-3 w-3 rounded-full border border-black/15"
                                style={{backgroundColor: sw.hex}}
                              />
                              <span>{sw.name}</span>
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="color"
                            value={normalizeHexColor(
                              currentTheme.textHeading,
                              DEFAULT_THEME_CONFIG.textHeading,
                            )}
                            onChange={(e) => updateTheme({textHeading: e.target.value})}
                            className="h-9 w-11 cursor-pointer rounded border border-slate-300 bg-white p-0.5"
                          />
                          <input
                            type="text"
                            value={currentTheme.textHeading}
                            onChange={(e) => updateTheme({textHeading: e.target.value})}
                            className="h-9 flex-1 rounded-lg border border-slate-300 bg-white px-2.5 font-mono-tabular text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-2 rounded-xl border border-slate-200 bg-[#F8FAFC] p-4">
                        <label className="block text-xs font-bold text-slate-900">
                          Warna Judul di Kotak Gelap (Profil &amp; Kontak)
                        </label>
                        <p className="text-[11px] text-slate-600">
                          Berlaku untuk nama Anda di kotak profil kanan atas dan judul kotak kontak.
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {[
                            {name: 'Putih', hex: '#FFFFFF'},
                            {name: 'Biru Muda', hex: '#7DD3FC'},
                            {name: 'Kuning Emas', hex: '#FDE047'},
                            {name: 'Hijau Muda', hex: '#6EE7B7'},
                          ].map((sw) => (
                            <button
                              key={sw.hex}
                              type="button"
                              onClick={() => updateTheme({textHeadingDark: sw.hex})}
                              className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold transition-colors ${
                                currentTheme.textHeadingDark.toUpperCase() === sw.hex
                                  ? 'border-[#1D4ED8] bg-[#EFF6FF] text-[#1D4ED8]'
                                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <span
                                className="h-3 w-3 rounded-full border border-black/25"
                                style={{backgroundColor: sw.hex}}
                              />
                              <span>{sw.name}</span>
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="color"
                            value={normalizeHexColor(
                              currentTheme.textHeadingDark,
                              DEFAULT_THEME_CONFIG.textHeadingDark,
                            )}
                            onChange={(e) => updateTheme({textHeadingDark: e.target.value})}
                            className="h-9 w-11 cursor-pointer rounded border border-slate-300 bg-white p-0.5"
                          />
                          <input
                            type="text"
                            value={currentTheme.textHeadingDark}
                            onChange={(e) => updateTheme({textHeadingDark: e.target.value})}
                            className="h-9 flex-1 rounded-lg border border-slate-300 bg-white px-2.5 font-mono-tabular text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Plain-language Color Palette Controls */}
                  <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
                    <div>
                      <h3 className="font-display text-sm font-bold text-[#0B192C]">
                        4. Sesuaikan Warna Bagian Lainnya (Opsional)
                      </h3>
                      <p className="text-xs text-slate-600">
                        Klik kotak warna di sebelah kiri untuk memilih warna latar, paragraf, atau tombol.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {[
                        {
                          key: 'bgPage' as const,
                          label: 'Latar Belakang Halaman',
                          hint: 'Area dasar di belakang kotak-kotak konten',
                        },
                        {
                          key: 'bgSurface' as const,
                          label: 'Warna Kotak Konten',
                          hint: 'Kotak putih pengalaman & sertifikasi',
                        },
                        {
                          key: 'bgDark' as const,
                          label: 'Kotak Profil & Kontak (Gelap)',
                          hint: 'Kotak foto kanan atas & formulir kontak',
                        },
                        {
                          key: 'textPrimary' as const,
                          label: 'Warna Teks Isi Utama',
                          hint: 'Daftar tugas, angka ringkasan & isi teks',
                        },
                        {
                          key: 'textSecondary' as const,
                          label: 'Warna Teks Keterangan',
                          hint: 'Paragraf penjelasan dan rincian tugas',
                        },
                        {
                          key: 'brandAccent' as const,
                          label: 'Warna Tombol & Penanda Menu',
                          hint: 'Tombol penting & garis menu yang aktif',
                        },
                      ].map((field) => (
                        <div key={field.key} className="space-y-1">
                          <label className="block text-xs font-semibold text-slate-800">
                            {field.label}
                          </label>
                          <p className="text-[11px] text-slate-500">{field.hint}</p>
                          <div className="flex items-center gap-2 pt-0.5">
                            <input
                              type="color"
                              value={normalizeHexColor(
                                currentTheme[field.key],
                                DEFAULT_THEME_CONFIG[field.key],
                              )}
                              onChange={(e) => updateTheme({[field.key]: e.target.value})}
                              className="h-9 w-11 cursor-pointer rounded border border-slate-300 bg-white p-0.5"
                            />
                            <input
                              type="text"
                              value={currentTheme[field.key]}
                              onChange={(e) => updateTheme({[field.key]: e.target.value})}
                              className="h-9 flex-1 rounded-lg border border-slate-300 px-2.5 font-mono-tabular text-xs"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Optional Collapsible CSS Mode */}
                  <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="font-display text-sm font-bold text-[#0B192C]">
                          5. Pengaturan CSS Lanjutan (Khusus Jika Perlu)
                        </h3>
                        <p className="text-xs text-slate-600">
                          Tidak wajib diisi. Bagian ini hanya jika Anda ingin mengunduh file CSS
                          atau menambahkan aturan kode CSS sendiri.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={handleExportThemeCss}
                          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                        >
                          <Download className="h-3.5 w-3.5 text-[#1D4ED8]" />
                          <span>Unduh File CSS</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAdvancedCss((prev) => !prev)}
                          className="inline-flex min-h-[36px] items-center rounded-lg bg-slate-100 px-3 text-xs font-semibold text-slate-800 hover:bg-slate-200"
                        >
                          {showAdvancedCss ? 'Tutup Kode CSS' : 'Buka Editor CSS Manual'}
                        </button>
                      </div>
                    </div>

                    {showAdvancedCss && (
                      <div className="space-y-3 border-t border-slate-200 pt-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-medium text-slate-600">
                            Sisipkan contoh cepat:
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateTheme({
                                customCss: `${currentTheme.customCss ? `${currentTheme.customCss}\n` : ''}/* Garis pembatas kotak lebih tebal */\n.portfolio-surface { border-width: 2px; }`,
                              })
                            }
                            className="rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                          >
                            + Pertebal garis kotak
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateTheme({
                                customCss: `${currentTheme.customCss ? `${currentTheme.customCss}\n` : ''}/* Judul halaman lebih besar */\nh1 { font-size: 3rem !important; }`,
                              })
                            }
                            className="rounded-md border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
                          >
                            + Perbesar judul utama
                          </button>
                          {currentTheme.customCss && (
                            <button
                              type="button"
                              onClick={() => updateTheme({customCss: ''})}
                              className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 hover:bg-rose-100"
                            >
                              Hapus CSS Tambahan
                            </button>
                          )}
                        </div>
                        <textarea
                          rows={4}
                          value={currentTheme.customCss}
                          onChange={(e) => updateTheme({customCss: e.target.value})}
                          placeholder="Kosongkan saja jika tidak diperlukan. Perubahan warna & huruf di atas sudah otomatis berlaku."
                          className="w-full rounded-lg border border-slate-300 bg-slate-950 p-3 font-mono-tabular text-xs leading-relaxed text-sky-200 focus:border-[#1D4ED8] focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'publish' && (
                <div className="space-y-6">
                  <div className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-5 space-y-3">
                    <h3 className="font-display text-sm font-bold text-[#0B192C]">
                      Cara Membuka Tanpa Server &amp; Upload ke GitHub / Web Hosting
                    </h3>
                    <ol className="list-decimal space-y-1.5 pl-4 text-xs leading-relaxed text-slate-700">
                      <li>
                        <strong>Buka langsung tanpa server:</strong> Unduh <strong>1 File HTML</strong>{' '}
                        di bawah (atau ekstrak ZIP lalu klik dua kali <code className="font-mono">index.html</code>).
                        Bisa langsung dibuka di HP maupun laptop tanpa server/aplikasi tambahan.
                      </li>
                      <li>
                        <strong>Upload ke GitHub Pages / Hosting statis:</strong> Unggah seluruh isi
                        ZIP (<code className="font-mono">index.html</code>, <code className="font-mono">assets/</code>,{' '}
                        <code className="font-mono">portfolio-data.json</code>) ke repositori GitHub
                        Anda, lalu aktifkan Pages dari branch <code className="font-mono">main</code> (folder <code className="font-mono">/ (root)</code>).
                      </li>
                      <li>
                        <strong>Simpan perubahan teks/foto:</strong> Klik <strong>Simpan Perubahan</strong>,
                        unduh <code className="font-mono">portfolio-data.json</code>, lalu timpa file{' '}
                        <code className="font-mono">portfolio-data.json</code> di repositori Anda.
                      </li>
                    </ol>

                    <div className="flex flex-wrap gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleExportJson}
                        className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-[#0B192C] px-4 text-xs font-semibold text-white hover:bg-[#1E3A6E]"
                      >
                        <Download className="h-4 w-4" />
                        <span>Unduh portfolio-data.json</span>
                      </button>

                      {hasServerZips && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              handleDownloadAsset(
                                './downloads/portofolio-saif-al-daffa.html',
                                'portofolio-saif-al-daffa.html',
                              )
                            }
                            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-[#1D4ED8] px-4 text-xs font-semibold text-white hover:bg-[#1E40AF]"
                          >
                            <Download className="h-4 w-4" />
                            <span>Unduh 1 File HTML (Buka Tanpa Server)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDownloadAsset(
                                './downloads/saif-al-daffa-portofolio.zip',
                                'saif-al-daffa-portofolio.zip',
                              )
                            }
                            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                          >
                            <Download className="h-4 w-4 text-[#2563EB]" />
                            <span>Unduh Paket Lengkap (.ZIP)</span>
                          </button>
                        </>
                      )}

                      <label className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-800 hover:bg-slate-50">
                        <Upload className="h-4 w-4 text-[#2563EB]" />
                        <span>Impor File JSON Cadangan</span>
                        <input
                          type="file"
                          accept="application/json"
                          onChange={handleImportJson}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Change Admin PIN */}
                  <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                    <h3 className="font-display text-sm font-bold text-[#0B192C]">
                      Ubah PIN Admin Pribadi
                    </h3>
                    <div className="flex flex-wrap items-center gap-3">
                      <input
                        type="password"
                        value={newPinInput}
                        onChange={(e) => setNewPinInput(e.target.value)}
                        placeholder="PIN baru (min. 4 karakter)"
                        className="h-10 w-64 rounded-lg border border-slate-300 px-3 font-mono-tabular text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newPinInput.trim().length < 4) {
                            onToast('PIN baru minimal 4 karakter.');
                            return;
                          }
                          onUpdatePin(newPinInput.trim());
                          setNewPinInput('');
                          onToast('PIN Admin berhasil diperbarui.');
                        }}
                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[#2563EB] px-4 text-xs font-semibold text-white hover:bg-[#1D4ED8]"
                      >
                        <Check className="h-4 w-4" />
                        <span>Simpan PIN Baru</span>
                      </button>
                    </div>
                  </div>

                  {/* Reset Data */}
                  <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                      <h3 className="font-display text-sm font-bold text-rose-900">
                        Kembalikan ke Data Awal
                      </h3>
                      <p className="text-xs text-rose-700">
                        Menghapus suntingan lokal browser dan memulihkan data bawaan Saif Al Daffa.
                      </p>
                    </div>

                    {confirmReset ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            onResetDefault();
                            setConfirmReset(false);
                            onToast('Data dipulihkan ke setelan awal.');
                          }}
                          className="min-h-[38px] rounded-lg bg-rose-600 px-3.5 text-xs font-semibold text-white hover:bg-rose-700"
                        >
                          Ya, Reset Sekarang
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmReset(false)}
                          className="min-h-[38px] rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmReset(true)}
                        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 shrink-0"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Reset Bawaan</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Save Bar */}
            <div className="flex items-center justify-between gap-4 border-t border-slate-200 bg-[#F8FAFC] px-6 py-4">
              <span className="text-xs text-slate-500">
                Perubahan tersimpan aman di perangkat Anda sebelum diekspor.
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handleCommitDraft}
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[#2563EB] px-5 text-xs font-semibold text-white hover:bg-[#1D4ED8]"
                >
                  <Save className="h-4 w-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
