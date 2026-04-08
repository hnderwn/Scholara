import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useExam } from '../../context/ExamContext';
import { db } from '../../lib/supabase';
import { localDB } from '../../utils/indexedDB';

// ── Shield Icon ──
const ShieldIcon = ({ size = 32 }) => (
  <svg width={size} height={size * 1.17} viewBox="0 0 36 42" fill="none">
    <path d="M18 2L3 8V22C3 31 10 38.5 18 41C26 38.5 33 31 33 22V8L18 2Z" fill="#0A2463" stroke="#C9A84C" strokeWidth="1.5" />
    <path d="M18 7L7 12V22C7 28.5 12 34 18 36C24 34 29 28.5 29 22V12L18 7Z" fill="none" stroke="rgba(201,168,76,0.4)" strokeWidth="0.8" />
    <line x1="18" y1="11" x2="18" y2="33" stroke="#C9A84C" strokeWidth="1.2" opacity="0.8" />
    <line x1="9" y1="20" x2="27" y2="20" stroke="#C9A84C" strokeWidth="1.2" opacity="0.8" />
    <circle cx="18" cy="20" r="2.5" fill="#C9A84C" opacity="0.9" />
  </svg>
);

// ── Reusable dividers ──
const RedRule = ({ opacity = 1 }) => <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,#BF0A30 25%,#BF0A30 75%,transparent)', opacity }} />;
const GoldRule = ({ opacity = 1 }) => <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,#C8B99A 30%,#C8B99A 70%,transparent)', opacity }} />;

// ── Skill latihan icons ──
const SKILL_ICONS = {
  Grammar: '📝',
  Vocabulary: '📚',
  Reading: '👁️',
  Cloze: '✏️',
  Daily: '⚡',
};

// ── Score badge color ──
const scoreBadge = (score) => {
  if (score >= 80) return { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0', label: 'Sangat Baik' };
  if (score >= 60) return { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A', label: 'Baik' };
  return { bg: '#FFF1F2', color: '#BF0A30', border: '#FECDD3', label: 'Perlu ↑' };
};

// ─────────────────────────────────────────────────
// DATA PAKET UJIAN (tidak diubah dari kode asli)
// ─────────────────────────────────────────────────
const examPackages = [
  {
    id: 'kickstart_diagnostic',
    name: 'Kickstart Diagnostic',
    uniqueName: 'The Level Check',
    description: 'Paket lengkap (Mixed Difficulty) untuk profil awal.',
    duration: 60,
    questions: 50,
    category: 'Diagnostic',
    type: 'ujian',
  },
  {
    id: 'basic_mastery',
    name: 'Basic Mastery',
    uniqueName: 'Level A1-A2',
    description: 'Fokus pada penguasaan materi dasar.',
    duration: 40,
    questions: 30,
    category: 'Basic',
    type: 'ujian',
  },
  {
    id: 'intermediate_path',
    name: 'Intermediate Path',
    uniqueName: 'Level B1-B2',
    description: 'Fokus pada pemahaman konteks menengah.',
    duration: 45,
    questions: 30,
    category: 'Intermediate',
    type: 'ujian',
  },
  {
    id: 'advanced_pro',
    name: 'Advanced Pro',
    uniqueName: 'Level C1-C2',
    description: 'Tantangan tingkat tinggi & akademik.',
    duration: 50,
    questions: 30,
    category: 'Advanced',
    type: 'ujian',
  },
  {
    id: 'daily_speed_check',
    name: 'Daily Speed-Check',
    uniqueName: 'Morning Brew',
    description: 'Versi lite Kickstart untuk rutinitas harian.',
    duration: 20,
    questions: 15,
    category: 'Daily',
    type: 'latihan',
  },
  {
    id: 'grammar_master',
    name: 'Grammar Master',
    uniqueName: 'Skill: Grammar',
    description: 'Fokus 100% pada struktur dan tata bahasa.',
    duration: 25,
    questions: 20,
    category: 'Skill',
    type: 'latihan',
  },
  {
    id: 'vocab_power',
    name: 'Vocab Power',
    uniqueName: 'Skill: Vocabulary',
    description: 'Fokus 100% pada kosakata dan makna kata.',
    duration: 25,
    questions: 20,
    category: 'Skill',
    type: 'latihan',
  },
  {
    id: 'reading_pro',
    name: 'Reading Pro',
    uniqueName: 'Skill: Reading',
    description: 'Fokus 100% pada pemahaman bacaan.',
    duration: 30,
    questions: 15,
    category: 'Skill',
    type: 'latihan',
  },
  {
    id: 'cloze_challenge',
    name: 'Cloze Challenge',
    uniqueName: 'Skill: Cloze',
    description: 'Fokus 100% pada pengisian teks rumpang.',
    duration: 25,
    questions: 20,
    category: 'Skill',
    type: 'latihan',
  },
];

// ─────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();
  const { profile, isAdmin, signOut } = useAuth();
  const { clearExam } = useExam();

  // ── Semua state asli tidak diubah ──
  const [stats, setStats] = useState({ totalExams: 0, averageScore: 0, lastExamDate: null });
  const [examHistory, setExamHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initDashboard = async () => {
      // Jika profile?.id tidak ada (belum komplit ter-load dari context)
      // Kita langsung set loading false agar UI tidak mem-block selamanya
      if (!profile?.id) {
        console.log('Dashboard: profile.id belum siap. Loading -> false');
        if (mounted) setLoading(false);
        return;
      }

      await loadDashboardData();
    };

    initDashboard();
    clearExam();

    // Sync queued results if online
    if (navigator.onLine) {
      syncQueuedResults();
    }

    const handleOnline = () => syncQueuedResults();
    window.addEventListener('online', handleOnline);

    // Safety timeout untuk memastikan tidak stuck di loading
    const safetyTimer = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Dashboard: Terlalu lama memuat data, memaksa tampil.');
        setLoading(false);
      }
    }, 5000); // 5 detik maksimal loading

    return () => {
      mounted = false;
      window.removeEventListener('online', handleOnline);
      clearTimeout(safetyTimer);
    };
  }, [profile?.id]);

  // ── Semua fungsi asli tidak diubah ──
  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Jika offline, andalkan data yang mungkin sudah ada di state (atau cache)
      if (!navigator.onLine) {
        console.log('Dashboard: Offline mode, using existing state');
        return;
      }

      const { data, error } = await db.getExamResults(profile?.id);
      if (error) throw error;
      if (data && data.length > 0) {
        setExamHistory(data.slice(0, 5));
        const totalExams = data.length;
        const totalScore = data.reduce((sum, exam) => sum + exam.score_total, 0);
        const averageScore = Math.round(totalScore / totalExams);
        const lastExamDate = data[0].created_at;
        setStats({ totalExams, averageScore, lastExamDate });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      // Pastikan setLoading dipanggil terlepas dari error atau return awal
      setLoading(false);
    }
  };

  const syncQueuedResults = async () => {
    if (!navigator.onLine) return;

    try {
      const queued = await localDB.getQueuedResults();
      if (queued.length === 0) return;

      console.log(`Dashboard: Syncing ${queued.length} queued results...`);

      for (const result of queued) {
        // Hapus metadata IndexedDB sebelum simpan ke Supabase
        const { id: queueId, status: queueStatus, ...payload } = result;
        const { error } = await db.saveExamResult(payload);
        if (!error) {
          await localDB.removeQueuedResult(queueId);
        }
      }

      // Refresh dashboard data after sync
      loadDashboardData();
    } catch (error) {
      console.error('Dashboard: Sync failed', error);
    }
  };

  const startExam = (packageId) => {
    const pkg = examPackages.find((p) => p.id === packageId);
    if (!navigator.onLine && pkg.type === 'ujian') {
      alert('Maaf, paket ujian ini membutuhkan koneksi internet. Silakan beralih ke menu Kamus atau Latihan Harian.');
      return;
    }
    navigate(`/siswa/exam?paket=${packageId}`);
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  // ── Derived data untuk rekomendasi (dari examHistory) ──
  // Simulasi weak topics dari history — di production bisa dari field breakdown score
  const weakTopics =
    examHistory.length > 0
      ? examPackages
          .filter((p) => p.type === 'latihan' && p.category === 'Skill')
          .slice(0, 2)
          .map((p) => ({ ...p, weakScore: Math.floor(Math.random() * 30) + 40 }))
      : [];

  // Streak simulasi — di production dari data harian user
  const streak = 7;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F2ECD8' }}>
        <div className="text-center">
          <ShieldIcon size={40} />
          <p className="mt-4 text-lg italic" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
            Memuat dashboard...
          </p>
        </div>
      </div>
    );
  }

  // ── Package card untuk ujian (non-diagnostic) ──
  const PackageCard = ({ pkg }) => (
    <div
      className="flex items-start justify-between p-5 rounded-sm transition-all duration-200 hover:-translate-y-0.5 group"
      style={{ background: '#FAF6EC', border: '1px solid #C8B99A', boxShadow: '0 1px 3px rgba(10,36,99,0.06)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#1A4FAD';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(10,36,99,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#C8B99A';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(10,36,99,0.06)';
      }}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h3 className="font-bold text-base" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
            {pkg.name}
          </h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm" style={{ background: 'rgba(10,36,99,0.06)', color: '#0A2463', border: '1px solid rgba(10,36,99,0.15)' }}>
            {pkg.uniqueName}
          </span>
        </div>
        <p className="text-xs mb-3" style={{ color: '#6B5A42' }}>
          {pkg.description}
        </p>
        <div className="flex items-center gap-4 text-xs" style={{ color: '#6B5A42' }}>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {pkg.duration}m
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {pkg.questions} soal
          </span>
        </div>
      </div>
      <button
        onClick={() => startExam(pkg.id)}
        className="ml-4 flex-shrink-0 px-4 py-2 text-xs font-bold rounded-sm text-white transition-all"
        style={{ background: '#1A4FAD' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#2460C8';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = '#1A4FAD';
          e.currentTarget.style.transform = 'none';
        }}
      >
        Mulai
      </button>
    </div>
  );

  // ── Compact card untuk latihan ──
  const SkillCard = ({ pkg }) => {
    const skillKey = Object.keys(SKILL_ICONS).find((k) => pkg.uniqueName.includes(k)) || 'Daily';
    return (
      <div
        onClick={() => startExam(pkg.id)}
        className="p-4 rounded-sm cursor-pointer transition-all duration-200 hover:-translate-y-0.5 flex flex-col gap-2"
        style={{ background: '#FAF6EC', border: '1px solid #C8B99A' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#1A4FAD';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(10,36,99,0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#C8B99A';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xl">{SKILL_ICONS[skillKey]}</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm" style={{ background: '#EDE4CC', color: '#6B5A42', border: '1px solid #C8B99A' }}>
            {pkg.duration}m
          </span>
        </div>
        <div>
          <p className="text-sm font-bold" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
            {pkg.name}
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: '#6B5A42' }}>
            {pkg.questions} soal
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pb-12" style={{ backgroundColor: '#F2ECD8', fontFamily: "'DM Sans',sans-serif" }}>
      {/* ══════════ HEADER ══════════ */}
      <header
        className="sticky top-0 z-40"
        style={{
          backgroundColor: '#0A2463',
          backgroundImage: `
          repeating-linear-gradient(0deg,  rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 36px),
          repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 36px)
        `,
          boxShadow: '0 4px 20px rgba(10,36,99,0.3)',
        }}
      >
        <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,#C9A84C 25%,#C9A84C 75%,transparent)' }} />

        <div className="max-w-6xl mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            {/* Left: Logo + greeting */}
            <div className="flex items-center gap-2 md:gap-3">
              <ShieldIcon size={28} />
              <div className="min-w-0">
                <h1 className="text-white font-bold text-base md:text-lg leading-none truncate" style={{ fontFamily: "'Cormorant Garamond',serif" }}>
                  Halo, {profile?.full_name?.split(' ')[0]}!
                </h1>
                <p className="text-[10px] md:text-xs mt-0.5 italic truncate" style={{ color: '#C9A84C', fontFamily: "'IM Fell English',serif" }}>
                  {profile?.school}
                </p>
              </div>
            </div>

            {/* Right: Streak + Offline Badge + Desktop Actions */}
            <div className="flex items-center gap-2 md:gap-4">
              {/* Offline Badge (Compact on mobile) */}
              {!navigator.onLine && (
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 rounded-sm">
                  <span className="animate-pulse w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span className="text-[8px] md:text-[10px] font-bold text-amber-500 uppercase tracking-widest">Offline</span>
                </div>
              )}

              {/* Streak badge */}
              <div className="flex items-center gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-sm" style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)' }}>
                <span className="text-sm md:text-base">🔥</span>
                <span className="text-white font-bold text-xs md:text-sm">{streak}</span>
              </div>

              {/* Desktop-only Actions */}
              <div className="hidden md:flex items-stretch gap-3">
                <button
                  onClick={() => navigate('/siswa/dictionary')}
                  className="px-3 py-2 text-xs font-bold rounded-sm transition-all flex items-center gap-1.5"
                  style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
                >
                  <span>📖</span> Kamus
                </button>

                <button
                  onClick={() => navigate('/siswa/profile')}
                  className="px-3 py-1.5 text-xs font-bold rounded-sm transition-all flex items-center gap-1.5"
                  style={{ color: '#0A2463', border: '1px solid #C8B99A', background: '#EDE4CC' }}
                >
                  <span>👤</span> Profil
                </button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,#BF0A30 25%,#BF0A30 75%,transparent)' }} />
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* ══════════ HERO — KICKSTART DIAGNOSTIC ══════════ */}
        <section
          className="rounded-sm overflow-hidden relative"
          style={{
            background: '#0A2463',
            backgroundImage: `
              repeating-linear-gradient(0deg,  rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 40px),
              repeating-linear-gradient(90deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 40px)
            `,
            border: '1px solid #C9A84C',
            boxShadow: '0 8px 32px rgba(10,36,99,0.25)',
          }}
        >
          {/* Gold corner ornaments */}
          <div className="absolute top-0 left-0 w-8 md:w-12 h-8 md:h-12 border-t-2 border-l-2 border-gold opacity-40" style={{ borderColor: '#C9A84C' }} />
          <div className="absolute top-0 right-0 w-8 md:w-12 h-8 md:h-12 border-t-2 border-r-2 opacity-40" style={{ borderColor: '#C9A84C' }} />
          <div className="absolute bottom-0 left-0 w-8 md:w-12 h-8 md:h-12 border-b-2 border-l-2 opacity-40" style={{ borderColor: '#C9A84C' }} />
          <div className="absolute bottom-0 right-0 w-8 md:w-12 h-8 md:h-12 border-b-2 border-r-2 opacity-40" style={{ borderColor: '#C9A84C' }} />

          <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,#C9A84C 25%,#C9A84C 75%,transparent)' }} />

          <div className="px-5 md:px-8 py-8 md:py-10 relative z-10">
            <div className="flex flex-col lg:flex-row items-center lg:items-center justify-between gap-6 md:gap-8 text-center lg:text-left">
              {/* Left content */}
              <div className="flex-1 flex flex-col items-center lg:items-start">
                {/* Label */}
                <div className="flex items-center gap-2 mb-3 md:mb-4">
                  <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest px-2 md:py-1 rounded-sm" style={{ background: 'rgba(191,10,48,0.8)', color: '#fff' }}>
                    ✦ Mulai Di Sini
                  </span>
                </div>

                <h2 className="text-white text-2xl md:text-4xl font-bold leading-tight mb-1" style={{ fontFamily: "'Cormorant Garamond',serif" }}>
                  Kickstart Diagnostic
                </h2>
                <p className="text-xs md:text-base italic mb-4 md:mb-1" style={{ fontFamily: "'IM Fell English',serif", color: '#C9A84C' }}>
                  "The Level Check"
                </p>
                <p className="hidden md:block text-sm leading-relaxed mb-6 max-w-lg" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Tes komprehensif untuk mengukur kemampuan awal dan membentuk profil belajarmu.
                </p>

                {/* Meta info */}
                <div className="flex items-center gap-4 md:gap-6 mb-6 md:mb-8">
                  {[
                    { icon: '🕒', label: '60m' },
                    { icon: '📄', label: '50 soal' },
                    { icon: '📊', label: 'Mixed' },
                  ].map(({ icon, label }) => (
                    <div key={label} className="flex items-center gap-1.5 md:gap-2">
                      <span className="text-sm md:text-base">{icon}</span>
                      <span className="text-[11px] md:text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button
                  onClick={() => startExam('kickstart_diagnostic')}
                  className={`w-full md:w-auto px-6 md:px-8 py-3 md:py-3.5 text-xs md:text-sm font-bold rounded-sm transition-all flex items-center justify-center gap-2 ${!navigator.onLine ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                  style={{ background: '#1A4FAD', color: '#fff', boxShadow: !navigator.onLine ? 'none' : '0 4px 16px rgba(26,79,173,0.4)' }}
                  disabled={!navigator.onLine}
                >
                  {!navigator.onLine ? 'Butuh Koneksi Internet' : 'Mulai Diagnostic'}
                </button>
              </div>

              {/* Right: decorative crest (hidden small mobile) */}
              <div className="hidden md:flex flex-col items-center gap-3 opacity-20">
                <ShieldIcon size={120} />
              </div>
            </div>
          </div>

          <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,#C9A84C 25%,#C9A84C 75%,transparent)' }} />
        </section>

        {/* ══════════ STATS BAR ══════════ */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {[
            { label: 'Ujian Dikerjakan', value: stats.totalExams, icon: '📝', suffix: 'x' },
            { label: 'Rata-rata Skor', value: stats.averageScore, icon: '⭐', suffix: '%' },
            {
              label: 'Terakhir Ujian',
              value: stats.lastExamDate ? formatDate(stats.lastExamDate) : 'Belum ada',
              icon: '📅',
              suffix: '',
              isDate: true,
              span: 'col-span-2 md:col-span-1',
            },
          ].map(({ label, value, icon, suffix, isDate, span = '' }) => (
            <div key={label} className={`rounded-sm p-3 md:p-5 flex items-center gap-3 md:gap-4 ${span}`} style={{ background: '#FAF6EC', border: '1px solid #C8B99A' }}>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-sm flex items-center justify-center flex-shrink-0 text-lg md:text-xl" style={{ background: '#EDE4CC' }}>
                {icon}
              </div>
              <div className="min-w-0">
                <p className="text-[9px] md:text-[11px] font-bold uppercase tracking-wider truncate" style={{ color: '#6B5A42' }}>
                  {label}
                </p>
                <p className="font-bold mt-0.5 truncate" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463', fontSize: isDate ? (span ? 12 : 11) : 20 }}>
                  <span className="md:text-2xl">{value}</span>
                  <span className="text-[10px] md:text-xs ml-0.5">{suffix}</span>
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ══════════ REKOMENDASI TOPIK LEMAH ══════════ */}
        {weakTopics.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-base">⚠️</span>
              <h2 className="font-bold text-base" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463', fontSize: 18 }}>
                Rekomendasi Topik yang Perlu Ditingkatkan
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {weakTopics.map((topic) => (
                <div key={topic.id} className="rounded-sm p-5 flex items-center justify-between" style={{ background: '#FAF6EC', border: '1px solid #C8B99A', borderLeft: '4px solid #BF0A30' }}>
                  <div>
                    <p className="font-bold text-base" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
                      {topic.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#6B5A42' }}>
                      {topic.description}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="h-1.5 w-28 rounded-full overflow-hidden" style={{ background: '#EDE4CC' }}>
                        <div className="h-full rounded-full" style={{ width: `${topic.weakScore}%`, background: '#BF0A30' }} />
                      </div>
                      <span className="text-[11px] font-bold" style={{ color: '#BF0A30' }}>
                        {topic.weakScore}%
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => startExam(topic.id)}
                    className="ml-4 px-4 py-2 text-xs font-bold rounded-sm flex-shrink-0 transition-all"
                    style={{ background: '#BF0A30', color: '#fff' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#D41035')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#BF0A30')}
                  >
                    Latihan →
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ══════════ MAIN CONTENT GRID ══════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: Paket Ujian + Latihan */}
          <div className="lg:col-span-2 space-y-8">
            {/* Ujian */}
            <section>
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4" fill="none" stroke="#1A4FAD" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="font-bold" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463', fontSize: 18 }}>
                  Ujian — Diagnostic & Proficiency
                </h2>
              </div>
              <GoldRule opacity={0.6} />
              <div className="space-y-3 mt-4">
                {examPackages
                  .filter((p) => p.type === 'ujian' && p.id !== 'kickstart_diagnostic')
                  .map((pkg) => (
                    <PackageCard key={pkg.id} pkg={pkg} />
                  ))}
              </div>
            </section>

            {/* Latihan */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="#BF0A30" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h2 className="font-bold" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463', fontSize: 18 }}>
                    Latihan — Daily & Focused
                  </h2>
                </div>
                <span className="md:hidden text-[10px] font-bold text-crimson animate-pulse">Geser ➜</span>
              </div>
              <GoldRule opacity={0.6} />
              <div className="flex md:grid md:grid-cols-3 gap-3 mt-4 overflow-x-auto pb-4 md:pb-0 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                {examPackages
                  .filter((p) => p.type === 'latihan')
                  .map((pkg) => (
                    <div key={pkg.id} className="min-w-[140px] md:min-w-0 flex-1">
                      <SkillCard pkg={pkg} />
                    </div>
                  ))}
              </div>
            </section>
          </div>

          {/* RIGHT: Riwayat Tryout */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4" fill="none" stroke="#C9A84C" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="font-bold" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463', fontSize: 18 }}>
                Riwayat Tryout
              </h2>
            </div>
            <GoldRule opacity={0.6} />

            <div className="space-y-3 mt-4">
              {examHistory.length > 0 ? (
                examHistory.map((exam) => {
                  const badge = scoreBadge(exam.score_total);
                  return (
                    <div key={exam.id} className="rounded-sm p-4 flex items-center justify-between" style={{ background: '#FAF6EC', border: '1px solid #C8B99A' }}>
                      <div>
                        <p className="font-bold text-base" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
                          {exam.score_total}
                          <span className="text-sm font-normal" style={{ color: '#6B5A42' }}>
                            /100
                          </span>
                        </p>
                        <p className="text-[11px] mt-0.5" style={{ color: '#6B5A42' }}>
                          {formatDate(exam.created_at)}
                        </p>
                      </div>
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-sm" style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                        {badge.label}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-sm p-8 text-center" style={{ background: '#FAF6EC', border: '1px solid #C8B99A' }}>
                  <p className="text-3xl mb-3 opacity-30">📋</p>
                  <p className="text-sm italic" style={{ fontFamily: "'IM Fell English',serif", color: '#6B5A42' }}>
                    Belum ada riwayat tryout
                  </p>
                  <p className="text-xs mt-1" style={{ color: '#A8946C' }}>
                    Mulai dengan Kickstart Diagnostic di atas!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
