-- Create Learning Materials Table
CREATE TABLE IF NOT EXISTS public.learning_materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  term TEXT NOT NULL,
  definition TEXT,
  example_sentence TEXT,
  category TEXT NOT NULL, -- e.g. Vocabulary, Grammar, Phrases
  sub_category TEXT, -- e.g. Adjective, Gerund, Tenses
  level TEXT, -- e.g. A1, A2, B1, B2, C1, C2
  audio_url TEXT, -- for future pronunciation feature
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.learning_materials ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Learning materials are viewable by everyone" 
  ON public.learning_materials FOR SELECT 
  USING (true);

CREATE POLICY "Admins can manage learning materials" 
  ON public.learning_materials FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Seed some initial data
INSERT INTO public.learning_materials (term, definition, example_sentence, category, sub_category, level)
VALUES 
('Persistent', 'Continuing firmly or obstinately in a course of action in spite of difficulty or opposition.', 'He was persistent in his efforts to learn the language.', 'Vocabulary', 'Adjective', 'B2'),
('Gerund', 'A form that is derived from a verb but that functions as a noun.', 'In "learning is fun", the word "learning" is a gerund.', 'Grammar', 'Gerund', 'B1'),
('Eloquent', 'Fluent or persuasive in speaking or writing.', 'His speech was eloquent and moved the audience.', 'Vocabulary', 'Adjective', 'C1');
