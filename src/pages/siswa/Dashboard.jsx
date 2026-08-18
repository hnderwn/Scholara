import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useExam } from '../../context/ExamContext';
import { db } from '../../lib/supabase';
import { localDB } from '../../utils/indexedDB';
import { calculateSAWPriority } from '../../lib/saw';
import ConfirmModal from '../../components/ui/ConfirmModal';
import StudentReportModal from '../../components/siswa/StudentReportModal';
import SkillCompetencyMap from '../../components/siswa/SkillCompetencyMap';
import WeakTopicRecommendations from '../../components/siswa/WeakTopicRecommendations';
import { exportToPDF, exportCombinedStudentResultsPDF } from '../../utils/export';

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
    minCefr: 'A1'
  },
  {
    id: 'basic_mastery',
    name: 'Basic Mastery',
    uniqueName: 'Level A1',
    description: 'Fokus pada penguasaan materi dasar.',
    duration: 60,
    questions: 50,
    category: 'Basic',
    type: 'ujian',
    minCefr: 'A1'
  },
  {
    id: 'pre_intermediate',
    name: 'Pre-Intermediate Bridge',
    uniqueName: 'Level A2',
    description: 'Menjembatani ke pemahaman konteks harian.',
    duration: 60,
    questions: 50,
    category: 'Basic',
    type: 'ujian',
    minCefr: 'A2'
  },
  {
    id: 'intermediate_path',
    name: 'Intermediate Path',
    uniqueName: 'Level B1',
    description: 'Fokus pada pemahaman konteks menengah.',
    duration: 65,
    questions: 50,
    category: 'Intermediate',
    type: 'ujian',
    minCefr: 'B1'
  },
  {
    id: 'upper_intermediate',
    name: 'Upper-Intermediate Flight',
    uniqueName: 'Level B2',
    description: 'Fokus pada ekspresi dan argumen kompleks.',
    duration: 65,
    questions: 50,
    category: 'Intermediate',
    type: 'ujian',
    minCefr: 'B2'
  },
  {
    id: 'advanced_pro',
    name: 'Advanced Pro',
    uniqueName: 'Level C1-C2',
    description: 'Tantangan tingkat tinggi & akademik.',
    duration: 70,
    questions: 50,
    category: 'Advanced',
    type: 'ujian',
    minCefr: 'C1/C2'
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
  const { profile, updateLocalProfile } = useAuth();
  const { clearExam } = useExam();

  const [stats, setStats] = useState({ totalExams: 0, averageScore: 0, lastExamDate: null });
  const [tryoutHistory, setTryoutHistory] = useState([]);
  const [practiceHistory, setPracticeHistory] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [skillProficiency, setSkillProficiency] = useState({ grammar: 0, vocab: 0, reading: 0, cloze: 0 });
  const [loading, setLoading] = useState(true);
  const [weakTopics, setWeakTopics] = useState([]);
  const [isLatihanExpanded, setIsLatihanExpanded] = useState(true);
  const [historyFilter, setHistoryFilter] = useState('Semua');
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmVariant: 'primary',
    onConfirm: () => {},
  });
  const [hasDiagnostic, setHasDiagnostic] = useState(false);
  const [isPrintDropdownOpen, setIsPrintDropdownOpen] = useState(false);

  useEffect(() => {
    const closeDropdown = () => setIsPrintDropdownOpen(false);
    window.addEventListener('click', closeDropdown);
    return () => window.removeEventListener('click', closeDropdown);
  }, []);

  const handleExportAllExams = () => {
    if (tryoutHistory.length === 0) return;
    
    exportCombinedStudentResultsPDF(
      `LAPORAN RIWAYAT UJIAN - ${profile?.full_name?.toUpperCase()}`,
      tryoutHistory,
      `Riwayat_Ujian_${profile?.full_name?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
    );
  };

  const handleExportAllPractices = () => {
    if (practiceHistory.length === 0) return;
    const columns = ['Kategori Skill', 'Nilai Skor', 'Status Kelulusan', 'Tanggal'];
    const packageNames = {
      grammar_master: 'Grammar',
      vocab_power: 'Vocabulary',
      reading_pro: 'Reading',
      cloze_challenge: 'Cloze'
    };

    const getPracticeScore = (catKey, exam) => {
      const catData = exam.category_scores?.[catKey];
      if (catData === undefined || catData === null) return 0;
      if (typeof catData === 'object') return catData.score || 0;
      return Number(catData) || 0;
    };

    const rows = practiceHistory.map(exam => {
      const pkgId = exam.package_id || exam.category_scores?.package_id;
      const catKey = pkgId === 'grammar_master' ? 'grammar' :
                      pkgId === 'vocab_power' ? 'vocab' :
                      pkgId === 'reading_pro' ? 'reading' : 'cloze';
      const catName = packageNames[pkgId] || 'Latihan Mandiri';
      const score = getPracticeScore(catKey, exam);

      return [
        catName,
        `${score}%`,
        score >= 80 ? 'Lulus (Kompeten)' : 'Belum Lulus (Butuh Penguatan)',
        new Date(exam.created_at).toLocaleDateString('id-ID', { dateStyle: 'medium' })
      ];
    });

    exportToPDF(
      `RIWAYAT LATIHAN - ${profile?.full_name?.toUpperCase()}`,
      columns,
      rows,
      `Riwayat_Latihan_${profile?.full_name?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
      'portrait'
    );
  };

  // Fungsi pengecekan CEFR & Tangga Progresi Ketat (Point 3)
  const CEFR_LEVELS_LADDER = ['A1/A2', 'B1/B2', 'C1/C2'];
  const packageTargetCefr = {
    basic_mastery: 'A1/A2',
    pre_intermediate: 'A1/A2',
    intermediate_path: 'B1/B2',
    upper_intermediate: 'B1/B2',
    advanced_pro: 'C1/C2'
  };
  const userCefr = hasDiagnostic ? (profile?.cefr_level || 'A1/A2') : '-';

  /**
   * @description Menentukan apakah suatu paket ujian terkunci berdasarkan aturan progresi tangga CEFR
   * @param {Object} pkg - Objek paket ujian
   * @returns {boolean} True jika terkunci
   */
  const isPackageLocked = (pkg) => {
    if (pkg.id === 'kickstart_diagnostic') {
      // Diagnostik terkunci jika sudah profiling awal DAN belum menyelesaikan 4 latihan
      const passedCount = profile?.passed_practices?.length || 0;
      return hasDiagnostic && passedCount < 4;
    }
    
    if (pkg.type === 'latihan') {
      return false; // Latihan materi tidak pernah dikunci
    }
    
    // Paket ujian utama tingkat lainnya dikunci jika level user di bawah level paket tersebut
    const targetCefr = packageTargetCefr[pkg.id];
    if (!targetCefr) return true;
    
    const userCefrIdx = CEFR_LEVELS_LADDER.indexOf(userCefr);
    const targetCefrIdx = CEFR_LEVELS_LADDER.indexOf(targetCefr);
    
    if (userCefrIdx >= targetCefrIdx) {
      // Unlocked! Level user sama atau di atas tingkat paket soal
      return false;
    }
    
    return true;
  };

  // Dapatkan paket Ujian Utama yang aktif (selalu Kickstart Diagnostic di bawah Opsi 1)
  const getActiveOverallPackage = () => {
    return examPackages.find(p => p.id === 'kickstart_diagnostic');
  };

  const getNextRecommendedPractice = () => {
    // 1. Jika ada weakTopics dari SAW, ambil yang teratas
    if (weakTopics && weakTopics.length > 0) {
      return weakTopics[0];
    }
    
    // 2. Jika tidak ada weakTopics, cari practice yang belum lulus dari passed_practices
    const passedPractices = profile?.passed_practices || [];
    const practiceMapping = [
      { id: 'grammar_master', categoryKey: 'grammar' },
      { id: 'vocab_power', categoryKey: 'vocab' },
      { id: 'reading_pro', categoryKey: 'reading' },
      { id: 'cloze_challenge', categoryKey: 'cloze' }
    ];
    
    const nextIncomplete = practiceMapping.find(p => !passedPractices.includes(p.categoryKey));
    if (nextIncomplete) {
      return examPackages.find(pkg => pkg.id === nextIncomplete.id);
    }
    
    // Fallback ke grammar
    return examPackages.find(pkg => pkg.id === 'grammar_master');
  };

  const activeOverallPkg = getActiveOverallPackage();

  // Saring paket ujian lama untuk direview (hanya yang levelnya berada DI BAWAH level aktif user)
  const reviewExams = examPackages.filter((p) => {
    if (p.type !== 'ujian') return false;
    if (p.id === 'kickstart_diagnostic') return false;
    
    const targetCefr = packageTargetCefr[p.id];
    if (!targetCefr) return false;
    
    const userCefrIdx = CEFR_LEVELS_LADDER.indexOf(userCefr);
    const targetCefrIdx = CEFR_LEVELS_LADDER.indexOf(targetCefr);
    
    // Soal di bawah atau setingkat level aktif user dibuka sebagai review
    return targetCefrIdx <= userCefrIdx;
  });

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
        // Cek apakah sudah menyelesaikan Ujian Diagnostik
        const completedDiagnostic = data.some(exam => 
          exam.package_id === 'kickstart_diagnostic' || 
          exam.category_scores?.package_id === 'kickstart_diagnostic' ||
          exam.exam_type === 'tryout'
        );
        setHasDiagnostic(completedDiagnostic);

        const tryoutList = data.filter(exam => exam.exam_type === 'tryout' || exam.package_id === 'kickstart_diagnostic');
        const practiceList = data.filter(exam => exam.exam_type === 'practice');

        setTryoutHistory(tryoutList);
        setPracticeHistory(practiceList);
        const totalExams = data.length;
        const totalScore = data.reduce((sum, exam) => sum + exam.score_total, 0);
        const averageScore = Math.round(totalScore / totalExams);
        const lastExamDate = data[0].created_at;
        setStats({ totalExams, averageScore, lastExamDate });

        const getAverage = (scoresArr) => {
          if (scoresArr.length === 0) return 0;
          return Math.round(scoresArr.reduce((sum, s) => sum + s, 0) / scoresArr.length);
        };

        // Hanya hitung rata-rata jika sesi tersebut menguji materi yang bersangkutan (Tryout/Diagnostic atau latihan spesifik materi tersebut)
        const grammarScores = data.filter(exam => 
          exam.exam_type === 'tryout' || 
          exam.package_id === 'kickstart_diagnostic' || 
          exam.category_scores?.package_id === 'kickstart_diagnostic' ||
          exam.package_id === 'grammar_master' ||
          exam.category_scores?.package_id === 'grammar_master'
        ).map(exam => {
          const val = exam.category_scores?.grammar;
          return typeof val === 'object' && val !== null ? val.score : val;
        }).filter(s => typeof s === 'number');

        const vocabScores = data.filter(exam => 
          exam.exam_type === 'tryout' || 
          exam.package_id === 'kickstart_diagnostic' || 
          exam.category_scores?.package_id === 'kickstart_diagnostic' ||
          exam.package_id === 'vocab_power' ||
          exam.category_scores?.package_id === 'vocab_power'
        ).map(exam => {
          const val = exam.category_scores?.vocab;
          return typeof val === 'object' && val !== null ? val.score : val;
        }).filter(s => typeof s === 'number');

        const readingScores = data.filter(exam => 
          exam.exam_type === 'tryout' || 
          exam.package_id === 'kickstart_diagnostic' || 
          exam.category_scores?.package_id === 'kickstart_diagnostic' ||
          exam.package_id === 'reading_pro' ||
          exam.category_scores?.package_id === 'reading_pro'
        ).map(exam => {
          const val = exam.category_scores?.reading;
          return typeof val === 'object' && val !== null ? val.score : val;
        }).filter(s => typeof s === 'number');

        const clozeScores = data.filter(exam => 
          exam.exam_type === 'tryout' || 
          exam.package_id === 'kickstart_diagnostic' || 
          exam.category_scores?.package_id === 'kickstart_diagnostic' ||
          exam.package_id === 'cloze_challenge' ||
          exam.category_scores?.package_id === 'cloze_challenge'
        ).map(exam => {
          const val = exam.category_scores?.cloze;
          return typeof val === 'object' && val !== null ? val.score : val;
        }).filter(s => typeof s === 'number');

        setSkillProficiency({
          grammar: getAverage(grammarScores),
          vocab: getAverage(vocabScores),
          reading: getAverage(readingScores),
          cloze: getAverage(clozeScores)
        });

        // Aggregation logic for last 5 exams of type 'tryout' (to prevent single-skill override)
        const tryoutExams = data.filter(exam => exam.exam_type === 'tryout');
        const lastExams = tryoutExams.slice(0, 5);
        const categoriesList = ['grammar', 'vocab', 'reading', 'cloze'];
        const aggregatedScores = {};

        categoriesList.forEach(cat => {
          let scoreSum = 0;
          let testedCount = 0;
          const aggregatedDiffStats = {
            1: { correct: 0, total: 0 },
            2: { correct: 0, total: 0 },
            3: { correct: 0, total: 0 }
          };

          lastExams.forEach(exam => {
            const catData = exam.category_scores?.[cat];
            if (catData && typeof catData === 'object') {
              const diffStats = catData.difficultyStats;
              const hasTested = diffStats && (
                (diffStats[1]?.total || 0) + 
                (diffStats[2]?.total || 0) + 
                (diffStats[3]?.total || 0)
              ) > 0;

              if (hasTested) {
                scoreSum += catData.score || 0;
                testedCount++;

                for (let lvl = 1; lvl <= 3; lvl++) {
                  if (diffStats[lvl]) {
                    aggregatedDiffStats[lvl].correct += diffStats[lvl].correct || 0;
                    aggregatedDiffStats[lvl].total += diffStats[lvl].total || 0;
                  }
                }
              }
            }
          });

          if (testedCount > 0) {
            aggregatedScores[cat] = {
              score: Math.round(scoreSum / testedCount),
              difficultyStats: aggregatedDiffStats
            };
          }
        });

        // Kalkulasi Rekomendasi SAW Real dengan Aggregated Scores (Hanya jika diagnostik sudah selesai)
        const finalScoresForSaw = Object.keys(aggregatedScores).length > 0 ? aggregatedScores : data[0].category_scores;
        if (completedDiagnostic && finalScoresForSaw && Object.keys(finalScoresForSaw).length > 0) {
          const recommendations = calculateSAWPriority(finalScoresForSaw);
          // Hanya rekomendasikan topik yang benar-benar lemah (skor < 80 dan priorityScore > 0) dan belum lulus
          const passedPractices = profile?.passed_practices || [];
          const actualWeakRecommendations = recommendations.filter(rec => 
            rec.rawScore < 80 && 
            rec.priorityScore > 0 && 
            !passedPractices.includes(rec.categoryKey)
          );

          const mappedTopics = actualWeakRecommendations.slice(0, 2).map(rec => {
            const practiceId = rec.categoryKey === 'grammar' ? 'grammar_master' : 
                               rec.categoryKey === 'vocab' ? 'vocab_power' :
                               rec.categoryKey === 'reading' ? 'reading_pro' : 'cloze_challenge';
            const pkg = examPackages.find(p => p.id === practiceId);
            return {
              ...pkg,
              weakScore: Math.round(rec.priorityScore * 100) || 0 // Fallback ke 0 jika NaN
            };
          }).filter(p => p.id !== undefined);
          setWeakTopics(mappedTopics);
        } else {
          setWeakTopics([]);
        }
      } else {
        setHasDiagnostic(false);
        setStats({ totalExams: 0, averageScore: 0, lastExamDate: null });
        setTryoutHistory([]);
        setPracticeHistory([]);
        setSkillProficiency({ grammar: 0, vocab: 0, reading: 0, cloze: 0 });
        setWeakTopics([]);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      // Pastikan setLoading dipanggil terlepas dari error atau return awal
      setLoading(false);
    }
  };

  const handleResetDemo = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset Data Demo',
      message: 'Apakah Anda yakin ingin me-reset data demo? Semua riwayat ujian Anda akan dihapus untuk mensimulasikan user baru.',
      confirmVariant: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          setLoading(true);
          // Hapus hasil dari DB dan offline queue IndexedDB
          const { error: deleteError } = await db.deleteExamResults(profile.id);
          if (deleteError) throw deleteError;
          await localDB.clearQueue();

          // Hapus semua flag submitted dari sessionStorage
          for (let i = sessionStorage.length - 1; i >= 0; i--) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith('submitted_')) {
              sessionStorage.removeItem(key);
            }
          }

          const freshProfile = {
            cefr_level: 'A1',
            passed_practices: [],
            skill_levels: { grammar: 'A1', vocab: 'A1', reading: 'A1', cloze: 'A1' }
          };

          const { error: profileError } = await db.updateProfile(profile.id, freshProfile);
          if (profileError) throw profileError;

          updateLocalProfile(freshProfile);
          setStats({ totalExams: 0, averageScore: 0, lastExamDate: null });
          setHasDiagnostic(false);
          setTryoutHistory([]);
          setPracticeHistory([]);
          setSkillProficiency({ grammar: 0, vocab: 0, reading: 0, cloze: 0 });
          setWeakTopics([]);
        } catch (error) {
          console.error('Error resetting demo:', error);
          alert('Gagal me-reset: ' + error.message);
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const syncQueuedResults = async () => {
    if (!navigator.onLine) return;

    try {
      const queued = await localDB.getQueuedResults();
      if (queued.length === 0) return;

      console.log(`Dashboard: Syncing ${queued.length} queued results...`);

      for (const result of queued) {
        const { id: queueId, examResult, profileUpdates } = result;
        const finalExamPayload = examResult || result;

        const { error } = await db.saveExamResult(finalExamPayload);
        if (!error) {
          if (profileUpdates) {
            const { error: profileError } = await db.updateProfile(profile.id, profileUpdates);
            if (profileError) console.error('Dashboard Sync: Profile update failed', profileError);
          }
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
    sessionStorage.removeItem(`submitted_${packageId}`);
    navigate(`/siswa/exam?paket=${packageId}`, { state: { fromDashboard: true } });
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  // Streak simulasi — di production dari data harian user
  const streak = 7;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F2ECD8' }}>
        <div className="text-center flex flex-col items-center justify-center">
          <ShieldIcon size={40} />
          <p className="mt-4 text-lg italic" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
            Memuat dashboard...
          </p>
        </div>
      </div>
    );
  }

  // ── Package card untuk ujian (non-diagnostic) ──
  const PackageCard = ({ pkg }) => {
    const locked = isPackageLocked(pkg);

    // Dapatkan pesan penjelasan jika terkunci (Point 3)
    let lockMessage = '🔒 Terkunci';
    if (locked) {
      if (stats.totalExams === 0) {
        lockMessage = '🔒 Selesaikan Diagnostic';
      } else {
        const targetCefr = packageTargetCefr[pkg.id];
        const userCefrIdx = CEFR_LEVELS_LADDER.indexOf(userCefr);
        const targetCefrIdx = CEFR_LEVELS_LADDER.indexOf(targetCefr);

        if (targetCefrIdx > userCefrIdx) {
          lockMessage = `🔒 Butuh Level ${targetCefr}`;
        } else if (targetCefrIdx === userCefrIdx) {
          const passedCount = profile?.passed_practices?.length || 0;
          lockMessage = `🔒 Lulus Latihan (${passedCount}/4)`;
        }
      }
    }

    return (
      <div
        className={`flex items-start justify-between p-5 rounded-sm transition-all duration-200 ${locked ? 'opacity-75 grayscale-[50%]' : 'hover:-translate-y-0.5 group'}`}
        style={{ background: '#FAF6EC', border: '1px solid #C8B99A', boxShadow: '0 1px 3px rgba(10,36,99,0.06)' }}
        onMouseEnter={(e) => {
          if (!locked) {
            e.currentTarget.style.borderColor = '#1A4FAD';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(10,36,99,0.1)';
          }
        }}
        onMouseLeave={(e) => {
          if (!locked) {
            e.currentTarget.style.borderColor = '#C8B99A';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(10,36,99,0.06)';
          }
        }}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-bold text-base" style={{ fontFamily: "'Cormorant Garamond',serif", color: locked ? '#6B5A42' : '#0A2463' }}>
              {pkg.name}
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-sm" style={{ background: locked ? '#EDE4CC' : 'rgba(10,36,99,0.06)', color: locked ? '#6B5A42' : '#0A2463', border: '1px solid rgba(10,36,99,0.15)' }}>
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
          onClick={() => !locked && startExam(pkg.id)}
          disabled={locked}
          className={`ml-4 flex-shrink-0 px-4 py-2 text-xs font-bold rounded-sm text-white transition-all flex items-center gap-1 ${locked ? 'cursor-not-allowed opacity-80' : ''}`}
          style={{ background: locked ? '#A8946C' : '#1A4FAD' }}
          onMouseEnter={(e) => {
            if (!locked) {
              e.currentTarget.style.background = '#2460C8';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }
          }}
          onMouseLeave={(e) => {
            if (!locked) {
              e.currentTarget.style.background = '#1A4FAD';
              e.currentTarget.style.transform = 'none';
            }
          }}
        >
          {locked ? <span>{lockMessage}</span> : 'Mulai'}
        </button>
      </div>
    );
  };

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

              {/* Streak badge & CEFR */}
              <div className="flex items-center gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-sm" style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)' }}>
                <span className="text-sm md:text-base">🔥</span>
                <span className="text-white font-bold text-xs md:text-sm">{streak}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2 md:px-3 py-1 md:py-1.5 rounded-sm" style={{ background: '#16A34A', border: '1px solid #15803D' }}>
                <span className="text-white font-black text-xs md:text-sm tracking-widest">{userCefr}</span>
              </div>

              {/* Reset Demo Button (Dev Mode only) */}
              {import.meta.env.DEV && (
                <button
                  onClick={handleResetDemo}
                  className="px-2 md:px-3 py-1 md:py-1.5 text-[10px] md:text-xs font-bold rounded-sm transition-all flex items-center gap-1 border border-red-500 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white"
                >
                  <span>⚡</span> Reset
                </button>
              )}

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
        {/* ══════════ HERO BLOCK (HEADER STRIP + HERO CARD) ══════════ */}
        <div 
          className="rounded-sm overflow-hidden relative" 
          style={{ 
            border: '1px solid #C9A84C',
            boxShadow: '0 8px 32px rgba(10,36,99,0.25)',
          }}
        >
          {/* Header Progress Strip (Sesuai reference.html) */}
          <div 
            className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 text-left bg-[#0A2463]"
            style={{ 
              borderBottom: '1px solid rgba(201, 168, 76, 0.25)' 
            }}
          >
            <span className="text-stone-300 text-sm font-bold uppercase tracking-wider">
              ✦ Ringkasan Progres Belajar
            </span>
            <div className="flex items-center gap-6">
              {[
                { label: 'Ujian', value: stats.totalExams ? `${stats.totalExams}x` : '0x' },
                { label: 'Rerata', value: stats.averageScore ? `${stats.averageScore}%` : '—' },
                { label: 'Progres', value: `${profile?.passed_practices?.length || 0}/4` },
                { label: 'Terakhir', value: stats.lastExamDate ? formatDate(stats.lastExamDate).split(' ').slice(0, 2).join(' ') : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="text-center font-mono">
                  <div className="text-[#C9A84C] font-bold text-sm leading-none" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                    {value}
                  </div>
                  <div className="text-[8px] uppercase tracking-wider text-stone-400 mt-0.5">
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Main Content Card */}
          <section
            className="relative"
            style={{
              background: '#0A2463',
              backgroundImage: `
                repeating-linear-gradient(0deg,  rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 40px),
                repeating-linear-gradient(90deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.02) 1px, transparent 1px, transparent 40px)
              `,
            }}
          >
            {/* Gold corner ornaments */}
            <div className="absolute top-0 left-0 w-8 md:w-12 h-8 md:h-12 border-t-2 border-l-2 border-gold opacity-40" style={{ borderColor: '#C9A84C' }} />
            <div className="absolute top-0 right-0 w-8 md:w-12 h-8 md:h-12 border-t-2 border-r-2 opacity-40" style={{ borderColor: '#C9A84C' }} />
            <div className="absolute bottom-0 left-0 w-8 md:w-12 h-8 md:h-12 border-b-2 border-l-2 opacity-40" style={{ borderColor: '#C9A84C' }} />
            <div className="absolute bottom-0 right-0 w-8 md:w-12 h-8 md:h-12 border-b-2 border-r-2 opacity-40" style={{ borderColor: '#C9A84C' }} />

            <div className="px-5 md:px-8 py-8 md:py-10 relative z-10">
              <div className="flex flex-col lg:flex-row items-center lg:items-center justify-between gap-6 md:gap-8 text-center lg:text-left">
                {/* Left content */}
                <div className="flex-1 flex flex-col items-center lg:items-start w-full">
                  {(() => {
                    const passedCount = profile?.passed_practices?.length || 0;
                    let heroState = 'practice';
                    if (!hasDiagnostic) {
                      heroState = 'diagnostic';
                    } else if (userCefr === 'C1/C2') {
                      heroState = 'mastered';
                    } else if (passedCount >= 4) {
                      heroState = 'levelup';
                    }

                    const recommendedPractice = getNextRecommendedPractice();

                    const practiceStatus = [
                      { name: 'Grammar', id: 'grammar_master', key: 'grammar', icon: '📝' },
                      { name: 'Vocabulary', id: 'vocab_power', key: 'vocab', icon: '📚' },
                      { name: 'Reading', id: 'reading_pro', key: 'reading', icon: '👁️' },
                      { name: 'Cloze', id: 'cloze_challenge', key: 'cloze', icon: '✏️' }
                    ];

                    if (heroState === 'diagnostic') {
                      return (
                        <>
                          <div className="flex items-center gap-2 mb-3 md:mb-4">
                            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest px-2 md:py-1 rounded-sm" style={{ background: 'rgba(191,10,48,0.8)', color: '#fff' }}>
                              ✦ Mulai Di Sini
                            </span>
                          </div>
                          <h2 className="text-white text-2xl md:text-4xl font-bold leading-tight mb-1" style={{ fontFamily: "'Cormorant Garamond',serif" }}>
                            {activeOverallPkg?.name || 'Kickstart Diagnostic'}
                          </h2>
                          <p className="text-xs md:text-base italic mb-4 md:mb-1" style={{ fontFamily: "'IM Fell English',serif", color: '#C9A84C' }}>
                            "{activeOverallPkg?.uniqueName || 'The Level Check'}"
                          </p>
                          <p className="text-sm leading-relaxed mb-6 max-w-lg text-stone-300">
                            {activeOverallPkg?.description || 'Tes komprehensif untuk mengukur kemampuan awal dan membentuk profil belajarmu.'}
                          </p>
                          
                          <div className="flex items-center gap-4 md:gap-6 mb-6 md:mb-8">
                            {[
                              { icon: '🕒', label: `${activeOverallPkg?.duration || 60}m` },
                              { icon: '📄', label: `${activeOverallPkg?.questions || 50} soal` },
                              { icon: '📊', label: activeOverallPkg?.category || 'Diagnostic' },
                            ].map(({ icon, label }) => (
                              <div key={label} className="flex items-center gap-1.5 md:gap-2">
                                <span className="text-sm md:text-base">{icon}</span>
                                <span className="text-[11px] md:text-sm font-semibold text-stone-200">
                                  {label}
                                </span>
                              </div>
                            ))}
                          </div>

                          <button
                            onClick={() => startExam(activeOverallPkg.id)}
                            className="w-full md:w-auto px-6 md:px-8 py-3 md:py-3.5 text-xs md:text-sm font-bold rounded-sm transition-all flex items-center justify-center gap-2"
                            style={{ 
                              background: '#1A4FAD', 
                              color: '#fff', 
                              boxShadow: '0 4px 16px rgba(26,79,173,0.4)' 
                            }}
                          >
                            Mulai Ujian Diagnostic
                          </button>
                        </>
                      );
                    }

                    if (heroState === 'practice') {
                      return (
                        <>
                          <div className="flex items-center gap-2 mb-3 md:mb-4">
                            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest px-2 md:py-1 rounded-sm" style={{ background: 'rgba(201,168,76,0.85)', color: '#fff' }}>
                              ✦ Progres Latihan: {passedCount}/4 Lulus
                            </span>
                          </div>
                          <h2 className="text-white text-2xl md:text-4xl font-bold leading-tight mb-1" style={{ fontFamily: "'Cormorant Garamond',serif" }}>
                            Latihan Penguatan Skill (Level {userCefr})
                          </h2>
                          <p className="text-xs md:text-base italic mb-4 md:mb-1" style={{ fontFamily: "'IM Fell English',serif", color: '#C9A84C' }}>
                            "Persiapan Kenaikan Level"
                          </p>
                          <p className="text-sm leading-relaxed mb-4 max-w-lg text-stone-300">
                            Selesaikan ke-4 latihan skill dengan nilai minimal 80 untuk membuka Ujian Kenaikan Level.
                          </p>

                          {/* Kartu Status Latihan */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2 mb-6 w-full max-w-3xl">
                            {practiceStatus.map((item) => {
                              const isPassed = profile?.passed_practices?.includes(item.key);
                              const isRecommended = recommendedPractice?.id === item.id;
                              return (
                                <div 
                                  key={item.id}
                                  onClick={() => startExam(item.id)}
                                  className="p-3 rounded-sm cursor-pointer transition-all duration-200 text-left"
                                  style={{
                                    background: isRecommended ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.05)',
                                    border: isRecommended ? '1.5px solid #C9A84C' : '1px solid rgba(255,255,255,0.1)',
                                    boxShadow: isRecommended ? '0 0 10px rgba(201,168,76,0.2)' : 'none'
                                  }}
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="text-xs font-bold text-white">{item.icon} {item.name}</span>
                                    {isRecommended && (
                                      <span className="text-[7px] font-black px-1 py-0.5 rounded-sm bg-[#C9A84C] text-[#0A2463]">
                                        REKOMENDASI
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] mt-2 font-bold" style={{ color: isPassed ? '#4ADE80' : '#A8A29E' }}>
                                    {isPassed ? '✓ Lulus (>=80)' : '⏳ Belum Selesai'}
                                  </p>
                                </div>
                              );
                            })}
                          </div>

                          {/* Rekomendasi Utama Card */}
                          {recommendedPractice && (
                            <div className="p-4 rounded-sm border border-l-4 w-full max-w-3xl text-left mb-2" style={{ background: 'rgba(201,168,76,0.08)', borderColor: 'rgba(201,168,76,0.3)', borderLeftColor: '#C9A84C' }}>
                              <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#C9A84C]">Rekomendasi Latihan Selanjutnya (Analisis SAW)</h4>
                              <p className="text-white font-bold text-base mt-1">{recommendedPractice.name}</p>
                              <p className="text-xs text-stone-300 mt-1">{recommendedPractice.description}</p>
                              <button 
                                onClick={() => startExam(recommendedPractice.id)}
                                className="mt-3 px-5 py-2 text-xs font-bold rounded-sm text-[#0A2463] bg-[#C9A84C] hover:bg-[#dfbe61] transition-all"
                              >
                                Mulai Latihan Sekarang &rarr;
                              </button>
                            </div>
                          )}
                        </>
                      );
                    }

                    if (heroState === 'levelup') {
                      const targetNextCefr = userCefr === 'A1/A2' ? 'B1/B2' : 'C1/C2';
                      return (
                        <>
                          <div className="flex items-center gap-2 mb-3 md:mb-4">
                            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest px-2 md:py-1 rounded-sm text-white" style={{ background: '#16A34A' }}>
                              ✦ Ujian Kenaikan Level Terbuka!
                            </span>
                          </div>
                          <h2 className="text-white text-2xl md:text-4xl font-bold leading-tight mb-1" style={{ fontFamily: "'Cormorant Garamond',serif" }}>
                            Evaluasi Kenaikan Tingkat ({userCefr} → {targetNextCefr})
                          </h2>
                          <p className="text-xs md:text-base italic mb-4 md:mb-1" style={{ fontFamily: "'IM Fell English',serif", color: '#C9A84C' }}>
                            "Selesaikan Ujian Kenaikan Level"
                          </p>
                          <p className="text-sm leading-relaxed mb-6 max-w-lg text-stone-300">
                            Kamu telah menyelesaikan ke-4 latihan skill dengan sukses. Ambil Ujian Kenaikan Level untuk menaikkan tingkat kemahiran bahasa Inggrismu secara resmi!
                          </p>
                          
                          <div className="flex items-center gap-4 md:gap-6 mb-6 md:mb-8">
                            {[
                              { icon: '🕒', label: `${activeOverallPkg?.duration || 60}m` },
                              { icon: '📄', label: `${activeOverallPkg?.questions || 30} soal` },
                              { icon: '📊', label: activeOverallPkg?.name || 'Ujian Kenaikan Level' },
                            ].map(({ icon, label }) => (
                              <div key={label} className="flex items-center gap-1.5 md:gap-2">
                                <span className="text-sm md:text-base">{icon}</span>
                                <span className="text-[11px] md:text-sm font-semibold text-stone-200">
                                  {label}
                                </span>
                              </div>
                            ))}
                          </div>

                          <button
                            onClick={() => startExam(activeOverallPkg.id)}
                            className="w-full md:w-auto px-6 md:px-8 py-3 md:py-3.5 text-xs md:text-sm font-bold rounded-sm transition-all flex items-center justify-center gap-2"
                            style={{ 
                              background: '#16A34A', 
                              color: '#fff', 
                              boxShadow: '0 4px 16px rgba(22,163,74,0.4)' 
                            }}
                          >
                            Mulai Ujian Kenaikan Level
                          </button>
                        </>
                      );
                    }

                    if (heroState === 'mastered') {
                      return (
                        <>
                          <div className="flex items-center gap-2 mb-3 md:mb-4">
                            <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest px-2 md:py-1 rounded-sm" style={{ background: '#16A34A', color: '#fff' }}>
                              ✦ Kemampuan Maksimal
                            </span>
                          </div>
                          <h2 className="text-white text-2xl md:text-4xl font-bold leading-tight mb-1" style={{ fontFamily: "'Cormorant Garamond',serif" }}>
                            Tingkat Kemampuan Maksimal Terpenuhi!
                          </h2>
                          <p className="text-xs md:text-base italic mb-4 md:mb-1" style={{ fontFamily: "'IM Fell English',serif", color: '#C9A84C' }}>
                            "Level C1/C2 (Proficient)"
                          </p>
                          <p className="text-sm leading-relaxed mb-6 max-w-lg text-stone-300">
                            Selamat! Kamu telah menguasai level tertinggi. Terus asah kemampuan bahasamu dengan melakukan latihan mandiri kapan saja.
                          </p>
                        </>
                      );
                    }

                    return null;
                  })()}
                </div>

              {/* Right: decorative crest (hidden small mobile) */}
              <div className="hidden md:flex flex-col items-center gap-3 opacity-20">
                <ShieldIcon size={120} />
              </div>
            </div>
          </div>

          <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,#C9A84C 25%,#C9A84C 75%,transparent)' }} />
        </section>
      </div>

        {/* ══════════ PETA KEKUATAN SKILL (RADAR VISUAL) ══════════ */}
        <SkillCompetencyMap
          hasDiagnostic={hasDiagnostic}
          skillProficiency={skillProficiency}
          profile={profile}
        />

        {/* ══════════ REKOMENDASI TOPIK LEMAH ══════════ */}
        <WeakTopicRecommendations
          hasDiagnostic={hasDiagnostic}
          weakTopics={weakTopics}
          userCefr={userCefr}
          startExam={startExam}
        />

        {/* ══════════ MAIN CONTENT GRID ══════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: Paket Ujian + Latihan */}
          <div className="lg:col-span-2 space-y-8">
            {/* Ujian — Review & Latihan Ulang (Hanya muncul jika siswa memiliki ujian tingkat di bawah level aktifnya) */}
            {reviewExams.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4" fill="none" stroke="#1A4FAD" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h2 className="font-bold" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463', fontSize: 18 }}>
                    Ujian — Review & Latihan Ulang
                  </h2>
                </div>
                <GoldRule opacity={0.6} />
                <div className="space-y-3 mt-4">
                  {reviewExams.map((pkg) => (
                    <PackageCard key={pkg.id} pkg={pkg} />
                  ))}
                </div>
              </section>
            )}

            {/* Latihan */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setIsLatihanExpanded(!isLatihanExpanded)}>
                  <svg className="w-4 h-4" fill="none" stroke="#BF0A30" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <h2 className="font-bold flex items-center gap-2" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463', fontSize: 18 }}>
                    Latihan — Daily & Focused
                    <span className="text-xs font-normal text-stone-500">
                      {isLatihanExpanded ? '▲ Sembunyikan' : '▼ Tampilkan'}
                    </span>
                  </h2>
                </div>
                {isLatihanExpanded && <span className="md:hidden text-[10px] font-bold text-crimson animate-pulse">Geser ➜</span>}
              </div>
              <GoldRule opacity={0.6} />
              {isLatihanExpanded && (
                <div className="flex md:grid md:grid-cols-3 gap-3 mt-4 overflow-x-auto pb-4 md:pb-0 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                  {examPackages
                    .filter((p) => p.type === 'latihan')
                    .map((pkg) => (
                      <div key={pkg.id} className="min-w-[140px] md:min-w-0 flex-1">
                        <SkillCard pkg={pkg} />
                      </div>
                    ))}
                </div>
              )}
            </section>
          </div>

          {/* RIGHT: Riwayat Aktivitas Ujian & Latihan Gabungan */}
          <div className="space-y-6 no-print text-left">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="#0A2463" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h2 className="font-bold text-lg" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
                    Riwayat Aktivitas Ujian
                  </h2>
                </div>
                
                {/* PRINT DROPDOWN */}
                <div className="relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPrintDropdownOpen(!isPrintDropdownOpen);
                    }}
                    className="px-2.5 py-1.5 bg-[#0A2463] hover:bg-[#1A4FAD] text-white text-[9px] font-bold uppercase tracking-widest rounded-sm transition-all flex items-center gap-1 shadow-sm"
                  >
                    <span>🖨️ Cetak Laporan</span>
                    <span className="text-[7px]">▼</span>
                  </button>
                  {isPrintDropdownOpen && (
                    <div className="absolute right-0 mt-1.5 w-44 bg-[#FAF6EC] border border-[#C8B99A] rounded-sm shadow-xl z-20 overflow-hidden text-left">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsPrintDropdownOpen(false);
                          handleExportAllExams();
                        }}
                        className="w-full text-left px-3 py-2.5 text-[9px] font-bold uppercase tracking-wider text-[#6B5A42] hover:bg-[#EDE4CC] hover:text-[#0A2463] border-b border-[#C8B99A]/20 transition-all flex items-center gap-1.5"
                      >
                        <span>📝 Cetak Semua Ujian</span>
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsPrintDropdownOpen(false);
                          handleExportAllPractices();
                        }}
                        className="w-full text-left px-3 py-2.5 text-[9px] font-bold uppercase tracking-wider text-[#6B5A42] hover:bg-[#EDE4CC] hover:text-[#0A2463] transition-all flex items-center gap-1.5"
                      >
                        <span>⚡ Cetak Semua Latihan</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <GoldRule opacity={0.6} />
            </div>

            {/* Filter Tabs "Semua, Ujian, Latihan" */}
            <div className="flex bg-[#EDE4CC] p-1 rounded-sm border border-[#C8B99A] mb-4">
                {['Semua', 'Ujian', 'Latihan'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setHistoryFilter(filter)}
                    className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-sm transition-all ${
                      historyFilter === filter 
                        ? 'bg-[#0A2463] text-white shadow-sm' 
                        : 'text-[#6B5A42] hover:text-[#0A2463]'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* Combined List Scroll Area */}
              <div className="space-y-3 overflow-y-auto pr-1 flex-1 max-h-[300px] lg:max-h-[330px]">
                {(() => {
                  const combined = [...tryoutHistory, ...practiceHistory].sort(
                    (a, b) => new Date(b.created_at) - new Date(a.created_at)
                  );

                const filtered = combined.filter((exam) => {
                  const isTryoutItem = exam.exam_type === 'tryout' || exam.package_id === 'kickstart_diagnostic' || exam.category_scores?.package_id === 'kickstart_diagnostic';
                  if (historyFilter === 'Ujian') return isTryoutItem;
                  if (historyFilter === 'Latihan') return !isTryoutItem;
                  return true;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="rounded-sm p-8 text-center" style={{ background: '#FAF6EC', border: '1px solid #C8B99A' }}>
                      <p className="text-3xl mb-3 opacity-30">📋</p>
                      <p className="text-sm italic" style={{ fontFamily: "'IM Fell English',serif", color: '#6B5A42' }}>
                        Tidak ada riwayat untuk "{historyFilter}"
                      </p>
                    </div>
                  );
                }

                return filtered.map((exam) => {
                  const isTryoutItem = exam.exam_type === 'tryout' || exam.package_id === 'kickstart_diagnostic' || exam.category_scores?.package_id === 'kickstart_diagnostic';
                  const badge = scoreBadge(exam.score_total);
                  const pkgId = exam.package_id || exam.category_scores?.package_id;
                  
                  const packageNames = {
                    kickstart_diagnostic: 'Ujian Diagnostik',
                    basic_mastery: 'Ujian Basic Mastery',
                    pre_intermediate: 'Ujian Pre-Intermediate',
                    intermediate_path: 'Ujian Intermediate Path',
                    upper_intermediate: 'Ujian Upper-Intermediate',
                    advanced_pro: 'Ujian Advanced Pro',
                    grammar_master: 'Latihan Grammar',
                    vocab_power: 'Latihan Vocabulary',
                    reading_pro: 'Latihan Reading',
                    cloze_challenge: 'Latihan Cloze'
                  };

                  const displayName = packageNames[pkgId] || (isTryoutItem ? 'Ujian Utama' : 'Latihan Mandiri');

                  return (
                    <div 
                      key={exam.id} 
                      onClick={() => setSelectedReport(exam)}
                      className="rounded-sm p-4 flex items-center justify-between cursor-pointer transition-all hover:bg-[#EDE4CC] hover:-translate-y-0.5" 
                      style={{ background: '#FAF6EC', border: '1px solid #C8B99A', boxShadow: '0 1px 3px rgba(10,36,99,0.05)' }}
                    >
                      <div>
                        <p className="font-bold text-base flex items-center gap-1.5" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
                          {exam.score_total}
                          <span className="text-xs font-normal" style={{ color: '#6B5A42' }}>
                            /100
                          </span>
                          <span className="text-[10px] text-[#A8946C] font-normal italic">
                            (Lihat Rapor)
                          </span>
                        </p>
                        
                        <div className="flex items-center gap-1.5 mt-1">
                          <span 
                            className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm text-white" 
                            style={{ background: isTryoutItem ? '#1A4FAD' : '#BF0A30' }}
                          >
                            {isTryoutItem ? 'Ujian' : 'Latihan'}
                          </span>
                          <span className="text-[10px] text-[#6B5A42] font-semibold truncate max-w-[120px]">
                            {displayName}
                          </span>
                        </div>

                        <p className="text-[9px] mt-1 text-stone-500 font-mono">
                          {formatDate(exam.created_at)}
                        </p>
                      </div>
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-sm" style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                        {badge.label}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </div>
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmVariant={confirmModal.confirmVariant}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
      <StudentReportModal
        isOpen={!!selectedReport}
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    </div>
  );
};

export default Dashboard;
