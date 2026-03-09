import { useState, useEffect } from 'react';
import { db } from '../../lib/supabase';
import Card from '../../components/ui/Card';

const AuditLogs = () => {
  // ── Semua state & logika asli tidak diubah ──
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await db.getAuditLogs();
      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // ── getActionColor diganti ke Collegiate palette, logika kondisi sama persis ──
  const getActionColor = (action) => {
    if (action.startsWith('CREATE')) return { bg: '#F0FDF4', color: '#16A34A', border: '#BBF7D0' };
    if (action.startsWith('UPDATE')) return { bg: '#EFF6FF', color: '#1A4FAD', border: '#BFDBFE' };
    if (action.startsWith('DELETE')) return { bg: '#FFF1F2', color: '#BF0A30', border: '#FECDD3' };
    return { bg: '#EDE4CC', color: '#6B5A42', border: '#C8B99A' };
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8" style={{ backgroundColor: '#F2ECD8', fontFamily: "'DM Sans',sans-serif" }}>
      {/* ── Page header ── */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="font-bold text-3xl leading-none" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
          Audit Logs
        </h1>
        <p className="text-sm italic mt-1" style={{ fontFamily: "'IM Fell English',serif", color: '#6B5A42' }}>
          Lacak sejarah perubahan sistem oleh administrator.
        </p>
        <div className="mt-4" style={{ height: 1, background: 'linear-gradient(90deg,transparent,#C8B99A 30%,#C8B99A 70%,transparent)' }} />
      </div>

      {/* ── Table card ── */}
      <div className="max-w-7xl mx-auto rounded-sm overflow-hidden" style={{ background: '#FAF6EC', border: '1px solid #C8B99A', boxShadow: '0 4px 24px rgba(10,36,99,0.08)' }}>
        {/* Crimson top rule */}
        <div style={{ height: 3, background: 'linear-gradient(90deg,transparent,#BF0A30 25%,#BF0A30 75%,transparent)' }} />

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ background: '#EDE4CC', borderBottom: '1px solid #C8B99A' }}>
                {['Waktu', 'Administrator', 'Aksi', 'Deskripsi', 'Target ID'].map((col) => (
                  <th key={col} className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest" style={{ color: '#6B5A42', fontFamily: "'DM Sans',sans-serif" }}>
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
                      Memuat log sistem...
                    </p>
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log, i) => {
                  const badge = getActionColor(log.action);
                  return (
                    <tr key={log.id} style={{ borderBottom: '1px solid rgba(200,185,154,0.4)' }} onMouseEnter={(e) => (e.currentTarget.style.background = '#EDE4CC')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                      {/* Waktu */}
                      <td className="px-5 py-4 text-xs font-mono whitespace-nowrap" style={{ color: '#6B5A42' }}>
                        {new Date(log.created_at).toLocaleString('id-ID')}
                      </td>

                      {/* Administrator */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-sm flex items-center justify-center text-xs font-black text-white flex-shrink-0" style={{ background: '#1A4FAD' }}>
                            {(log.profiles?.full_name || 'S').charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-bold" style={{ color: '#0A2463' }}>
                            {log.profiles?.full_name || 'System'}
                          </span>
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="px-5 py-4">
                        <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-sm" style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                          {log.action}
                        </span>
                      </td>

                      {/* Deskripsi */}
                      <td className="px-5 py-4 text-sm" style={{ color: '#2C1F0E', maxWidth: 300 }}>
                        {log.description}
                      </td>

                      {/* Target ID */}
                      <td className="px-5 py-4 text-xs font-mono" style={{ color: '#6B5A42' }}>
                        {log.target_id || '—'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center">
                    <div className="text-4xl mb-3 opacity-30">📭</div>
                    <p className="text-lg italic" style={{ fontFamily: "'IM Fell English',serif", color: '#6B5A42' }}>
                      Belum ada aktivitas yang tercatat.
                    </p>
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
              Memuat log...
            </div>
          ) : logs.length > 0 ? (
            logs.map((log) => {
              const badge = getActionColor(log.action);
              return (
                <div key={log.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-sm flex items-center justify-center text-[10px] font-black text-white" style={{ background: '#1A4FAD' }}>
                        {(log.profiles?.full_name || 'S').charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-bold text-[#0A2463]" style={{ fontFamily: "'Cormorant Garamond',serif" }}>
                        {log.profiles?.full_name || 'System'}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-[#6B5A42]">{new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div>
                    <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm inline-block mb-1.5" style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}>
                      {log.action}
                    </span>
                    <p className="text-xs text-[#2C1F0E] leading-relaxed">{log.description}</p>
                  </div>

                  {log.target_id && <div className="text-[9px] text-[#A8946C] font-mono">Target: {log.target_id.substring(0, 8)}...</div>}
                </div>
              );
            })
          ) : (
            <div className="px-6 py-12 text-center text-sm italic text-[#6B5A42]" style={{ fontFamily: "'IM Fell English',serif" }}>
              Belum ada aktivitas.
            </div>
          )}
        </div>

        {/* Gold bottom rule */}
        <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,#C9A84C 25%,#C9A84C 75%,transparent)' }} />
      </div>
    </div>
  );
};

export default AuditLogs;
