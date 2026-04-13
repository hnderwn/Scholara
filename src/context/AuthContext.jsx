import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, auth, db } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Profile Cache Key
  const CACHE_KEY = 'scholara_user_profile';

  // Inisialisasi state otentikasi
  useEffect(() => {
    let mounted = true;

    // Listen for connectivity changes
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    let currentLoading = true;

    const handleSession = async (session) => {
      if (!mounted) return;
      
      if (session?.user) {
        setUser(session.user);

        // Optimistic: Gunakan cache jika tersedia untuk resolusi instan
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached && currentLoading) {
          setProfile(JSON.parse(cached));
          setLoading(false);
          currentLoading = false;
        }

        // Fetch profil terbaru secara asinkron
        const profileData = await fetchProfile(session.user.id);

        if (mounted) {
          if (profileData) {
            setProfile(profileData);
          } else {
            console.warn('AuthContext: Profile fetch failed. Kicking user out.');
            setUser(null);
            setProfile(null);
            localStorage.removeItem(CACHE_KEY);
            
            const badKeys = [];
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i);
              if (k && k.startsWith('sb-') && k.endsWith('-auth-token')) badKeys.push(k);
            }
            badKeys.forEach(k => localStorage.removeItem(k));
          }
          setLoading(false);
          currentLoading = false;
        }
      } else {
        if (mounted) {
          setUser(null);
          setProfile(null);
          localStorage.removeItem(CACHE_KEY);
          setLoading(false);
          currentLoading = false;
        }
      }
    };

    // Ambil initial session secara eksplisit agar lebih handal saat refresh
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`AuthContext: Event [${event}] received`);
      if (event === 'SIGNED_OUT') {
        if (mounted) {
          setUser(null);
          setProfile(null);
          localStorage.removeItem(CACHE_KEY);
          setLoading(false);
          currentLoading = false;
        }
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        handleSession(session);
      }
    });

    // Timeout safety: Pastikan UI tidak stuck jika Supabase/Network bermasalah
    const safetyTimeout = setTimeout(() => {
      if (mounted && currentLoading) {
        console.warn('AuthContext: Initialization timeout reached. Forcing loading to false.');
        setLoading(false);
      }
    }, 6000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Ambil profil pengguna
  const fetchProfile = async (userId, retries = 3) => {
    try {
      // Jika offline, jangan panggil DB, andalkan cache yang sudah ada atau biarkan null
      if (!navigator.onLine) {
        console.log('Auth: Offline, skipping live profile fetch');
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) return JSON.parse(cached);
        return null;
      }

      const { data, error } = await db.getProfile(userId);

      // Jika profil tidak ditemukan dan sisa retries ada (kemungkinan delay Trigger), tunggu dan coba lagi
      if (!data && retries > 0) {
        console.log(`Profile not found yet, retrying... (${retries} left)`);
        await new Promise((resolve) => setTimeout(resolve, 1500)); // Increased wait time
        return fetchProfile(userId, retries - 1);
      }

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "Row not found"

      if (data) {
        setProfile(data);
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      }

      return data;
    } catch (error) {
      console.error('Profile fetch error:', error);
      return null;
    }
  };

  // Fungsi masuk (sign in)
  const signIn = async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      const { data, error } = await auth.signIn(email, password);
      if (error) throw error;

      setUser(data.user);
      const userProfile = await fetchProfile(data.user.id);

      return { success: true, role: userProfile?.role };
    } catch (error) {
      console.error('Sign in error:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Masuk dengan Google
  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      const { error } = await auth.signInWithGoogle();
      if (error) throw error;
      // Redirect ditangani oleh Supabase OAuth
    } catch (error) {
      console.error('Google sign in error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi daftar (sign up)
  const signUp = async (email, password, fullName, school, role = 'siswa') => {
    try {
      setError(null);
      setLoading(true);

      // Daftar pengguna dengan metadata
      const { data: authData, error: authError } = await auth.signUp(email, password, {
        data: {
          full_name: fullName,
          school: school,
          role: role,
        },
      });
      if (authError) throw authError;

      setUser(authData.user);
      if (authData.user) {
        // Tunggu jeda sebentar untuk trigger
        await new Promise((resolve) => setTimeout(resolve, 2000));

        let { data: checkProfile } = await db.getProfile(authData.user.id);

        if (!checkProfile) {
          console.warn('Trigger based profile creation failed or too slow. Attempting manual creation...');
          // Fallback: Buat profil secara manual
          const { error: manualProfileError } = await db.createProfile({
            id: authData.user.id,
            full_name: fullName,
            school: school,
            role: role,
          });

          if (manualProfileError) {
            console.error('Manual profile creation fallback failed:', manualProfileError);
          }
        }

        const userProfile = await fetchProfile(authData.user.id);
        return { success: true, role: userProfile?.role };
      }

      return { success: true };
    } catch (error) {
      console.error('Sign up error:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Fungsi keluar (sign out)
  const signOut = async () => {
    try {
      setLoading(true);

      // Menggunakan Promise.race untuk memberikan timeout ketat pada Supabase Auth
      // Jika terjadi jaringan lemot/hang, kita paksa keluar secara lokal (UX)
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Sign out timeout')), 3000));

      try {
        await Promise.race([auth.signOut(), timeoutPromise]);
      } catch (err) {
        console.warn('Supabase sign out error or timeout:', err.message);
        // Tetap lanjut hapus sesi lokal meskipun server/API supabase gagal
      }

      // SURGICAL STRIKE: Mencegah Zombie Session
      // Hapus token akses asli dari Supabase yang tersisa di storage
      // Key biasanya berbentuk 'sb-[project-id]-auth-token'
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));

      setUser(null);
      setProfile(null);
      localStorage.removeItem(CACHE_KEY);

      return { success: true };
    } catch (error) {
      console.error('Sign out fallback error:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Cek apakah pengguna memiliki peran tertentu
  const hasRole = (role) => {
    return profile?.role === role;
  };

  // Cek apakah pengguna adalah admin
  const isAdmin = () => hasRole('admin');

  // Cek apakah pengguna adalah siswa
  const isStudent = () => hasRole('siswa');

  const value = {
    user,
    profile,
    loading,
    error,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    hasRole,
    isAdmin,
    isStudent,
    isOnline,
    fetchProfile,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
