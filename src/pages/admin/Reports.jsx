import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/supabase';
import { exportToExcel, exportAnalyticsPDF } from '../../utils/export';
import { calculateReportsStats } from '../../utils/analytics';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { RedRule, GoldRule } from '../../components/ui/Rules';
import ExportDropdown from '../../components/admin/ExportDropdown';

const Reports = () => {
  const { isAdmin } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState(null);

  useEffect(() => {
    if (!isAdmin()) {
      window.location.href = '/siswa/dashboard';
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [resultsResponse, questionsResponse] = await Promise.all([db.getExamResults(), db.getQuestions()]);

      if (resultsResponse.error) throw resultsResponse.error;
      if (questionsResponse.error) throw questionsResponse.error;

      setResults(resultsResponse.data || []);
      setQuestions(questionsResponse.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const stats = calculateReportsStats(results, questions);

  const downloadCSV = () => {
    if (results.length === 0) return;

    const headers = ['Nama Siswa', 'Sekolah', 'Skor Total', 'Grammar', 'Vocab', 'Reading', 'Cloze', 'Tanggal'];

    const rows = results.map((r) => [
      r.profiles?.full_name || 'Anonymous',
      r.profiles?.school || '-',
      r.score_total,
      r.category_scores?.grammar?.score || 0,
      r.category_scores?.vocab?.score || 0,
      r.category_scores?.reading?.score || 0,
      r.category_scores?.cloze?.score || 0,
      new Date(r.created_at).toLocaleDateString(),
    ]);

    const csvContent = [headers, ...rows].map((e) => e.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_Ujian_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    if (results.length === 0) return;
    const dataToExport = results.map(r => ({
      'Nama Siswa': r.profiles?.full_name || 'Anonymous',
      'Sekolah': r.profiles?.school || '—',
      'Tipe Ujian': r.exam_type || 'Ujian',
      'Skor Total': r.score_total,
      'Grammar %': r.category_scores?.grammar?.score || 0,
      'Vocab %': r.category_scores?.vocab?.score || 0,
      'Reading %': r.category_scores?.reading?.score || 0,
      'Cloze %': r.category_scores?.cloze?.score || 0,
      'Tanggal': new Date(r.created_at).toLocaleString('id-ID'),
    }));
    exportToExcel(dataToExport, `Laporan_Analitik_${new Date().toISOString().split('T')[0]}.xlsx`, 'Laporan Ujian');
  };

  const handleExportPDF = () => {
    if (results.length === 0 || !stats) return;

    // Kumpulkan data performa rata-rata per siswa unik
    const studentGroups = {};
    results.forEach(r => {
      const uId = r.user_id;
      if (!uId) return;
      if (!studentGroups[uId]) {
        studentGroups[uId] = {
          name: r.profiles?.full_name || 'Anonymous',
          school: r.profiles?.school || '—',
          cefr: r.profiles?.cefr_level || 'A1/A2',
          scores: [],
          grammar: [],
          vocab: [],
          reading: [],
          cloze: []
        };
      }
      studentGroups[uId].scores.push(r.score_total);
      if (r.category_scores) {
        const getScore = (catData) => {
          if (typeof catData === 'object' && catData !== null) return catData.score || 0;
          return Number(catData) || 0;
        };
        studentGroups[uId].grammar.push(getScore(r.category_scores.grammar));
        studentGroups[uId].vocab.push(getScore(r.category_scores.vocab));
        studentGroups[uId].reading.push(getScore(r.category_scores.reading));
        studentGroups[uId].cloze.push(getScore(r.category_scores.cloze));
      }
    });

    const studentData = Object.values(studentGroups).map(g => ({
      name: g.name,
      school: g.school,
      cefr: g.cefr,
      examCount: g.scores.length,
      averageScore: g.scores.reduce((a, b) => a + b, 0) / g.scores.length,
      avgGrammar: g.grammar.reduce((a, b) => a + b, 0) / (g.grammar.length || 1),
      avgVocab: g.vocab.reduce((a, b) => a + b, 0) / (g.vocab.length || 1),
      avgReading: g.reading.reduce((a, b) => a + b, 0) / (g.reading.length || 1),
      avgCloze: g.cloze.reduce((a, b) => a + b, 0) / (g.cloze.length || 1),
    }));

    exportAnalyticsPDF(
      'SCHOLARA - LAPORAN ANALITIK PERFORMA SISWA',
      stats,
      studentData,
      `Laporan_Analitik_${new Date().toISOString().split('T')[0]}.pdf`
    );
  };

  if (!isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F2ECD8' }}>
        <p className="text-lg italic" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
          Akses ditolak. Khusus Admin.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 space-y-8" style={{ backgroundColor: '#F2ECD8', fontFamily: "'DM Sans',sans-serif" }}>
      {/* ── Header ── */}
      <div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-3">
          <div>
            <h1 className="font-bold text-2xl leading-none" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
              Laporan Analitik
            </h1>
            <p className="text-sm italic mt-1" style={{ fontFamily: "'IM Fell English',serif", color: '#6B5A42' }}>
              Ringkasan komprehensif performa ujian siswa
            </p>
          </div>
          <div className="flex space-x-3 no-print items-center relative">
            {/* Export Dropdown Button */}
            <ExportDropdown
              onPrint={() => window.print()}
              onExportExcel={handleExportExcel}
              onExportPDF={handleExportPDF}
              onExportCSV={downloadCSV}
              label="Ekspor Laporan"
            />

            <Button variant="primary" onClick={() => loadData()}>
              Segarkan Data
            </Button>
          </div>
        </div>
        <GoldRule opacity={0.6} />
      </div>
      {/* ── Main Content ── */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 rounded-full border-2 mx-auto mb-4 animate-spin" style={{ borderColor: '#C8B99A', borderTopColor: '#1A4FAD' }} />
          <p className="text-sm italic" style={{ fontFamily: "'IM Fell English',serif", color: '#6B5A42' }}>
            Memuat laporan analitik...
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* ══ STATS ══ */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mt-6">
              {[
                { label: 'Total Ujian', value: stats.totalExams, icon: '📋', accent: '#1A4FAD' },
                { label: 'Total Siswa', value: stats.totalStudents, icon: '👥', accent: '#16A34A' },
                { label: 'Skor Rata', value: stats.averageScore, icon: '🎯', accent: '#D97706', colorClass: getScoreColor(stats.averageScore) },
                { label: 'Rating', value: Math.round((stats.averageScore / 100) * 5 * 10) / 10, icon: '⭐', accent: '#7C3AED' },
              ].map(({ label, value, icon, accent, colorClass }) => (
                <div
                  key={label}
                  className="rounded-sm p-3 md:p-5 flex flex-col gap-2 md:gap-3 transition-all duration-200 hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(10,36,99,0.1)] cursor-default"
                  style={{ background: '#FAF6EC', border: '1px solid #C8B99A', borderLeft: `4px solid ${accent}` }}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest truncate" style={{ color: '#6B5A42' }}>
                      {label}
                    </p>
                    <span className="text-base md:text-lg">{icon}</span>
                  </div>
                  <p className={`font-bold leading-none ${colorClass || ''}`} style={{ fontFamily: "'Cormorant Garamond',serif", color: colorClass ? undefined : '#0A2463', fontSize: 24 }}>
                    <span className="md:text-[32px]">{value}</span>
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* ══ ANALYTICS GRID ══ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CEFR Distribution */}
            <div className="rounded-sm p-6" style={{ background: '#FAF6EC', border: '1px solid #C8B99A' }}>
              <div className="flex items-center gap-2 mb-2">
                <span>📊</span>
                <h2 className="font-bold text-lg" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
                  Distribusi Level CEFR
                </h2>
              </div>
              <GoldRule opacity={0.6} />

              <div className="space-y-4 mt-5">
                {stats &&
                  Object.entries(stats.cefrDist).map(([level, count]) => {
                    const percentage = stats.totalStudents > 0 ? (count / stats.totalStudents) * 100 : 0;
                    return (
                      <div key={level}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-bold" style={{ color: '#0A2463' }}>
                            {level}
                          </span>
                          <span className="text-xs font-mono" style={{ color: '#6B5A42' }}>
                            {count} Siswa ({Math.round(percentage)}%)
                          </span>
                        </div>
                        <div className="w-full rounded-full h-2" style={{ background: '#EDE4CC' }}>
                          <div
                            className={`h-2 rounded-full transition-all duration-500`}
                            style={{
                              width: `${percentage}%`,
                              background: level.startsWith('C') ? '#7C3AED' : level.startsWith('B') ? '#1A4FAD' : '#16A34A',
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
              </div>
              <p className="mt-6 text-[11px] italic" style={{ fontFamily: "'IM Fell English',serif", color: '#6B5A42' }}>
                * Distribusi tingkat kemahiran CEFR siswa saat ini.
              </p>
            </div>

            {/* Hardest Topics */}
            <div className="rounded-sm p-6" style={{ background: '#FAF6EC', border: '1px solid #C8B99A' }}>
              <div className="flex items-center gap-2 mb-2">
                <span>🧨</span>
                <h2 className="font-bold text-lg" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
                  Rekap Topik Tersulit
                </h2>
              </div>
              <GoldRule opacity={0.6} />

              <div className="mt-5 overflow-hidden rounded-sm" style={{ border: '1px solid #C8B99A' }}>
                <RedRule opacity={0.6} />

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y" style={{ borderColor: 'rgba(200,185,154,0.4)' }}>
                    <thead style={{ background: '#EDE4CC' }}>
                      <tr>
                        <th className="px-4 py-3 text-left text-[10px] font-black uppercase tracking-widest" style={{ color: '#6B5A42' }}>
                          Topik Materi
                        </th>
                        <th className="px-4 py-3 text-right text-[10px] font-black uppercase tracking-widest" style={{ color: '#6B5A42' }}>
                          Error Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'rgba(200,185,154,0.4)' }}>
                      {stats &&
                        stats.hardestTopics.map((item, idx) => (
                          <tr key={idx} className="transition-colors hover:bg-[#EDE4CC]/50">
                            <td className="px-4 py-3 text-sm font-medium" style={{ color: '#0A2463' }}>
                              {item.topic}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span className="px-2 py-1 rounded-sm text-xs font-bold" style={{ background: item.errorRate > 70 ? 'rgba(191,10,48,0.1)' : 'rgba(217,119,6,0.1)', color: item.errorRate > 70 ? '#BF0A30' : '#D97706' }}>
                                {item.errorRate}% Salah
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile List View */}
                <div className="md:hidden divide-y divide-[#C8B99A]/40">
                  {stats &&
                    stats.hardestTopics.map((item, idx) => (
                      <div key={idx} className="px-4 py-3 flex items-center justify-between">
                        <span className="text-sm font-bold text-[#0A2463]">{item.topic}</span>
                        <span className="text-[10px] font-black px-2 py-1 rounded-sm" style={{ background: item.errorRate > 70 ? 'rgba(191,10,48,0.1)' : 'rgba(217,119,6,0.1)', color: item.errorRate > 70 ? '#BF0A30' : '#D97706' }}>
                          {item.errorRate}% Error
                        </span>
                      </div>
                    ))}
                </div>
              </div>
              <p className="mt-6 text-[11px] italic" style={{ fontFamily: "'IM Fell English',serif", color: '#6B5A42' }}>
                * Topik dengan tingkat kesalahan tertinggi dari seluruh jawaban siswa.
              </p>
            </div>
          </div>

          {/* ══ CATEGORY & STOCK ══ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-sm p-6" style={{ background: '#FAF6EC', border: '1px solid #C8B99A' }}>
              <div className="flex items-center gap-2 mb-2">
                <span>📈</span>
                <h2 className="font-bold text-lg" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
                  Rata-rata Skor Kategori
                </h2>
              </div>
              <GoldRule opacity={0.6} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                {stats &&
                  Object.entries(stats.categoryAverages).map(([category, score]) => (
                    <div
                      key={category}
                      className="p-4 flex justify-between items-center rounded-sm transition-all hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(10,36,99,0.08)]"
                      style={{ background: '#F2ECD8', border: '1px solid #C8B99A' }}
                    >
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: '#6B5A42' }}>
                          {category}
                        </p>
                        <p className={`text-2xl font-black ${getScoreColor(score)}`} style={{ fontFamily: "'Cormorant Garamond',serif" }}>
                          {score}
                        </p>
                      </div>
                      <div className="w-14 h-14 rounded-full flex items-center justify-center relative" style={{ border: '3px solid #EDE4CC' }}>
                        <span className="text-xs font-bold" style={{ color: '#0A2463' }}>
                          {score}%
                        </span>
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                          <circle cx="28" cy="28" r="25" fill="none" stroke="#1A4FAD" strokeWidth="3" className="transition-all duration-1000" strokeDasharray={157} strokeDashoffset={157 - (score / 100) * 157} />
                        </svg>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="rounded-sm p-6" style={{ background: '#FAF6EC', border: '1px solid #C8B99A' }}>
              <div className="flex items-center gap-2 mb-2">
                <span>📦</span>
                <h2 className="font-bold text-lg" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
                  Stok Soal
                </h2>
              </div>
              <GoldRule opacity={0.6} />

              <ul className="divide-y mt-3" style={{ borderColor: 'rgba(200,185,154,0.4)' }}>
                {['Grammar', 'Vocabulary', 'Reading', 'Cloze'].map((cat) => {
                  const count = questions.filter((q) => q.category === cat).length;
                  const isLow = count < 50;
                  return (
                    <li key={cat} className="py-3 flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ color: '#0A2463' }}>
                        {cat}
                      </span>
                      <div className="flex items-center">
                        <span className="text-sm font-bold mr-2 font-mono" style={{ color: isLow ? '#BF0A30' : '#16A34A' }}>
                          {count} item
                        </span>
                        {isLow && <span className="flex h-2 w-2 rounded-full animate-pulse" style={{ background: '#BF0A30' }}></span>}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-4 p-2 text-center rounded-sm" style={{ background: '#EDE4CC' }}>
                <p className="text-[9px] uppercase font-black tracking-widest" style={{ color: '#6B5A42' }}>
                  Minimal stok: 50 per kategori
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ RESULT DETAILS MODAL ══ */}
      {selectedResult && (
        <div className="fixed inset-0 bg-[#0A2463]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="rounded-sm max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl bg-[#FAF6EC] border border-[#C8B99A]">
            {/* PENAMBAHAN AKSEN MERAH DI SINI */}
            <RedRule />
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
                  Arsip Rincian Ujian
                </h3>
                <Button variant="outline" size="sm" onClick={() => setSelectedResult(null)}>
                  Tutup
                </Button>
              </div>
              <GoldRule opacity={0.6} />

              <div className="space-y-6 mt-6">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: '#6B5A42' }}>
                    Informasi Profil
                  </h4>
                  <div className="rounded-sm p-5 space-y-3" style={{ background: '#F2ECD8', border: '1px solid rgba(200,185,154,0.5)' }}>
                    {[
                      { label: 'Nama Lengkap', value: selectedResult.profiles?.full_name || 'Unknown' },
                      { label: 'Institusi/Sekolah', value: selectedResult.profiles?.school || 'Unknown' },
                      { label: 'Waktu Pelaksanaan', value: formatDate(selectedResult.created_at) },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between items-end border-b pb-1" style={{ borderColor: 'rgba(200,185,154,0.3)' }}>
                        <span className="text-xs" style={{ color: '#6B5A42' }}>
                          {label}
                        </span>
                        <span className="text-sm font-bold" style={{ color: '#0A2463' }}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: '#6B5A42' }}>
                    Distribusi Nilai
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Skor Total', value: selectedResult.score_total, color: getScoreColor(selectedResult.score_total) },
                      { label: 'Tata Bahasa', value: selectedResult.score_grammar, color: getScoreColor(selectedResult.score_grammar) },
                      { label: 'Kosakata', value: selectedResult.score_vocab, color: getScoreColor(selectedResult.score_vocab) },
                      { label: 'Membaca', value: selectedResult.score_reading, color: getScoreColor(selectedResult.score_reading) },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="rounded-sm p-4 text-center transition-transform hover:-translate-y-1" style={{ background: '#F2ECD8', border: '1px solid rgba(200,185,154,0.5)' }}>
                        <div className={`text-3xl font-black ${color}`} style={{ fontFamily: "'Cormorant Garamond',serif" }}>
                          {value || 0}
                        </div>
                        <div className="text-[10px] uppercase font-bold tracking-widest mt-2" style={{ color: '#6B5A42' }}>
                          {label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
