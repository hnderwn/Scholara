import { useState, useEffect } from 'react';
import { db } from '../../lib/supabase';
// Import komponen UI tetap dipertahankan agar tidak mengubah struktur dependensi
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

// ── Reusable dividers (Sesuai dengan tema) ──
const RedRule = ({ opacity = 1 }) => <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,#BF0A30 25%,#BF0A30 75%,transparent)', opacity }} />;
const GoldRule = ({ opacity = 1 }) => <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,#C8B99A 30%,#C8B99A 70%,transparent)', opacity }} />;

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

          <div className="flex items-center bg-[#EDE4CC] border border-[#C8B99A] rounded-sm px-3.5 py-2.5 transition-all focus-within:border-[#1A4FAD] focus-within:shadow-[0_0_0_3px_rgba(26,79,173,0.12)]">
            <span className="text-[#A8946C] mr-2 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Cari nama atau sekolah..."
              className="outline-none text-[13px] text-[#2C1F0E] w-full md:w-72 bg-transparent font-['DM_Sans'] placeholder-[#A8946C]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
        {selectedDetails && (
          <div className="fixed inset-0 bg-[#0A2463]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity">
            <div className="max-w-2xl w-full bg-[#FAF6EC] border border-[#C8B99A] rounded-sm shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
              {/* Aksen RedRule di puncak Modal Sesuai Permintaan */}
              <RedRule />

              <div className="p-6 md:p-8">
                {/* Modal Header */}
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-3xl font-bold leading-tight text-[#0A2463]" style={{ fontFamily: "'Cormorant Garamond',serif" }}>
                      {selectedDetails.profiles?.full_name || 'Anonymous Student'}
                    </h2>
                    <p className="text-sm italic text-[#6B5A42] mt-1" style={{ fontFamily: "'IM Fell English',serif" }}>
                      {selectedDetails.profiles?.school || 'Institusi Tidak Diketahui'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#6B5A42] mb-1">Skor Total</p>
                    <p className="text-4xl font-black leading-none" style={{ fontFamily: "'Cormorant Garamond',serif", color: selectedDetails.score_total >= 80 ? '#16A34A' : selectedDetails.score_total >= 60 ? '#D97706' : '#BF0A30' }}>
                      {selectedDetails.score_total}
                    </p>
                  </div>
                </div>

                <GoldRule opacity={0.6} />

                {/* Score Grid - Diubah menjadi gaya kartu klasik (bukan tailwind pastel color logic) */}
                <div className="grid grid-cols-2 gap-4 mt-8 mb-8">
                  {[
                    { label: 'Grammar', key: 'grammar' },
                    { label: 'Vocabulary', key: 'vocab' },
                    { label: 'Reading', key: 'reading' },
                    { label: 'Cloze', key: 'cloze' },
                  ].map((cat) => (
                    <div key={cat.label} className="p-4 rounded-sm bg-[#F2ECD8] border border-[rgba(200,185,154,0.5)] flex items-center justify-between transition-transform hover:-translate-y-1">
                      <span className="text-[10px] font-black text-[#6B5A42] uppercase tracking-widest">{cat.label}</span>
                      <span className="text-2xl font-black text-[#0A2463]" style={{ fontFamily: "'Cormorant Garamond',serif" }}>
                        {selectedDetails.category_scores?.[cat.key]?.score || 0}%
                      </span>
                    </div>
                  ))}
                </div>

                {/* Date & Exam Info */}
                <div className="bg-[#0A2463] border border-[rgba(201,168,76,0.3)] text-white rounded-sm p-6 mb-8 relative overflow-hidden">
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#C9A84C 25%,#C9A84C 75%,transparent)' }} />
                  <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: 'rgba(201,168,76,0.7)' }}>
                    ✦ Waktu Pelaksanaan Ujian
                  </p>
                  <p className="text-lg font-bold" style={{ fontFamily: "'Cormorant Garamond',serif" }}>
                    {new Date(selectedDetails.created_at).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}
                  </p>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,transparent,#C9A84C 25%,#C9A84C 75%,transparent)' }} />
                </div>

                {/* Close Action */}
                <button
                  onClick={() => setSelectedDetails(null)}
                  className="w-full py-3 rounded-sm bg-[#FAF6EC] border border-[#C8B99A] text-[#6B5A42] text-sm font-bold uppercase tracking-wider transition-all hover:border-[#0A2463] hover:text-[#0A2463]"
                >
                  Tutup Rincian
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsCenter;
