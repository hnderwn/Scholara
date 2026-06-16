/**
 * Implementasi Algoritma SAW (Simple Additive Weighting)
 * Digunakan untuk menghitung prioritas rekomendasi belajar berdasarkan skor ujian
 */

// Bobot default untuk setiap kategori (dapat disesuaikan)
export const DEFAULT_WEIGHTS = {
  cloze: 0.3, // 30% - Prioritas tertinggi karena seringkali paling menantang
  grammar: 0.25, // 25% - Penting untuk dasar bahasa
  reading: 0.25, // 25% - Kritis untuk pemahaman
  vocab: 0.2, // 20% - Dasar tapi lebih mudah ditingkatkan
};

// Batas skor prioritas untuk pelabelan warna
export const PRIORITY_THRESHOLDS = {
  critical: 0.25, // Merah - Butuh perhatian segera
  high: 0.2, // Oranye - Prioritas tinggi
  medium: 0.15, // Kuning - Prioritas sedang
  low: 0.1, // Hijau - Prioritas rendah
};

/**
 * Kalkulasi skor prioritas SAW untuk rekomendasi pembelajaran
 * @param {Object} categoryData - Objek dengan statistik per kategori (skor, jumlah kesulitan)
 * @param {Object} weights - Opsi kustom untuk bobot kategori
 * @returns {Array} Array rekomendasi prioritas yang sudah diurutkan
 */
export function calculateSAWPriority(categoryData, weights = DEFAULT_WEIGHTS) {
  const priorities = [];

  for (const [category, data] of Object.entries(categoryData)) {
    if (category === 'total') continue;

    // LEWATI kalkulasi jika kategori ini tidak diuji sama sekali (misal pada paket spesifik)
    const hasTested = (data.difficultyStats?.[1]?.total || 0) + (data.difficultyStats?.[2]?.total || 0) + (data.difficultyStats?.[3]?.total || 0) > 0;
    if (!hasTested) continue;

    const score = data.score || 0;
    
    // Langkah 1: Hitung Cost berdasarkan sisa nilai menuju sempurna (100 - skor)
    const rawCost = (100 - score) / 100;

    // Dampak Fondasi: Jika banyak salah di Level 1, tingkatkan prioritas
    const l1Correct = data.difficultyStats?.[1]?.correct || 0;
    const l1Total = data.difficultyStats?.[1]?.total || 0;
    const l1ErrorRate = l1Total > 0 ? (l1Total - l1Correct) / l1Total : 0;

    // Pengali prioritas berdasarkan kelemahan fondasi (jika rasio salah L1 tinggi, prioritas melonjak)
    const foundationMultiplier = 1 + l1ErrorRate * 0.5;

    const weight = weights[category] || 0;
    const priorityScore = rawCost * weight * foundationMultiplier;

    priorities.push({
      category: formatCategoryName(category),
      categoryKey: category,
      rawScore: score,
      cost: Math.round(rawCost * 100),
      weight: weight,
      priorityScore: Math.round(priorityScore * 1000) / 1000,
      color: getPriorityColor(priorityScore),
      label: getPriorityLabel(priorityScore),
      recommendation: getEnhancedRecommendation(category, score, data.difficultyStats),
      cefrLevel: determineCEFR(data.difficultyStats),
    });
  }

  return priorities.sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * Menentukan Level CEFR berdasarkan performa tingkat kesulitan
 */
export function determineCEFR(difficultyStats) {
  if (!difficultyStats) return 'A1';

  const l1Total = difficultyStats[1]?.total || 0;
  const l1Correct = difficultyStats[1]?.correct || 0;
  const l1Rate = l1Total > 0 ? l1Correct / l1Total : 0;

  const l2Total = difficultyStats[2]?.total || 0;
  const l2Correct = difficultyStats[2]?.correct || 0;
  const l2Rate = l2Total > 0 ? l2Correct / l2Total : 0;

  const l3Total = difficultyStats[3]?.total || 0;
  const l3Correct = difficultyStats[3]?.correct || 0;
  const l3Rate = l3Total > 0 ? l3Correct / l3Total : 0;

  // Logika Mahir (Proficient) - Memerlukan soal Level 3 diuji
  if (l3Total > 0 && l3Rate >= 0.7 && l2Rate >= 0.8) return 'C1/C2';

  // Logika Mandiri (Independent) - Memerlukan soal Level 3 diuji untuk B2
  if (l3Total > 0 && (l3Rate >= 0.3 || l2Rate >= 0.7)) return 'B2';
  if (l2Rate >= 0.4 || (l1Rate >= 0.9 && l2Total === 0)) return 'B1';

  // Logika Dasar (Basic)
  if (l1Rate >= 0.6) return 'A2';
  return 'A1';
}

/**
 * Hitung Level CEFR Gabungan dari seluruh kategori ujian
 */
export function calculateOverallCEFR(categoryScores) {
  const combinedStats = {
    1: { correct: 0, total: 0 },
    2: { correct: 0, total: 0 },
    3: { correct: 0, total: 0 }
  };

  for (const [key, data] of Object.entries(categoryScores)) {
    if (key === 'total' || !data.difficultyStats) continue;
    
    for (let level = 1; level <= 3; level++) {
      if (data.difficultyStats[level]) {
        combinedStats[level].correct += data.difficultyStats[level].correct || 0;
        combinedStats[level].total += data.difficultyStats[level].total || 0;
      }
    }
  }

  return determineCEFR(combinedStats);
}

/**
 * Dapatkan rekomendasi yang ditingkatkan berdasarkan kategori, skor, dan rincian kesulitan
 */
function getEnhancedRecommendation(category, score, difficultyStats) {
  const l1Rate = difficultyStats?.[1]?.total > 0 ? difficultyStats[1].correct / difficultyStats[1].total : 1;

  if (l1Rate < 0.7) {
    return `Fokus kembali pada konsep dasar ${formatCategoryName(category)}. Fondasi Anda di level A1/A2 masih perlu diperkuat.`;
  }

  if (score < 80) {
    return `Tingkatkan pemahaman konteks dan variasi soal untuk ${formatCategoryName(category)} level Menengah (B1/B2).`;
  }

  return `Pertahankan performa! Fokus pada detail halus dan pengecualian aturan untuk mencapai level Advanced (C1/C2).`;
}

/**
 * Hitung skor per kategori menggunakan sistem Bobot (Weighted Scoring)
 * @param {Array} questions - Array objek soal beserta tingkat kesulitan/bobotnya
 * @param {Object} answers - Objek yang memetakan questionId ke jawaban yang dipilih
 * @returns {Object} Skor berbobot dan statistik kesulitan per kategori
 */
export function calculateCategoryScores(questions, answers) {
  const categoryStats = {
    grammar: { earnedPoints: 0, maxPoints: 0, difficultyStats: { 1: { correct: 0, total: 0 }, 2: { correct: 0, total: 0 }, 3: { correct: 0, total: 0 } } },
    vocab: { earnedPoints: 0, maxPoints: 0, difficultyStats: { 1: { correct: 0, total: 0 }, 2: { correct: 0, total: 0 }, 3: { correct: 0, total: 0 } } },
    reading: { earnedPoints: 0, maxPoints: 0, difficultyStats: { 1: { correct: 0, total: 0 }, 2: { correct: 0, total: 0 }, 3: { correct: 0, total: 0 } } },
    cloze: { earnedPoints: 0, maxPoints: 0, difficultyStats: { 1: { correct: 0, total: 0 }, 2: { correct: 0, total: 0 }, 3: { correct: 0, total: 0 } } },
  };

  questions.forEach((question) => {
    let category = question.category.toLowerCase();
    if (category === 'vocabulary') category = 'vocab';
    const weight = question.weight || 1;
    const difficulty = question.difficulty || 1;

    if (categoryStats[category]) {
      categoryStats[category].maxPoints += weight;
      categoryStats[category].difficultyStats[difficulty].total++;

      if (answers[question.id] === question.correct_answer) {
        categoryStats[category].earnedPoints += weight;
        categoryStats[category].difficultyStats[difficulty].correct++;
      }
    }
  });

  const finalResults = {};
  let totalEarned = 0;
  let totalMax = 0;

  for (const [category, stats] of Object.entries(categoryStats)) {
    const score = stats.maxPoints > 0 ? Math.round((stats.earnedPoints / stats.maxPoints) * 100) : 0;
    finalResults[category] = {
      score,
      difficultyStats: stats.difficultyStats,
    };
    totalEarned += stats.earnedPoints;
    totalMax += stats.maxPoints;
  }

  finalResults.total = totalMax > 0 ? Math.round((totalEarned / totalMax) * 100) : 0;

  return finalResults;
}

/**
 * Format nama kategori untuk antarmuka pengguna
 */
function formatCategoryName(category) {
  const names = {
    grammar: 'Tata Bahasa',
    vocab: 'Kosakata',
    reading: 'Pemahaman Bacaan',
    cloze: 'Tes Rumpang',
  };
  return names[category] || category;
}

/**
 * Dapatkan warna berdasarkan skor prioritas
 */
function getPriorityColor(score) {
  if (score >= PRIORITY_THRESHOLDS.critical) return '#ef4444'; // Merah
  if (score >= PRIORITY_THRESHOLDS.high) return '#f97316'; // Oranye
  if (score >= PRIORITY_THRESHOLDS.medium) return '#eab308'; // Kuning
  return '#22c55e'; // Hijau
}

/**
 * Dapatkan label nama prioritas berdasarkan skor
 */
function getPriorityLabel(score) {
  if (score >= PRIORITY_THRESHOLDS.critical) return 'Prioritas Kritis';
  if (score >= PRIORITY_THRESHOLDS.high) return 'Prioritas Tinggi';
  if (score >= PRIORITY_THRESHOLDS.medium) return 'Prioritas Sedang';
  return 'Prioritas Rendah';
}

/**
 * Fungsi uji (Test) untuk algoritma SAW
 */
export function testSAW() {
  const testScores = {
    grammar: 60,
    vocab: 90,
    reading: 70,
    cloze: 50,
  };

  console.log('Menguji Algoritma SAW dengan skor:', testScores);
  const result = calculateSAWPriority(testScores);
  console.log('Hasil SAW:', result);

  return result;
}
