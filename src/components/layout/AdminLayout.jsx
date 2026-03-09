import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ── Shield Icon ──
const ShieldIcon = ({ size = 26 }) => (
  <svg width={size} height={size * 1.17} viewBox="0 0 36 42" fill="none">
    <path d="M18 2L3 8V22C3 31 10 38.5 18 41C26 38.5 33 31 33 22V8L18 2Z" fill="#0A2463" stroke="#C9A84C" strokeWidth="1.5" />
    <path d="M18 7L7 12V22C7 28.5 12 34 18 36C24 34 29 28.5 29 22V12L18 7Z" fill="none" stroke="rgba(201,168,76,0.4)" strokeWidth="0.8" />
    <line x1="18" y1="11" x2="18" y2="33" stroke="#C9A84C" strokeWidth="1.2" opacity="0.8" />
    <line x1="9" y1="20" x2="27" y2="20" stroke="#C9A84C" strokeWidth="1.2" opacity="0.8" />
    <circle cx="18" cy="20" r="2.5" fill="#C9A84C" opacity="0.9" />
  </svg>
);

const AdminLayout = ({ children }) => {
  // ── Semua state & logika asli tidak diubah ──
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    {
      path: '/admin/dashboard',
      name: 'Beranda Admin',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      path: '/admin/questions',
      name: 'Manajemen Soal',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      path: '/admin/packages',
      name: 'Paket Ujian',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      path: '/admin/users',
      name: 'Pengguna',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      path: '/admin/results',
      name: 'Hasil Ujian',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      path: '/admin/reports',
      name: 'Laporan Analitik',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      path: '/admin/learning',
      name: 'Materi Belajar',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      ),
    },
    {
      path: '/admin/audit-logs',
      name: 'Audit Logs',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      path: '/siswa/dashboard',
      name: 'Kembali ke Siswa',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex overflow-x-hidden" style={{ backgroundColor: '#F2ECD8', fontFamily: "'DM Sans',sans-serif" }}>
      {/* ══════════ MOBILE HEADER ══════════ */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 h-16 z-30 flex items-center justify-between px-4"
        style={{
          backgroundColor: '#0A2463',
          borderBottom: '1px solid rgba(201,168,76,0.25)',
          boxShadow: '0 2px 12px rgba(10,36,99,0.2)',
        }}
      >
        <div className="flex items-center gap-3">
          <ShieldIcon size={24} />
          <span className="text-white font-bold text-lg" style={{ fontFamily: "'Cormorant Garamond',serif" }}>
            Admin Panel
          </span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-white hover:bg-white/10 rounded-sm transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>
      </header>

      {/* ══════════ SIDEBAR (DRAWER ON MOBILE) ══════════ */}
      {/* Mobile Overlay */}
      {isSidebarOpen && window.innerWidth <= 768 && <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />}

      <aside
        className={`fixed h-full z-50 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        style={{
          width: isSidebarOpen ? 240 : 72,
          backgroundColor: '#0A2463',
          backgroundImage: `
            repeating-linear-gradient(0deg,  rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 36px),
            repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 36px)
          `,
          borderRight: '1px solid rgba(201,168,76,0.25)',
          boxShadow: '4px 0 24px rgba(10,36,99,0.2)',
        }}
      >
        {/* Gold top stripe */}
        <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,#C9A84C 25%,#C9A84C 75%,transparent)', flexShrink: 0 }} />

        {/* Logo area */}
        <div
          className="flex items-center gap-3 overflow-hidden"
          style={{
            padding: isSidebarOpen ? '20px 20px' : '20px 0',
            justifyContent: isSidebarOpen ? 'flex-start' : 'center',
            borderBottom: '1px solid rgba(201,168,76,0.15)',
            minHeight: 72,
            flexShrink: 0,
          }}
        >
          <div className="flex-shrink-0">
            <ShieldIcon size={26} />
          </div>
          {isSidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-white font-bold text-base leading-none truncate" style={{ fontFamily: "'Cormorant Garamond',serif" }}>
                Scholara
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest mt-0.5" style={{ color: '#C9A84C' }}>
                Admin Panel
              </p>
            </div>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-0.5" style={{ padding: isSidebarOpen ? '12px 10px' : '12px 8px' }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const isSiswa = item.path === '/siswa/dashboard';
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center rounded-sm transition-all duration-150 group"
                style={{
                  gap: isSidebarOpen ? 10 : 0,
                  padding: isSidebarOpen ? '9px 12px' : '9px 0',
                  justifyContent: isSidebarOpen ? 'flex-start' : 'center',
                  background: isActive ? 'rgba(201,168,76,0.15)' : 'transparent',
                  borderLeft: isActive ? '3px solid #C9A84C' : isSiswa ? '3px solid rgba(191,10,48,0.3)' : '3px solid transparent',
                  color: isActive ? '#C9A84C' : isSiswa ? 'rgba(252,205,211,0.8)' : 'rgba(255,255,255,0.6)',
                  marginTop: isSiswa ? 8 : 0,
                  borderTop: isSiswa ? '1px solid rgba(201,168,76,0.1)' : 'none',
                  paddingTop: isSiswa ? 12 : 9,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.color = '#fff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = isSiswa ? 'rgba(252,205,211,0.8)' : 'rgba(255,255,255,0.6)';
                  }
                }}
              >
                <div className="flex-shrink-0" style={{ color: 'inherit' }}>
                  {item.icon}
                </div>
                {isSidebarOpen && (
                  <span className="text-sm font-semibold whitespace-nowrap truncate" style={{ color: 'inherit' }}>
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: profile + logout */}
        <div style={{ borderTop: '1px solid rgba(201,168,76,0.15)', padding: isSidebarOpen ? '12px 10px' : '12px 8px', flexShrink: 0 }}>
          {/* Profile card */}
          {isSidebarOpen && (
            <div className="mb-2 px-3 py-2.5 rounded-sm" style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)' }}>
              <p className="text-[9px] font-black uppercase tracking-widest mb-0.5" style={{ color: 'rgba(201,168,76,0.6)' }}>
                Administrator
              </p>
              <p className="text-sm font-semibold truncate text-white" style={{ fontFamily: "'Cormorant Garamond',serif" }}>
                {profile?.full_name || 'Admin'}
              </p>
            </div>
          )}

          {/* Logout */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center rounded-sm transition-all duration-150 font-semibold text-sm"
            style={{
              gap: isSidebarOpen ? 10 : 0,
              padding: isSidebarOpen ? '9px 12px' : '9px 0',
              justifyContent: isSidebarOpen ? 'flex-start' : 'center',
              color: '#FECDD3',
              background: 'rgba(191,10,48,0.1)',
              border: '1px solid rgba(191,10,48,0.2)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(191,10,48,0.22)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(191,10,48,0.1)')}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {isSidebarOpen && <span>Keluar</span>}
          </button>
        </div>

        {/* Gold bottom stripe */}
        <div style={{ height: 2, background: 'linear-gradient(90deg,transparent,#C9A84C 25%,#C9A84C 75%,transparent)', flexShrink: 0 }} />

        {/* Toggle button — desktop only */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="hidden md:flex absolute -right-3 top-24 w-6 h-6 rounded-full items-center justify-center transition-all hover:scale-110 active:scale-95 z-30"
          style={{
            background: '#FAF6EC',
            border: '1px solid #C9A84C',
            boxShadow: '0 2px 8px rgba(10,36,99,0.2)',
            color: '#0A2463',
          }}
        >
          <svg className="w-3.5 h-3.5 transition-transform duration-300" style={{ transform: isSidebarOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </aside>

      {/* ══════════ MAIN CONTENT ══════════ */}
      <main
        className="flex-1 min-h-screen transition-all duration-300 min-w-0"
        style={{
          marginLeft: window.innerWidth > 768 ? (isSidebarOpen ? 240 : 72) : 0,
          paddingTop: window.innerWidth <= 768 ? 64 : 0,
        }}
      >
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
