import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { calculateSAWPriority, calculateOverallCEFR } from '../../lib/saw';
import { db } from '../../lib/supabase';
// Import UI components dipertahankan
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

// ── Reusable dividers (Sesuai dengan tema) ──
const RedRule = ({ opacity = 1 }) => <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,#BF0A30 25%,#BF0A30 75%,transparent)', opacity }} />;
const GoldRule = ({ opacity = 1 }) => <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,#C8B99A 30%,#C8B99A 70%,transparent)', opacity }} />;

const Result = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, user } = useAuth();

  const [examResult, setExamResult] = useState(null);
  const [sawRecommendations, setSawRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [detailedQuestions, setDetailedQuestions] = useState([]);
  const [isPracticeModalOpen, setIsPracticeModalOpen] = useState(false);
  const [selectedPracticeCategory, setSelectedPracticeCategory] = useState(null);
  const [explanationLang, setExplanationLang] = useState('en');

  // Fetch detailed questions when examResult is available
  useEffect(() => {
    const fetchQuestionDetails = async () => {
      if (!examResult?.answers) return;

      try {
        const questionIds = Object.keys(examResult.answers);
        if (questionIds.length === 0) return;

        const { data, error } = await db.getQuestions();
        if (error) throw error;

        const relevantQuestions = data.filter((q) => questionIds.includes(q.id));
        setDetailedQuestions(relevantQuestions);
      } catch (err) {
        console.error('Error fetching question details:', err);
      }
    };

    if (examResult) {
      fetchQuestionDetails();
    }
  }, [examResult]);

  useEffect(() => {
    const init = async () => {
      try {
        let currentResult = null;
        if (location.state?.examResult) {
          console.log('Using result from state:', location.state.examResult);
          currentResult = location.state.examResult;
          setExamResult(currentResult);
        }
        
        if (user?.id) {
          await loadRecommendationsAndResult(currentResult);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error in Result initialization:', error);
        setLoading(false);
      }
    };

    init();
  }, [user?.id]);

  const loadRecommendationsAndResult = async (currentResult) => {
    try {
      setLoading(true);
      if (!user?.id) return;

      const { data, error } = await db.getExamResults(user.id);
      if (error) throw error;

      let latestResult = currentResult;

      if (!latestResult && data && data.length > 0) {
        const latest = data[0];
        latestResult = {
          id: latest.id,
          startTime: latest.created_at,
          endTime: latest.created_at,
          duration: 0,
          questions: 0,
          answered: Object.keys(latest.answers || {}).length,
          scores: {
            total: latest.score_total,
            ...latest.category_scores,
          },
          answers: latest.answers,
        };
        setExamResult(latestResult);
      }

      if (latestResult) {
        const categoriesList = ['grammar', 'vocab', 'reading', 'cloze'];
        const scoresForSaw = {};

        categoriesList.forEach(cat => {
          const scoreData = latestResult.scores[cat];
          if (scoreData && typeof scoreData === 'object') {
            scoresForSaw[cat] = scoreData;
          } else {
            scoresForSaw[cat] = {
              score: typeof scoreData === 'number' ? scoreData : 0,
              difficultyStats: {
                1: { correct: 0, total: 1 },
                2: { correct: 0, total: 0 },
                3: { correct: 0, total: 0 }
              }
            };
          }
        });

        const recommendations = calculateSAWPriority(scoresForSaw);
        setSawRecommendations(recommendations);
      }
    } catch (error) {
      console.error('Error loading result and recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-[#16A34A]';
    if (score >= 60) return 'text-[#D97706]';
    return 'text-[#BF0A30]';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Sangat Baik';
    if (score >= 60) return 'Baik';
    return 'Perlu Peningkatan';
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}d`;
  };

  const overallCEFR = examResult ? calculateOverallCEFR(examResult.scores) : 'A1';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F2ECD8' }}>
        <p className="text-xl italic" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
          Memuat kalkulasi hasil...
        </p>
      </div>
    );
  }

  if (!examResult) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F2ECD8' }}>
        <div className="text-center">
          <p className="text-sm italic mb-4" style={{ fontFamily: "'IM Fell English',serif", color: '#6B5A42' }}>
            Tidak ada arsip hasil ujian ditemukan.
          </p>
          <Button onClick={() => navigate('/siswa/dashboard')}>Kembali ke Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 font-['DM_Sans']" style={{ backgroundColor: '#F2ECD8' }}>
      <div className="max-w-7xl mx-auto">
        {/* ── Header ── */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold leading-none" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
              Laporan Hasil Ujian
            </h1>
            <p className="text-sm italic mt-1" style={{ fontFamily: "'IM Fell English',serif", color: '#6B5A42' }}>
              Kerja bagus, <b style={{ color: '#0A2463' }}>{profile?.full_name}</b>! Berikut adalah analisis performa Anda.
            </p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#A8946C' }}>
              Waktu Penyelesaian
            </p>
            <p className="text-sm font-bold font-mono" style={{ color: '#0A2463' }}>
              {new Date(examResult.endTime).toLocaleString('id-ID')}
            </p>
          </div>
        </div>
        <GoldRule opacity={0.6} />

        {/* ── Main Layout ── */}
        <div className="mt-8 space-y-8">
          {/* ══ OVERALL SCORE ══ */}
          <Card className="p-8 text-center relative overflow-hidden">
            <RedRule opacity={0.6} />
            <h2 className="text-[10px] font-black uppercase tracking-widest mt-2 mb-4" style={{ color: '#6B5A42' }}>
              Skor Total Evaluasi
            </h2>
            <div className="mb-6 flex flex-col md:flex-row items-center justify-center gap-4">
              <div className="flex items-baseline">
                <span className={`text-7xl font-black leading-none ${getScoreColor(examResult.scores.total)}`} style={{ fontFamily: "'Cormorant Garamond',serif" }}>
                  {examResult.scores.total}
                </span>
                <span className="text-2xl font-bold ml-1" style={{ color: '#A8946C', fontFamily: "'Cormorant Garamond',serif" }}>
                  /100
                </span>
              </div>

            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest" style={{ color: '#6B5A42' }}>
              <span className="bg-[#EDE4CC] px-3 py-1 rounded-sm border border-[#C8B99A]">Durasi: {formatDuration(examResult.duration)}</span>
              <span>✦</span>
              <span className="bg-[#EDE4CC] px-3 py-1 rounded-sm border border-[#C8B99A]">
                Terjawab: {examResult.answered}/{examResult.questions || examResult.answered}
              </span>
              <span>✦</span>
              <span className={`px-3 py-1 rounded-sm border border-[currentColor] ${getScoreColor(examResult.scores.total)}`}>{getScoreLabel(examResult.scores.total)}</span>
            </div>
          </Card>

          {/* ══ ACTION BUTTONS ══ */}
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="outline" onClick={() => navigate('/siswa/dashboard')}>
              Kembali
            </Button>
            <Button variant="secondary" onClick={() => setShowDetails(true)}>
              Lihat Pembahasan
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                const weakestRec = sawRecommendations[0];
                if (weakestRec) {
                  setSelectedPracticeCategory(weakestRec);
                  setIsPracticeModalOpen(true);
                }
              }}
            >
              Latihan Area Lemah
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* ══ CATEGORY BREAKDOWN ══ */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">📈</span>
                <h2 className="text-xl font-bold" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
                  Skor per Kategori
                </h2>
              </div>
              <div className="space-y-4">
                {Object.entries(examResult.scores)
                  .filter(([category]) => category !== 'total')
                  .map(([category, data]) => {
                    const score = typeof data === 'object' ? data.score : data;
                    const cefr = sawRecommendations.find((r) => r.categoryKey === category)?.cefrLevel || 'A1';

                    return (
                      <Card key={category} className="p-5 transition-transform hover:-translate-y-1">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="text-[11px] font-black uppercase tracking-widest" style={{ color: '#0A2463' }}>
                                {category === 'vocab' ? 'Kosakata' : category === 'grammar' ? 'Tata Bahasa' : category === 'reading' ? 'Membaca' : category === 'cloze' ? 'Rumpang' : category}
                              </h3>
                            </div>
                            <p className="mt-1 text-[11px] font-bold" style={{ color: '#6B5A42' }}>
                              {getScoreLabel(score)}
                            </p>
                          </div>
                          <div className="text-right flex items-baseline">
                            <span className={`text-3xl font-black ${getScoreColor(score)}`} style={{ fontFamily: "'Cormorant Garamond',serif" }}>
                              {score}
                            </span>
                            <span className="text-sm font-bold ml-0.5" style={{ color: '#A8946C' }}>
                              /100
                            </span>
                          </div>
                        </div>
                        <div className="w-full h-1.5 rounded-sm" style={{ backgroundColor: '#EDE4CC' }}>
                          <div
                            className="h-1.5 rounded-sm transition-all duration-1000"
                            style={{
                              width: `${score}%`,
                              backgroundColor: score >= 80 ? '#16A34A' : score >= 60 ? '#D97706' : '#BF0A30',
                            }}
                          />
                        </div>
                      </Card>
                    );
                  })}
              </div>
            </div>

            {/* ══ SAW RECOMMENDATIONS ══ */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">🎯</span>
                <h2 className="text-xl font-bold" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
                  Rekomendasi Prioritas Belajar
                </h2>
              </div>
              <div className="space-y-4">
                {sawRecommendations.map((rec, index) => (
                  <ExpandableRecommendationCard key={rec.categoryKey} rec={rec} index={index} />
                ))}
              </div>
            </div>
          </div>

          {/* ══ EXPLANATION CARD ══ */}
          <div className="mt-8">
            <Card className="p-6 md:p-8">
              <h3 className="text-lg font-bold mb-3" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
                Bagaimana rekomendasi dihitung?
              </h3>
              <div className="text-sm space-y-2 leading-relaxed" style={{ color: '#2C1F0E' }}>
                <p>
                  Sistem kami menggunakan metode <b>SAW (Simple Additive Weighting)</b> untuk menghitung prioritas belajar:
                </p>
                <ul className="list-disc list-inside space-y-1.5 ml-2">
                  <li>Skor akhir dihitung berdasarkan bobot soal (Level 1-3). Soal sulit (C1/C2) memberi poin lebih besar.</li>
                  <li>Sistem mendeteksi level CEFR Anda (A1-C2) berdasarkan seberapa konsisten Anda menjawab benar di tiap tingkat kesulitan.</li>
                  <li>Metode SAW memberikan prioritas lebih tinggi pada kategori yang masih memiliki kesalahan di level Dasar (A1/A2).</li>
                  <li>Sistem menyarankan untuk fokus pada area dengan potensi peningkatan skor terbesar.</li>
                </ul>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* ════ DETAILED REVIEW MODAL ════ */}
      {showDetails && (
        <div className="fixed inset-0 bg-[#0A2463]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="bg-[#FAF6EC] rounded-sm w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-[#C8B99A]">
            <RedRule />

            {/* Modal Header */}
            <div className="p-5 border-b flex justify-between items-center bg-[#FAF6EC] sticky top-0 z-10" style={{ borderColor: '#C8B99A' }}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <h2 className="text-2xl font-bold" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
                  Pembahasan Soal
                </h2>

                {/* Language Toggle Classic */}
                <div className="flex bg-[#EDE4CC] p-1 rounded-sm border border-[#C8B99A]">
                  <button
                    onClick={() => setExplanationLang('en')}
                    className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-sm transition-colors ${explanationLang === 'en' ? 'bg-[#0A2463] text-white shadow-sm' : 'text-[#6B5A42] hover:text-[#0A2463]'}`}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setExplanationLang('id')}
                    className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-sm transition-colors ${explanationLang === 'id' ? 'bg-[#0A2463] text-white shadow-sm' : 'text-[#6B5A42] hover:text-[#0A2463]'}`}
                  >
                    Indonesia
                  </button>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowDetails(false)}>
                Tutup
              </Button>
            </div>

            {/* Modal Body */}
            <div className="p-4 md:p-6 overflow-y-auto flex-1" style={{ backgroundColor: '#F2ECD8' }}>
              {detailedQuestions.length > 0 ? (
                <div className="space-y-6">
                  {detailedQuestions.map((item, index) => {
                    const userAnswer = examResult.answers[item.id];
                    const isCorrect = userAnswer === item.correct_answer;

                    return (
                      <Card key={item.id} className="p-6 relative overflow-hidden" style={{ borderLeft: `4px solid ${isCorrect ? '#16A34A' : '#BF0A30'}` }}>
                        <div className="flex items-start justify-between mb-5">
                          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#6B5A42' }}>
                            Soal No. {index + 1}
                          </span>
                          <span
                            className="px-2 py-1 border rounded-sm text-[9px] font-black tracking-widest"
                            style={{
                              backgroundColor: isCorrect ? 'rgba(22,163,74,0.1)' : 'rgba(191,10,48,0.1)',
                              color: isCorrect ? '#16A34A' : '#BF0A30',
                              borderColor: isCorrect ? 'rgba(22,163,74,0.3)' : 'rgba(191,10,48,0.3)',
                            }}
                          >
                            {isCorrect ? 'BENAR' : 'SALAH'}
                          </span>
                        </div>

                        {/* Teks Soal menggunakan font sans-serif & text-black sesuai request sebelumnya */}
                        <p className="text-black font-sans text-lg mb-6 whitespace-pre-wrap leading-relaxed">{item.question_text}</p>

                        <div className="space-y-3 mb-6">
                          {['A', 'B', 'C', 'D', 'E'].map((opt) => {
                            const optText = item.options?.[opt];
                            if (!optText) return null;

                            let optionStyle = { backgroundColor: '#FAF6EC', borderColor: '#C8B99A', color: '#2C1F0E' };

                            if (opt === item.correct_answer) {
                              optionStyle = { backgroundColor: 'rgba(22,163,74,0.1)', borderColor: '#16A34A', color: '#0A2463' }; // Jawaban Benar
                            } else if (opt === userAnswer && !isCorrect) {
                              optionStyle = { backgroundColor: 'rgba(191,10,48,0.1)', borderColor: '#BF0A30', color: '#0A2463' }; // Jawaban Salah User
                            }

                            return (
                              <div key={opt} className="p-4 rounded-sm border flex items-center transition-all" style={optionStyle}>
                                <span className="w-8 font-bold text-sans">{opt}.</span>
                                <span className="flex-1 font-sans text-[15px]">{optText}</span>

                                {opt === item.correct_answer && (
                                  <svg className="w-5 h-5 ml-2" style={{ color: '#16A34A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                                {opt === userAnswer && !isCorrect && (
                                  <svg className="w-5 h-5 ml-2" style={{ color: '#BF0A30' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Kotak Penjelasan */}
                        <div className="rounded-sm p-5 border" style={{ backgroundColor: '#EDE4CC', borderColor: '#C8B99A' }}>
                          <div className="flex items-center mb-3">
                            <span className="mr-2 text-lg">📝</span>
                            <h4 className="text-[11px] font-black uppercase tracking-widest" style={{ color: '#0A2463' }}>
                              Ulasan ({explanationLang === 'en' ? 'English' : 'Indonesia'})
                            </h4>
                          </div>
                          <p className="text-sm leading-relaxed" style={{ color: '#2C1F0E', fontFamily: "'DM Sans',sans-serif" }}>
                            {explanationLang === 'id' ? item.explanation_bahasa || 'Maaf, penjelasan bahasa Indonesia belum tersedia untuk soal ini.' : item.explanation || 'No explanation available for this question.'}
                          </p>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-lg italic" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#6B5A42' }}>
                    Memuat arsip rincian soal...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════ PRACTICE CONFIRMATION MODAL ════ */}
      {isPracticeModalOpen && selectedPracticeCategory && (
        <div className="fixed inset-0 bg-[#0A2463]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="bg-[#FAF6EC] rounded-sm w-full max-w-md border border-[#C8B99A] overflow-hidden shadow-2xl">
            <RedRule />
            <div className="p-6 md:p-8">
              <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
                Latihan Fokus: {selectedPracticeCategory.category}
              </h3>

              <div className="border rounded-sm p-4 mb-5" style={{ backgroundColor: 'rgba(217,119,6,0.1)', borderColor: 'rgba(217,119,6,0.3)' }}>
                <p className="text-[13px] font-bold" style={{ color: '#D97706' }}>
                  Sistem mendeteksi skor {selectedPracticeCategory.category} Anda masih menjadi area kelemahan utama.
                </p>
              </div>

              <p className="text-sm leading-relaxed mb-6" style={{ color: '#2C1F0E' }}>
                Sesi khusus ini terdiri dari <b>15 soal adaptif</b> pada kategori {selectedPracticeCategory.category} untuk mempertajam pemahaman dan meningkatkan akurasi Anda.
              </p>

              <div className="flex justify-end space-x-3 pt-4 border-t" style={{ borderColor: 'rgba(200,185,154,0.4)' }}>
                <Button variant="outline" onClick={() => setIsPracticeModalOpen(false)}>
                  Nanti Saja
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    const catKey = selectedPracticeCategory.categoryKey;
                    const dbCategory = catKey.charAt(0).toUpperCase() + catKey.slice(1);
                    navigate(`/siswa/exam?paket=practice&category=${dbCategory}`);
                  }}
                >
                  Mulai Latihan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Komponen Child ExpandableRecommendationCard ──
const ExpandableRecommendationCard = ({ rec, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Menyesuaikan warna badge agar bernuansa klasik (opsional, jika rec.color dari backend terlalu terang)
  const badgeColor = index === 0 ? '#BF0A30' : index === 1 ? '#D97706' : '#1A4FAD';

  return (
    <Card className="p-4 transition-all duration-200 hover:shadow-md cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-sm flex items-center justify-center text-white text-[13px] font-bold mr-4 border" style={{ backgroundColor: badgeColor, borderColor: '#0A2463' }}>
            {index + 1}
          </div>
          <div>
            <h3 className="font-bold text-base" style={{ color: '#0A2463', fontFamily: "'Cormorant Garamond',serif" }}>
              {rec.category}
            </h3>
            <p className="text-[11px] font-bold uppercase tracking-widest mt-0.5" style={{ color: '#6B5A42' }}>
              {rec.label}
            </p>
          </div>
        </div>
        <div className="text-right flex items-center">
          <div className="mr-3">
            <div className="text-[11px] font-bold" style={{ color: '#6B5A42' }}>
              Skor: <span style={{ color: '#0A2463' }}>{rec.rawScore}/100</span>
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest mt-0.5" style={{ color: badgeColor }}>
              Prioritas: {(rec.priorityScore * 100).toFixed(1)}%
            </div>
          </div>
          <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} style={{ color: '#C8B99A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'rgba(200,185,154,0.4)' }}>
          <div className="rounded-sm p-4 mb-3 border" style={{ backgroundColor: '#EDE4CC', borderColor: '#C8B99A' }}>
            <p className="text-sm leading-relaxed" style={{ color: '#0A2463' }}>
              <strong className="text-[10px] uppercase tracking-widest" style={{ color: '#6B5A42' }}>
                Arahan Sistem:
              </strong>
              <br />
              {rec.recommendation}
            </p>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono font-bold" style={{ color: '#6B5A42' }}>
            <span>Kebutuhan Belajar: {rec.cost}/100</span>
            <span>Bobot SAW: {(rec.weight * 100).toFixed(0)}%</span>
          </div>
        </div>
      )}
    </Card>
  );
};

export default Result;
