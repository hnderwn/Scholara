/**
 * Hitung statistik analitik komprehensif dari hasil ujian dan data bank soal
 * @param {Array} results - Riwayat hasil ujian dari database
 * @param {Array} questions - Kumpulan bank soal dari database
 * @returns {Object|null} Objek statistik ringkasan, atau null jika data kosong
 */
export const calculateReportsStats = (results, questions) => {
  if (!results || results.length === 0 || !questions || questions.length === 0) return null;

  // Saring hasil ujian terbaru untuk tiap siswa unik
  const latestResultsPerStudent = Object.values(
    results.reduce((acc, current) => {
      if (!acc[current.user_id] || new Date(current.created_at) > new Date(acc[current.user_id].created_at)) {
        acc[current.user_id] = current;
      }
      return acc;
    }, {})
  );

  const totalStudents = latestResultsPerStudent.length;
  const averageScore = Math.round(results.reduce((sum, r) => sum + r.score_total, 0) / results.length);

  // Rata-rata skor per kategori materi
  const categoryAverages = {
    Grammar: Math.round(results.reduce((sum, r) => sum + (r.category_scores?.grammar?.score || 0), 0) / results.length),
    Vocabulary: Math.round(results.reduce((sum, r) => sum + (r.category_scores?.vocab?.score || 0), 0) / results.length),
    Reading: Math.round(results.reduce((sum, r) => sum + (r.category_scores?.reading?.score || 0), 0) / results.length),
    Cloze: Math.round(results.reduce((sum, r) => sum + (r.category_scores?.cloze?.score || 0), 0) / results.length),
  };

  // Sebaran tingkat kemahiran CEFR berdasarkan profil siswa
  const cefrDist = { 'A1/A2': 0, 'B1/B2': 0, 'C1/C2': 0 };
  latestResultsPerStudent.forEach((r) => {
    const level = r.profiles?.cefr_level || 'A1/A2';
    if (cefrDist[level] !== undefined) {
      cefrDist[level]++;
    } else {
      cefrDist['A1/A2']++;
    }
  });

  // Hitung tingkat kesalahan (error rate) per sub-kategori/topik soal
  const topicStats = {};
  results.forEach((r) => {
    if (!r.answers) return;
    Object.entries(r.answers).forEach(([qId, answer]) => {
      const q = questions.find((question) => question.id === qId);
      if (!q || !q.sub_category) return;

      if (!topicStats[q.sub_category]) {
        topicStats[q.sub_category] = { correct: 0, total: 0 };
      }
      topicStats[q.sub_category].total++;
      if (answer === q.correct_answer) topicStats[q.sub_category].correct++;
    });
  });

  // Dapatkan 5 topik dengan tingkat error tertinggi
  const hardestTopics = Object.entries(topicStats)
    .map(([topic, stats]) => ({
      topic,
      errorRate: Math.round((1 - stats.correct / stats.total) * 100),
    }))
    .sort((a, b) => b.errorRate - a.errorRate)
    .slice(0, 5);

  return {
    totalExams: results.length,
    totalStudents,
    averageScore,
    categoryAverages,
    cefrDist,
    hardestTopics,
  };
};
