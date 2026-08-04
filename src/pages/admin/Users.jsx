import { useState, useEffect } from 'react';
import { db } from '../../lib/supabase';
import { exportToExcel, exportToPDF } from '../../utils/export';
// Import UI components dipertahankan sesuai aslinya
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ConfirmModal from '../../components/ui/ConfirmModal';
import { RedRule, GoldRule } from '../../components/ui/Rules';
import ExportDropdown from '../../components/admin/ExportDropdown';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmVariant: 'primary',
    onConfirm: () => {},
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await db.getAllProfiles();
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    const dataToExport = filteredUsers.map(user => ({
      'Nama Lengkap': user.full_name || 'Anonymous',
      'Sekolah': user.school || '—',
      'Level CEFR': user.cefr_level || '—',
      'Grammar Skill': user.skill_levels?.grammar || '—',
      'Vocab Skill': user.skill_levels?.vocab || '—',
      'Reading Skill': user.skill_levels?.reading || '—',
      'Cloze Skill': user.skill_levels?.cloze || '—',
      'Peran': user.role || 'siswa',
      'Mode Debug': user.is_debug_enabled ? 'Aktif' : 'Nonaktif',
      'Terdaftar Pada': new Date(user.created_at).toLocaleDateString('id-ID'),
    }));
    exportToExcel(dataToExport, `Daftar_Pengguna_${new Date().toISOString().split('T')[0]}.xlsx`, 'Daftar Pengguna');
  };

  const handleExportPDF = () => {
    const columns = [
      'Nama Lengkap',
      'Sekolah',
      'Level CEFR',
      'Grammar',
      'Vocab',
      'Reading',
      'Cloze',
      'Peran',
      'Debug',
      'Terdaftar'
    ];
    
    const rows = filteredUsers.map(user => [
      user.full_name || 'Anonymous',
      user.school || '—',
      user.cefr_level || '—',
      user.skill_levels?.grammar || '—',
      user.skill_levels?.vocab || '—',
      user.skill_levels?.reading || '—',
      user.skill_levels?.cloze || '—',
      user.role || 'siswa',
      user.is_debug_enabled ? 'Aktif' : 'Nonaktif',
      new Date(user.created_at).toLocaleDateString('id-ID')
    ]);
    
    exportToPDF('SCHOLARA - LAPORAN DIREKTORI PENGGUNA', columns, rows, `Laporan_Pengguna_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleRoleChange = (userId, newRole) => {
    const title = newRole === 'admin' ? 'Jadikan Admin' : 'Cabut Akses Admin';
    const message = newRole === 'admin'
      ? 'Apakah Anda yakin ingin menjadikan pengguna ini sebagai Admin? Mereka akan memiliki akses penuh ke sistem.'
      : 'Apakah Anda yakin ingin mencabut akses Admin dari pengguna ini?';

    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmVariant: newRole === 'admin' ? 'primary' : 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          const { error } = await db.updateProfile(userId, { role: newRole });
          if (error) throw error;

          // Update local state
          setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));

          // Log activity
          await db.createAuditLog({
            action: 'UPDATE_ROLE',
            target_id: userId,
            description: `Mengubah peran user ${userId} menjadi ${newRole}`,
          });
        } catch (error) {
          console.error('Error updating role:', error);
          alert('Gagal mengubah peran: ' + error.message);
        }
      },
    });
  };

  const handleToggleDebug = (userId, currentStatus) => {
    const newStatus = !currentStatus;
    const title = newStatus ? 'Aktifkan Mode Debug' : 'Nonaktifkan Mode Debug';
    const message = newStatus
      ? 'Apakah Anda yakin ingin mengaktifkan Mode Debug untuk user ini? Mereka akan dapat menggunakan asisten pengisian otomatis jawaban.'
      : 'Apakah Anda yakin ingin menonaktifkan Mode Debug untuk user ini?';

    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmVariant: newStatus ? 'primary' : 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          const { error } = await db.updateProfile(userId, { is_debug_enabled: newStatus });
          if (error) throw error;

          // Update local state
          setUsers(users.map((u) => (u.id === userId ? { ...u, is_debug_enabled: newStatus } : u)));

          // Log activity
          await db.createAuditLog({
            action: 'TOGGLE_DEBUG',
            target_id: userId,
            description: `Mengubah mode debug user ${userId} menjadi ${newStatus ? 'AKTIF' : 'NONAKTIF'}`,
          });
        } catch (error) {
          console.error('Error updating debug mode:', error);
          alert('Gagal mengubah mode debug: ' + error.message);
        }
      },
    });
  };

  const handleDeleteUser = (userId, name) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Pengguna',
      message: `Apakah Anda yakin ingin menghapus pengguna "${name || 'Anonymous'}"? Semua riwayat ujian dan profilnya akan dihapus permanen.`,
      confirmVariant: 'danger',
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        try {
          // Delete exam results first to prevent foreign key errors
          await db.deleteExamResults(userId);
          
          // Delete profile
          const { error } = await db.deleteProfile(userId);
          if (error) throw error;

          // Update local state
          setUsers(users.filter((u) => u.id !== userId));

          // Log activity
          await db.createAuditLog({
            action: 'DELETE_USER',
            target_id: userId,
            description: `Menghapus user/siswa: ${name || 'Anonymous'} (ID: ${userId})`,
          });
        } catch (error) {
          console.error('Error deleting user:', error);
          alert('Gagal menghapus pengguna: ' + error.message);
        }
      },
    });
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || user.school?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8" style={{ backgroundColor: '#F2ECD8', fontFamily: "'DM Sans',sans-serif" }}>
      <div className="max-w-7xl mx-auto">
        {/* ── Page header ── */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="font-bold text-3xl leading-none" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
              Manajemen Pengguna
            </h1>
            <p className="text-sm italic mt-1" style={{ fontFamily: "'IM Fell English',serif", color: '#6B5A42' }}>
              Kelola data siswa dan hak akses admin secara menyeluruh.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
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

            {/* Role Filter */}
            <select
              className="w-full sm:w-auto bg-[#EDE4CC] border border-[#C8B99A] rounded-sm px-4 py-2.5 text-[13px] font-bold text-[#0A2463] outline-none cursor-pointer transition-all focus:border-[#1A4FAD] focus:shadow-[0_0_0_3px_rgba(26,79,173,0.12)]"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">Semua Peran</option>
              <option value="siswa">Siswa</option>
              <option value="admin">Admin</option>
            </select>

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
          {/* Aksen RedRule */}
          <RedRule opacity={0.6} />

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#EDE4CC] border-b border-[#C8B99A]">
                  <th className="px-6 py-3.5 text-[10px] font-black text-[#6B5A42] uppercase tracking-widest">Nama Lengkap</th>
                  <th className="px-6 py-3.5 text-[10px] font-black text-[#6B5A42] uppercase tracking-widest">Sekolah</th>
                  <th className="px-6 py-3.5 text-[10px] font-black text-[#6B5A42] uppercase tracking-widest">Level CEFR</th>
                  <th className="px-6 py-3.5 text-[10px] font-black text-[#6B5A42] uppercase tracking-widest">Detail Skill</th>
                  <th className="px-6 py-3.5 text-[10px] font-black text-[#6B5A42] uppercase tracking-widest">Peran</th>
                  <th className="px-6 py-3.5 text-[10px] font-black text-[#6B5A42] uppercase tracking-widest">Mode Debug</th>
                  <th className="px-6 py-3.5 text-[10px] font-black text-[#6B5A42] uppercase tracking-widest">Terdaftar Pada</th>
                  <th className="px-6 py-3.5 text-right text-[10px] font-black text-[#6B5A42] uppercase tracking-widest">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(200,185,154,0.4)]">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-16 text-center text-lg italic text-[#6B5A42]" style={{ fontFamily: "'Cormorant Garamond',serif" }}>
                      Memuat direktori pengguna...
                    </td>
                  </tr>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-[#EDE4CC]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-base text-[#0A2463]" style={{ fontFamily: "'Cormorant Garamond',serif" }}>
                          {user.full_name || 'Anonymous'}
                        </div>
                        <div className="text-[10px] text-[#A8946C] font-mono mt-0.5 tracking-wider">ID: {user.id.substring(0, 8)}...</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#2C1F0E] font-medium">{user.school || '—'}</td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-sm text-[#0A2463]">{user.cefr_level || '—'}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-[#6B5A42]">
                        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 w-max">
                          <div>Grammar: <span className="font-bold text-[#0A2463]">{user.skill_levels?.grammar || '—'}</span></div>
                          <div>Vocab: <span className="font-bold text-[#0A2463]">{user.skill_levels?.vocab || '—'}</span></div>
                          <div>Reading: <span className="font-bold text-[#0A2463]">{user.skill_levels?.reading || '—'}</span></div>
                          <div>Cloze: <span className="font-bold text-[#0A2463]">{user.skill_levels?.cloze || '—'}</span></div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="px-2.5 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest border"
                          style={{
                            backgroundColor: user.role === 'admin' ? '#E0E7FF' : '#D1FAE5',
                            color: user.role === 'admin' ? '#3730A3' : '#065F46',
                            borderColor: user.role === 'admin' ? '#C7D2FE' : '#A7F3D0',
                          }}
                        >
                          {user.role || 'siswa'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleToggleDebug(user.id, user.is_debug_enabled)}
                          className="px-2 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest border transition-all hover:opacity-80"
                          style={{
                            backgroundColor: user.is_debug_enabled ? '#FEF3C7' : '#F3F4F6',
                            color: user.is_debug_enabled ? '#92400E' : '#374151',
                            borderColor: user.is_debug_enabled ? '#FDE68A' : '#E5E7EB',
                          }}
                        >
                          {user.is_debug_enabled ? 'Aktif 🛠️' : 'Nonaktif'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-[#6B5A42]">{new Date(user.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          {user.role === 'admin' ? (
                            <button onClick={() => handleRoleChange(user.id, 'siswa')} className="text-[11px] font-black text-[#BF0A30] hover:text-[#8B0020] transition-colors tracking-wider">
                              JADIKAN SISWA
                            </button>
                          ) : (
                            <button onClick={() => handleRoleChange(user.id, 'admin')} className="text-[11px] font-black text-[#1A4FAD] hover:text-[#0A2463] transition-colors tracking-wider">
                              JADIKAN ADMIN
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteUser(user.id, user.full_name)}
                            className="text-[11px] font-black text-[#BF0A30] hover:text-[#8B0020] transition-colors tracking-wider flex items-center gap-1"
                            title="Hapus Pengguna"
                          >
                            <span>🗑️</span> HAPUS
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-16 text-center text-sm italic text-[#6B5A42]" style={{ fontFamily: "'IM Fell English',serif" }}>
                      Pencarian pengguna tidak ditemukan.
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
                Memuat direktori pengguna...
              </div>
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div key={user.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-lg text-[#0A2463]" style={{ fontFamily: "'Cormorant Garamond',serif" }}>
                        {user.full_name || 'Anonymous'}
                      </div>
                      <div className="text-sm text-[#2C1F0E] font-medium leading-tight mb-2">{user.school || '—'}</div>
                      <div className="flex flex-col gap-0.5 text-xs text-[#2C1F0E] border-t border-[rgba(200,185,154,0.3)] pt-1.5 mt-1.5">
                        <div><span className="font-semibold text-[#6B5A42]">Level CEFR:</span> <span className="font-bold text-[#0A2463]">{user.cefr_level || '—'}</span></div>
                        <div className="text-[10px] text-[#6B5A42] font-mono leading-relaxed mt-0.5">
                          G: {user.skill_levels?.grammar || '—'} | V: {user.skill_levels?.vocab || '—'} | R: {user.skill_levels?.reading || '—'} | C: {user.skill_levels?.cloze || '—'}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span
                        className="px-2 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-widest border"
                        style={{
                          backgroundColor: user.role === 'admin' ? '#E0E7FF' : '#D1FAE5',
                          color: user.role === 'admin' ? '#3730A3' : '#065F46',
                          borderColor: user.role === 'admin' ? '#C7D2FE' : '#A7F3D0',
                        }}
                      >
                        {user.role || 'siswa'}
                      </span>
                      <button
                        onClick={() => handleToggleDebug(user.id, user.is_debug_enabled)}
                        className="px-1.5 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-widest border transition-all"
                        style={{
                          backgroundColor: user.is_debug_enabled ? '#FEF3C7' : '#F3F4F6',
                          color: user.is_debug_enabled ? '#92400E' : '#374151',
                          borderColor: user.is_debug_enabled ? '#FDE68A' : '#E5E7EB',
                        }}
                      >
                        {user.is_debug_enabled ? 'Debug 🛠️' : 'No Debug'}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-mono text-[#6B5A42]">{new Date(user.created_at).toLocaleDateString('id-ID')}</span>
                    <div className="flex items-center gap-2">
                      {user.role === 'admin' ? (
                        <button onClick={() => handleRoleChange(user.id, 'siswa')} className="text-[11px] font-black text-[#BF0A30] px-3 py-1.5 border border-[#BF0A30]/20 rounded-sm">
                          Siswa
                        </button>
                      ) : (
                        <button onClick={() => handleRoleChange(user.id, 'admin')} className="text-[11px] font-black text-[#1A4FAD] px-3 py-1.5 border border-[#1A4FAD]/20 rounded-sm">
                          Admin
                        </button>
                      )}
                      <button onClick={() => handleDeleteUser(user.id, user.full_name)} className="text-[11px] font-black text-[#BF0A30] px-3 py-1.5 border border-[#BF0A30]/20 rounded-sm flex items-center gap-1">
                        🗑️ Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center text-sm italic text-[#6B5A42]" style={{ fontFamily: "'IM Fell English',serif" }}>
                Pencarian pengguna tidak ditemukan.
              </div>
            )}
          </div>

          {/* Bottom Gold Accent */}
          <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,#C9A84C 25%,#C9A84C 75%,transparent)' }} />
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmVariant={confirmModal.confirmVariant}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default Users;
