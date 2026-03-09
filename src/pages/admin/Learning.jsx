import { useState, useEffect } from 'react';
import { db } from '../../lib/supabase';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const levelBadgeStyle = (level = '') => {
  const l = level.toUpperCase();
  if (l.startsWith('A')) return { background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' };
  if (l.startsWith('B')) return { background: '#EFF6FF', color: '#1A4FAD', border: '1px solid #BFDBFE' };
  if (l.startsWith('C')) return { background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE' };
  return { background: '#EDE4CC', color: '#6B5A42', border: '1px solid #C8B99A' };
};

// ── Shared input/textarea style ──
const fieldStyle = {
  width: '100%',
  background: '#EDE4CC',
  border: '1px solid #C8B99A',
  borderRadius: 2,
  padding: '10px 14px',
  fontSize: 13,
  color: '#2C1F0E',
  outline: 'none',
  fontFamily: "'DM Sans',sans-serif",
  transition: 'border-color 0.15s, box-shadow 0.15s',
};

const FieldLabel = ({ children }) => (
  <label className="block text-[10px] font-black uppercase tracking-widest mb-1.5" style={{ color: '#6B5A42', fontFamily: "'DM Sans',sans-serif" }}>
    {children}
  </label>
);

const GoldRule = ({ opacity = 1 }) => <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,#C8B99A 30%,#C8B99A 70%,transparent)', opacity }} />;
const RedRule = ({ opacity = 1 }) => <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,#BF0A30 25%,#BF0A30 75%,transparent)', opacity }} />;

const AdminLearning = () => {
  // ── Semua state asli tidak diubah ──
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [formData, setFormData] = useState({
    term: '',
    definition: '',
    definition_bahasa: '',
    example_sentence: '',
    example_sentence_bahasa: '',
    category: 'Vocabulary',
    sub_category: '',
    level: 'B1',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    loadMaterials();
  }, []);

  // ── Semua fungsi asli tidak diubah ──
  const loadMaterials = async () => {
    try {
      setLoading(true);
      const { data, error } = await db.getLearningMaterials();
      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error('Error loading materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (material = null) => {
    if (material) {
      setEditingMaterial(material);
      setFormData({
        term: material.term,
        definition: material.definition || '',
        definition_bahasa: material.definition_bahasa || '',
        example_sentence: material.example_sentence || '',
        example_sentence_bahasa: material.example_sentence_bahasa || '',
        category: material.category,
        sub_category: material.sub_category || '',
        level: material.level || 'B1',
      });
    } else {
      setEditingMaterial(null);
      setFormData({
        term: '',
        definition: '',
        definition_bahasa: '',
        example_sentence: '',
        example_sentence_bahasa: '',
        category: 'Vocabulary',
        sub_category: '',
        level: 'B1',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingMaterial) {
        const { error } = await db.updateLearningMaterial(editingMaterial.id, formData);
        if (error) throw error;
      } else {
        const { error } = await db.createLearningMaterial(formData);
        if (error) throw error;
      }
      setIsModalOpen(false);
      loadMaterials();
    } catch (error) {
      console.error('Error saving material:', error);
      alert('Gagal menyimpan: ' + error.message);
    }
  };

  const handleDelete = async (id, term) => {
    if (!window.confirm(`Hapus "${term}"?`)) return;
    try {
      const { error } = await db.deleteLearningMaterial(id);
      if (error) throw error;
      loadMaterials();
    } catch (error) {
      console.error('Error deleting material:', error);
    }
  };

  const filteredMaterials = materials.filter(
    (m) => m.term.toLowerCase().includes(searchTerm.toLowerCase()) || m.category.toLowerCase().includes(searchTerm.toLowerCase()) || (m.sub_category && m.sub_category.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const totalPages = Math.ceil(filteredMaterials.length / itemsPerPage);
  const paginatedMaterials = filteredMaterials.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8" style={{ backgroundColor: '#F2ECD8', fontFamily: "'DM Sans',sans-serif" }}>
      {/* ── Page header ── */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="font-bold text-3xl leading-none" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
              Materi Belajar/Kamus
            </h1>
            <p className="text-sm italic mt-1" style={{ fontFamily: "'IM Fell English',serif", color: '#6B5A42' }}>
              Kelola kamus dan referensi tata bahasa untuk siswa.
            </p>
          </div>

          {/* Search + Tambah */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: '#A8946C' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Cari materi..."
                style={{
                  ...fieldStyle,
                  paddingLeft: 36,
                  minWidth: 260,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#1A4FAD';
                  e.target.style.boxShadow = '0 0 0 3px rgba(26,79,173,0.12)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#C8B99A';
                  e.target.style.boxShadow = 'none';
                }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="px-5 py-2.5 text-sm font-bold text-white rounded-sm transition-all whitespace-nowrap"
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
              + Tambah Materi
            </button>
          </div>
        </div>
        <div className="mt-4">
          <GoldRule opacity={0.6} />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="max-w-7xl mx-auto rounded-sm overflow-hidden" style={{ background: '#FAF6EC', border: '1px solid #C8B99A', boxShadow: '0 4px 24px rgba(10,36,99,0.08)' }}>
        <RedRule opacity={0.6} />

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ background: '#EDE4CC', borderBottom: '1px solid #C8B99A' }}>
                {['Istilah / Term', 'Kategori', 'Sub-Kategori', 'Level', ''].map((col, i) => (
                  <th key={i} className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest" style={{ color: '#6B5A42', textAlign: i === 4 ? 'right' : 'left' }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <p className="text-lg italic" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#6B5A42' }}>
                      Memuat materi...
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedMaterials.map((m) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid rgba(200,185,154,0.4)' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#EDE4CC')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                    <td className="px-5 py-3.5 font-bold text-base" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
                      {m.term}
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: '#2C1F0E' }}>
                      {m.category}
                    </td>
                    <td className="px-5 py-3.5 text-sm" style={{ color: '#6B5A42' }}>
                      {m.sub_category || '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-sm" style={levelBadgeStyle(m.level)}>
                        {m.level}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleOpenModal(m)}
                        className="text-xs font-bold mr-4 transition-colors"
                        style={{ color: '#1A4FAD' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#0A2463')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#1A4FAD')}
                      >
                        EDIT
                      </button>
                      <button
                        onClick={() => handleDelete(m.id, m.term)}
                        className="text-xs font-bold transition-colors"
                        style={{ color: '#BF0A30' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#8B0020')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#BF0A30')}
                      >
                        HAPUS
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-[rgba(200,185,154,0.4)]">
          {loading ? (
            <div className="px-6 py-12 text-center text-sm italic text-[#6B5A42]" style={{ fontFamily: "'Cormorant Garamond',serif" }}>
              Memuat materi...
            </div>
          ) : paginatedMaterials.length > 0 ? (
            paginatedMaterials.map((m) => (
              <div key={m.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-lg text-[#0A2463]" style={{ fontFamily: "'Cormorant Garamond',serif" }}>
                      {m.term}
                    </div>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm" style={{ backgroundColor: '#F2ECD8', color: '#0A2463', border: '1px solid #C8B99A' }}>
                        {m.category}
                      </span>
                      <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm" style={levelBadgeStyle(m.level)}>
                        {m.level}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleOpenModal(m)} className="p-2 bg-[#1A4FAD]/10 rounded-sm text-[#1A4FAD]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button onClick={() => handleDelete(m.id, m.term)} className="p-2 bg-[#BF0A30]/10 rounded-sm text-[#BF0A30]">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                {m.sub_category && (
                  <p className="text-xs italic text-[#6B5A42]" style={{ fontFamily: "'IM Fell English',serif" }}>
                    {m.sub_category}
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="px-6 py-12 text-center text-sm italic text-[#6B5A42]" style={{ fontFamily: "'IM Fell English',serif" }}>
              Tidak ada materi ditemukan.
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="px-5 py-3.5 flex items-center justify-between flex-wrap gap-3" style={{ background: '#EDE4CC', borderTop: '1px solid #C8B99A' }}>
          <p className="text-xs" style={{ color: '#6B5A42' }}>
            Menampilkan <b style={{ color: '#0A2463' }}>{(currentPage - 1) * itemsPerPage + 1}</b> – <b style={{ color: '#0A2463' }}>{Math.min(currentPage * itemsPerPage, filteredMaterials.length)}</b> dari{' '}
            <b style={{ color: '#0A2463' }}>{filteredMaterials.length}</b> materi
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="px-3 py-1.5 text-xs font-bold rounded-sm transition-all disabled:opacity-40"
              style={{ background: '#FAF6EC', border: '1px solid #C8B99A', color: '#0A2463' }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) e.currentTarget.style.borderColor = '#1A4FAD';
              }}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#C8B99A')}
            >
              ← Prev
            </button>
            <span className="text-xs font-bold" style={{ color: '#0A2463' }}>
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="px-3 py-1.5 text-xs font-bold rounded-sm transition-all disabled:opacity-40"
              style={{ background: '#FAF6EC', border: '1px solid #C8B99A', color: '#0A2463' }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) e.currentTarget.style.borderColor = '#1A4FAD';
              }}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#C8B99A')}
            >
              Next →
            </button>
          </div>
        </div>

        <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,#C9A84C 25%,#C9A84C 75%,transparent)' }} />
      </div>

      {/* ══════════ MODAL ══════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(10,36,99,0.35)', backdropFilter: 'blur(2px)' }}>
          <div className="w-full max-w-2xl rounded-sm overflow-hidden shadow-2xl" style={{ background: '#FAF6EC', border: '1px solid #C9A84C', maxHeight: '90vh', overflowY: 'auto' }}>
            <RedRule />

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #C8B99A' }}>
              <div>
                <h2 className="font-bold text-2xl leading-none" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
                  {editingMaterial ? 'Edit Materi' : 'Tambah Materi Baru'}
                </h2>
                <p className="text-xs italic mt-0.5" style={{ fontFamily: "'IM Fell English',serif", color: '#6B5A42' }}>
                  {editingMaterial ? `Mengedit: ${editingMaterial.term}` : 'Isi form di bawah ini'}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
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

            <form onSubmit={handleSubmit}>
              <div className="px-6 py-5 space-y-4">
                {/* Term */}
                <div>
                  <FieldLabel>Istilah / Kata</FieldLabel>
                  <input
                    type="text"
                    required
                    style={fieldStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#1A4FAD';
                      e.target.style.boxShadow = '0 0 0 3px rgba(26,79,173,0.12)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#C8B99A';
                      e.target.style.boxShadow = 'none';
                    }}
                    value={formData.term}
                    onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                  />
                </div>

                {/* Kategori + Level */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Kategori</FieldLabel>
                    <select style={fieldStyle} value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })}>
                      <option value="Vocabulary">Vocabulary</option>
                      <option value="Grammar">Grammar</option>
                      <option value="Phrases">Phrases</option>
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Level CEFR</FieldLabel>
                    <select style={fieldStyle} value={formData.level} onChange={(e) => setFormData({ ...formData, level: e.target.value })}>
                      {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => (
                        <option key={lvl} value={lvl}>
                          {lvl}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Sub-kategori */}
                <div>
                  <FieldLabel>Sub-Kategori (Contoh: Adjective, Gerund)</FieldLabel>
                  <input
                    type="text"
                    style={fieldStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#1A4FAD';
                      e.target.style.boxShadow = '0 0 0 3px rgba(26,79,173,0.12)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#C8B99A';
                      e.target.style.boxShadow = 'none';
                    }}
                    value={formData.sub_category}
                    onChange={(e) => setFormData({ ...formData, sub_category: e.target.value })}
                  />
                </div>

                <GoldRule opacity={0.5} />

                {/* Definisi */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Definisi (English)</FieldLabel>
                    <textarea
                      style={{ ...fieldStyle, height: 96, resize: 'none' }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#1A4FAD';
                        e.target.style.boxShadow = '0 0 0 3px rgba(26,79,173,0.12)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#C8B99A';
                        e.target.style.boxShadow = 'none';
                      }}
                      value={formData.definition}
                      onChange={(e) => setFormData({ ...formData, definition: e.target.value })}
                    />
                  </div>
                  <div>
                    <FieldLabel>Definisi (Indonesia)</FieldLabel>
                    <textarea
                      style={{ ...fieldStyle, height: 96, resize: 'none' }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#1A4FAD';
                        e.target.style.boxShadow = '0 0 0 3px rgba(26,79,173,0.12)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#C8B99A';
                        e.target.style.boxShadow = 'none';
                      }}
                      value={formData.definition_bahasa}
                      onChange={(e) => setFormData({ ...formData, definition_bahasa: e.target.value })}
                    />
                  </div>
                </div>

                {/* Contoh kalimat */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Contoh (English)</FieldLabel>
                    <textarea
                      style={{ ...fieldStyle, height: 80, resize: 'none' }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#1A4FAD';
                        e.target.style.boxShadow = '0 0 0 3px rgba(26,79,173,0.12)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#C8B99A';
                        e.target.style.boxShadow = 'none';
                      }}
                      value={formData.example_sentence}
                      onChange={(e) => setFormData({ ...formData, example_sentence: e.target.value })}
                    />
                  </div>
                  <div>
                    <FieldLabel>Contoh (Indonesia)</FieldLabel>
                    <textarea
                      style={{ ...fieldStyle, height: 80, resize: 'none' }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#1A4FAD';
                        e.target.style.boxShadow = '0 0 0 3px rgba(26,79,173,0.12)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#C8B99A';
                        e.target.style.boxShadow = 'none';
                      }}
                      value={formData.example_sentence_bahasa}
                      onChange={(e) => setFormData({ ...formData, example_sentence_bahasa: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Modal footer */}
              <div className="px-6 py-4 flex gap-3" style={{ background: '#EDE4CC', borderTop: '1px solid #C8B99A' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
                  {editingMaterial ? 'Simpan Perubahan' : 'Tambah Materi'}
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

export default AdminLearning;
