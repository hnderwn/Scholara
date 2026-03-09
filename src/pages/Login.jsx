import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ─── Tailwind config harus include warna custom ini di tailwind.config.js ───
// colors: {
//   parchment: { DEFAULT: '#F2ECD8', light: '#FAF6EC', dark: '#EDE4CC', border: '#C8B99A' },
//   navy:      { DEFAULT: '#0A2463', light: '#1A4FAD', muted: '#4A6080' },
//   crimson:   { DEFAULT: '#BF0A30', light: '#D41035', soft: '#F9E8EC' },
//   gold:      { DEFAULT: '#C9A84C', light: '#E2C97E', dark: '#A8893A' },
//   ink:       { DEFAULT: '#2C1F0E', muted: '#6B5A42' },
// }
// fontFamily: {
//   display: ['Cormorant Garamond', 'serif'],
//   script:  ['IM Fell English', 'serif'],
//   body:    ['DM Sans', 'sans-serif'],
// }
// ─────────────────────────────────────────────────────────────────────────────

const ShieldCrest = ({ size = 36 }) => (
  <svg width={size} height={size * 1.17} viewBox="0 0 36 42" fill="none">
    <path d="M18 2L3 8V22C3 31 10 38.5 18 41C26 38.5 33 31 33 22V8L18 2Z" fill="#0A2463" stroke="#C9A84C" strokeWidth="1.5" />
    <path d="M18 7L7 12V22C7 28.5 12 34 18 36C24 34 29 28.5 29 22V12L18 7Z" fill="none" stroke="rgba(201,168,76,0.4)" strokeWidth="0.8" />
    <line x1="18" y1="11" x2="18" y2="33" stroke="#C9A84C" strokeWidth="1.2" opacity="0.7" />
    <line x1="9" y1="20" x2="27" y2="20" stroke="#C9A84C" strokeWidth="1.2" opacity="0.7" />
    <circle cx="18" cy="20" r="2" fill="#C9A84C" opacity="0.8" />
  </svg>
);

const IconEmail = () => (
  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m2 7 10 7 10-7" />
  </svg>
);
const IconLock = () => (
  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const IconUser = () => (
  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);
const IconHome = () => (
  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const IconEyeOpen = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const IconEyeClosed = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);
const IconError = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 flex-shrink-0">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

// ── Reusable password input ──
const PasswordInput = ({ id, value, onChange, placeholder }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <IconLock />
      <input id={id} type={show ? 'text' : 'password'} value={value} onChange={onChange} placeholder={placeholder} className="field-input w-full pl-10 pr-10 py-2.5 text-sm rounded-sm font-body" />
      <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-navy transition-colors">
        {show ? <IconEyeClosed /> : <IconEyeOpen />}
      </button>
    </div>
  );
};

// ── Error box ──
const ErrorBox = ({ message }) => (
  <div className="flex items-center gap-2 bg-crimson-soft border border-red-200 text-crimson text-xs px-3 py-2.5 rounded-sm">
    <IconError />
    <span>{message}</span>
  </div>
);

// ── CTA Button ──
const BtnPrimary = ({ children, onClick, type = 'submit', disabled = false }) => (
  <button type={type} onClick={onClick} disabled={disabled} className="btn-primary w-full py-3 text-white text-sm font-semibold rounded-sm font-body flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
    {children}
    {!disabled && <span className="text-gold text-base">✦</span>}
  </button>
);

// ────────────────────────────────────────────────
const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formData, setFormData] = useState({ fullName: '', school: '', confirmPassword: '' });

  const navigate = useNavigate();
  const { user, profile, signIn, signInWithGoogle, signUp, signOut, loading, error, setError } = useAuth();

  // ── Redirect jika sudah login (logika asli) ──
  useEffect(() => {
    if (!loading && user && profile) {
      if (profile.role === 'admin') {
        navigate('/admin/questions', { replace: true });
      } else {
        navigate('/siswa/dashboard', { replace: true });
      }
    }
  }, [user, profile, loading, navigate]);

  // ── Helper functions (pindah ke atas agar konsisten) ──
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSignUp) {
      if (password !== formData.confirmPassword) {
        alert('Kata sandi tidak cocok!');
        return;
      }
      const result = await signUp(email, password, formData.fullName, formData.school);
      if (result.success) {
        if (result.role === 'admin') {
          navigate('/admin/questions');
        } else {
          navigate('/siswa/dashboard');
        }
      }
    } else {
      const result = await signIn(email, password);
      if (result.success) {
        if (result.role === 'admin') {
          navigate('/admin/questions');
        } else {
          const from = location.state?.from?.pathname || '/siswa/dashboard';
          navigate(from, { replace: true });
        }
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const switchTab = (toSignUp) => {
    setIsSignUp(toSignUp);
    setError(null);
  };

  // ── Loading screen (logika asli) ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-parchment">
        <div className="text-center">
          <ShieldCrest size={40} />
          <div className="mt-4 font-display text-navy text-lg font-semibold">Memeriksa sesi...</div>
          <div className="mt-1 font-body text-sm text-ink-muted">Mohon tunggu sebentar</div>
        </div>
      </div>
    );
  }

  // ── Edge case: user ada tapi profil tidak ada (logika asli) ──
  if (user && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-parchment px-4">
        <div className="max-w-md w-full parchment-card gold-border rounded-sm shadow-xl overflow-hidden">
          <div className="red-rule h-[3px] w-full" />
          <div className="p-8 text-center">
            <ShieldCrest size={36} />
            <h2 className="font-display text-navy text-xl font-bold mt-4 mb-2">Menyiapkan Profil</h2>
            <div className="flex justify-center mb-6 mt-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
            </div>
            <p className="font-body text-ink-muted text-sm mb-6 leading-relaxed text-center">Kami sedang menyiapkan akun Anda. Mohon tunggu beberapa saat...</p>
            <button onClick={async () => await signOut()} className="w-full py-2.5 border border-ink-muted text-ink-muted text-sm font-semibold rounded-sm font-body hover:bg-stone-100 transition-all">
              Batalkan & Keluar
            </button>
          </div>
          <div className="red-rule h-[3px] w-full" />
        </div>
      </div>
    );
  }

  // ── Offline screen (NEW) ──
  if (!navigator.onLine && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-parchment px-4">
        <div className="max-w-md w-full parchment-card gold-border rounded-sm shadow-xl overflow-hidden">
          <div className="red-rule h-[3px] w-full" />
          <div className="p-8 text-center bg-[#FAF6EC]">
            <ShieldCrest size={36} />
            <h2 className="font-display text-navy text-xl font-bold mt-4 mb-2">Aktivasi Diperlukan</h2>
            <div className="flex justify-center mb-6 mt-4">
              <span className="text-4xl opacity-50">📡</span>
            </div>
            <p className="font-body text-ink-muted text-sm mb-6 leading-relaxed">Ooopps! Sepertinya kamu sedang offline. Scholara butuh koneksi internet sebentar untuk aktivasi pertama kali di perangkat ini.</p>
            <button onClick={() => window.location.reload()} className="w-full py-2.5 bg-navy text-white text-sm font-semibold rounded-sm font-body hover:bg-navy-light transition-all">
              Coba Segarkan Halaman
            </button>
          </div>
          <div className="red-rule h-[3px] w-full" />
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────
  return (
    <>
      {/* Global styles — masukkan ke index.css / global.css di project kamu */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=IM+Fell+English:ital@0;1&family=DM+Sans:wght@400;500;600&display=swap');

        .panel-left {
          background-color: #0A2463;
          background-image:
            repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 40px),
            repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 40px);
        }
        .parchment-card {
          background-color: #FAF6EC;
        }
        .gold-border {
          border: 1px solid #C9A84C;
          box-shadow: 0 0 0 1px rgba(201,168,76,0.15), inset 0 0 0 1px rgba(201,168,76,0.05);
        }
        .field-input {
          background: #EDE4CC;
          border: 1px solid #C8B99A;
          color: #2C1F0E;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .field-input::placeholder { color: #A8946C; }
        .field-input:focus {
          outline: none;
          border-color: #1A4FAD;
          background: #F2ECD8;
          box-shadow: 0 0 0 3px rgba(26,79,173,0.12);
        }
        .btn-primary {
          background: #1A4FAD;
          transition: all 0.2s;
        }
        .btn-primary:hover:not(:disabled) {
          background: #2460C8;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(26,79,173,0.3);
        }
        .btn-primary:active:not(:disabled) { transform: translateY(0); }
        .red-rule {
          background: linear-gradient(90deg, transparent, #BF0A30 30%, #BF0A30 70%, transparent);
        }
        .ornament { color: #C9A84C; letter-spacing: 6px; font-size: 10px; }
        .tab-underline {
          position: relative;
        }
        .tab-underline::after {
          content: '';
          position: absolute;
          bottom: -1px; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, #BF0A30, #1A4FAD);
          border-radius: 2px;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.5s ease both; }
      `}</style>

      <div className="min-h-screen flex" style={{ backgroundColor: '#F2ECD8', fontFamily: "'DM Sans', sans-serif" }}>
        {/* ══ LEFT PANEL ══ */}
        <div className="hidden lg:flex lg:w-[42%] panel-left relative flex-col justify-between p-12 overflow-hidden">
          {/* Gold corner ornaments */}
          <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-gold opacity-40" />
          <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-gold opacity-40" />
          <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-gold opacity-40" />
          <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-gold opacity-40" />

          {/* Red top stripe */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-crimson opacity-80" />

          {/* Logo */}
          <div className="relative z-10 flex items-center gap-3">
            <ShieldCrest size={36} />
            <div>
              <div className="font-display text-white text-xl font-bold tracking-wide leading-none" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Scholara
              </div>
              <div className="text-white text-xs italic opacity-80 leading-tight" style={{ fontFamily: "'IM Fell English', serif" }}>
                Est. 2025
              </div>
            </div>
          </div>

          {/* Center */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex-1 h-px bg-gold opacity-30" />
              <span className="ornament">✦ ✦ ✦</span>
              <div className="flex-1 h-px bg-gold opacity-30" />
            </div>

            <h1 className="text-white leading-tight mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 48, lineHeight: 1.1 }}>
              Navigasi
              <br />
              <em style={{ color: '#C9A84C' }}>Perjalanan</em>
              <br />
              Akademimu.
            </h1>

            <div className="h-px bg-gold opacity-20 my-5" />

            <p className="text-blue-200 text-base italic leading-relaxed opacity-90 mb-8" style={{ fontFamily: "'IM Fell English', serif" }}>
              "Education is the passport to the future,
              <br />
              for tomorrow belongs to those who prepare for it today."
            </p>

            <div className="flex flex-col gap-3">
              {['Ribuan soal tryout terverifikasi', 'Rekomendasi belajar personal', 'Analisis performa mendalam'].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#BF0A30' }}>
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className="text-blue-200 text-sm font-body">{item}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 mt-8">
              <div className="flex-1 h-px bg-gold opacity-30" />
              <span className="ornament">✦ ✦ ✦</span>
              <div className="flex-1 h-px bg-gold opacity-30" />
            </div>
          </div>

          {/* Stats */}
          <div className="relative z-10 grid grid-cols-3 gap-4">
            {[
              ['12K+', 'Siswa'],
              ['5K+', 'Soal'],
              ['98%', 'Puas'],
            ].map(([num, label], i) => (
              <div key={label} className={`text-center ${i === 1 ? 'border-x border-gold border-opacity-20' : ''}`}>
                <div className="text-white text-2xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  {num}
                </div>
                <div className="text-blue-300 text-xs uppercase tracking-widest mt-0.5 font-body">{label}</div>
              </div>
            ))}
          </div>

          {/* Bottom red stripe */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-crimson opacity-80" />
        </div>

        {/* ══ RIGHT PANEL ══ */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-[420px] fade-up">
            {/* Mobile logo */}
            <div className="flex lg:hidden items-center gap-3 mb-8">
              <ShieldCrest size={28} />
              <div>
                <div className="text-navy text-xl font-bold" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  Scholara
                </div>
                <div className="text-gold text-xs italic" style={{ fontFamily: "'IM Fell English', serif" }}>
                  Est. 2024
                </div>
              </div>
            </div>

            {/* Card */}
            <div className="parchment-card gold-border rounded-sm shadow-xl overflow-hidden">
              <div className="red-rule h-[3px] w-full" />

              <div className="p-8">
                {/* Tabs */}
                <div className="flex border-b mb-7 gap-6" style={{ borderColor: '#C8B99A' }}>
                  <button
                    type="button"
                    onClick={() => switchTab(false)}
                    className={`pb-3 text-lg font-semibold tracking-wide transition-colors ${!isSignUp ? 'tab-underline text-navy' : 'text-ink-muted hover:text-navy'}`}
                    style={{ fontFamily: "'Cormorant Garamond', serif", color: !isSignUp ? '#0A2463' : '#6B5A42' }}
                  >
                    Masuk
                  </button>
                  <button
                    type="button"
                    onClick={() => switchTab(true)}
                    className={`pb-3 text-lg font-semibold tracking-wide transition-colors ${isSignUp ? 'tab-underline' : 'hover:text-navy'}`}
                    style={{ fontFamily: "'Cormorant Garamond', serif", color: isSignUp ? '#0A2463' : '#6B5A42' }}
                  >
                    Daftar
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  {/* ── LOGIN FORM ── */}
                  {!isSignUp && (
                    <>
                      <div className="mb-6">
                        <h2 className="text-navy text-2xl font-bold leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                          Selamat Datang Kembali
                        </h2>
                        <p className="text-sm mt-1 font-body" style={{ color: '#6B5A42' }}>
                          Masuk untuk melanjutkan sesi belajarmu.
                        </p>
                      </div>

                      <div className="space-y-4 mb-4">
                        {/* Email */}
                        <div>
                          <label className="block text-xs font-semibold text-navy uppercase tracking-widest mb-1.5 font-body">Alamat Email</label>
                          <div className="relative">
                            <IconEmail />
                            <input type="email" autoComplete="email" required placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="field-input w-full pl-10 pr-4 py-2.5 text-sm rounded-sm" />
                          </div>
                        </div>

                        {/* Password */}
                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <label className="text-xs font-semibold text-navy uppercase tracking-widest font-body">Kata Sandi</label>
                            <a href="#" className="text-xs font-body transition-colors" style={{ color: '#BF0A30' }}>
                              Lupa sandi?
                            </a>
                          </div>
                          <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimal 8 karakter" />
                        </div>
                      </div>

                      {error && <ErrorBox message={error} />}
                    </>
                  )}

                  {/* ── REGISTER FORM ── */}
                  {isSignUp && (
                    <>
                      <div className="mb-6">
                        <h2 className="text-navy text-2xl font-bold leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                          Mulai Perjalananmu
                        </h2>
                        <p className="text-sm mt-1 font-body" style={{ color: '#6B5A42' }}>
                          Daftar gratis dan raih prestasi terbaikmu.
                        </p>
                      </div>

                      <div className="space-y-4 mb-4">
                        {/* Nama & Sekolah */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-navy uppercase tracking-widest mb-1.5 font-body">Nama</label>
                            <div className="relative">
                              <IconUser />
                              <input
                                name="fullName"
                                type="text"
                                autoComplete="name"
                                required
                                placeholder="John Doe"
                                value={formData.fullName}
                                onChange={handleInputChange}
                                className="field-input w-full pl-10 pr-3 py-2.5 text-sm rounded-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-navy uppercase tracking-widest mb-1.5 font-body">Sekolah</label>
                            <div className="relative">
                              <IconHome />
                              <input name="school" type="text" required placeholder="SMA Negeri 1" value={formData.school} onChange={handleInputChange} className="field-input w-full pl-10 pr-3 py-2.5 text-sm rounded-sm" />
                            </div>
                          </div>
                        </div>

                        {/* Email */}
                        <div>
                          <label className="block text-xs font-semibold text-navy uppercase tracking-widest mb-1.5 font-body">Alamat Email</label>
                          <div className="relative">
                            <IconEmail />
                            <input type="email" autoComplete="email" required placeholder="nama@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="field-input w-full pl-10 pr-4 py-2.5 text-sm rounded-sm" />
                          </div>
                        </div>

                        {/* Password */}
                        <div>
                          <label className="block text-xs font-semibold text-navy uppercase tracking-widest mb-1.5 font-body">Kata Sandi</label>
                          <PasswordInput id="password-reg" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimal 8 karakter" />
                        </div>

                        {/* Confirm Password */}
                        <div>
                          <label className="block text-xs font-semibold text-navy uppercase tracking-widest mb-1.5 font-body">Konfirmasi Sandi</label>
                          <PasswordInput id="confirmPassword" value={formData.confirmPassword} onChange={(e) => handleInputChange({ target: { name: 'confirmPassword', value: e.target.value } })} placeholder="Ulangi kata sandi" />
                        </div>
                      </div>

                      {error && <ErrorBox message={error} />}

                      <p className="text-center font-body text-xs mb-4" style={{ color: '#6B5A42' }}>
                        Dengan mendaftar kamu menyetujui{' '}
                        <a href="#" className="hover:underline" style={{ color: '#BF0A30' }}>
                          Syarat & Ketentuan
                        </a>{' '}
                        kami.
                      </p>
                    </>
                  )}

                  {/* Submit */}
                  <BtnPrimary disabled={loading}>{loading ? 'Memproses...' : isSignUp ? 'Buat Akun' : 'Masuk'}</BtnPrimary>
                </form>

                {/* Google — hanya tampil di login */}
                {!isSignUp && (
                  <>
                    <div className="flex items-center gap-3 py-4">
                      <div className="flex-1 h-px" style={{ backgroundColor: '#C8B99A' }} />
                      <span className="font-body text-xs italic" style={{ color: '#6B5A42', fontFamily: "'IM Fell English', serif" }}>
                        atau
                      </span>
                      <div className="flex-1 h-px" style={{ backgroundColor: '#C8B99A' }} />
                    </div>
                    <button
                      type="button"
                      onClick={() => signInWithGoogle()}
                      className="w-full py-2.5 border text-sm font-semibold rounded-sm font-body transition-all duration-200 flex items-center justify-center gap-2.5 hover:opacity-80"
                      style={{ borderColor: '#C8B99A', backgroundColor: '#F2ECD8', color: '#2C1F0E' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      Lanjutkan dengan Google
                    </button>
                  </>
                )}

                {/* Switch tab link */}
                <p className="text-center font-body text-xs mt-6" style={{ color: '#6B5A42' }}>
                  {isSignUp ? 'Sudah punya akun?' : 'Belum punya akun?'}
                  <button type="button" onClick={() => switchTab(!isSignUp)} className="font-semibold ml-1 hover:underline transition-colors" style={{ color: '#BF0A30' }}>
                    {isSignUp ? 'Masuk di sini →' : 'Daftar gratis →'}
                  </button>
                </p>
              </div>
              <div className="red-rule h-[3px] w-full" />
            </div>

            {/* Tagline */}
            <p className="text-center text-xs italic mt-5 opacity-60" style={{ color: '#6B5A42', fontFamily: "'IM Fell English', serif" }}>
              Raih prestasi terbaikmu bersama Scholara ✦
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
