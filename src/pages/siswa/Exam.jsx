import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useExam } from '../../context/ExamContext';
import { db } from '../../lib/supabase';
import { localDB } from '../../utils/indexedDB';
// Import UI components dipertahankan
import QuestionCard from '../../components/Exam/QuestionCard';
import Timer from '../../components/ui/Timer';
import Button from '../../components/ui/Button';

// ── Reusable dividers (Sesuai dengan tema) ──
const RedRule = ({ opacity = 1 }) => <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,#BF0A30 25%,#BF0A30 75%,transparent)', opacity }} />;
const GoldRule = ({ opacity = 1 }) => <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,#C8B99A 30%,#C8B99A 70%,transparent)', opacity }} />;

const Exam = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile, user } = useAuth();
  const { questions, answers, currentQuestionIndex, timeLeft, isActive, currentQuestion, totalQuestions, startExam, setAnswer, goToQuestion, nextQuestion, prevQuestion, finishExam, formatTime, clearExam } = useExam();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  // Auto-submit function ketika waktu habis
  useEffect(() => {
    window.autoSubmitExam = handleAutoSubmit;
    return () => {
      window.autoSubmitExam = null;
    };
  }, [answers, questions]);

  useEffect(() => {
    loadExamQuestions();
  }, []);

  const loadExamQuestions = async () => {
    try {
      setLoading(true);
      const packageId = searchParams.get('paket');
      clearExam();

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
        examQuestions = examQuestions.slice(0, 50);
      } else if (packageId === 'grammar_master') {
        examQuestions = examQuestions.filter((q) => q.category === 'Grammar').slice(0, 20);
      } else if (packageId === 'vocab_power') {
        examQuestions = examQuestions.filter((q) => q.category === 'Vocabulary').slice(0, 20);
      } else if (packageId === 'reading_pro') {
        examQuestions = examQuestions.filter((q) => q.category === 'Reading').slice(0, 15);
      } else if (packageId === 'cloze_challenge') {
        examQuestions = examQuestions.filter((q) => q.category === 'Cloze').slice(0, 20);
      } else if (packageId === 'daily_speed_check') {
        examQuestions = examQuestions.slice(0, 15);
      } else if (packageId === 'basic_mastery') {
        const l1 = examQuestions.filter((q) => q.difficulty === 1).slice(0, 24);
        const l2 = examQuestions.filter((q) => q.difficulty === 2).slice(0, 6);
        examQuestions = [...l1, ...l2];
      } else if (packageId === 'intermediate_path') {
        const l1 = examQuestions.filter((q) => q.difficulty === 1).slice(0, 6);
        const l2 = examQuestions.filter((q) => q.difficulty === 2).slice(0, 18);
        const l3 = examQuestions.filter((q) => q.difficulty === 3).slice(0, 6);
        examQuestions = [...l1, ...l2, ...l3];
      } else if (packageId === 'advanced_pro') {
        const l2 = examQuestions.filter((q) => q.difficulty === 2).slice(0, 6);
        const l3 = examQuestions.filter((q) => q.difficulty === 3).slice(0, 24);
        examQuestions = [...l2, ...l3];
      } else if (packageId === 'practice') {
        const targetCategory = searchParams.get('category');
        if (targetCategory) {
          examQuestions = examQuestions.filter((q) => q.category === targetCategory).slice(0, 15);
        }
      } else {
        examQuestions = examQuestions.slice(0, 50);
      }

      if (examQuestions.length === 0) {
        examQuestions = generateMockQuestions(packageId, searchParams.get('category'));
      }

      const duration = getPackageDuration(packageId);
      startExam(examQuestions, duration);
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
      const examType = packageId === 'practice' ? 'practice' : 'tryout';

      const dbPayload = {
        user_id: user.id,
        exam_type: examType,
        score_total: examResult.scores.total,
        category_scores: {
          grammar: examResult.scores.grammar || 0,
          vocab: examResult.scores.vocab || 0,
          reading: examResult.scores.reading || 0,
          cloze: examResult.scores.cloze || 0,
        },
        answers: examResult.answers,
      };

      if (navigator.onLine) {
        const { error } = await db.saveExamResult(dbPayload);
        if (error) throw error;
      } else {
        console.log('Exam: Offline, queuing result');
        await localDB.queueResult(dbPayload);
        alert('Ujian selesai! Karena kamu sedang offline, hasil ujian disimpan di perangkat dan akan otomatis disinkronkan saat terhubung internet.');
      }

      navigate('/siswa/result', { state: { examResult } });
    } catch (error) {
      console.error('Error submitting exam:', error);
      alert(`Error submitting exam: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitExam = async () => {
    setShowConfirmSubmit(false);
    await handleAutoSubmit();
  };

  const handleCancelExam = () => {
    clearExam();
    navigate('/siswa/dashboard');
  };

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
              <h1 className="text-2xl font-bold leading-none" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
                Naskah Ujian Resmi
              </h1>
              <p className="text-xs italic mt-1" style={{ fontFamily: "'IM Fell English',serif", color: '#6B5A42' }}>
                Soal {currentQuestionIndex + 1} dari {totalQuestions}
              </p>
            </div>

            <div className="flex items-center space-x-4 md:space-x-6">
              {/* Timer UI (assuming it handles its own styles, but we wrap it carefully) */}
              <div className="font-bold text-lg" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#BF0A30' }}>
                <Timer timeLeft={timeLeft} isActive={isActive} />
              </div>

              <div className="flex items-center space-x-3">
                {/* Hierarki UX: Tombol Batal dibuat lebih "subtle" */}
                <button onClick={() => setShowConfirmCancel(true)} className="text-xs font-bold uppercase tracking-wider transition-colors hover:underline" style={{ color: '#6B5A42' }}>
                  Batalkan
                </button>

                <button
                  onClick={() => setShowConfirmSubmit(true)}
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
                    onClick={() => setShowConfirmSubmit(true)}
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
      {showConfirmSubmit && (
        <div className="fixed inset-0 bg-[#0A2463]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="bg-[#FAF6EC] rounded-sm max-w-md w-full border border-[#C8B99A] overflow-hidden shadow-2xl">
            <RedRule />
            <div className="p-6 md:p-8">
              <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
                Kumpulkan Ujian?
              </h3>
              <p className="text-sm italic mb-6" style={{ fontFamily: "'IM Fell English',serif", color: '#6B5A42' }}>
                Apakah Anda yakin ingin mengumpulkan ujian? Waktu tersisa <b style={{ color: '#BF0A30' }}>{formatTime(timeLeft)}</b> lagi.
              </p>
              <div className="flex justify-end space-x-3 pt-4 border-t" style={{ borderColor: 'rgba(200,185,154,0.4)' }}>
                <button onClick={() => setShowConfirmSubmit(false)} className="px-4 py-2 text-xs font-bold rounded-sm uppercase tracking-wider transition-colors" style={{ color: '#6B5A42', border: '1px solid #C8B99A' }}>
                  Batal
                </button>
                <button
                  onClick={handleSubmitExam}
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white rounded-sm uppercase tracking-wider transition-colors"
                  style={{ backgroundColor: '#1A4FAD', opacity: submitting ? 0.7 : 1 }}
                >
                  {submitting ? 'Menyimpan...' : 'Ya, Kumpulkan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════ MODAL KONFIRMASI BATALKAN ════ */}
      {showConfirmCancel && (
        <div className="fixed inset-0 bg-[#0A2463]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="bg-[#FAF6EC] rounded-sm max-w-md w-full border border-[#BF0A30] overflow-hidden shadow-2xl">
            <RedRule />
            <div className="p-6 md:p-8">
              <h3 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#BF0A30' }}>
                Batalkan Ujian?
              </h3>
              <p className="text-sm italic mb-6" style={{ fontFamily: "'IM Fell English',serif", color: '#6B5A42' }}>
                Apakah Anda yakin ingin membatalkan ujian ini? Semua progres jawaban Anda akan hilang dan tidak dapat dikembalikan.
              </p>
              <div className="flex justify-end space-x-3 pt-4 border-t" style={{ borderColor: 'rgba(200,185,154,0.4)' }}>
                <button onClick={() => setShowConfirmCancel(false)} className="px-4 py-2 text-xs font-bold rounded-sm uppercase tracking-wider transition-colors" style={{ color: '#0A2463', border: '1px solid #C8B99A' }}>
                  Kembali Lanjut
                </button>
                <button onClick={handleCancelExam} className="px-5 py-2 text-xs font-bold text-white rounded-sm uppercase tracking-wider transition-colors" style={{ backgroundColor: '#BF0A30' }}>
                  Ya, Batalkan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Exam;
