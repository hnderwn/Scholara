# Rencana Pengembangan Masa Depan (Future Development)

Dokumen ini mencatat ide-ide fitur dan peningkatan teknis yang dapat diimplementasikan pada tahap pengembangan selanjutnya untuk meningkatkan kualitas aplikasi.

## 1. Sistem Penilaian Adaptif (Adaptive Scoring & Item Weighting)
*   **Item Weighting (Bobot Soal):** Menambahkan atribut `difficulty` (Mudah, Sedang, Sulit) atau `weight` pada setiap soal di database.
*   **Adaptive Testing:** Mengembangkan logika ujian di mana tingkat kesulitan soal menyesuaikan kemampuan siswa secara real-time (mirip GMAT/TOEFL iBT). Jika siswa menjawab benar, soal berikutnya lebih sulit dengan bobot nilai lebih tinggi.
*   **Manfaat:** Penilaian kemampuan siswa menjadi jauh lebih presisi dibandingkan sistem bobot statis saat ini.

## 2. Bank Soal & Manajemen Konten Lanjutan
*   **Import/Export Soal:** Fitur untuk upload soal secara massal via Excel/CSV bagi admin.
*   **Rich Text Editor:** Memungkinkan admin memasukkan soal bergambar, audio (Listening Section), atau formula matematika.
*   **Tagging System:** Menambahkan tag topik spesifik (misal: "Tenses", "Pronoun") di dalam kategori besar "Grammar" untuk analisis yang lebih granular.

## 3. Gamifikasi & Engagement
*   **Leaderboard:** Papan peringkat siswa dengan skor tertinggi mingguan/bulanan.
*   **Badges/Achievements:** Penghargaan digital untuk pencapaian tertentu (misal: "Grammar Master", "Streak 7 Hari").
*   **Progress Tracker:** Grafik visual perkembangan skor siswa dari waktu ke waktu.

## 4. Keamanan & Integritas Ujian
*   **Browser Lock:** Mencegah siswa membuka tab lain atau copy-paste saat ujian berlangsung.
*   **Randomized Question/Option:** Mengacak urutan soal dan pilihan jawaban untuk setiap siswa guna mencegah kecurangan.

## 5. Internasionalisasi (i18n)
*   Mengganti hardcoded string dengan library i18n agar aplikasi mudah dialihbahasakan (Inggris <-> Indonesia) secara dinamis.
