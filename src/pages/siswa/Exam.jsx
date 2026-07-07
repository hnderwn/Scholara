import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useExam } from '../../context/ExamContext';
import { db } from '../../lib/supabase';
import { localDB } from '../../utils/indexedDB';
import { determineCEFR, calculateOverallCEFR } from '../../lib/saw';
// Import UI components dipertahankan
import QuestionCard from '../../components/Exam/QuestionCard';
import Timer from '../../components/ui/Timer';
import Button from '../../components/ui/Button';
import ConfirmModal from '../../components/ui/ConfirmModal';

// ── Reusable dividers (Sesuai dengan tema) ──
const RedRule = ({ opacity = 1 }) => <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,#BF0A30 25%,#BF0A30 75%,transparent)', opacity }} />;
const GoldRule = ({ opacity = 1 }) => <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,#C8B99A 30%,#C8B99A 70%,transparent)', opacity }} />;

const Exam = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { profile, user, loading: authLoading, updateLocalProfile } = useAuth();
  const { questions, answers, currentQuestionIndex, endTime, duration, isActive, currentQuestion, totalQuestions, startExam, setAnswer, goToQuestion, nextQuestion, prevQuestion, finishExam, formatTime, getRemainingTime, clearExam } = useExam();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasDiagnostic, setHasDiagnostic] = useState(false);
  const [verifyingLock, setVerifyingLock] = useState(true);

  // 1. Verifikasi status pengerjaan Ujian Diagnostik dari database secara asinkron
  useEffect(() => {
    const verifyLockStatus = async () => {
      if (!user?.id) return;
      try {
        if (navigator.onLine) {
          const { data: results } = await db.getExamResults(user.id);
          const completedDiagnostic = results?.some(exam => 
            exam.package_id === 'kickstart_diagnostic' || 
            exam.category_scores?.package_id === 'kickstart_diagnostic' ||
            exam.exam_type === 'tryout'
          );
          setHasDiagnostic(completedDiagnostic);
        } else {
          // Fallback offline menggunakan status profil
          const offlineHasDiagnostic = profile?.cefr_level && profile.cefr_level !== '-' && profile.cefr_level !== 'null';
          setHasDiagnostic(offlineHasDiagnostic);
        }
      } catch (err) {
        console.error('Error verifying lock status:', err);
      } finally {
        setVerifyingLock(false);
      }
    };

    if (!authLoading) {
      if (user?.id) {
        verifyLockStatus();
      } else {
        setVerifyingLock(false);
      }
    }
  }, [user?.id, authLoading, profile?.cefr_level]);

  // 2. Efek untuk memicu dialog alert jika Ujian Diagnostik terkunci
  useEffect(() => {
    if (authLoading || verifyingLock || submitting) return;

    const packageId = searchParams.get('paket');
    const passedCount = profile?.passed_practices?.length || 0;

    if (packageId === 'kickstart_diagnostic' && hasDiagnostic && passedCount < 4) {
      alert('Ujian Diagnostik terkunci. Selesaikan ke-4 latihan skill terlebih dahulu untuk membukanya kembali.');
    }
  }, [authLoading, verifyingLock, submitting, hasDiagnostic, searchParams, profile?.passed_practices]);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [snapshotTimeLeft, setSnapshotTimeLeft] = useState(0);

  // Auto-submit function ketika waktu habis
  useEffect(() => {
    window.autoSubmitExam = handleAutoSubmit;
    return () => {
      window.autoSubmitExam = null;
    };
  }, [answers, questions]);

  // Mencegah refresh/tutup tab tidak sengaja
  useEffect(() => {
    if (!isActive) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Ujian sedang berlangsung. Apakah Anda yakin ingin keluar?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isActive]);

  // Intersep tombol back browser (safeguard)
  useEffect(() => {
    if (!isActive) return;

    // Push dummy history entry ke stack
    window.history.pushState(null, null, window.location.href);

    const handlePopState = () => {
      // Masukkan kembali dummy entry agar tombol back tertahan lagi jika ditekan berikutnya
      window.history.pushState(null, null, window.location.href);
      // Tampilkan modal kustom pembatalan ujian
      setShowConfirmCancel(true);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isActive]);

  useEffect(() => {
    if (authLoading || verifyingLock) return;

    const packageId = searchParams.get('paket');
    const passedCount = profile?.passed_practices?.length || 0;
    const isLocked = !submitting && packageId === 'kickstart_diagnostic' && hasDiagnostic && passedCount < 4;
    const isSubmitted = !submitting && sessionStorage.getItem(`submitted_${packageId}`) === 'true';
    const isDirectAccess = !submitting && !isActive && !location.state?.fromDashboard;

    if (isLocked || isSubmitted || isDirectAccess) {
      return; // Jangan load soal jika akses tidak valid/terkunci/sudah dikumpulkan
    }

    loadExamQuestions();
  }, [searchParams, authLoading, verifyingLock, hasDiagnostic, isActive, location.state, submitting]);

  // Helper fungsi pengacak array (Fisher-Yates)
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const loadExamQuestions = async () => {
    try {
      setLoading(true);
      const packageId = searchParams.get('paket');
      // Kita TIDAK memanggil clearExam() lagi secara brutal agar fungsi REJOIN dari context aktif!


      let data, error;

      if (navigator.onLine) {
        const response = await db.getQuestions();
        data = response.data;
        error = response.error;
        if (data) {
          await localDB.saveQuestions(data); // Cache for offline
        }
      } else {
        console.log('Exam: Offline mode, loading from local cache');
        data = await localDB.getQuestions();
      }

      if (error) throw error;

      let examQuestions = data || [];

      if (packageId === 'kickstart_diagnostic') {
        examQuestions = shuffleArray(examQuestions).slice(0, 50);
      } else if (['grammar_master', 'vocab_power', 'reading_pro', 'cloze_challenge', 'practice'].includes(packageId)) {
        let targetCategory = '';
        let totalCount = 20;

        if (packageId === 'grammar_master') targetCategory = 'Grammar';
        else if (packageId === 'vocab_power') targetCategory = 'Vocabulary';
        else if (packageId === 'reading_pro') { targetCategory = 'Reading'; totalCount = 15; }
        else if (packageId === 'cloze_challenge') targetCategory = 'Cloze';
        else if (packageId === 'practice') { targetCategory = searchParams.get('category'); totalCount = 15; }

        if (targetCategory) {
          const catKey = targetCategory.toLowerCase() === 'vocabulary' ? 'vocab' : targetCategory.toLowerCase();
          const cefr = profile?.skill_levels?.[catKey] || 'A1';
          const filtered = examQuestions.filter(q => q.category === targetCategory);
          const l1Pool = shuffleArray(filtered.filter(q => q.difficulty === 1));
          const l2Pool = shuffleArray(filtered.filter(q => q.difficulty === 2));
          const l3Pool = shuffleArray(filtered.filter(q => q.difficulty === 3));

          let l1Count = 0, l2Count = 0, l3Count = 0;
          if (cefr === 'A1/A2' || cefr === 'A1' || cefr === 'A2') {
            l1Count = Math.round(totalCount * 0.8);
            l2Count = Math.round(totalCount * 0.2);
          } else if (cefr === 'B1/B2' || cefr === 'B1' || cefr === 'B2') {
            l1Count = Math.round(totalCount * 0.2);
            l2Count = Math.round(totalCount * 0.6);
            l3Count = Math.round(totalCount * 0.2);
          } else {
            l2Count = Math.round(totalCount * 0.3);
            l3Count = Math.round(totalCount * 0.7);
          }

          let adaptiveQuestions = [
            ...l1Pool.slice(0, l1Count),
            ...l2Pool.slice(0, l2Count),
            ...l3Pool.slice(0, l3Count)
          ];

          // Jika stok soal spesifik di bank data tidak mencukupi, isi kekurangannya secara acak
          const remainingNeeded = totalCount - adaptiveQuestions.length;
          if (remainingNeeded > 0) {
             const usedIds = new Set(adaptiveQuestions.map(q => q.id));
             const unused = shuffleArray(filtered.filter(q => !usedIds.has(q.id)));
             adaptiveQuestions.push(...unused.slice(0, remainingNeeded));
          }

          examQuestions = shuffleArray(adaptiveQuestions);
        }
      } else if (packageId === 'daily_speed_check') {
        examQuestions = shuffleArray(examQuestions).slice(0, 15);
      } else if (['basic_mastery', 'pre_intermediate', 'intermediate_path', 'upper_intermediate', 'advanced_pro'].includes(packageId)) {
        // Helper to fill questions up to target count if not enough specific difficulties exist
        const fillToTarget = (selected, pool, targetCount) => {
          if (selected.length >= targetCount) return selected;
          const selectedIds = new Set(selected.map(q => q.id));
          const remainingPool = shuffleArray(pool.filter(q => !selectedIds.has(q.id)));
          return [...selected, ...remainingPool.slice(0, targetCount - selected.length)];
        };

        if (packageId === 'basic_mastery') {
          const l1 = shuffleArray(examQuestions.filter((q) => q.difficulty === 1)).slice(0, 40);
          const l2 = shuffleArray(examQuestions.filter((q) => q.difficulty === 2)).slice(0, 10);
          examQuestions = fillToTarget([...l1, ...l2], examQuestions, 50);
        } else if (packageId === 'pre_intermediate') {
          const l1 = shuffleArray(examQuestions.filter((q) => q.difficulty === 1)).slice(0, 15);
          const l2 = shuffleArray(examQuestions.filter((q) => q.difficulty === 2)).slice(0, 35);
          examQuestions = fillToTarget([...l1, ...l2], examQuestions, 50);
        } else if (packageId === 'intermediate_path') {
          const l1 = shuffleArray(examQuestions.filter((q) => q.difficulty === 1)).slice(0, 10);
          const l2 = shuffleArray(examQuestions.filter((q) => q.difficulty === 2)).slice(0, 30);
          const l3 = shuffleArray(examQuestions.filter((q) => q.difficulty === 3)).slice(0, 10);
          examQuestions = fillToTarget([...l1, ...l2, ...l3], examQuestions, 50);
        } else if (packageId === 'upper_intermediate') {
          const l2 = shuffleArray(examQuestions.filter((q) => q.difficulty === 2)).slice(0, 20);
          const l3 = shuffleArray(examQuestions.filter((q) => q.difficulty === 3)).slice(0, 30);
          examQuestions = fillToTarget([...l2, ...l3], examQuestions, 50);
        } else if (packageId === 'advanced_pro') {
          const l2 = shuffleArray(examQuestions.filter((q) => q.difficulty === 2)).slice(0, 10);
          const l3 = shuffleArray(examQuestions.filter((q) => q.difficulty === 3)).slice(0, 40);
          examQuestions = fillToTarget([...l2, ...l3], examQuestions, 50);
        }
        examQuestions = shuffleArray(examQuestions);
      } else {
        examQuestions = shuffleArray(examQuestions).slice(0, 50);
      }

      if (examQuestions.length === 0) {
        examQuestions = generateMockQuestions(packageId, searchParams.get('category'));
      }

      const dur = getPackageDuration(packageId);
      // Panggil startExam - jika state lama dikenali context, examQuestions ini akan dirangkai dengan answers lama.
      startExam(examQuestions, packageId, dur);
    } catch (error) {
      console.error('Error loading exam questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPackageDuration = (packageId) => {
    const durations = {
      kickstart_diagnostic: 3600,
      grammar_master: 1500,
      vocab_power: 1500,
      reading_pro: 1800,
      cloze_challenge: 1500,
      daily_speed_check: 1200,
      basic_mastery: 2400,
      intermediate_path: 2700,
      advanced_pro: 3000,
      practice: 900,
    };
    return durations[packageId] || 3600;
  };

  const generateMockQuestions = (packageId, targetCategory) => {
    const mockQuestions = [];
    const packageConfig = {
      kickstart_diagnostic: { cats: ['Grammar', 'Vocabulary', 'Reading', 'Cloze'], count: 50 },
      grammar_master: { cats: ['Grammar'], count: 20 },
      vocab_power: { cats: ['Vocabulary'], count: 20 },
      reading_pro: { cats: ['Reading'], count: 15 },
      cloze_challenge: { cats: ['Cloze'], count: 20 },
      daily_speed_check: { cats: ['Grammar', 'Vocabulary', 'Reading', 'Cloze'], count: 15 },
      basic_mastery: { cats: ['Grammar', 'Vocabulary', 'Reading', 'Cloze'], count: 30 },
      intermediate_path: { cats: ['Grammar', 'Vocabulary', 'Reading', 'Cloze'], count: 30 },
      advanced_pro: { cats: ['Grammar', 'Vocabulary', 'Reading', 'Cloze'], count: 30 },
      practice: { cats: [targetCategory || 'Grammar'], count: 15 },
    };

    const config = packageConfig[packageId] || { cats: ['Grammar'], count: 20 };

    for (let i = 0; i < config.count; i++) {
      const category = config.cats[i % config.cats.length];
      mockQuestions.push({
        id: `mock_${packageId}_${i + 1}`,
        category: category,
        question_text: `Sample ${category} question ${i + 1} for ${packageId}.`,
        options: { A: 'Option A', B: 'Option B', C: 'Option C', D: 'Option D', E: 'Option E' },
        correct_answer: 'A',
        difficulty: (i % 3) + 1,
        weight: (i % 3) + 1,
      });
    }
    return mockQuestions;
  };

  const handleAnswerSelect = (answer) => {
    setAnswer(currentQuestion.id, answer);
  };

  const handleQuestionClick = (index) => {
    goToQuestion(index);
  };

  const handleAutoSubmit = async () => {
    if (submitting) return;

    setSubmitting(true);
    try {
      const examResult = finishExam();
      if (!user?.id) throw new Error('User not authenticated');

      const packageId = searchParams.get('paket');
      const isPractice = ['grammar_master', 'vocab_power', 'reading_pro', 'cloze_challenge', 'practice', 'daily_speed_check'].includes(packageId);
      const examType = isPractice ? 'practice' : 'tryout';

      const dbPayload = {
        user_id: user.id,
        exam_type: examType,
        score_total: examResult.scores.total,
        category_scores: {
          package_id: packageId,
          grammar: examResult.scores.grammar || 0,
          vocab: examResult.scores.vocab || 0,
          reading: examResult.scores.reading || 0,
          cloze: examResult.scores.cloze || 0,
        },
        answers: examResult.answers,
      };

      let newSkillLevels = { ...(profile?.skill_levels || { grammar: 'A1', vocab: 'A1', reading: 'A1', cloze: 'A1' }) };
      let newOverallCefr = profile?.cefr_level || 'A1';
      let newPassedPractices = [...(profile?.passed_practices || [])];

      const packageTargetCefr = {
        basic_mastery: 'A1',
        pre_intermediate: 'A2',
        intermediate_path: 'B1',
        upper_intermediate: 'B2',
        advanced_pro: 'C1'
      };

      const targetCefr = packageTargetCefr[packageId];
      const isInitialDiagnostic = packageId === 'kickstart_diagnostic';
      // Hanya perbarui skala CEFR jika ini adalah Ujian Utama pertama (Diagnostic) ATAU Ujian Utama setingkat level aktif user
      const shouldUpdateCefr = examType === 'tryout' && (isInitialDiagnostic || targetCefr === newOverallCefr);

      if (shouldUpdateCefr) {
        const levelRank = {
          'A1/A2': 1,
          'B1/B2': 2,
          'C1/C2': 3
        };

        // 1. Perbarui skill levels dengan pencegahan downgrade (CEFR Lock)
        ['grammar', 'vocab', 'reading', 'cloze'].forEach(cat => {
          if (examResult.scores[cat]?.difficultyStats) {
             const stats = examResult.scores[cat].difficultyStats;
             const hasTested = (stats[1]?.total || 0) + (stats[2]?.total || 0) + (stats[3]?.total || 0) > 0;
             if (hasTested) {
               const calculatedSkillCefr = determineCEFR(stats);
               const currentSkillRank = levelRank[profile?.skill_levels?.[cat]] || 0;
               const newSkillRank = levelRank[calculatedSkillCefr] || 0;
               
               if (newSkillRank > currentSkillRank) {
                 newSkillLevels[cat] = calculatedSkillCefr;
               } else {
                 newSkillLevels[cat] = profile?.skill_levels?.[cat] || 'A1/A2';
               }
             }
          }
        });

        // 2. Perbarui overall CEFR dengan pencegahan downgrade (CEFR Lock)
        const calculatedOverall = calculateOverallCEFR(examResult.scores);
        const currentOverallRank = levelRank[profile?.cefr_level] || 0;
        const newOverallRank = levelRank[calculatedOverall] || 0;

        if (newOverallRank > currentOverallRank) {
          newOverallCefr = calculatedOverall;
        } else {
          newOverallCefr = profile?.cefr_level || 'A1/A2';
        }

        // Batasi level CEFR maksimal berdasarkan jenis paket soal
        if (packageId === 'basic_mastery' && ['B2', 'C1/C2'].includes(newOverallCefr)) {
          newOverallCefr = 'B1/B2';
        } else if (packageId === 'pre_intermediate' && ['B2', 'C1/C2'].includes(newOverallCefr)) {
          newOverallCefr = 'B1/B2';
        } else if (packageId === 'intermediate_path' && ['C1/C2'].includes(newOverallCefr)) {
          newOverallCefr = 'B1/B2';
        }
      }

      // Reset progres latihan jika mengambil Ujian Utama setingkat (baik lulus maupun gagal)
      if (examType === 'tryout' && shouldUpdateCefr) {
         newPassedPractices = [];
      } else if (examType === 'practice') {
         // Logika pelacakan kelulusan latihan skill
         let categoryKey = null;
         if (packageId === 'grammar_master') categoryKey = 'grammar';
         else if (packageId === 'vocab_power') categoryKey = 'vocab';
         else if (packageId === 'reading_pro') categoryKey = 'reading';
         else if (packageId === 'cloze_challenge') categoryKey = 'cloze';
         else if (packageId === 'practice') {
           const catParam = searchParams.get('category')?.toLowerCase();
           if (catParam === 'vocabulary') categoryKey = 'vocab';
           else if (catParam) categoryKey = catParam;
         }

          if (categoryKey && examResult.scores.total >= 80) {
            if (!newPassedPractices.includes(categoryKey)) {
              newPassedPractices.push(categoryKey);
            }
          }
       }

       if (navigator.onLine) {
         const { error } = await db.saveExamResult(dbPayload);
         if (error) throw error;
         
         // Update profile
         const { error: profileError } = await db.updateProfile(user.id, {
            cefr_level: newOverallCefr,
            skill_levels: newSkillLevels,
            passed_practices: newPassedPractices
         });
         if (profileError) throw profileError;
       } else {
         console.log('Exam: Offline, queuing result');
         await localDB.queueResult({
           examResult: dbPayload,
           profileUpdates: {
              cefr_level: newOverallCefr,
              skill_levels: newSkillLevels,
              passed_practices: newPassedPractices
           }
         });
       }

      // Perbarui profil secara lokal di state dan localStorage agar UI PWA beradaptasi langsung
      updateLocalProfile({
         cefr_level: newOverallCefr,
         skill_levels: newSkillLevels,
         passed_practices: newPassedPractices
      });

      if (!navigator.onLine) {
        alert('Ujian selesai! Karena kamu sedang offline, hasil ujian disimpan di perangkat dan akan otomatis disinkronkan saat terhubung internet.');
      }

      sessionStorage.setItem(`submitted_${packageId}`, 'true');
      clearExam();
      navigate('/siswa/result', { state: { examResult: { ...examResult, packageId } }, replace: true });
    } catch (error) {
      console.error('Error submitting exam:', error);
      alert(`Error submitting exam: ${error.message}`);
      setSubmitting(false);
    }
  };

  /**
   * @description Mengisi otomatis jawaban soal untuk keperluan pengujian alur
   * @param {string} type - Tipe pengisian: 'correct' (benar semua), 'incorrect' (salah semua), 'random' (acak)
   * @returns {void}
   */
  /**
   * @description Mengisi otomatis jawaban soal untuk keperluan pengujian alur
   * @param {string} type - Tipe pengisian: 'correct' (benar semua), 'incorrect' (salah semua), 'random' (acak), 'custom' (skor kustom)
   * @returns {void}
   */
  const handleDebugAutoFill = (type = 'correct') => {
    let targetPercent = 100;
    if (type === 'custom') {
      const input = prompt('Masukkan target persentase nilai (0-100):', '80');
      if (input === null) return;
      targetPercent = parseFloat(input);
      if (isNaN(targetPercent) || targetPercent < 0 || targetPercent > 100) {
        alert('Persentase tidak valid!');
        return;
      }
    } else if (type === 'incorrect') {
      targetPercent = 0;
    } else if (type === 'random') {
      targetPercent = Math.random() * 100;
    }

    const total = questions.length;
    const correctCount = Math.round((targetPercent / 100) * total);

    questions.forEach((q, idx) => {
      const isCorrect = idx < correctCount;
      let ans = 'A';
      if (isCorrect) {
        ans = q.correct_answer;
      } else {
        const options = Object.keys(q.options || { A: 'A', B: 'B', C: 'C', D: 'D', E: 'E' });
        ans = options.find(opt => opt !== q.correct_answer) || 'A';
      }
      setAnswer(q.id, ans);
    });

    // alert(`Debug Auto-Fill Berhasil: Mengisi ${correctCount} jawaban benar dari ${total} soal (${Math.round((correctCount / total) * 100)}%).`);
  };

  const handleOpenSubmit = () => {
    setSnapshotTimeLeft(getRemainingTime());
    setShowConfirmSubmit(true);
  }

  const handleSubmitExam = async () => {
    setShowConfirmSubmit(false);
    await handleAutoSubmit();
  };

  const handleCancelExam = () => {
    clearExam();
    navigate('/siswa/dashboard');
  };

  if (authLoading || verifyingLock) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F2ECD8' }}>
        <p className="text-xl italic" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
          Memverifikasi akses ujian...
        </p>
      </div>
    );
  }

  const checkPackageId = searchParams.get('paket');
  const checkPassedCount = profile?.passed_practices?.length || 0;
  const checkIsLocked = !submitting && checkPackageId === 'kickstart_diagnostic' && hasDiagnostic && checkPassedCount < 4;
  const checkIsSubmitted = !submitting && sessionStorage.getItem(`submitted_${checkPackageId}`) === 'true';
  const checkIsDirectAccess = !submitting && !isActive && !location.state?.fromDashboard;

  if (checkIsLocked || checkIsSubmitted || checkIsDirectAccess) {
    return <Navigate to="/siswa/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F2ECD8' }}>
        <p className="text-xl italic" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
          Memuat naskah ujian...
        </p>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F2ECD8' }}>
        <p className="text-xl italic" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
          Tidak ada soal tersedia untuk paket ini.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-['DM_Sans']" style={{ backgroundColor: '#F2ECD8' }}>
      {/* ── Sticky Header (UX Improvement) ── */}
      <div className="sticky top-0 z-40 shadow-md" style={{ backgroundColor: '#FAF6EC', borderBottom: '1px solid #C8B99A' }}>
        <RedRule />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold leading-none capitalize" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
                {searchParams.get('paket') ? searchParams.get('paket').split('_').join(' ') : 'Naskah Ujian Resmi'}
              </h1>
              <p className="text-xs italic mt-1" style={{ fontFamily: "'IM Fell English',serif", color: '#6B5A42' }}>
                Soal {currentQuestionIndex + 1} dari {totalQuestions}
              </p>
            </div>

            <div className="flex items-center space-x-4 md:space-x-6">
              {/* Timer UI Now independently ticks via Absolute endTime */}
              <div className="font-bold text-lg" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#BF0A30' }}>
                <Timer endTime={endTime} duration={duration} isActive={isActive} />
              </div>

              <div className="flex items-center space-x-3">
                {/* Dev Mode Debug Helper */}
                {(import.meta.env.DEV || profile?.is_debug_enabled || profile?.role === 'admin') && (
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50/10 border border-red-200/30 rounded-sm">
                    <span className="text-[10px] font-bold text-[#C9A84C] font-mono">DEBUG:</span>
                    <button
                      onClick={() => handleDebugAutoFill('correct')}
                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-mono text-[9px] font-bold rounded-sm transition-colors"
                    >
                      Benar
                    </button>
                    <button
                      onClick={() => handleDebugAutoFill('incorrect')}
                      className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-mono text-[9px] font-bold rounded-sm transition-colors"
                    >
                      Salah
                    </button>
                    <button
                      onClick={() => handleDebugAutoFill('random')}
                      className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white font-mono text-[9px] font-bold rounded-sm transition-colors"
                    >
                      Acak
                    </button>
                    <button
                      onClick={() => handleDebugAutoFill('custom')}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white font-mono text-[9px] font-bold rounded-sm transition-colors"
                    >
                      Set Skor
                    </button>
                  </div>
                )}

                {/* Hierarki UX: Tombol Batal dibuat lebih "subtle" */}
                <button onClick={() => setShowConfirmCancel(true)} className="text-xs font-bold uppercase tracking-wider transition-colors hover:underline" style={{ color: '#6B5A42' }}>
                  Batalkan
                </button>

                <button
                  onClick={handleOpenSubmit}
                  className="px-4 py-2 text-xs font-bold text-white rounded-sm shadow-sm transition-all hover:-translate-y-px"
                  style={{ backgroundColor: '#1A4FAD', border: '1px solid #0A2463' }}
                >
                  Kumpulkan
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6">
          {/* ══ AREA SOAL (Diurutkan pertama di Mobile) ══ */}
          <div className="order-1 lg:col-span-3">
            {/* Wrapper Card Klasik untuk Komponen QuestionCard */}
            <div className="rounded-sm p-6 md:p-8" style={{ backgroundColor: '#FAF6EC', border: '1px solid #C8B99A', boxShadow: '0 4px 16px rgba(10,36,99,0.05)' }}>
              <QuestionCard question={currentQuestion} questionNumber={currentQuestionIndex + 1} totalQuestions={totalQuestions} selectedAnswer={answers[currentQuestion.id]} onAnswerSelect={handleAnswerSelect} />

              <div className="mt-8 mb-4">
                <GoldRule opacity={0.5} />
              </div>

              {/* Navigation Buttons Bawah */}
              <div className="flex items-center justify-between">
                <button
                  onClick={prevQuestion}
                  disabled={currentQuestionIndex === 0}
                  className="px-4 py-2 flex items-center text-sm font-bold rounded-sm transition-all disabled:opacity-40"
                  style={{ backgroundColor: '#EDE4CC', border: '1px solid #C8B99A', color: '#0A2463' }}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Sebelumnya
                </button>

                <div className="hidden md:block text-xs font-mono" style={{ color: '#6B5A42' }}>
                  {Object.keys(answers).length} / {totalQuestions} Terjawab
                </div>

                {currentQuestionIndex === totalQuestions - 1 ? (
                  <button
                    onClick={handleOpenSubmit}
                    className="px-4 py-2 flex items-center text-sm font-bold rounded-sm text-white transition-all hover:bg-[#2460C8]"
                    style={{ backgroundColor: '#1A4FAD', border: '1px solid #0A2463' }}
                  >
                    Selesai
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                ) : (
                  <button onClick={nextQuestion} className="px-4 py-2 flex items-center text-sm font-bold rounded-sm transition-all hover:bg-[#E5D7B3]" style={{ backgroundColor: '#EDE4CC', border: '1px solid #C8B99A', color: '#0A2463' }}>
                    Selanjutnya
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ══ NAVIGASI SOAL (Diurutkan kedua di Mobile, Sticky di Desktop) ══ */}
          <div className="order-2 lg:col-span-1">
            <div className="rounded-sm sticky top-28" style={{ backgroundColor: '#FAF6EC', border: '1px solid #C8B99A', boxShadow: '0 4px 16px rgba(10,36,99,0.05)' }}>
              <RedRule opacity={0.6} />
              <div className="p-4 md:p-5">
                <h3 className="text-sm font-bold mb-3 uppercase tracking-widest" style={{ color: '#0A2463' }}>
                  Indeks Soal
                </h3>
                <GoldRule opacity={0.6} />

                {/* Solusi Mobile UX: max-h-60 overflow-y-auto */}
                <div className="mt-4 grid grid-cols-5 gap-2 max-h-60 lg:max-h-[calc(100vh-16rem)] overflow-y-auto pr-1">
                  {Array.from({ length: totalQuestions }, (_, i) => {
                    const questionId = questions[i]?.id;
                    const isAnswered = answers[questionId] !== undefined;
                    const isCurrent = i === currentQuestionIndex;

                    // Classic Button Styles Logic
                    let btnStyle = { border: '1px solid #C8B99A', color: '#6B5A42', backgroundColor: 'transparent' };
                    if (isCurrent) {
                      btnStyle = { border: '1px solid #0A2463', color: '#fff', backgroundColor: '#0A2463' }; // Navy for active
                    } else if (isAnswered) {
                      btnStyle = { border: '1px solid #1A4FAD', color: '#1A4FAD', backgroundColor: '#EDE4CC' }; // Highlighted for answered
                    }

                    return (
                      <button key={i} onClick={() => handleQuestionClick(i)} className="w-full aspect-square rounded-sm text-xs font-bold font-mono transition-all hover:opacity-80 flex items-center justify-center" style={btnStyle}>
                        {i + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(200,185,154,0.4)' }}>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span style={{ color: '#6B5A42' }}>Terjawab:</span>
                    <span className="font-bold text-sm" style={{ color: '#0A2463' }}>
                      {Object.keys(answers).length} / {totalQuestions}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ════ MODAL KONFIRMASI KUMPULKAN ════ */}
      <ConfirmModal
        isOpen={showConfirmSubmit}
        title="Kumpulkan Ujian?"
        message={`Apakah Anda yakin ingin mengumpulkan ujian? Waktu tersisa ${formatTime(snapshotTimeLeft)} lagi.`}
        confirmText={submitting ? 'Menyimpan...' : 'Ya, Kumpulkan'}
        cancelText="Batal"
        confirmVariant="primary"
        onConfirm={handleSubmitExam}
        onCancel={() => setShowConfirmSubmit(false)}
      />

      {/* ════ MODAL KONFIRMASI BATALKAN ════ */}
      <ConfirmModal
        isOpen={showConfirmCancel}
        title="Batalkan Ujian?"
        message="Apakah Anda yakin ingin membatalkan ujian ini? Semua progres jawaban Anda akan hilang dan tidak dapat dikembalikan."
        confirmText="Ya, Batalkan"
        cancelText="Kembali Lanjut"
        confirmVariant="danger"
        onConfirm={handleCancelExam}
        onCancel={() => setShowConfirmCancel(false)}
      />
    </div>
  );
};

export default Exam;
