import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { calculateSAWPriority, calculateOverallCEFR } from '../../lib/saw';
import { db } from '../../lib/supabase';
// Import UI components dipertahankan
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import AnswerKeyBreakdown from '../../components/siswa/AnswerKeyBreakdown';

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

  const packageId = location.state?.examResult?.packageId || examResult?.scores?.package_id;
  const isDiagnostic = packageId === 'kickstart_diagnostic';
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
              {isDiagnostic && (
                <div className="flex flex-col items-center bg-[#EDE4CC]/60 border border-[#C8B99A]/50 px-5 py-2 rounded-sm">
                  <span className="text-[8px] font-black uppercase tracking-widest text-[#6B5A42] mb-0.5">
                    Prediksi Level CEFR
                  </span>
                  <span className="text-3xl font-black text-[#0A2463]" style={{ fontFamily: "'Cormorant Garamond',serif" }}>
                    {overallCEFR}
                  </span>
                </div>
              )}
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
            <Button
              variant="primary"
              onClick={() => navigate('/siswa/dashboard')}
            >
              Kembali ke Dashboard
            </Button>
            <Button variant="secondary" onClick={() => setShowDetails(true)}>
              Lihat Pembahasan
            </Button>
          </div>

          {isDiagnostic && (
            <>
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
                      .filter(([category]) => category !== 'total' && category !== 'package_id')
                      .map(([category, data]) => {
                        const score = typeof data === 'object' ? data.score : data;

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
                            {typeof data === 'object' && data.difficultyStats && (
                              <div className="mt-3 text-[10px] text-stone-500 font-mono flex gap-x-4 border-t pt-2" style={{ borderColor: 'rgba(200,185,154,0.3)' }}>
                                {Object.entries(data.difficultyStats).map(([lvl, stats]) => {
                                  const lvlLabel = lvl === '1' ? 'A1/A2' : lvl === '2' ? 'B1/B2' : 'C1/C2';
                                  return (
                                    <div key={lvl}>
                                      <span className="font-bold text-stone-600">{lvlLabel}:</span> {stats.correct}/{stats.total}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
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
            </>
          )}
        </div>
      </div>

      {/* ════ DETAILED REVIEW MODAL ════ */}
      <AnswerKeyBreakdown
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        detailedQuestions={detailedQuestions}
        examResult={examResult}
        explanationLang={explanationLang}
        setExplanationLang={setExplanationLang}
      />


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
