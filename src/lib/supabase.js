import { createClient } from '@supabase/supabase-js';

// Get these from your Supabase project settings
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions for common operations
export const auth = {
  signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),

  signUp: (email, password, options = {}) => supabase.auth.signUp({ email, password, options }),

  signOut: () => supabase.auth.signOut(),

  signInWithGoogle: () =>
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    }),

  getUser: () => supabase.auth.getUser(),
};

// Database operations
export const db = {
  // Profiles
  getProfile: (userId) => supabase.from('profiles').select('*').eq('id', userId).single(),

  getAllProfiles: () => supabase.from('profiles').select('*').order('created_at', { ascending: false }),

  createProfile: (profile) => supabase.from('profiles').insert(profile),

  updateProfile: (userId, updates) => supabase.from('profiles').update(updates).eq('id', userId),

  // Questions
  getQuestions: (category = null) => {
    let query = supabase.from('questions').select('*');
    if (category) {
      query = query.eq('category', category);
    }
    return query.order('created_at', { ascending: false });
  },

  createQuestion: (question) => supabase.from('questions').insert(question),

  updateQuestion: (id, updates) => supabase.from('questions').update(updates).eq('id', id),

  deleteQuestion: (id) => supabase.from('questions').delete().eq('id', id),

  // Exam Packages
  getPackages: () => supabase.from('exam_packages').select('*').order('created_at', { ascending: false }),

  createPackage: (pkg) => supabase.from('exam_packages').insert(pkg),

  updatePackage: (id, updates) => supabase.from('exam_packages').update(updates).eq('id', id),

  deletePackage: (id) => supabase.from('exam_packages').delete().eq('id', id),

  // Exam Results
  saveExamResult: (result) => supabase.from('exam_results').insert(result),

  getExamResults: (userId = null) => {
    let query = supabase.from('exam_results').select(`*, profiles(full_name, school)`).order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    return query;
  },

  // Audit Logs
  getAuditLogs: () => supabase.from('audit_logs').select(`*, profiles(full_name)`).order('created_at', { ascending: false }).limit(100),

  createAuditLog: (log) => supabase.from('audit_logs').insert(log),

  // Learning Materials
  getLearningMaterials: (category = null, lastSync = null) => {
    let query = supabase.from('learning_materials').select('*');
    if (category && category !== 'All') {
      query = query.eq('category', category);
    }
    if (lastSync) {
      query = query.gt('updated_at', lastSync);
    }
    return query.order('term', { ascending: true });
  },

  createLearningMaterial: (material) => supabase.from('learning_materials').insert(material),

  updateLearningMaterial: (id, updates) => supabase.from('learning_materials').update(updates).eq('id', id),

  deleteLearningMaterial: (id) => supabase.from('learning_materials').delete().eq('id', id),
};
