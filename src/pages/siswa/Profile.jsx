import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/supabase';

// ── Shield Icon (Used as Avatar Placeholder) ──
const ShieldIcon = ({ size = 48 }) => (
  <svg width={size} height={size * 1.17} viewBox="0 0 36 42" fill="none">
    <path d="M18 2L3 8V22C3 31 10 38.5 18 41C26 38.5 33 31 33 22V8L18 2Z" fill="#0A2463" stroke="#C9A84C" strokeWidth="1.5" />
    <path d="M18 7L7 12V22C7 28.5 12 34 18 36C24 34 29 28.5 29 22V12L18 7Z" fill="none" stroke="rgba(201,168,76,0.4)" strokeWidth="0.8" />
    <line x1="18" y1="11" x2="18" y2="33" stroke="#C9A84C" strokeWidth="1.2" opacity="0.8" />
    <line x1="9" y1="20" x2="27" y2="20" stroke="#C9A84C" strokeWidth="1.2" opacity="0.8" />
    <circle cx="18" cy="20" r="2.5" fill="#C9A84C" opacity="0.9" />
  </svg>
);

const GoldRule = ({ opacity = 1 }) => <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,#C8B99A 30%,#C8B99A 70%,transparent)', opacity }} />;

const Profile = () => {
  const navigate = useNavigate();
  const { profile, user, signOut, loading: authLoading } = useAuth();
  
  const [stats, setStats] = useState({ totalExams: 0, averageScore: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (!profile?.id) return;
      
      try {
        setLoadingStats(true);
        // Jika offline, andalkan data cache jika ada, tapi karena ini statik kita coba fetch
        if (!navigator.onLine) {
           setLoadingStats(false);
           return;
        }

        const { data, error } = await db.getExamResults(profile.id);
        if (error) throw error;
        
        if (data && data.length > 0) {
          const totalExams = data.length;
          const totalScore = data.reduce((sum, exam) => sum + exam.score_total, 0);
          setStats({
            totalExams,
            averageScore: Math.round(totalScore / totalExams)
          });
        }
      } catch (error) {
        console.error('Error loading profile stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    loadStats();
  }, [profile?.id]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  if (authLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
        <span className="text-sm text-ink-muted mt-3 font-body">Memuat profil...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12 w-full" style={{ backgroundColor: '#F2ECD8', fontFamily: "'DM Sans',sans-serif" }}>
      {/* ══════════ Header ══════════ */}
      <div 
        className="w-full pt-6 pb-16 relative"
        style={{
          backgroundColor: '#0A2463',
          backgroundImage: `
          repeating-linear-gradient(0deg,  rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 36px),
          repeating-linear-gradient(90deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 36px)
        `,
          borderBottom: '2px solid #C9A84C'
        }}
      >
        <div className="max-w-2xl mx-auto px-4 flex items-start justify-between relative z-10 pt-4 md:pt-0">
          {/* Horizontally aligned Title + ShieldIcon */}
          <div className="flex items-center gap-2 md:gap-3">
            <ShieldIcon size={24} />
            <div className="min-w-0">
              <h1 className="text-white text-base md:text-xl font-bold leading-none truncate" style={{ fontFamily: "'Cormorant Garamond',serif" }}>
                Profil Akademi
              </h1>
              <p className="hidden xs:block text-[10px] md:text-xs italic opacity-75 mt-0.5" style={{ color: '#C9A84C', fontFamily: "'IM Fell English',serif" }}>
                Your academic journey
              </p>
            </div>
          </div>
          
          {/* Exit Button - Styled exactly like the close button in Dictionary.jsx */}
          <button
             onClick={() => navigate('/siswa/dashboard')}
             className="p-1.5 rounded-sm transition-colors"
             style={{ color: '#C9A84C' }}
             onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(201,168,76,0.1)')}
             onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
             <svg className="w-5 h-5 md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
               <line x1="18" y1="6" x2="6" y2="18" />
               <line x1="6" y1="6" x2="18" y2="18" />
             </svg>
          </button>
        </div>
      </div>

      {/* ══════════ Profile Card ══════════ */}
      <div className="max-w-2xl mx-auto px-4 -mt-10 relative z-10">
        <div 
          className="rounded-sm overflow-hidden"
          style={{ 
            background: '#FAF6EC', 
            border: '1px solid #C8B99A',
            boxShadow: '0 8px 24px rgba(10,36,99,0.1)'
          }}
        >
          {/* Top Decor */}
          <div style={{ height: 3, background: 'linear-gradient(90deg, #1A4FAD, #BF0A30)' }} />

          <div className="p-6 md:p-8 flex flex-col items-center text-center">
             {/* Avatar Area */}
             <div className="mb-4">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-white rounded-full flex items-center justify-center mx-auto" style={{ border: '2px solid #C9A84C', boxShadow: '0 4px 12px rgba(201,168,76,0.3)' }}>
                  <ShieldIcon size={40} />
                </div>
             </div>

             {/* Info */}
             <h2 className="font-bold text-2xl md:text-3xl mb-1" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
                {profile?.full_name || 'Pelajar Scholara'}
             </h2>
             
             <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
               <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-sm" style={{ background: '#EDE4CC', color: '#6B5A42', border: '1px solid #C8B99A' }}>
                  {profile?.role === 'siswa' ? 'Siswa' : 'Admin'}
               </span>
               <span className="text-[11px] md:text-sm italic" style={{ fontFamily: "'IM Fell English',serif", color: '#6B5A42' }}>
                  di {profile?.school || '-'}
               </span>
             </div>

             <div className="w-full max-w-xs mx-auto mb-6">
                <GoldRule opacity={0.6}/>
             </div>

             {/* Stats Grid */}
             <div className="grid grid-cols-2 gap-4 w-full max-w-sm mx-auto mb-8">
                <div className="p-4 rounded-sm" style={{ background: '#F2ECD8', border: '1px solid #C8B99A' }}>
                   <p className="text-[10px] uppercase font-bold tracking-widest mb-1" style={{ color: '#6B5A42' }}>Level Rata-Rata</p>
                   <p className="text-xl md:text-2xl font-bold" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
                      {loadingStats ? '...' : (stats.averageScore > 0 ? `${stats.averageScore}%` : '-')}
                   </p>
                </div>
                <div className="p-4 rounded-sm" style={{ background: '#F2ECD8', border: '1px solid #C8B99A' }}>
                   <p className="text-[10px] uppercase font-bold tracking-widest mb-1" style={{ color: '#6B5A42' }}>Total Ujian</p>
                   <p className="text-xl md:text-2xl font-bold" style={{ fontFamily: "'Cormorant Garamond',serif", color: '#0A2463' }}>
                      {loadingStats ? '...' : stats.totalExams} <span className="text-sm font-normal">x</span>
                   </p>
                </div>
             </div>

             {/* Email Account */}
             <div className="w-full bg-white bg-opacity-40 p-3 rounded-sm border mb-8 flex items-center justify-center gap-2" style={{ borderColor: '#E2C97E' }}>
                <span className="text-xl">✉️</span>
                <span className="text-xs md:text-sm font-medium" style={{ color: '#0A2463' }}>{user?.email}</span>
             </div>

             {/* Logout CTA */}
             <button
               onClick={handleSignOut}
               className="w-full max-w-xs py-3.5 text-sm font-bold flex items-center justify-center gap-2 rounded-sm transition-all"
               style={{ 
                  background: '#BF0A30', 
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(191,10,48,0.3)'
               }}
               onMouseEnter={(e) => {
                 e.currentTarget.style.background = '#D41035';
                 e.currentTarget.style.transform = 'translateY(-2px)';
               }}
               onMouseLeave={(e) => {
                 e.currentTarget.style.background = '#BF0A30';
                 e.currentTarget.style.transform = 'none';
               }}
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
               </svg>
               Keluar Sesi
             </button>
          </div>
        </div>
        
        {/* Footer note */}
        <div className="text-center mt-6 hidden md:block">
           <p className="text-xs italic opacity-60" style={{ color: '#6B5A42', fontFamily: "'IM Fell English',serif" }}>
              Perjalanan akademikmu terekam dengan aman di Scholara.
           </p>
        </div>
      </div>
    </div>
  );
};

export default Profile;
