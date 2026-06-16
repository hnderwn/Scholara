-- Create Exam Packages Table
CREATE TABLE IF NOT EXISTS public.exam_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  unique_name TEXT,
  description TEXT,
  duration INTEGER NOT NULL, -- duration in seconds
  question_count INTEGER NOT NULL,
  category TEXT NOT NULL,
  type TEXT CHECK (type IN ('ujian', 'latihan')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  target_id TEXT, -- ID of the object being modified (e.g. question_id)
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.exam_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Polices for Exam Packages
CREATE POLICY "Exam packages are viewable by everyone" 
  ON public.exam_packages FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage exam packages" 
  ON public.exam_packages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Polices for Audit Logs
CREATE POLICY "Admins can view audit logs" 
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Users can insert audit logs" 
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

-- Seed initial packages if table is empty
INSERT INTO public.exam_packages (name, unique_name, description, duration, question_count, category, type)
SELECT 'Kickstart Diagnostic', 'The Level Check', 'Paket lengkap (Mixed Difficulty) untuk profil awal.', 3600, 50, 'Diagnostic', 'ujian'
WHERE NOT EXISTS (SELECT 1 FROM public.exam_packages WHERE name = 'Kickstart Diagnostic');

INSERT INTO public.exam_packages (name, unique_name, description, duration, question_count, category, type)
SELECT 'Grammar Master', 'Skill: Grammar', 'Fokus 100% pada struktur dan tata bahasa.', 1500, 20, 'Skill', 'latihan'
WHERE NOT EXISTS (SELECT 1 FROM public.exam_packages WHERE name = 'Grammar Master');
