import { useState, useEffect } from 'react';
import { db } from '../../lib/supabase';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

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
  padding: '10px 14px',
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

const Packages = () => {
  // ── Semua state asli tidak diubah ──
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    unique_name: '',
    description: '',
    duration: 3600,
    question_count: 50,
    category: 'Diagnostic',
    type: 'ujian',
  });

  useEffect(() => {
    loadPackages();
  }, []);

  // ── Semua fungsi asli tidak diubah ──
  const loadPackages = async () => {
    try {
      setLoading(true);
      const { data, error } = await db.getPackages();
      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Error loading packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (pkg = null) => {
    if (pkg) {
      setEditingPackage(pkg);
      setFormData({
        name: pkg.name,
        unique_name: pkg.unique_name || '',
        description: pkg.description || '',
        duration: pkg.duration,
        question_count: pkg.question_count,
        category: pkg.category,
        type: pkg.type,
      });
    } else {
      setEditingPackage(null);
      setFormData({
        name: '',
        unique_name: '',
        description: '',
        duration: 3600,
        question_count: 50,
        category: 'Diagnostic',
        type: 'ujian',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPackage) {
        const { error } = await db.updatePackage(editingPackage.id, formData);
        if (error) throw error;
        await db.createAuditLog({
          action: 'UPDATE_PACKAGE',
          target_id: editingPackage.id,
          description: `Memperbarui paket: ${formData.name}`,
        });
      } else {
        const { error } = await db.createPackage(formData);
        if (error) throw error;
        await db.createAuditLog({
          action: 'CREATE_PACKAGE',
          description: `Membuat paket baru: ${formData.name}`,
        });
      }
      setIsModalOpen(false);
      loadPackages();
    } catch (error) {
      console.error('Error saving package:', error);
      alert('Gagal menyimpan: ' + error.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Hapus paket "${name}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      const { error } = await db.deletePackage(id);
      if (error) throw error;
      await db.createAuditLog({
        action: 'DELETE_PACKAGE',
        target_id: id,
        description: `Menghapus paket: ${name}`,
      });
      loadPackages();
    } catch (error) {
      console.error('Error deleting package:', error);
      alert('Gagal menghapus: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8" style={{ backgroundColor: '#F2ECD8', fontFamily: "'DM Sans',sans-serif" }}>
      {/* ── Page header ── */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="font-bold text-3xl leading-none" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
              Manajemen Paket
            </h1>
            <p className="text-sm italic mt-1" style={{ fontFamily: "'IM Fell English',serif", color: '#6B5A42' }}>
              Konfigurasi jenis ujian, durasi, dan jumlah soal.
            </p>
          </div>
          <button
            onClick={() => handleOpenModal()}
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
            + Buat Paket Baru
          </button>
        </div>
        <div className="mt-4">
          <GoldRule opacity={0.6} />
        </div>
      </div>

      {/* ── Package cards grid ── */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {/* Loading skeleton */}
        {loading
          ? Array(3)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="rounded-sm overflow-hidden animate-pulse" style={{ background: '#FAF6EC', border: '1px solid #C8B99A', height: 220 }}>
                  <div style={{ height: 3, background: '#EDE4CC' }} />
                  <div className="p-5 space-y-3">
                    <div style={{ height: 16, background: '#EDE4CC', borderRadius: 2, width: '60%' }} />
                    <div style={{ height: 12, background: '#EDE4CC', borderRadius: 2, width: '40%' }} />
                    <div style={{ height: 12, background: '#EDE4CC', borderRadius: 2, width: '80%' }} />
                  </div>
                </div>
              ))
          : packages.map((pkg) => (
              <div
                key={pkg.id}
                className="flex flex-col rounded-sm overflow-hidden transition-all duration-200 hover:-translate-y-1"
                style={{ background: '#FAF6EC', border: '1px solid #C8B99A', boxShadow: '0 2px 8px rgba(10,36,99,0.06)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#1A4FAD';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(10,36,99,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#C8B99A';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(10,36,99,0.06)';
                }}
              >
                <RedRule opacity={0.5} />

                <div className="p-5 flex flex-col flex-1">
                  {/* Type badge + actions */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-sm"
                      style={pkg.type === 'ujian' ? { background: '#EFF6FF', color: '#1A4FAD', border: '1px solid #BFDBFE' } : { background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0' }}
                    >
                      {pkg.type}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenModal(pkg)}
                        className="p-1.5 rounded-sm transition-colors"
                        style={{ color: '#6B5A42' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#1A4FAD';
                          e.currentTarget.style.background = '#EDE4CC';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#6B5A42';
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(pkg.id, pkg.name)}
                        className="p-1.5 rounded-sm transition-colors"
                        style={{ color: '#6B5A42' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#BF0A30';
                          e.currentTarget.style.background = '#FFF1F2';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = '#6B5A42';
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Name + unique name */}
                  <h3 className="font-bold text-lg leading-tight mb-1" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
                    {pkg.name}
                  </h3>
                  <p className="text-xs font-bold mb-3" style={{ color: '#C9A84C' }}>
                    {pkg.unique_name || 'Generic Package'}
                  </p>

                  {/* Description */}
                  <p className="text-sm italic flex-1 mb-5 line-clamp-2" style={{ color: '#6B5A42', fontFamily: "'IM Fell English',serif" }}>
                    {pkg.description || 'Tidak ada deskripsi.'}
                  </p>

                  {/* Stats footer */}
                  <div className="pt-4 grid grid-cols-2 gap-4" style={{ borderTop: '1px solid #C8B99A' }}>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: '#6B5A42' }}>
                        Durasi
                      </p>
                      <p className="text-sm font-bold" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
                        {Math.floor(pkg.duration / 60)} menit
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: '#6B5A42' }}>
                        Jumlah Soal
                      </p>
                      <p className="text-sm font-bold" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
                        {pkg.question_count} butir
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,#C9A84C 25%,#C9A84C 75%,transparent)', opacity: 0.5 }} />
              </div>
            ))}
      </div>

      {/* ══════════ MODAL ══════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(10,36,99,0.35)', backdropFilter: 'blur(2px)' }}>
          <div className="w-full max-w-xl rounded-sm overflow-hidden shadow-2xl" style={{ background: '#FAF6EC', border: '1px solid #C9A84C', maxHeight: '90vh', overflowY: 'auto' }}>
            <RedRule />

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #C8B99A' }}>
              <div>
                <h2 className="font-bold text-2xl leading-none" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
                  {editingPackage ? 'Edit Paket Ujian' : 'Buat Paket Baru'}
                </h2>
                <p className="text-xs italic mt-0.5" style={{ fontFamily: "'IM Fell English',serif", color: '#6B5A42' }}>
                  {editingPackage ? `Mengedit: ${editingPackage.name}` : 'Isi detail paket di bawah ini'}
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
                {/* Nama paket */}
                <div>
                  <FieldLabel>Nama Paket</FieldLabel>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Mid-Term Examination"
                    style={fieldStyle}
                    onFocus={focusField}
                    onBlur={blurField}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                {/* Label unik + Kategori */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Label Unik</FieldLabel>
                    <input type="text" placeholder="e.g. Level B1-B2" style={fieldStyle} onFocus={focusField} onBlur={blurField} value={formData.unique_name} onChange={(e) => setFormData({ ...formData, unique_name: e.target.value })} />
                  </div>
                  <div>
                    <FieldLabel>Kategori</FieldLabel>
                    <input type="text" required style={fieldStyle} onFocus={focusField} onBlur={blurField} value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
                  </div>
                </div>

                {/* Deskripsi */}
                <div>
                  <FieldLabel>Deskripsi Singkat</FieldLabel>
                  <textarea style={{ ...fieldStyle, height: 88, resize: 'none' }} onFocus={focusField} onBlur={blurField} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </div>

                <GoldRule opacity={0.5} />

                {/* Durasi + Jumlah soal */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Durasi (Detik)</FieldLabel>
                    <input type="number" required style={fieldStyle} onFocus={focusField} onBlur={blurField} value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })} />
                    <p className="text-[10px] mt-1" style={{ color: '#A8946C' }}>
                      3600 = 60 menit
                    </p>
                  </div>
                  <div>
                    <FieldLabel>Jumlah Soal</FieldLabel>
                    <input type="number" required style={fieldStyle} onFocus={focusField} onBlur={blurField} value={formData.question_count} onChange={(e) => setFormData({ ...formData, question_count: parseInt(e.target.value) })} />
                  </div>
                </div>

                {/* Tipe paket */}
                <div>
                  <FieldLabel>Tipe Paket</FieldLabel>
                  <div className="flex gap-4 mt-1">
                    {[
                      { val: 'ujian', label: 'Ujian', color: '#1A4FAD' },
                      { val: 'latihan', label: 'Latihan', color: '#16A34A' },
                    ].map(({ val, label, color }) => (
                      <label key={val} className="flex items-center gap-2 cursor-pointer group">
                        <input type="radio" name="type" checked={formData.type === val} onChange={() => setFormData({ ...formData, type: val })} className="accent-current" style={{ accentColor: color }} />
                        <span className="text-sm font-semibold transition-colors" style={{ color: formData.type === val ? color : '#6B5A42' }}>
                          {label}
                        </span>
                      </label>
                    ))}
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
                  {editingPackage ? 'Simpan Perubahan' : 'Buat Paket'}
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

export default Packages;
