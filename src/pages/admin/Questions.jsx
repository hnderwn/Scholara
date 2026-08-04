import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/supabase';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { exportToExcel, exportToPDF, exportToCSV } from '../../utils/export';
import ExportDropdown from '../../components/admin/ExportDropdown';

// ── Shared helpers ──
const GoldRule = ({ opacity = 1 }) => <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,#C8B99A 30%,#C8B99A 70%,transparent)', opacity }} />;
const RedRule = ({ opacity = 1 }) => <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,#BF0A30 25%,#BF0A30 75%,transparent)', opacity }} />;
const FieldLabel = ({ children }) => (
  <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: '#6B5A42', fontFamily: "'DM Sans',sans-serif" }}>
    {children}
  </label>
);
const fieldStyle = {
  width: '100%',
  background: '#EDE4CC',
  border: '1px solid #C8B99A',
  borderRadius: 2,
  padding: '9px 13px',
  fontSize: 13,
  color: '#2C1F0E',
  outline: 'none',
  fontFamily: "'DM Sans',sans-serif",
  transition: 'border-color 0.15s, box-shadow 0.15s',
};
const focusField = (e) => {
  e.target.style.borderColor = '#1A4FAD';
  e.target.style.boxShadow = '0 0 0 3px rgba(26,79,173,0.12)';
};
const blurField = (e) => {
  e.target.style.borderColor = '#C8B99A';
  e.target.style.boxShadow = 'none';
};

const CAT_COLORS = {
  Grammar: { bg: '#EFF6FF', color: '#1A4FAD', border: '#BFDBFE' },
  Vocabulary: { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' },
  Reading: { bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' },
  Cloze: { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
};

const diffStyle = (d) => {
  if (d === 3) return { bg: '#FFF1F2', color: '#BF0A30', border: '#FECDD3' };
  if (d === 2) return { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' };
  return { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' };
};

const Questions = () => {
  // ── Semua state asli tidak diubah ──
  const { isAdmin } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [formData, setFormData] = useState({
    category: 'Grammar',
    sub_category: '',
    question_text: '',
    options: { A: '', B: '', C: '', D: '', E: '' },
    correct_answer: 'A',
    difficulty: 1,
    weight: 1,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const categories = ['Grammar', 'Vocabulary', 'Reading', 'Cloze'];
  const subCategories = {
    Grammar: ['Tenses & Aspects', 'Passive Voice & Causative', 'Modals & Conditionals', 'Sentence Structure'],
    Vocabulary: ['Word Formation', 'Synonym/Antonym', 'Collocations & Phrasal Verbs', 'Legal/Formal Register'],
    Reading: ['Main Idea/Gist', 'Specific Detail', 'Inference/Implication', 'Reference'],
    Cloze: ['Grammatical Cloze', 'Lexical Cloze', 'Cohesive Devices'],
  };
  const options = ['A', 'B', 'C', 'D', 'E'];

  // ── Semua fungsi asli tidak diubah ──
  useEffect(() => {
    let mounted = true;

    if (!isAdmin()) {
      window.location.href = '/siswa/dashboard';
      return;
    }

    const initQuestions = async () => {
      await loadQuestions();
    };

    initQuestions();

    const safetyTimer = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Admin Questions: Terlalu lama memuat data, memaksa tampil.');
        setLoading(false);
      }
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
    };
  }, []); // Bergantung pada saat mount saja

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const { data, error } = await db.getQuestions();
      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.question_text.trim()) {
        alert('Teks soal wajib diisi');
        return;
      }
      if (!formData.sub_category) {
        alert('Sub-kategori (Topik) wajib dipilih');
        return;
      }
      for (const option of options) {
        if (!formData.options[option]?.trim()) {
          alert(`Pilihan ${option} wajib diisi`);
          return;
        }
      }
      const submissionData = { ...formData, difficulty: parseInt(formData.difficulty), weight: parseInt(formData.weight) };
      if (editingQuestion) {
        const { error } = await db.updateQuestion(editingQuestion.id, submissionData);
        if (error) throw error;
      } else {
        const { error } = await db.createQuestion(submissionData);
        if (error) throw error;
      }
      resetForm();
      await loadQuestions();
    } catch (error) {
      console.error('Error saving question:', error);
      alert('Gagal menyimpan soal. Silakan coba lagi.');
    }
  };

  const handleEdit = (question) => {
    setEditingQuestion(question);
    setFormData({
      category: question.category,
      sub_category: question.sub_category || '',
      question_text: question.question_text,
      options: question.options || { A: '', B: '', C: '', D: '', E: '' },
      correct_answer: question.correct_answer,
      difficulty: question.difficulty || 1,
      weight: question.weight || 1,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus soal ini?')) return;
    try {
      const { error } = await db.deleteQuestion(id);
      if (error) throw error;
      await loadQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Gagal menghapus soal. Silakan coba lagi.');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingQuestion(null);
    setFormData({ category: 'Grammar', sub_category: '', question_text: '', options: { A: '', B: '', C: '', D: '', E: '' }, correct_answer: 'A', difficulty: 1, weight: 1 });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOptionChange = (option, value) => {
    setFormData((prev) => ({ ...prev, options: { ...prev.options, [option]: value } }));
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = q.question_text.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !filterCategory || q.category === filterCategory;
    const matchesDifficulty = !filterDifficulty || q.difficulty === parseInt(filterDifficulty);
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const handleExportExcel = () => {
    const dataToExport = filteredQuestions.map(q => ({
      'Teks Soal': q.question_text || '',
      'Kategori': q.category || '',
      'Sub-Kategori': q.sub_category || '',
      'Level': q.difficulty || 1,
      'Bobot': q.weight || 1,
      'Kunci': q.correct_answer || '',
      'Opsi A': q.options?.A || '',
      'Opsi B': q.options?.B || '',
      'Opsi C': q.options?.C || '',
      'Opsi D': q.options?.D || '',
      'Opsi E': q.options?.E || '',
    }));
    exportToExcel(dataToExport, `Daftar_Soal_${new Date().toISOString().split('T')[0]}.xlsx`, 'Daftar Soal');
  };

  const handleExportCSV = () => {
    const dataToExport = filteredQuestions.map(q => ({
      'Teks Soal': q.question_text || '',
      'Kategori': q.category || '',
      'Sub-Kategori': q.sub_category || '',
      'Level': q.difficulty || 1,
      'Bobot': q.weight || 1,
      'Kunci': q.correct_answer || '',
      'Opsi A': q.options?.A || '',
      'Opsi B': q.options?.B || '',
      'Opsi C': q.options?.C || '',
      'Opsi D': q.options?.D || '',
      'Opsi E': q.options?.E || '',
    }));
    exportToCSV(dataToExport, `Daftar_Soal_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportPDF = () => {
    const columns = ['Teks Soal', 'Kategori', 'Sub-Kategori', 'Level', 'Kunci'];
    const rows = filteredQuestions.map(q => [
      q.question_text ? (q.question_text.length > 50 ? q.question_text.substring(0, 50) + '...' : q.question_text) : '',
      q.category || '',
      q.sub_category || '',
      q.difficulty || 1,
      q.correct_answer || '',
    ]);
    exportToPDF('SCHOLARA - LAPORAN DIREKTORI SOAL', columns, rows, `Laporan_Soal_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
  const paginatedQuestions = filteredQuestions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterCategory, filterDifficulty]);

  if (!isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F2ECD8' }}>
        <p style={{ color: '#6B5A42', fontFamily: "'IM Fell English',serif", fontStyle: 'italic' }}>Akses ditolak. Khusus Admin.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8" style={{ backgroundColor: '#F2ECD8', fontFamily: "'DM Sans',sans-serif" }}>
      {/* ── Page header ── */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="font-bold text-3xl leading-none" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
              Manajemen Soal
            </h1>
            <p className="text-sm italic mt-1" style={{ fontFamily: "'IM Fell English',serif", color: '#6B5A42' }}>
              Kelola soal ujian untuk semua kategori
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-5 py-2.5 text-sm font-bold text-white rounded-sm transition-all whitespace-nowrap self-start"
            style={{ background: '#1A4FAD', boxShadow: '0 4px 12px rgba(26,79,173,0.25)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#2460C8';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#1A4FAD';
              e.currentTarget.style.transform = 'none';
            }}
          >
            + Tambah Soal Baru
          </button>
        </div>
        <div className="mt-4">
          <GoldRule opacity={0.6} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── Stats per kategori ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {categories.map((category) => {
            const count = questions.filter((q) => q.category === category).length;
            const c = CAT_COLORS[category];
            return (
              <div key={category} className="rounded-sm p-3 md:p-4 flex items-center justify-between transition-all duration-200" style={{ background: '#FAF6EC', border: '1px solid #C8B99A', borderLeft: `4px solid ${c.color}` }}>
                <div className="min-w-0">
                  <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest mb-0.5 md:mb-1 truncate" style={{ color: '#6B5A42' }}>
                    {category}
                  </p>
                  <p className="text-xl md:text-2xl font-bold leading-none" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
                    {count}
                  </p>
                </div>
                <div className="w-8 h-8 md:w-9 md:h-9 rounded-sm flex items-center justify-center flex-shrink-0" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                  <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke={c.color} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Table card ── */}
        <div className="rounded-sm overflow-hidden" style={{ background: '#FAF6EC', border: '1px solid #C8B99A', boxShadow: '0 4px 24px rgba(10,36,99,0.07)' }}>
          <RedRule opacity={0.6} />

          {/* Filter bar */}
          <div className="px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3" style={{ borderBottom: '1px solid #C8B99A', background: '#EDE4CC' }}>
            <p className="font-bold text-lg" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
              Data Perolehan Soal <span className="text-base">({questions.length})</span>
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative">
                <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: '#A8946C' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input type="text" placeholder="Cari teks soal..." style={{ ...fieldStyle, paddingLeft: 30, minWidth: 200 }} onFocus={focusField} onBlur={blurField} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <select style={fieldStyle} onFocus={focusField} onBlur={blurField} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                <option value="">Semua Kategori</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <select style={fieldStyle} onFocus={focusField} onBlur={blurField} value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)}>
                <option value="">Semua Level</option>
                <option value="1">Level 1 (A1/A2)</option>
                <option value="2">Level 2 (B1/B2)</option>
                <option value="3">Level 3 (C1/C2)</option>
              </select>
              <ExportDropdown
                onPrint={() => window.print()}
                onExportExcel={handleExportExcel}
                onExportCSV={handleExportCSV}
                onExportPDF={handleExportPDF}
              />
            </div>
          </div>

          {/* Table / Card List body */}
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 rounded-full border-2 mx-auto mb-4 animate-spin" style={{ borderColor: '#C8B99A', borderTopColor: '#1A4FAD' }} />
              <p className="text-sm italic" style={{ fontFamily: "'IM Fell English',serif", color: '#6B5A42' }}>
                Memuat basis data soal...
              </p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr style={{ background: '#EDE4CC', borderBottom: '1px solid #C8B99A' }}>
                      {['Soal & Topik', 'Level', 'Point', 'Key', ''].map((col, i) => (
                        <th key={i} className="px-5 py-3 text-[10px] font-black uppercase tracking-widest" style={{ color: '#6B5A42', textAlign: i === 4 ? 'right' : 'left' }}>
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedQuestions.map((q) => {
                      const c = CAT_COLORS[q.category] || CAT_COLORS.Grammar;
                      const d = diffStyle(q.difficulty);
                      return (
                        <tr
                          key={q.id}
                          style={{ borderBottom: '1px solid rgba(200,185,154,0.35)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#EDE4CC')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td className="px-5 py-3.5" style={{ maxWidth: 360 }}>
                            <p className="text-sm font-semibold truncate" style={{ color: '#2C1F0E' }}>
                              {q.question_text}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm" style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
                                {q.category}
                              </span>
                              <span className="text-[10px] font-semibold" style={{ color: '#6B5A42' }}>
                                • {q.sub_category || 'General'}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-sm" style={{ background: d.bg, color: d.color, border: `1px solid ${d.border}` }}>
                              Lvl {q.difficulty || 1}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-xs font-mono" style={{ color: '#6B5A42' }}>
                            W:{q.weight || 1}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="w-6 h-6 flex items-center justify-center rounded-sm text-xs font-black" style={{ background: '#0A2463', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.4)' }}>
                              {q.correct_answer}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button onClick={() => handleEdit(q)} className="text-xs font-bold mr-4 transition-colors" style={{ color: '#1A4FAD' }}>
                              Edit
                            </button>
                            <button onClick={() => handleDelete(q.id)} className="text-xs font-bold transition-colors" style={{ color: '#BF0A30' }}>
                              Hapus
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARD LIST */}
              <div className="md:hidden divide-y divide-[#C8B99A]/40">
                {paginatedQuestions.map((q) => {
                  const c = CAT_COLORS[q.category] || CAT_COLORS.Grammar;
                  const d = diffStyle(q.difficulty);
                  return (
                    <div key={q.id} className="p-4 bg-white/50">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#0A2463] line-clamp-2 leading-snug">{q.question_text}</p>
                        </div>
                        <span className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-sm text-xs font-black" style={{ background: '#0A2463', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.4)' }}>
                          {q.correct_answer}
                        </span>
                      </div>

                      <div className="flex items-center flex-wrap gap-2 mb-4">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm" style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
                          {q.category}
                        </span>
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-sm" style={{ background: d.bg, color: d.color, border: `1px solid ${d.border}` }}>
                          Lvl {q.difficulty || 1}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-[#6B5A42]">W:{q.weight || 1}</span>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-dashed border-[#C8B99A]/50">
                        <span className="text-[10px] font-semibold text-[#6B5A42] truncate">{q.sub_category || 'General Topic'}</span>
                        <div className="flex items-center gap-4">
                          <button onClick={() => handleEdit(q)} className="text-xs font-bold text-[#1A4FAD]">
                            Edit
                          </button>
                          <button onClick={() => handleDelete(q.id)} className="text-xs font-bold text-[#BF0A30]">
                            Hapus
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-3.5 flex items-center justify-between flex-wrap gap-3" style={{ background: '#EDE4CC', borderTop: '1px solid #C8B99A' }}>
              <p className="text-xs" style={{ color: '#6B5A42' }}>
                Menampilkan <b style={{ color: '#0A2463' }}>{(currentPage - 1) * itemsPerPage + 1}</b> – <b style={{ color: '#0A2463' }}>{Math.min(currentPage * itemsPerPage, filteredQuestions.length)}</b> dari{' '}
                <b style={{ color: '#0A2463' }}>{filteredQuestions.length}</b> soal
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-xs font-bold rounded-sm transition-all disabled:opacity-40"
                  style={{ background: '#FAF6EC', border: '1px solid #C8B99A', color: '#0A2463' }}
                >
                  ← Prev
                </button>
                {[...Array(totalPages)].map((_, i) => {
                  const pageNum = i + 1;
                  if (totalPages > 5 && Math.abs(pageNum - currentPage) > 2 && pageNum !== 1 && pageNum !== totalPages) {
                    if (pageNum === 2 || pageNum === totalPages - 1)
                      return (
                        <span key={pageNum} className="px-1 text-xs" style={{ color: '#6B5A42' }}>
                          …
                        </span>
                      );
                    return null;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8 h-8 text-xs font-bold rounded-sm transition-all"
                      style={{
                        background: currentPage === pageNum ? '#0A2463' : '#FAF6EC',
                        color: currentPage === pageNum ? '#C9A84C' : '#0A2463',
                        border: currentPage === pageNum ? '1px solid #0A2463' : '1px solid #C8B99A',
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-xs font-bold rounded-sm transition-all disabled:opacity-40"
                  style={{ background: '#FAF6EC', border: '1px solid #C8B99A', color: '#0A2463' }}
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,#C9A84C 25%,#C9A84C 75%,transparent)' }} />
        </div>
      </div>

      {/* ══════════ MODAL FORM ══════════ */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(10,36,99,0.35)', backdropFilter: 'blur(2px)' }}>
          <div className="w-full max-w-3xl rounded-sm overflow-hidden shadow-2xl flex flex-col" style={{ background: '#FAF6EC', border: '1px solid #C9A84C', maxHeight: '90vh' }}>
            <RedRule />

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 flex-shrink-0" style={{ borderBottom: '1px solid #C8B99A' }}>
              <div>
                <h3 className="font-bold text-2xl leading-none" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
                  {editingQuestion ? 'Perbarui Soal' : 'Tambah Soal Baru'}
                </h3>
                <p className="text-xs italic mt-0.5" style={{ fontFamily: "'IM Fell English',serif", color: '#6B5A42' }}>
                  {editingQuestion ? 'Edit konten soal yang ada' : 'Isi semua kolom wajib di bawah ini'}
                </p>
              </div>
              <button
                onClick={resetForm}
                className="p-1.5 rounded-sm transition-colors"
                style={{ color: '#6B5A42' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#EDE4CC')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
              <div className="px-6 py-5 space-y-5">
                {/* Kategori + Sub + Difficulty + Weight */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <FieldLabel>Kategori Utama</FieldLabel>
                    <select name="category" value={formData.category} onChange={handleInputChange} style={fieldStyle} onFocus={focusField} onBlur={blurField} required>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Sub-Kategori (Topic)</FieldLabel>
                    <select name="sub_category" value={formData.sub_category} onChange={handleInputChange} style={fieldStyle} onFocus={focusField} onBlur={blurField} required>
                      <option value="">Pilih Topik...</option>
                      {subCategories[formData.category]?.map((topic) => (
                        <option key={topic} value={topic}>
                          {topic}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <FieldLabel>Difficulty</FieldLabel>
                      <select name="difficulty" value={formData.difficulty} onChange={handleInputChange} style={fieldStyle} onFocus={focusField} onBlur={blurField} required>
                        <option value="1">1 (Easy)</option>
                        <option value="2">2 (Medium)</option>
                        <option value="3">3 (Hard)</option>
                      </select>
                    </div>
                    <div>
                      <FieldLabel>Weight</FieldLabel>
                      <select name="weight" value={formData.weight} onChange={handleInputChange} style={fieldStyle} onFocus={focusField} onBlur={blurField} required>
                        <option value="1">1 Poin</option>
                        <option value="2">2 Poin</option>
                        <option value="3">3 Poin</option>
                      </select>
                    </div>
                  </div>
                </div>

                <GoldRule opacity={0.5} />

                {/* Teks soal */}
                <div>
                  <FieldLabel>Narasi / Teks Soal</FieldLabel>
                  <textarea
                    name="question_text"
                    value={formData.question_text}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Ketikkan soal atau bacaan di sini..."
                    style={{ ...fieldStyle, resize: 'none' }}
                    onFocus={focusField}
                    onBlur={blurField}
                    required
                  />
                </div>

                <GoldRule opacity={0.5} />

                {/* Opsi jawaban */}
                <div>
                  <FieldLabel>Opsi Jawaban & Kunci</FieldLabel>
                  <div className="space-y-2">
                    {options.map((option) => {
                      const isCorrect = formData.correct_answer === option;
                      return (
                        <div key={option} className="flex">
                          <div
                            className="w-9 flex items-center justify-center rounded-l-sm text-xs font-black flex-shrink-0"
                            style={{
                              background: isCorrect ? '#0A2463' : '#EDE4CC',
                              color: isCorrect ? '#C9A84C' : '#6B5A42',
                              border: isCorrect ? '1px solid #0A2463' : '1px solid #C8B99A',
                              borderRight: 'none',
                            }}
                          >
                            {option}
                          </div>
                          <input
                            type="text"
                            value={formData.options[option] || ''}
                            onChange={(e) => handleOptionChange(option, e.target.value)}
                            placeholder={`Jawaban opsi ${option}...`}
                            required
                            style={{
                              ...fieldStyle,
                              borderRadius: '0 2px 2px 0',
                              borderLeft: 'none',
                              borderColor: isCorrect ? '#0A2463' : '#C8B99A',
                              background: isCorrect ? '#F0F4FF' : '#EDE4CC',
                            }}
                            onFocus={focusField}
                            onBlur={blurField}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Set kunci jawaban */}
                <div className="flex items-center justify-between p-4 rounded-sm" style={{ background: '#EDE4CC', border: '1px solid #C8B99A', borderLeft: '4px solid #C9A84C' }}>
                  <div>
                    <p className="text-sm font-bold" style={{ color: '#0A2463' }}>
                      Set Kunci Jawaban
                    </p>
                    <p className="text-xs" style={{ color: '#6B5A42' }}>
                      Pilih opsi yang merupakan jawaban benar.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {options.map((option) => {
                      const isCorrect = formData.correct_answer === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, correct_answer: option }))}
                          className="w-9 h-9 rounded-sm text-xs font-black transition-all"
                          style={{
                            background: isCorrect ? '#0A2463' : '#FAF6EC',
                            color: isCorrect ? '#C9A84C' : '#6B5A42',
                            border: isCorrect ? '1px solid #0A2463' : '1px solid #C8B99A',
                            transform: isCorrect ? 'scale(1.1)' : 'scale(1)',
                            boxShadow: isCorrect ? '0 2px 8px rgba(10,36,99,0.2)' : 'none',
                          }}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className="px-6 py-4 flex gap-3 flex-shrink-0" style={{ background: '#EDE4CC', borderTop: '1px solid #C8B99A' }}>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-2.5 text-sm font-bold rounded-sm transition-all"
                  style={{ background: '#FAF6EC', border: '1px solid #C8B99A', color: '#6B5A42' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#0A2463';
                    e.currentTarget.style.color = '#0A2463';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#C8B99A';
                    e.currentTarget.style.color = '#6B5A42';
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-sm font-bold rounded-sm text-white transition-all"
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
                  {editingQuestion ? 'Simpan Perubahan' : 'Terbitkan Soal'}
                </button>
              </div>
            </form>

            <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,#C9A84C 25%,#C9A84C 75%,transparent)' }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Questions;
