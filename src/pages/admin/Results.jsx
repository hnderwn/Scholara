import { useState, useEffect } from 'react';
import { db } from '../../lib/supabase';
import { exportToExcel, exportToPDF } from '../../utils/export';
// Import komponen UI tetap dipertahankan agar tidak mengubah struktur dependensi
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { RedRule, GoldRule } from '../../components/ui/Rules';
import ExportDropdown from '../../components/admin/ExportDropdown';
import ResultDetailModal from '../../components/admin/ResultDetailModal';

const ResultsCenter = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [selectedDetails, setSelectedDetails] = useState(null);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      setLoading(true);
      const { data, error } = await db.getExamResults();
      if (error) throw error;
      setResults(data || []);
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    const dataToExport = filteredResults.map(r => ({
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
    exportToExcel(dataToExport, `Hasil_Ujian_${new Date().toISOString().split('T')[0]}.xlsx`, 'Hasil Ujian');
  };

  const handleExportPDF = () => {
    const columns = [
      'Nama Siswa',
      'Sekolah',
      'Tipe Ujian',
      'Skor Total',
      'Grammar',
      'Vocab',
      'Reading',
      'Cloze',
      'Tanggal'
    ];
    
    const rows = filteredResults.map(r => [
      r.profiles?.full_name || 'Anonymous',
      r.profiles?.school || '—',
      r.exam_type || 'Ujian',
      `${r.score_total}/100`,
      `${r.category_scores?.grammar?.score || 0}%`,
      `${r.category_scores?.vocab?.score || 0}%`,
      `${r.category_scores?.reading?.score || 0}%`,
      `${r.category_scores?.cloze?.score || 0}%`,
      new Date(r.created_at).toLocaleDateString('id-ID')
    ]);
    
    exportToPDF('SCHOLARA - LAPORAN HASIL UJIAN SISWA', columns, rows, `Laporan_Hasil_Ujian_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedResults = [...results].sort((a, b) => {
    let valA, valB;

    if (sortConfig.key === 'full_name') {
      valA = a.profiles?.full_name?.toLowerCase() || '';
      valB = b.profiles?.full_name?.toLowerCase() || '';
    } else {
      valA = a[sortConfig.key];
      valB = b[sortConfig.key];
    }

    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const filteredResults = sortedResults.filter((r) => r.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || r.profiles?.school?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8" style={{ backgroundColor: '#F2ECD8', fontFamily: "'DM Sans',sans-serif" }}>
      <div className="max-w-7xl mx-auto">
        {/* ── Page header ── */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="font-bold text-3xl leading-none" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
              Hasil Ujian
            </h1>
            <p className="text-sm italic mt-1" style={{ fontFamily: "'IM Fell English',serif", color: '#6B5A42' }}>
              Gudang data seluruh nilai siswa secara mendetail.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="w-full sm:w-auto flex items-center bg-[#EDE4CC] border border-[#C8B99A] rounded-sm px-3.5 py-2.5 transition-all focus-within:border-[#1A4FAD] focus-within:shadow-[0_0_0_3px_rgba(26,79,173,0.12)]">
              <span className="text-[#A8946C] mr-2 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Cari nama atau sekolah..."
                className="outline-none text-[13px] text-[#2C1F0E] w-full sm:w-64 bg-transparent font-['DM_Sans'] placeholder-[#A8946C]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <ExportDropdown
              onPrint={() => window.print()}
              onExportExcel={handleExportExcel}
              onExportPDF={handleExportPDF}
            />
          </div>
        </div>
        <div className="mb-8">
          <GoldRule opacity={0.6} />
        </div>

        {/* ── Data Table Container ── */}
        <div className="rounded-sm overflow-hidden bg-[#FAF6EC] shadow-[0_4px_24px_rgba(10,36,99,0.08)] border border-[#C8B99A]">
          {/* Aksen RedRule Sesuai Permintaan */}
          <RedRule opacity={0.6} />

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#EDE4CC] border-b border-[#C8B99A]">
                  <th className="px-5 py-3.5 text-[10px] font-black text-[#6B5A42] uppercase tracking-widest cursor-pointer hover:text-[#0A2463] transition-colors" onClick={() => handleSort('full_name')}>
                    Siswa {sortConfig.key === 'full_name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-5 py-3.5 text-[10px] font-black text-[#6B5A42] uppercase tracking-widest">Sekolah</th>
                  <th className="px-5 py-3.5 text-[10px] font-black text-[#6B5A42] uppercase tracking-widest cursor-pointer hover:text-[#0A2463] transition-colors" onClick={() => handleSort('score_total')}>
                    Skor {sortConfig.key === 'score_total' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-5 py-3.5 text-[10px] font-black text-[#6B5A42] uppercase tracking-widest">Kategori</th>
                  <th className="px-5 py-3.5 text-[10px] font-black text-[#6B5A42] uppercase tracking-widest cursor-pointer hover:text-[#0A2463] transition-colors" onClick={() => handleSort('created_at')}>
                    Tanggal {sortConfig.key === 'created_at' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-5 py-3.5 text-right text-[10px] font-black text-[#6B5A42] uppercase tracking-widest">Opsi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(200,185,154,0.4)]">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center text-lg italic text-[#6B5A42]" style={{ fontFamily: "'Cormorant Garamond',serif" }}>
                      Memuat arsip hasil ujian...
                    </td>
                  </tr>
                ) : filteredResults.length > 0 ? (
                  filteredResults.map((r) => (
                    <tr key={r.id} className="hover:bg-[#EDE4CC]/50 transition-colors">
                      <td className="px-5 py-4 font-bold text-base text-[#0A2463]" style={{ fontFamily: "'Cormorant Garamond',serif" }}>
                        {r.profiles?.full_name || 'Anonymous'}
                      </td>
                      <td className="px-5 py-4 text-xs text-[#6B5A42]">{r.profiles?.school || '—'}</td>
                      <td className="px-5 py-4">
                        <span className="text-xl font-black" style={{ fontFamily: "'Cormorant Garamond',serif", color: r.score_total >= 80 ? '#16A34A' : r.score_total >= 60 ? '#D97706' : '#BF0A30' }}>
                          {r.score_total}
                        </span>
                        <span className="text-[10px] font-bold text-[#A8946C] ml-0.5">/100</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm bg-[#F2ECD8] border border-[#C8B99A] text-[#0A2463]">{r.exam_type || 'Ujian'}</span>
                      </td>
                      <td className="px-5 py-4 text-xs font-mono text-[#6B5A42]">{new Date(r.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="px-5 py-4 text-right">
                        <button onClick={() => setSelectedDetails(r)} className="text-[11px] font-black text-[#1A4FAD] hover:text-[#0A2463] hover:underline transition-colors tracking-wider">
                          DETAIL
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center text-sm italic text-[#6B5A42]" style={{ fontFamily: "'IM Fell English',serif" }}>
                      Tidak ada data hasil yang ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-[rgba(200,185,154,0.4)]">
            {loading ? (
              <div className="px-6 py-12 text-center text-sm italic text-[#6B5A42]" style={{ fontFamily: "'Cormorant Garamond',serif" }}>
                Memuat arsip hasil...
              </div>
            ) : filteredResults.length > 0 ? (
              filteredResults.map((r) => (
                <div key={r.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0">
                      <div className="font-bold text-lg text-[#0A2463] truncate" style={{ fontFamily: "'Cormorant Garamond',serif" }}>
                        {r.profiles?.full_name || 'Anonymous'}
                      </div>
                      <div className="text-xs text-[#6B5A42] truncate leading-tight">{r.profiles?.school || '—'}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-2xl font-black leading-none" style={{ fontFamily: "'Cormorant Garamond',serif", color: r.score_total >= 80 ? '#16A34A' : r.score_total >= 60 ? '#D97706' : '#BF0A30' }}>
                        {r.score_total}
                      </span>
                      <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm bg-[#F2ECD8] border border-[#C8B99A] text-[#0A2463]">{r.exam_type || 'UJIAN'}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-mono text-[#6B5A42]">{new Date(r.created_at).toLocaleDateString('id-ID')}</span>
                    <button onClick={() => setSelectedDetails(r)} className="text-[11px] font-black text-[#1A4FAD] px-3 py-1.5 border border-[#1A4FAD]/20 rounded-sm">
                      DETAIL
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center text-sm italic text-[#6B5A42]" style={{ fontFamily: "'IM Fell English',serif" }}>
                Hasil tidak ditemukan.
              </div>
            )}
          </div>
          {/* Bottom Gold Accent */}
          <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,#C9A84C 25%,#C9A84C 75%,transparent)' }} />
        </div>

        {/* ══════════ MODAL RINCIAN UJIAN ══════════ */}
        <ResultDetailModal
          isOpen={!!selectedDetails}
          result={selectedDetails}
          onClose={() => setSelectedDetails(null)}
        />
      </div>
    </div>
  );
};

export default ResultsCenter;
