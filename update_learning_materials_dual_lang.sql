-- Add Indonesian columns to learning_materials (Updated for consistency)
ALTER TABLE learning_materials 
ADD COLUMN IF NOT EXISTS definition_bahasa TEXT,
ADD COLUMN IF NOT EXISTS example_sentence_bahasa TEXT;

-- Update existing data with Indonesian equivalents
UPDATE learning_materials 
SET definition_bahasa = 'Sesuatu yang terus berlanjut secara teguh terlepas dari oposisi, hambatan, atau kesulitan.',
    example_sentence_bahasa = 'Pengejaran yang gigih terhadap tujuannya membawa kesuksesan.'
WHERE term = 'Persistent';

UPDATE learning_materials 
SET definition_bahasa = 'Bentuk kata kerja yang berfungsi sebagai kata benda, dalam bahasa Inggris berakhiran -ing.',
    example_sentence_bahasa = 'Berenang adalah olahraga favorit saya.'
WHERE term = 'Gerund';

UPDATE learning_materials 
SET definition_bahasa = 'Unit bahasa yang terdiri dari satu atau lebih kata yang diucapkan secara bermakna.',
    example_sentence_bahasa = 'Dia memberikan kata-kata penyemangat.'
WHERE term = 'Word';
