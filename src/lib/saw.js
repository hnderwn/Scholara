/**
 * Implementasi Algoritma SAW (Simple Additive Weighting) untuk Rekomendasi Adaptif
 */

// Bobot default kesulitan kategori
export const DEFAULT_WEIGHTS = {
  cloze: 0.30,
  grammar: 0.25,
  reading: 0.25,
  vocab: 0.20,
};

// Batas skor prioritas untuk pelabelan warna
export const PRIORITY_THRESHOLDS = {
  critical: 0.25,
  high: 0.20,
  medium: 0.15,
  low: 0.10,
};

/**
 * Menentukan Level CEFR berdasarkan performa tingkat kesulitan
 */
export function determineCEFR(difficultyStats) {
  if (!difficultyStats) return 'A1/A2';

  const l1Total = difficultyStats[1]?.total || 0;
  const l1Correct = difficultyStats[1]?.correct || 0;
  const l1Rate = l1Total > 0 ? l1Correct / l1Total : 0;

  const l2Total = difficultyStats[2]?.total || 0;
  const l2Correct = difficultyStats[2]?.correct || 0;
  const l2Rate = l2Total > 0 ? l2Correct / l2Total : 0;

  const l3Total = difficultyStats[3]?.total || 0;
  const l3Correct = difficultyStats[3]?.correct || 0;
  const l3Rate = l3Total > 0 ? l3Correct / l3Total : 0;

  // Logika C1/C2 (Proficient)
  if (l3Total > 0 && l3Rate >= 0.7 && l2Rate >= 0.8) return 'C1/C2';

  // Logika B1/B2 (Independent)
  if (l3Total > 0 && (l3Rate >= 0.3 || l2Rate >= 0.7)) return 'B1/B2';
  if (l2Rate >= 0.4 || (l1Rate >= 0.9 && l2Total === 0)) return 'B1/B2';

  // Logika A1/A2 (Basic)
  return 'A1/A2';
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
    if (key === 'total' || key === 'package_id' || !data) continue;
    
    // Support data yang berupa plain number
    if (typeof data === 'number') {
      continue;
    }

    if (data.difficultyStats) {
      for (let level = 1; level <= 3; level++) {
        if (data.difficultyStats[level]) {
          combinedStats[level].correct += data.difficultyStats[level].correct || 0;
          combinedStats[level].total += data.difficultyStats[level].total || 0;
        }
      }
    }
  }

  return determineCEFR(combinedStats);
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
 * Kalkulasi skor prioritas SAW dengan Normalisasi Matriks yang Presisi (>= 4 desimal)
 * Alternatif: Kategori Belajar (grammar, vocab, reading, cloze)
 * Kriteria:
 * 1. Gap Nilai (Cost ke Benefit) -> x_i1 = 100 - score. (Kriteria Benefit: semakin besar gap, semakin tinggi prioritas)
 * 2. Gap Fondasi (L1 Error Rate) -> x_i2 = L1 Error Rate. (Kriteria Benefit: semakin lemah fondasi, semakin tinggi prioritas)
 * 3. Kesulitan Kategori (Category Weight) -> x_i3 = Bobot Kategori. (Kriteria Benefit)
 * 
 * Bobot Kriteria SAW:
 * - Gap Nilai (w1) = 0.50
 * - Gap Fondasi (w2) = 0.30
 * - Kesulitan Kategori (w3) = 0.20
 */
export function calculateSAWPriority(categoryData, categoryWeights = DEFAULT_WEIGHTS) {
  const priorities = [];
  const validCategories = [];

  // Filter kategori yang valid & kumpulkan nilai kriteria awal
  for (const [category, data] of Object.entries(categoryData)) {
    if (category === 'total' || category === 'package_id') continue;

    // Jika data berupa number, konversikan ke objek agar kompatibel dengan legacy format
    const isObject = data && typeof data === 'object';
    const score = isObject ? (data.score || 0) : (Number(data) || 0);
    const difficultyStats = isObject ? data.difficultyStats : null;

    const hasTested = difficultyStats 
      ? (difficultyStats[1]?.total || 0) + (difficultyStats[2]?.total || 0) + (difficultyStats[3]?.total || 0) > 0
      : true; // Jika data legacy berupa angka saja, asumsikan diuji

    if (!hasTested) continue;

    // Kriteria 2: L1 Error Rate
    const l1Correct = difficultyStats?.[1]?.correct || 0;
    const l1Total = difficultyStats?.[1]?.total || 0;
    const l1ErrorRate = l1Total > 0 ? (l1Total - l1Correct) / l1Total : 0;

    validCategories.push({
      key: category,
      score,
      l1Error: l1ErrorRate,
      catWeight: categoryWeights[category] || 0.20,
      difficultyStats
    });
  }

  if (validCategories.length === 0) return [];

  // Kriteria 1: Gap Nilai (x_i1 = 100 - score)
  const x1 = validCategories.map(c => 100 - c.score);
  // Kriteria 2: L1 Error Rate (x_i2 = l1Error)
  const x2 = validCategories.map(c => c.l1Error);
  // Kriteria 3: Category Weight (x_i3 = catWeight)
  const x3 = validCategories.map(c => c.catWeight);

  // Cari nilai maksimum masing-masing kriteria untuk normalisasi Benefit
  const max_x1 = Math.max(...x1, 1); // minimal pembagi 1 untuk mencegah div by zero
  const max_x2 = Math.max(...x2, 0.0001); // minimal pembagi kecil
  const max_x3 = Math.max(...x3, 0.0001);

  // Bobot kriteria SAW
  const w1 = 0.50; // Bobot Gap Nilai
  const w2 = 0.30; // Bobot Kelemahan Fondasi L1
  const w3 = 0.20; // Bobot Tingkat Kesulitan Kategori

  validCategories.forEach(c => {
    const rawCostVal = 100 - c.score;
    
    // Normalisasi Kriteria dengan Presisi 4 Desimal
    const r1 = parseFloat((rawCostVal / max_x1).toFixed(4));
    const r2 = parseFloat((c.l1Error / max_x2).toFixed(4));
    const r3 = parseFloat((c.catWeight / max_x3).toFixed(4));

    // Perhitungan Nilai Preferensi SAW
    const priorityScore = parseFloat((w1 * r1 + w2 * r2 + w3 * r3).toFixed(4));

    priorities.push({
      category: formatCategoryName(c.key),
      categoryKey: c.key,
      rawScore: c.score,
      cost: Math.round((rawCostVal / 100) * 100),
      weight: c.catWeight,
      priorityScore,
      color: getPriorityColor(priorityScore),
      label: getPriorityLabel(priorityScore),
      recommendation: getEnhancedRecommendation(c.key, c.score, c.difficultyStats),
      cefrLevel: determineCEFR(c.difficultyStats)
    });
  });

  // Urutkan berdasarkan prioritas tertinggi ke terendah
  return priorities.sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * Hitung skor per kategori menggunakan sistem Bobot (Weighted Scoring)
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
      if (categoryStats[category].difficultyStats[difficulty]) {
        categoryStats[category].difficultyStats[difficulty].total++;
      }

      if (answers[question.id] === question.correct_answer) {
        categoryStats[category].earnedPoints += weight;
        if (categoryStats[category].difficultyStats[difficulty]) {
          categoryStats[category].difficultyStats[difficulty].correct++;
        }
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
