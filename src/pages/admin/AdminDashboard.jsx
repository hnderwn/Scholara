import { useState, useEffect } from 'react';
import { db } from '../../lib/supabase';
import Card from '../../components/ui/Card';

// ── Reusable dividers ──
const RedRule = ({ opacity = 1 }) => <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,#BF0A30 25%,#BF0A30 75%,transparent)', opacity }} />;
const GoldRule = ({ opacity = 1 }) => <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,#C8B99A 30%,#C8B99A 70%,transparent)', opacity }} />;

const AdminDashboard = () => {
  // ── Semua state asli tidak diubah ──
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalExams: 0,
    totalQuestions: 0,
    avgScore: 0,
  });
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initDashboard = async () => {
      await loadDashboardData();
    };

    initDashboard();

    const safetyTimer = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Admin Dashboard: Terlalu lama memuat data, memaksa tampil.');
        setLoading(false);
      }
    }, 5000);

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
    };
  }, []);

  // ── Fungsi asli tidak diubah ──
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [users, results, questions, logs] = await Promise.all([db.getAllProfiles(), db.getExamResults(), db.getQuestions(), db.getAuditLogs()]);

      const avg = results.data?.length > 0 ? Math.round(results.data.reduce((sum, r) => sum + r.score_total, 0) / results.data.length) : 0;

      setStats({
        totalUsers: users.data?.length || 0,
        totalExams: results.data?.length || 0,
        totalQuestions: questions.data?.length || 0,
        avgScore: avg,
      });

      setRecentLogs(logs.data || []);
    } catch (error) {
      console.error('Error loading admin dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F2ECD8' }}>
        <p className="text-lg italic" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
          Memuat dashboard...
        </p>
      </div>
    );
  }

  const STAT_CARDS = [
    { label: 'Total Pengguna', value: stats.totalUsers, icon: '👥', accent: '#1A4FAD' },
    { label: 'Ujian Selesai', value: stats.totalExams, icon: '📋', accent: '#16A34A' },
    { label: 'Bank Soal', value: stats.totalQuestions, icon: '📝', accent: '#D97706' },
    { label: 'Rata-rata Skor', value: `${stats.avgScore}%`, icon: '⭐', accent: '#7C3AED' },
  ];

  const QUICK_ACTIONS = [
    { label: 'Kelola Paket Ujian', icon: '📦', href: '/admin/packages', desc: 'Tambah & edit paket' },
    { label: 'Lihat Daftar Siswa', icon: '👥', href: '/admin/users', desc: 'Manajemen pengguna' },
    { label: 'Audit Log Lengkap', icon: '📋', href: '/admin/audit-logs', desc: 'Semua aktivitas sistem' },
  ];

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 space-y-8" style={{ backgroundColor: '#F2ECD8', fontFamily: "'DM Sans',sans-serif" }}>
      {/* ── Page title ── */}
      <div>
        <h1 className="font-bold text-2xl leading-none" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
          Dashboard Admin
        </h1>
        <p className="text-sm italic mt-1" style={{ fontFamily: "'IM Fell English',serif", color: '#6B5A42' }}>
          Ringkasan aktivitas & statistik sistem
        </p>
        <div className="mt-3">
          <GoldRule opacity={0.6} />
        </div>
      </div>

      {/* ══ STATS ══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(({ label, value, icon, accent }) => (
          <div
            key={label}
            className="rounded-sm p-5 flex flex-col gap-3 transition-all duration-200 cursor-default"
            style={{
              background: '#FAF6EC',
              border: '1px solid #C8B99A',
              borderLeft: `4px solid ${accent}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(10,36,99,0.1)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#6B5A42' }}>
                {label}
              </p>
              <span className="text-lg">{icon}</span>
            </div>
            <p className="font-bold leading-none" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463', fontSize: 32 }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* ══ MAIN GRID ══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Audit Log — 2/3 */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-1">
            <span>🕒</span>
            <h2 className="font-bold text-lg" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
              Aktivitas Terbaru
            </h2>
          </div>
          <GoldRule opacity={0.6} />

          <div className="mt-4 rounded-sm overflow-hidden" style={{ background: '#FAF6EC', border: '1px solid #C8B99A' }}>
            <RedRule opacity={0.5} />
            {recentLogs.length > 0 ? (
              recentLogs.map((log, i) => (
                <div key={log.id}>
                  <div className="px-5 py-4 flex items-start gap-4 transition-colors" onMouseEnter={(e) => (e.currentTarget.style.background = '#EDE4CC')} onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                    {/* Avatar initial */}
                    <div className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0 text-xs font-black text-white" style={{ background: '#1A4FAD' }}>
                      {(log.profiles?.full_name || 'S').charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-sm font-bold" style={{ color: '#0A2463' }}>
                          {log.profiles?.full_name || 'System'}
                        </p>
                        <span className="text-[10px] font-mono" style={{ color: '#6B5A42' }}>
                          {new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5 truncate" style={{ color: '#6B5A42' }}>
                        <span className="font-bold" style={{ color: '#BF0A30' }}>
                          {log.action}
                        </span>
                        {log.description ? ` — ${log.description}` : ''}
                      </p>
                    </div>
                  </div>
                  {i < recentLogs.length - 1 && <GoldRule opacity={0.3} />}
                </div>
              ))
            ) : (
              <div className="py-16 text-center px-8">
                <p className="text-3xl mb-3 opacity-30">📋</p>
                <p className="text-sm italic" style={{ fontFamily: "'IM Fell English',serif", color: '#6B5A42' }}>
                  Belum ada aktivitas tercatat.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions — 1/3 */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span>⚡</span>
            <h2 className="font-bold text-lg" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
              Quick Actions
            </h2>
          </div>
          <GoldRule opacity={0.6} />

          <div className="mt-4 space-y-3">
            {QUICK_ACTIONS.map(({ label, icon, href, desc }) => (
              <button
                key={href}
                onClick={() => (window.location.href = href)}
                className="w-full text-left p-4 rounded-sm flex items-center justify-between gap-3 transition-all duration-200"
                style={{ background: '#FAF6EC', border: '1px solid #C8B99A' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#1A4FAD';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(10,36,99,0.1)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#C8B99A';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-sm flex items-center justify-center text-lg flex-shrink-0" style={{ background: '#EDE4CC' }}>
                    {icon}
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: '#0A2463' }}>
                      {label}
                    </p>
                    <p className="text-[11px]" style={{ color: '#6B5A42' }}>
                      {desc}
                    </p>
                  </div>
                </div>
                <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#C8B99A' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                </svg>
              </button>
            ))}
          </div>

          {/* Mini system summary */}
          <div className="mt-6 p-4 rounded-sm" style={{ background: '#0A2463', border: '1px solid rgba(201,168,76,0.3)' }}>
            <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,#C9A84C 25%,#C9A84C 75%,transparent)', marginBottom: 12 }} />
            <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: 'rgba(201,168,76,0.7)' }}>
              ✦ Sistem
            </p>
            <div className="space-y-2">
              {[
                { label: 'Pengguna aktif', value: stats.totalUsers },
                { label: 'Total ujian', value: stats.totalExams },
                { label: 'Total soal', value: stats.totalQuestions },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    {label}
                  </span>
                  <span className="text-sm font-bold" style={{ color: '#fff', fontFamily: "'Cormorant Garamond',serif" }}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,#C9A84C 25%,#C9A84C 75%,transparent)', marginTop: 12 }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
