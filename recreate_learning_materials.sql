-- Recreate learning_materials table with strict column order
DROP TABLE IF EXISTS learning_materials;

CREATE TABLE learning_materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  term TEXT NOT NULL,
  definition TEXT,
  definition_bahasa TEXT,
  example_sentence TEXT,
  example_sentence_bahasa TEXT,
  category TEXT DEFAULT 'Vocabulary',
  sub_category TEXT,
  level TEXT DEFAULT 'B1',
  audio_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE learning_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON learning_materials
  FOR SELECT USING (true);

CREATE POLICY "Allow admin full access" ON learning_materials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Seed Data (10 Items)
INSERT INTO learning_materials 
(term, definition, definition_bahasa, example_sentence, example_sentence_bahasa, category, sub_category, level)
VALUES 
('Persistent', 'Continuing firmly or obstinately in a course of action in spite of difficulty or opposition.', 'Sesuatu yang terus berlanjut secara teguh terlepas dari oposisi, hambatan, atau kesulitan.', 'Her persistent efforts finally paid off.', 'Usahanya yang gigih akhirnya membuahkan hasil.', 'Vocabulary', 'Adjective', 'B2'),

('Gerund', 'A form that is derived from a verb but functions as a noun, in English ending in -ing.', 'Bentuk kata kerja yang berfungsi sebagai kata benda, dalam bahasa Inggris berakhiran -ing.', 'Swimming is my favorite hobby.', 'Berenang adalah hobi favorit saya.', 'Grammar', 'Nouns', 'B1'),

('Immersive', 'Providing information or entertainment in a way that makes you feel part of it.', 'Memberikan informasi atau hiburan dengan cara yang membuat Anda merasa menjadi bagian darinya.', 'The game offers an immersive experience.', 'Game ini menawarkan pengalaman yang imersif.', 'Vocabulary', 'Adjective', 'C1'),

('Eloquent', 'Fluent or persuasive in speaking or writing.', 'Fasih atau persuasif dalam berbicara atau menulis.', 'She gave an eloquent speech.', 'Dia memberikan pidato yang fasih.', 'Vocabulary', 'Adjective', 'B2'),

('Pragmatic', 'Dealing with things sensibly and realistically in a way that is based on practical considerations.', 'Menghadapi hal-hal secara masuk akal dan realistis berdasarkan pertimbangan praktis.', 'We need a pragmatic approach to this problem.', 'Kita butuh pendekatan yang pragmatis untuk masalah ini.', 'Vocabulary', 'Adjective', 'C1'),

('Resilient', 'Able to withstand or recover quickly from difficult conditions.', 'Mampu bertahan atau pulih dengan cepat dari kondisi sulit.', 'Children are often surprisingly resilient.', 'Anak-anak seringkali sangat tangguh.', 'Vocabulary', 'Adjective', 'B2'),

('Vocabulary', 'The body of words used in a particular language.', 'Kumpulan kata-kata yang digunakan dalam bahasa tertentu.', 'Reading helps expand your vocabulary.', 'Membaca membantu memperluas kosakata Anda.', 'Vocabulary', 'Nouns', 'A1'),

('Clause', 'A unit of grammatical organization next below the sentence in rank.', 'Unit organisasi tata bahasa di bawah kalimat dalam tingkatan.', 'Every sentence contains at least one clause.', 'Setiap kalimat mengandung setidaknya satu klausa.', 'Grammar', 'Syntax', 'B1'),

('Syntax', 'The arrangement of words and phrases to create well-formed sentences in a language.', 'Pengaturan kata dan frasa untuk membuat kalimat yang terbentuk dengan baik dalam sebuah bahasa.', 'The syntax of the language is quite complex.', 'Sintaksis bahasa tersebut cukup rumit.', 'Grammar', 'Syntax', 'C1'),

('Fluency', 'The ability to speak or write a foreign language easily and accurately.', 'Kemampuan berbicara atau menulis bahasa asing dengan mudah dan akurat.', 'Her fluency in English is remarkable.', 'Kefasihannya dalam bahasa Inggris sangat luar biasa.', 'Vocabulary', 'Nouns', 'B2');
