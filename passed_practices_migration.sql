-- Migration: Add passed_practices array column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS passed_practices TEXT[] DEFAULT '{}'::text[];

COMMENT ON COLUMN public.profiles.passed_practices IS 'Array kategori materi (grammar, vocab, reading, cloze) yang berhasil lulus >= 70% di level aktif';
