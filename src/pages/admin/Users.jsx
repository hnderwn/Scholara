import { useState, useEffect } from 'react';
import { db } from '../../lib/supabase';
// Import UI components dipertahankan sesuai aslinya
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ConfirmModal from '../../components/ui/ConfirmModal';

// ── Reusable dividers (Sesuai dengan tema) ──
const RedRule = ({ opacity = 1 }) => <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,#BF0A30 25%,#BF0A30 75%,transparent)', opacity }} />;
const GoldRule = ({ opacity = 1 }) => <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,#C8B99A 30%,#C8B99A 70%,transparent)', opacity }} />;

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
                  <th className="px-6 py-3.5 text-[10px] font-black text-[#6B5A42] uppercase tracking-widest">Peran</th>
                  <th className="px-6 py-3.5 text-[10px] font-black text-[#6B5A42] uppercase tracking-widest">Mode Debug</th>
                  <th className="px-6 py-3.5 text-[10px] font-black text-[#6B5A42] uppercase tracking-widest">Terdaftar Pada</th>
                  <th className="px-6 py-3.5 text-right text-[10px] font-black text-[#6B5A42] uppercase tracking-widest">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(200,185,154,0.4)]">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center text-lg italic text-[#6B5A42]" style={{ fontFamily: "'Cormorant Garamond',serif" }}>
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
                        {user.role === 'admin' ? (
                          <button onClick={() => handleRoleChange(user.id, 'siswa')} className="text-[11px] font-black text-[#BF0A30] hover:text-[#8B0020] transition-colors tracking-wider">
                            JADIKAN SISWA
                          </button>
                        ) : (
                          <button onClick={() => handleRoleChange(user.id, 'admin')} className="text-[11px] font-black text-[#1A4FAD] hover:text-[#0A2463] transition-colors tracking-wider">
                            JADIKAN ADMIN
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center text-sm italic text-[#6B5A42]" style={{ fontFamily: "'IM Fell English',serif" }}>
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
                      <div className="text-sm text-[#2C1F0E] font-medium leading-tight">{user.school || '—'}</div>
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
                    {user.role === 'admin' ? (
                      <button onClick={() => handleRoleChange(user.id, 'siswa')} className="text-[11px] font-black text-[#BF0A30] px-3 py-1.5 border border-[#BF0A30]/20 rounded-sm">
                        Ubah
                      </button>
                    ) : (
                      <button onClick={() => handleRoleChange(user.id, 'admin')} className="text-[11px] font-black text-[#1A4FAD] px-3 py-1.5 border border-[#1A4FAD]/20 rounded-sm">
                        Ubah
                      </button>
                    )}
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
