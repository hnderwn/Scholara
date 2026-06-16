-- Migration: Add difficulty and weight to questions table
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS difficulty INTEGER DEFAULT 1 CHECK (difficulty IN (1, 2, 3)),
ADD COLUMN IF NOT EXISTS weight INTEGER DEFAULT 1 CHECK (weight IN (1, 2, 3));

-- Update existing questions to have a default difficulty if needed
-- (Though the DEFAULT clause above handles it for existing rows)

COMMENT ON COLUMN public.questions.difficulty IS '1: A1/A2, 2: B1/B2, 3: C1/C2';
COMMENT ON COLUMN public.questions.weight IS 'Point multiplier for the question (1-3)';
