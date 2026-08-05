import React, { useRef, useEffect } from 'react';
import { RedRule, GoldRule } from '../ui/Rules';
import { exportToPDF } from '../../utils/export';

/**
 * Modal Laporan Detail Hasil Ujian & Latihan untuk Siswa
 */
const StudentReportModal = ({ isOpen, report, onClose }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen || !report) return null;

  const packageNames = {
    kickstart_diagnostic: 'Ujian Diagnostik Awal',
    basic_mastery: 'Ujian Basic Mastery',
    pre_intermediate: 'Ujian Pre-Intermediate',
    intermediate_path: 'Ujian Intermediate Path',
    upper_intermediate: 'Ujian Upper-Intermediate',
    advanced_pro: 'Ujian Advanced Pro',
    grammar_master: 'Latihan Penguatan: Grammar',
    vocab_power: 'Latihan Penguatan: Vocabulary',
    reading_pro: 'Latihan Penguatan: Reading',
    cloze_challenge: 'Latihan Penguatan: Cloze'
  };

  const getCategoryScore = (catData) => {
    if (!catData) return 0;
    if (typeof catData === 'number') return catData;
    if (typeof catData === 'object' && catData !== null) {
      if (typeof catData.score === 'number') return catData.score;
    }
    return 0;
  };

  const name = packageNames[report.package_id || report.category_scores?.package_id] || 'Ujian / Latihan';
  const isTryout = report.exam_type === 'tryout';

  const grammarScore = getCategoryScore(report.category_scores?.grammar);
  const vocabScore = getCategoryScore(report.category_scores?.vocab);
  const readingScore = getCategoryScore(report.category_scores?.reading);
  const clozeScore = getCategoryScore(report.category_scores?.cloze);

  // Cari skill terlemah untuk rekomendasi belajar mandiri
  const scoresArr = [
    { name: 'Grammar', score: grammarScore, rec: 'Latihan Grammar Master' },
    { name: 'Vocabulary', score: vocabScore, rec: 'Latihan Vocabulary Power' },
    { name: 'Reading', score: readingScore, rec: 'Latihan Reading Pro' },
    { name: 'Cloze', score: clozeScore, rec: 'Latihan Cloze Challenge' }
  ];
  
  // Saring hanya untuk materi yang benar-benar diuji dalam sesi
  const testedScores = isTryout ? scoresArr : scoresArr.filter(s => {
    const pkgId = report.package_id || report.category_scores?.package_id;
    if (pkgId === 'grammar_master') return s.name === 'Grammar';
    if (pkgId === 'vocab_power') return s.name === 'Vocabulary';
    if (pkgId === 'reading_pro') return s.name === 'Reading';
    if (pkgId === 'cloze_challenge') return s.name === 'Cloze';
    return false;
  });

  const weakest = testedScores.reduce((prev, current) => (prev.score < current.score) ? prev : current, { score: 100 });

  const handleExportPDF = () => {
    const columns = ['Kategori Skill', 'Nilai Perolehan', 'Ambang Batas Kelulusan', 'Status'];
    const rows = [
      ['Grammar (Struktur Bahasa)', `${grammarScore}%`, '80%', grammarScore >= 80 ? 'Kompeten' : 'Butuh Penguatan'],
      ['Vocabulary (Kosakata)', `${vocabScore}%`, '80%', vocabScore >= 80 ? 'Kompeten' : 'Butuh Penguatan'],
      ['Reading (Membaca Bacaan)', `${readingScore}%`, '80%', readingScore >= 80 ? 'Kompeten' : 'Butuh Penguatan'],
      ['Cloze (Kalimat Rumpang)', `${clozeScore}%`, '80%', clozeScore >= 80 ? 'Kompeten' : 'Butuh Penguatan'],
    ];
    exportToPDF(
      `LAPORAN HASIL ${name.toUpperCase()}`,
      columns,
      rows,
      `Laporan_${name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
      'portrait'
    );
  };

  return (
    <div className="fixed inset-0 bg-[#0A2463]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity no-print">
      <div
        ref={modalRef}
        tabIndex={-1}
        className="max-w-xl w-full bg-[#FAF6EC] border border-[#C9A84C] rounded-sm shadow-2xl overflow-hidden max-h-[95vh] flex flex-col outline-none"
      >
        <RedRule />
        
        <div className="p-6 md:p-8 flex flex-col flex-1 overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-start mb-6 flex-shrink-0">
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-sm text-white" style={{ background: isTryout ? '#1A4FAD' : '#BF0A30' }}>
                {isTryout ? 'Ujian Utama' : 'Latihan Penguatan'}
              </span>
              <h2 className="text-2xl font-bold text-[#0A2463] mt-2.5" style={{ fontFamily: "'Cormorant Garamond',serif" }}>
                {name}
              </h2>
              <p className="text-[10px] text-[#6B5A42] font-mono mt-1">
                📅 {new Date(report.created_at).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })}
              </p>
            </div>
            
            <div className="text-right">
              <span className="text-[9px] font-black uppercase tracking-widest text-[#6B5A42]">Nilai Total</span>
              <p className="text-4xl font-black" style={{ fontFamily: "'Cormorant Garamond',serif", color: report.score_total >= 80 ? '#16A34A' : report.score_total >= 60 ? '#D97706' : '#BF0A30' }}>
                {report.score_total}
              </p>
              <span className="text-[9px] font-bold text-[#6B5A42]">
                {report.score_total >= 80 ? '✓ LULUS' : '⏳ BELUM LULUS'}
              </span>
            </div>
          </div>

          <GoldRule opacity={0.6} />

          {/* Details body */}
          <div className="flex-1 overflow-y-auto my-6 pr-1 space-y-5 text-left">
            <h4 className="text-xs font-black uppercase tracking-wider text-[#0A2463]">
              Rincian Perolehan Nilai Kategori:
            </h4>
            
            <div className="grid grid-cols-2 gap-3.5">
              {scoresArr.map((cat) => {
                const isTested = isTryout || (
                  (report.package_id || report.category_scores?.package_id) === 'grammar_master' && cat.name === 'Grammar'
                ) || (
                  (report.package_id || report.category_scores?.package_id) === 'vocab_power' && cat.name === 'Vocabulary'
                ) || (
                  (report.package_id || report.category_scores?.package_id) === 'reading_pro' && cat.name === 'Reading'
                ) || (
                  (report.package_id || report.category_scores?.package_id) === 'cloze_challenge' && cat.name === 'Cloze'
                );

                const score = getCategoryScore(
                  cat.name === 'Grammar' ? report.category_scores?.grammar :
                  cat.name === 'Vocabulary' ? report.category_scores?.vocab :
                  cat.name === 'Reading' ? report.category_scores?.reading :
                  report.category_scores?.cloze
                );

                return (
                  <div 
                    key={cat.name} 
                    className="p-3.5 rounded-sm border flex items-center justify-between"
                    style={{
                      background: isTested ? '#F2ECD8' : 'rgba(0,0,0,0.02)',
                      borderColor: isTested ? 'rgba(200,185,154,0.6)' : 'rgba(0,0,0,0.05)',
                      opacity: isTested ? 1 : 0.4
                    }}
                  >
                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#6B5A42]">
                      {cat.name}
                    </span>
                    <span className="text-xl font-bold text-[#0A2463]" style={{ fontFamily: "'Cormorant Garamond',serif" }}>
                      {isTested ? `${score}%` : '—'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Recommendations / Analysis */}
            {weakest && weakest.score < 80 && (
              <div className="bg-[#FAF6EC] border-l-4 border-[#BF0A30] p-4 rounded-r-sm">
                <h5 className="text-xs font-bold text-[#BF0A30] uppercase tracking-wider">Rekomendasi Belajar</h5>
                <p className="text-xs text-[#6B5A42] mt-1">
                  Materi terlemah Anda terdeteksi pada sub-kategori <span className="font-bold text-[#0A2463]">{weakest.name}</span> dengan nilai {weakest.score}%. Kami merekomendasikan Anda untuk melakukan <span className="font-bold text-[#0A2463]">{weakest.rec}</span> untuk mendongkrak kelemahan tersebut.
                </p>
              </div>
            )}
            
            {weakest && weakest.score >= 80 && (
              <div className="bg-[#FAF6EC] border-l-4 border-[#16A34A] p-4 rounded-r-sm">
                <h5 className="text-xs font-bold text-[#16A34A] uppercase tracking-wider">Analisis Hasil</h5>
                <p className="text-xs text-[#6B5A42] mt-1">
                  Luar biasa! Seluruh performa kategori Anda berada di atas ambang kompetensi minimum (&gt;=80%). Pertahankan dan terus asah skill Anda dengan materi level selanjutnya!
                </p>
              </div>
            )}
          </div>

          {/* Footer Action */}
          <div className="flex-shrink-0 pt-2 border-t border-[#C8B99A]/20 flex gap-3">
            <button
              onClick={handleExportPDF}
              className="flex-1 py-3 bg-[#0A2463] hover:bg-[#1A4FAD] text-white text-sm font-bold uppercase tracking-wider rounded-sm transition-colors text-center"
            >
              Cetak PDF
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-[#FAF6EC] border border-[#C8B99A] text-[#6B5A42] hover:border-[#0A2463] hover:text-[#0A2463] text-sm font-bold uppercase tracking-wider rounded-sm transition-colors text-center"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentReportModal;
