import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Award,
  Briefcase,
  Check,
  Copy,
  Download,
  FolderGit2,
  GraduationCap,
  Layers,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react';
import {
  CertificationItem,
  CompetencyDomain,
  DEFAULT_PORTFOLIO_STATE,
  ExperienceCategory,
  ExperienceItem,
  Language,
  PortfolioState,
} from '../../data/portfolioData';

export type EditorTab = 'profile' | 'experience' | 'skills' | 'education' | 'github';

interface PortfolioEditorModalProps {
  isOpen: boolean;
  initialTab?: EditorTab;
  state: PortfolioState;
  lang: Language;
  onSaveState: (next: PortfolioState) => void;
  onResetState: () => void;
  onNotify: (msg: string) => void;
  onClose: () => void;
}

export const PortfolioEditorModal: React.FC<PortfolioEditorModalProps> = ({
  isOpen,
  initialTab = 'profile',
  state,
  lang,
  onSaveState,
  onResetState,
  onNotify,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<EditorTab>(initialTab);
  const [draft, setDraft] = useState<PortfolioState>(state);
  const [editLang, setEditLang] = useState<Language>(lang);
  const [editingExpId, setEditingExpId] = useState<string | null>(null);
  const [editingDomainId, setEditingDomainId] = useState<string>(
    state.competencies[0]?.id || ''
  );
  const [isDownloadingZip, setIsDownloadingZip] = useState<boolean>(false);
  const [confirmReset, setConfirmReset] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setDraft(JSON.parse(JSON.stringify(state)) as PortfolioState);
      setActiveTab(initialTab);
      setEditLang(lang);
      setEditingDomainId(state.competencies[0]?.id || '');
      setEditingExpId(null);
      setConfirmReset(false);
    }
  }, [isOpen, initialTab, state, lang]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commitDraft = (next: PortfolioState, message?: string) => {
    setDraft(next);
    onSaveState(next);
    if (message) onNotify(message);
  };

  // Profile photo upload (stored as compressed data URL in localStorage/JSON)
  const handlePortraitUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const next = {
          ...draft,
          profile: { ...draft.profile, portraitSrc: reader.result },
        };
        commitDraft(next, 'Foto profil diperbarui.');
      }
    };
    reader.readAsDataURL(file);
  };

  // Experience handlers
  const handleAddExperience = () => {
    const newId = `exp-${Date.now()}`;
    const newItem: ExperienceItem = {
      id: newId,
      category: 'aviation',
      categoryLabel: { id: 'Pengalaman Baru', en: 'New Experience' },
      period: '2026',
      location: 'Surabaya',
      organization: 'Nama Perusahaan / Instansi',
      role: { id: 'Jabatan / Peran Baru', en: 'New Role / Position' },
      summary: {
        id: 'Tuliskan ringkasan singkat tanggung jawab dan dampak Anda.',
        en: 'Write a concise summary of your responsibilities and impact.',
      },
      highlights: {
        id: ['Poin tanggung jawab utama 1', 'Poin tanggung jawab utama 2'],
        en: ['Key responsibility 1', 'Key responsibility 2'],
      },
      systemsAndTools: ['Alat / Sistem 1', 'Standar / SOP'],
      keyOutcome: {
        id: 'Hasil utama yang dicapai.',
        en: 'Key measurable outcome.',
      },
    };
    const next = {
      ...draft,
      experiences: [newItem, ...draft.experiences],
    };
    commitDraft(next);
    setEditingExpId(newId);
  };

  const handleMoveExperience = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= draft.experiences.length) return;
    const updated = [...draft.experiences];
    const [removed] = updated.splice(index, 1);
    updated.splice(target, 0, removed);
    commitDraft({ ...draft, experiences: updated });
  };

  const handleDeleteExperience = (id: string) => {
    const updated = draft.experiences.filter((x) => x.id !== id);
    commitDraft({ ...draft, experiences: updated }, 'Pengalaman dihapus.');
    if (editingExpId === id) setEditingExpId(null);
  };

  const updateExperience = (id: string, patch: Partial<ExperienceItem>) => {
    const updated = draft.experiences.map((item) =>
      item.id === id ? { ...item, ...patch } : item
    );
    setDraft({ ...draft, experiences: updated });
  };

  // Competency handlers
  const handleAddDomain = () => {
    const newId = `domain-${Date.now()}`;
    const newDomain: CompetencyDomain = {
      id: newId,
      title: { id: 'Bidang Keahlian Baru', en: 'New Skill Domain' },
      subtitle: {
        id: 'Deskripsi singkat kompetensi di bidang ini.',
        en: 'Brief description of this skill domain.',
      },
      capabilities: {
        id: ['Kemampuan teknis atau prosedur 1'],
        en: ['Technical capability or procedure 1'],
      },
      specs: [{ code: 'STANDAR', detail: { id: 'Keterangan spesifikasi', en: 'Specification detail' } }],
    };
    const next = {
      ...draft,
      competencies: [...draft.competencies, newDomain],
    };
    commitDraft(next);
    setEditingDomainId(newId);
  };

  const updateDomain = (id: string, patch: Partial<CompetencyDomain>) => {
    const updated = draft.competencies.map((d) => (d.id === id ? { ...d, ...patch } : d));
    setDraft({ ...draft, competencies: updated });
  };

  // Certification handlers
  const handleAddCertification = () => {
    const newCert: CertificationItem = {
      id: `cert-${Date.now()}`,
      title: 'Nama Sertifikasi Baru',
      issuer: 'Lembaga Penerbit',
      domain: { id: 'Bidang Kompetensi', en: 'Competency Field' },
      yearOrContext: '2026',
    };
    commitDraft(
      { ...draft, certifications: [newCert, ...draft.certifications] },
      'Sertifikasi baru ditambahkan.'
    );
  };

  const updateCertification = (id: string, patch: Partial<CertificationItem>) => {
    const updated = draft.certifications.map((c) => (c.id === id ? { ...c, ...patch } : c));
    setDraft({ ...draft, certifications: updated });
  };

  const deleteCertification = (id: string) => {
    commitDraft(
      {
        ...draft,
        certifications: draft.certifications.filter((c) => c.id !== id),
      },
      'Sertifikasi dihapus.'
    );
  };

  // Export portfolio-data.json
  const handleExportJson = () => {
    const jsonString = JSON.stringify(draft, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'portfolio-data.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    onNotify('File portfolio-data.json diunduh. Unggah ke folder public/ di GitHub Anda.');
  };

  // Import portfolio-data.json
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as PortfolioState;
        if (!parsed || !parsed.profile || !Array.isArray(parsed.experiences)) {
          throw new Error('Format tidak valid');
        }
        commitDraft(parsed, 'Data portfolio-data.json berhasil dimuat.');
      } catch {
        onNotify('Gagal membaca file JSON. Pastikan formatnya berasal dari portfolio-data.json.');
      }
    };
    reader.readAsText(file);
  };

  // Download GitHub-ready ZIP
  const handleDownloadGithubZip = async () => {
    try {
      setIsDownloadingZip(true);
      const res = await fetch('portfolio-github.zip');
      if (!res.ok) throw new Error('ZIP not found');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'portfolio-saif-github.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      onNotify('Paket portfolio-saif-github.zip berhasil diunduh.');
    } catch {
      onNotify('Gagal mengunduh ZIP. Silakan salin tautan langsung di bawah.');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const directGithubZipUrl =
    typeof window !== 'undefined'
      ? new URL('portfolio-github.zip', window.location.href).href
      : 'portfolio-github.zip';

  const handleCopyZipLink = async () => {
    try {
      await navigator.clipboard.writeText(directGithubZipUrl);
      onNotify('Tautan portfolio-github.zip berhasil disalin.');
    } catch {
      onNotify('Salin manual tautan di kotak URL.');
    }
  };

  const activeEditingDomain =
    draft.competencies.find((d) => d.id === editingDomainId) || draft.competencies[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/65 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="editor-modal-title"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-5xl w-full h-[92vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-200 bg-[#F8FAFC] flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="editor-modal-title" className="font-display text-lg sm:text-xl font-bold text-[#0F1F3D]">
              Kelola &amp; Edit Portofolio
            </h2>
            <p className="text-xs text-slate-500">
              Revisi langsung pengalaman, skill, sertifikasi, lalu simpan atau ekspor ke GitHub.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Language fields toggle for bilingual fields */}
            <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-200/80 text-xs">
              <button
                type="button"
                onClick={() => setEditLang('id')}
                className={`px-2.5 py-1 rounded-md font-semibold ${
                  editLang === 'id' ? 'bg-white text-[#0F1F3D] shadow-xs' : 'text-slate-600'
                }`}
              >
                Teks ID
              </button>
              <button
                type="button"
                onClick={() => setEditLang('en')}
                className={`px-2.5 py-1 rounded-md font-semibold ${
                  editLang === 'en' ? 'bg-white text-[#0F1F3D] shadow-xs' : 'text-slate-600'
                }`}
              >
                Teks EN
              </button>
            </div>

            <button
              type="button"
              onClick={() => commitDraft(draft, 'Semua perubahan disimpan ke browser Anda.')}
              className="min-h-[38px] px-4 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup editor"
              className="min-h-[38px] min-w-[38px] rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Editor Navigation Tabs */}
        <div className="px-5 sm:px-6 py-2.5 border-b border-slate-200 bg-white flex flex-wrap gap-1.5 overflow-x-auto shrink-0">
          {[
            { id: 'profile' as EditorTab, label: 'Profil & Metrik', icon: User },
            { id: 'experience' as EditorTab, label: `Pengalaman (${draft.experiences.length})`, icon: Briefcase },
            { id: 'skills' as EditorTab, label: `Skill & Kompetensi (${draft.competencies.length})`, icon: Layers },
            { id: 'education' as EditorTab, label: `Pendidikan & Sertifikasi (${draft.certifications.length})`, icon: Award },
            { id: 'github' as EditorTab, label: 'Upload & Sinkron GitHub', icon: FolderGit2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#0F1F3D] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-[#F8FAFC] space-y-6 text-sm">
          {/* TAB 1: PROFILE & METRICS */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <h3 className="font-display font-bold text-base text-[#0F1F3D]">
                  Identitas &amp; Kontak Utama
                </h3>

                <div className="flex flex-wrap items-center gap-4 pb-4 border-b border-slate-100">
                  <img
                    src={draft.profile.portraitSrc}
                    alt={draft.profile.name}
                    className="w-16 h-16 rounded-xl object-cover object-top border border-slate-200 bg-slate-100"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="min-h-[38px] px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Ganti Foto Profil</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePortraitUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          profile: {
                            ...draft.profile,
                            portraitSrc: DEFAULT_PORTFOLIO_STATE.profile.portraitSrc,
                          },
                        })
                      }
                      className="min-h-[38px] px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-[#0F1F3D] border border-slate-200 bg-slate-50"
                    >
                      Kembalikan Foto CV
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Lengkap</label>
                    <input
                      type="text"
                      value={draft.profile.name}
                      onChange={(e) =>
                        setDraft({ ...draft, profile: { ...draft.profile, name: e.target.value } })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Domisili / Alamat</label>
                    <input
                      type="text"
                      value={draft.profile.location}
                      onChange={(e) =>
                        setDraft({ ...draft, profile: { ...draft.profile, location: e.target.value } })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                    <input
                      type="email"
                      value={draft.profile.email}
                      onChange={(e) =>
                        setDraft({ ...draft, profile: { ...draft.profile, email: e.target.value } })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nomor HP / WhatsApp</label>
                    <input
                      type="text"
                      value={draft.profile.phone}
                      onChange={(e) => {
                        const phone = e.target.value;
                        const digits = phone.replace(/\D/g, '').replace(/^0/, '62');
                        setDraft({
                          ...draft,
                          profile: { ...draft.profile, phone, phoneHref: `tel:+${digits}` },
                        });
                      }}
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">URL LinkedIn</label>
                    <input
                      type="url"
                      value={draft.profile.linkedinUrl}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          profile: { ...draft.profile, linkedinUrl: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Hero Copy */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-base text-[#0F1F3D]">
                    Ringkasan Hero ({editLang === 'id' ? 'Bahasa Indonesia' : 'English'})
                  </h3>
                  <span className="text-xs text-slate-500">Gunakan tombol Teks ID / Teks EN di atas</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Subjudul Bidang (Kicker)</label>
                    <input
                      type="text"
                      value={draft.hero.kicker[editLang]}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          hero: {
                            ...draft.hero,
                            kicker: { ...draft.hero.kicker, [editLang]: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Headline Utama</label>
                    <input
                      type="text"
                      value={draft.hero.headline[editLang]}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          hero: {
                            ...draft.hero,
                            headline: { ...draft.hero.headline, [editLang]: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Paragraf Ringkasan Profil</label>
                    <textarea
                      rows={3}
                      value={draft.hero.lead[editLang]}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          hero: {
                            ...draft.hero,
                            lead: { ...draft.hero.lead, [editLang]: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Status Ketersediaan</label>
                      <input
                        type="text"
                        value={draft.hero.dossierStatus[editLang]}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            hero: {
                              ...draft.hero,
                              dossierStatus: {
                                ...draft.hero.dossierStatus,
                                [editLang]: e.target.value,
                              },
                            },
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Ringkasan Pesawat</label>
                      <input
                        type="text"
                        value={draft.hero.aircraftSummary}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            hero: { ...draft.hero, aircraftSummary: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono-tabular"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Ringkasan EXIM</label>
                      <input
                        type="text"
                        value={draft.hero.eximSummary}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            hero: { ...draft.hero, eximSummary: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono-tabular"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 Metrics */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <h3 className="font-display font-bold text-base text-[#0F1F3D]">
                  4 Kartu Metrik Utama ({editLang.toUpperCase()})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {draft.metrics.map((metric, idx) => (
                    <div key={metric.id} className="p-3.5 rounded-lg border border-slate-200 bg-[#F8FAFC] space-y-2">
                      <input
                        type="text"
                        value={metric.value[editLang]}
                        onChange={(e) => {
                          const nextMetrics = draft.metrics.map((m, i) =>
                            i === idx
                              ? { ...m, value: { ...m.value, [editLang]: e.target.value } }
                              : m
                          );
                          setDraft({ ...draft, metrics: nextMetrics });
                        }}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-sm font-bold"
                        placeholder="Angka / Nilai"
                      />
                      <input
                        type="text"
                        value={metric.label[editLang]}
                        onChange={(e) => {
                          const nextMetrics = draft.metrics.map((m, i) =>
                            i === idx
                              ? { ...m, label: { ...m.label, [editLang]: e.target.value } }
                              : m
                          );
                          setDraft({ ...draft, metrics: nextMetrics });
                        }}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-xs font-semibold"
                        placeholder="Judul Metrik"
                      />
                      <input
                        type="text"
                        value={metric.detail[editLang]}
                        onChange={(e) => {
                          const nextMetrics = draft.metrics.map((m, i) =>
                            i === idx
                              ? { ...m, detail: { ...m.detail, [editLang]: e.target.value } }
                              : m
                          );
                          setDraft({ ...draft, metrics: nextMetrics });
                        }}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-300 bg-white text-xs"
                        placeholder="Keterangan singkat"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EXPERIENCE */}
          {activeTab === 'experience' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-slate-600">
                  Klik salah satu pengalaman untuk mengubah peran, perusahaan, poin tugas, atau menambah riwayat baru.
                </p>
                <button
                  type="button"
                  onClick={handleAddExperience}
                  className="min-h-[38px] px-4 py-1.5 rounded-lg bg-[#0F1F3D] hover:bg-[#1E3A6E] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Pengalaman</span>
                </button>
              </div>

              <div className="space-y-3">
                {draft.experiences.map((exp, idx) => {
                  const isExpanded = editingExpId === exp.id;
                  return (
                    <div
                      key={exp.id}
                      className="bg-white border border-slate-200 rounded-xl overflow-hidden"
                    >
                      <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3 bg-white">
                        <div className="min-w-0">
                          <p className="text-xs text-slate-500 font-mono-tabular">
                            {exp.period} · {exp.location}
                          </p>
                          <p className="font-display font-bold text-[#0F1F3D] text-sm sm:text-base truncate">
                            {exp.role[editLang]} — {exp.organization}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveExperience(idx, -1)}
                            disabled={idx === 0}
                            title="Pindah ke atas"
                            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-35"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveExperience(idx, 1)}
                            disabled={idx === draft.experiences.length - 1}
                            title="Pindah ke bawah"
                            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-35"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingExpId(isExpanded ? null : exp.id)}
                            className="min-h-[34px] px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-[#0F1F3D] hover:bg-slate-50"
                          >
                            {isExpanded ? 'Tutup Form' : 'Revisi'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteExperience(exp.id)}
                            title="Hapus"
                            className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-4 border-t border-slate-200 bg-[#F8FAFC] space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">Kategori Filter</label>
                              <select
                                value={exp.category}
                                onChange={(e) =>
                                  updateExperience(exp.id, {
                                    category: e.target.value as Exclude<ExperienceCategory, 'all'>,
                                  })
                                }
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs"
                              >
                                <option value="aviation">Aviasi &amp; Ground Ops</option>
                                <option value="exim">EXIM &amp; Gudang</option>
                                <option value="it">IT &amp; Layanan</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">Periode</label>
                              <input
                                type="text"
                                value={exp.period}
                                onChange={(e) => updateExperience(exp.id, { period: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">Lokasi</label>
                              <input
                                type="text"
                                value={exp.location}
                                onChange={(e) => updateExperience(exp.id, { location: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">
                                Nama Perusahaan / Lembaga
                              </label>
                              <input
                                type="text"
                                value={exp.organization}
                                onChange={(e) => updateExperience(exp.id, { organization: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">
                                Label Kategori ({editLang.toUpperCase()})
                              </label>
                              <input
                                type="text"
                                value={exp.categoryLabel[editLang]}
                                onChange={(e) =>
                                  updateExperience(exp.id, {
                                    categoryLabel: { ...exp.categoryLabel, [editLang]: e.target.value },
                                  })
                                }
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                              Jabatan / Posisi ({editLang.toUpperCase()})
                            </label>
                            <input
                              type="text"
                              value={exp.role[editLang]}
                              onChange={(e) =>
                                updateExperience(exp.id, {
                                  role: { ...exp.role, [editLang]: e.target.value },
                                })
                              }
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                              Ringkasan ({editLang.toUpperCase()})
                            </label>
                            <textarea
                              rows={2}
                              value={exp.summary[editLang]}
                              onChange={(e) =>
                                updateExperience(exp.id, {
                                  summary: { ...exp.summary, [editLang]: e.target.value },
                                })
                              }
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">
                              Poin Tanggung Jawab ({editLang.toUpperCase()} — satu poin per baris)
                            </label>
                            <textarea
                              rows={5}
                              value={exp.highlights[editLang].join('\n')}
                              onChange={(e) =>
                                updateExperience(exp.id, {
                                  highlights: {
                                    ...exp.highlights,
                                    [editLang]: e.target.value
                                      .split('\n')
                                      .map((line) => line.trim())
                                      .filter(Boolean),
                                  },
                                })
                              }
                              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs leading-relaxed"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">
                                Sistem &amp; Peralatan (satu item per baris)
                              </label>
                              <textarea
                                rows={3}
                                value={exp.systemsAndTools.join('\n')}
                                onChange={(e) =>
                                  updateExperience(exp.id, {
                                    systemsAndTools: e.target.value
                                      .split('\n')
                                      .map((line) => line.trim())
                                      .filter(Boolean),
                                  })
                                }
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-mono-tabular"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-600 mb-1">
                                Pencapaian Utama ({editLang.toUpperCase()})
                              </label>
                              <textarea
                                rows={3}
                                value={exp.keyOutcome[editLang]}
                                onChange={(e) =>
                                  updateExperience(exp.id, {
                                    keyOutcome: { ...exp.keyOutcome, [editLang]: e.target.value },
                                  })
                                }
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: SKILLS & COMPETENCY MATRIX */}
          {activeTab === 'skills' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {draft.competencies.map((dom) => (
                    <button
                      key={dom.id}
                      type="button"
                      onClick={() => setEditingDomainId(dom.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                        activeEditingDomain?.id === dom.id
                          ? 'bg-[#0F1F3D] text-white border-[#0F1F3D]'
                          : 'bg-white text-slate-700 border-slate-300'
                      }`}
                    >
                      {dom.title[editLang]}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddDomain}
                  className="min-h-[36px] px-3.5 py-1.5 rounded-lg bg-[#0F1F3D] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Bidang Skill</span>
                </button>
              </div>

              {activeEditingDomain && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-display font-bold text-base text-[#0F1F3D]">
                      Edit Bidang ({editLang.toUpperCase()})
                    </h3>
                    {draft.competencies.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const nextComps = draft.competencies.filter(
                            (d) => d.id !== activeEditingDomain.id
                          );
                          commitDraft({ ...draft, competencies: nextComps }, 'Bidang keahlian dihapus.');
                          setEditingDomainId(nextComps[0]?.id || '');
                        }}
                        className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-semibold inline-flex items-center gap-1 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Bidang Ini</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Judul Bidang ({editLang.toUpperCase()})
                      </label>
                      <input
                        type="text"
                        value={activeEditingDomain.title[editLang]}
                        onChange={(e) =>
                          updateDomain(activeEditingDomain.id, {
                            title: { ...activeEditingDomain.title, [editLang]: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Subjudul ({editLang.toUpperCase()})
                      </label>
                      <input
                        type="text"
                        value={activeEditingDomain.subtitle[editLang]}
                        onChange={(e) =>
                          updateDomain(activeEditingDomain.id, {
                            subtitle: { ...activeEditingDomain.subtitle, [editLang]: e.target.value },
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Daftar Skill / Kemampuan ({editLang.toUpperCase()} — satu per baris)
                    </label>
                    <textarea
                      rows={5}
                      value={activeEditingDomain.capabilities[editLang].join('\n')}
                      onChange={(e) =>
                        updateDomain(activeEditingDomain.id, {
                          capabilities: {
                            ...activeEditingDomain.capabilities,
                            [editLang]: e.target.value
                              .split('\n')
                              .map((l) => l.trim())
                              .filter(Boolean),
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs leading-relaxed"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-slate-600">
                        Spesifikasi Kode &amp; Perangkat ({editLang.toUpperCase()})
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          updateDomain(activeEditingDomain.id, {
                            specs: [
                              ...activeEditingDomain.specs,
                              {
                                code: 'KODE BARU',
                                detail: { id: 'Keterangan baru', en: 'New detail' },
                              },
                            ],
                          })
                        }
                        className="text-xs font-semibold text-[#2563EB] hover:underline"
                      >
                        + Tambah Spesifikasi
                      </button>
                    </div>

                    <div className="space-y-2">
                      {activeEditingDomain.specs.map((sp, sIdx) => (
                        <div key={sIdx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={sp.code}
                            onChange={(e) => {
                              const nextSpecs = activeEditingDomain.specs.map((item, i) =>
                                i === sIdx ? { ...item, code: e.target.value } : item
                              );
                              updateDomain(activeEditingDomain.id, { specs: nextSpecs });
                            }}
                            className="w-36 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono-tabular"
                            placeholder="KODE"
                          />
                          <input
                            type="text"
                            value={sp.detail[editLang]}
                            onChange={(e) => {
                              const nextSpecs = activeEditingDomain.specs.map((item, i) =>
                                i === sIdx
                                  ? {
                                      ...item,
                                      detail: { ...item.detail, [editLang]: e.target.value },
                                    }
                                  : item
                              );
                              updateDomain(activeEditingDomain.id, { specs: nextSpecs });
                            }}
                            className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                            placeholder="Keterangan"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const nextSpecs = activeEditingDomain.specs.filter((_, i) => i !== sIdx);
                              updateDomain(activeEditingDomain.id, { specs: nextSpecs });
                            }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: EDUCATION & CERTIFICATIONS */}
          {activeTab === 'education' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#0F1F3D]" />
                  <h3 className="font-display font-bold text-base text-[#0F1F3D]">
                    Pendidikan Terakhir ({editLang.toUpperCase()})
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Sekolah / Kampus</label>
                    <input
                      type="text"
                      value={draft.education.schoolName}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          education: { ...draft.education, schoolName: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Tahun &amp; Kota</label>
                    <input
                      type="text"
                      value={draft.education.schoolPeriod}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          education: { ...draft.education, schoolPeriod: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Jurusan ({editLang.toUpperCase()})
                    </label>
                    <input
                      type="text"
                      value={draft.education.major[editLang]}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          education: {
                            ...draft.education,
                            major: { ...draft.education.major, [editLang]: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Poin Prestasi / Aktivitas ({editLang.toUpperCase()} — satu per baris)
                    </label>
                    <textarea
                      rows={3}
                      value={draft.education.points[editLang].join('\n')}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          education: {
                            ...draft.education,
                            points: {
                              ...draft.education.points,
                              [editLang]: e.target.value
                                .split('\n')
                                .map((l) => l.trim())
                                .filter(Boolean),
                            },
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-base text-[#0F1F3D]">
                    Daftar Sertifikasi ({draft.certifications.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddCertification}
                    className="min-h-[36px] px-3.5 py-1.5 rounded-lg bg-[#0F1F3D] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Sertifikasi</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {draft.certifications.map((cert) => (
                    <div
                      key={cert.id}
                      className="bg-white border border-slate-200 rounded-xl p-4 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <input
                          type="text"
                          value={cert.title}
                          onChange={(e) => updateCertification(cert.id, { title: e.target.value })}
                          className="flex-1 px-2.5 py-1.5 rounded border border-slate-300 text-xs font-bold"
                          placeholder="Judul Sertifikasi"
                        />
                        <button
                          type="button"
                          onClick={() => deleteCertification(cert.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded border border-red-200 shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={cert.issuer}
                        onChange={(e) => updateCertification(cert.id, { issuer: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs"
                        placeholder="Lembaga Penerbit"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={cert.domain[editLang]}
                          onChange={(e) =>
                            updateCertification(cert.id, {
                              domain: { ...cert.domain, [editLang]: e.target.value },
                            })
                          }
                          className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs"
                          placeholder="Bidang"
                        />
                        <input
                          type="text"
                          value={cert.yearOrContext}
                          onChange={(e) =>
                            updateCertification(cert.id, { yearOrContext: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 rounded border border-slate-300 text-xs font-mono-tabular"
                          placeholder="Tahun / Lokasi"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: GITHUB DEPLOY & SYNC */}
          {activeTab === 'github' && (
            <div className="space-y-5">
              {/* Step 1: Download GitHub Ready Repo ZIP */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-display font-bold text-base text-[#0F1F3D]">
                      1. Unduh Paket Repository Siap Upload ke GitHub
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                      Sudah lengkap dengan kode sumber bersih, foto profil, CV PDF asli, konfigurasi path relatif GitHub Pages, dan workflow otomatis <code className="font-mono-tabular bg-slate-100 px-1 rounded">.github/workflows/deploy.yml</code>.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isDownloadingZip}
                    onClick={handleDownloadGithubZip}
                    className="min-h-[42px] px-4 py-2 rounded-lg bg-[#0F1F3D] hover:bg-[#1E3A6E] text-white text-xs font-semibold inline-flex items-center gap-2 shrink-0 disabled:opacity-60"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isDownloadingZip ? 'Mengunduh...' : 'Unduh portfolio-github.zip'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <input
                    type="text"
                    readOnly
                    value={directGithubZipUrl}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-[#F8FAFC] text-xs font-mono-tabular text-slate-700"
                  />
                  <button
                    type="button"
                    onClick={handleCopyZipLink}
                    className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Link</span>
                  </button>
                </div>
              </div>

              {/* Step 2: Sync edits permanently via portfolio-data.json */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                <div>
                  <h3 className="font-display font-bold text-base text-[#0F1F3D]">
                    2. Sinkronkan Revisi Anda Secara Permanen ke GitHub
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Perubahan yang Anda buat di editor tersimpan otomatis di browser ini. Agar perekrut/pengunjung lain di link GitHub Pages juga melihat hasil revisi terbaru Anda, unduh file <code className="font-mono-tabular bg-slate-100 px-1 rounded">portfolio-data.json</code> di bawah ini lalu ganti file <code className="font-mono-tabular bg-slate-100 px-1 rounded">public/portfolio-data.json</code> di repository GitHub Anda.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="min-h-[40px] px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold inline-flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Unduh portfolio-data.json (Hasil Revisi)</span>
                  </button>

                  <label className="min-h-[40px] px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-2 cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <span>Muat dari file JSON</span>
                    <input
                      type="file"
                      accept="application/json,.json"
                      onChange={handleImportJson}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Step 3: GitHub Pages quick guide & Reset */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
                <h3 className="font-display font-bold text-sm text-[#0F1F3D]">
                  Panduan Cepat Upload ke GitHub &amp; Aktifkan GitHub Pages
                </h3>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600 leading-relaxed">
                  <li>
                    Ekstrak <code className="font-mono-tabular">portfolio-github.zip</code>, lalu buat repository baru di GitHub (contoh: <code className="font-mono-tabular">portofolio-saif</code>).
                  </li>
                  <li>
                    Upload seluruh isi folder (termasuk folder <code className="font-mono-tabular">.github</code>, <code className="font-mono-tabular">src</code>, dan <code className="font-mono-tabular">public</code>) ke branch <code className="font-mono-tabular">main</code>.
                  </li>
                  <li>
                    Buka menu <strong>Settings → Pages</strong> di repository GitHub Anda, lalu ubah <strong>Source</strong> menjadi <strong>GitHub Actions</strong>.
                  </li>
                  <li>
                    Tunggu ~1 menit sampai workflow selesai, dan portofolio Anda aktif 24 jam secara gratis di <code className="font-mono-tabular">https://username.github.io/portofolio-saif/</code>.
                  </li>
                </ol>

                <div className="pt-4 mt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">
                    Ingin mengembalikan semua teks &amp; daftar ke isi CV awal?
                  </span>
                  {!confirmReset ? (
                    <button
                      type="button"
                      onClick={() => setConfirmReset(true)}
                      className="min-h-[36px] px-3.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset ke Data CV Awal</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onResetState();
                          setDraft(JSON.parse(JSON.stringify(DEFAULT_PORTFOLIO_STATE)));
                          setConfirmReset(false);
                        }}
                        className="min-h-[36px] px-3.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Ya, Reset Sekarang</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmReset(false)}
                        className="min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700"
                      >
                        Batal
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Footer Bar */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            Tips: Klik <strong>Simpan</strong> untuk melihat perubahan langsung, lalu ekspor <code className="font-mono-tabular">portfolio-data.json</code> saat update ke GitHub.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[38px] px-4 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={() => {
                commitDraft(draft, 'Perubahan portofolio berhasil disimpan.');
                onClose();
              }}
              className="min-h-[38px] px-4 py-1.5 rounded-lg bg-[#0F1F3D] hover:bg-[#1E3A6E] text-white text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan &amp; Terapkan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
