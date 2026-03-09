/**
 * SAW (Simple Additive Weighting) Algorithm Implementation
 * Used for calculating learning priority based on exam scores
 */

// Default weights for each category (can be adjusted)
export const DEFAULT_WEIGHTS = {
  cloze: 0.3, // 30% - Prioritas tertinggi karena seringkali paling menantang
  grammar: 0.25, // 25% - Penting untuk dasar bahasa
  reading: 0.25, // 25% - Kritis untuk pemahaman
  vocab: 0.2, // 20% - Dasar tapi lebih mudah ditingkatkan
};

// Priority score thresholds for color coding
export const PRIORITY_THRESHOLDS = {
  critical: 0.25, // Red - Butuh perhatian segera
  high: 0.2, // Orange - High priority
  medium: 0.15, // Yellow - Medium priority
  low: 0.1, // Green - Low priority
};

/**
 * Calculate SAW priority scores for learning recommendations
 * @param {Object} categoryData - Object with category-level stats (score, difficulty counts)
 * @param {Object} weights - Optional custom weights for categories
 * @returns {Array} Sorted array of priority recommendations
 */
export function calculateSAWPriority(categoryData, weights = DEFAULT_WEIGHTS) {
  // Step 1: Calculate Cost based on room for improvement (100 - score)
  // Categories with high error rates in lower difficulty (foundational) get a multiplier
  const priorities = [];

  for (const [category, data] of Object.entries(categoryData)) {
    if (category === 'total') continue;

    const score = data.score || 0;
    const rawCost = (100 - score) / 100;

    // Foundational impact: If many mistakes were in Level 1, increase priority
    const l1Correct = data.difficultyStats?.[1]?.correct || 0;
    const l1Total = data.difficultyStats?.[1]?.total || 0;
    const l1ErrorRate = l1Total > 0 ? (l1Total - l1Correct) / l1Total : 0;

    // Priority multiplier based on foundation weakness (if L1 error is high, priority jumps)
    const foundationMultiplier = 1 + l1ErrorRate * 0.5;

    const weight = weights[category] || 0;
    const priorityScore = rawCost * weight * foundationMultiplier;

    priorities.push({
      category: formatCategoryName(category),
      categoryKey: category,
      rawScore: score,
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
 * Determine CEFR Level based on difficulty performance
 */
function determineCEFR(difficultyStats) {
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

  // Proficient logic
  if (l3Rate >= 0.7 && l2Rate >= 0.8) return 'C1/C2';

  // Independent logic
  if (l3Rate >= 0.3 || l2Rate >= 0.7) return 'B2';
  if (l2Rate >= 0.4 || (l1Rate >= 0.9 && l2Total === 0)) return 'B1';

  // Basic logic
  if (l1Rate >= 0.6) return 'A2';
  return 'A1';
}

/**
 * Get enhanced recommendation based on category, score, and difficulty breakdown
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
 * Calculate category scores using Weighted Scoring
 * @param {Array} questions - Array of question objects with difficulty/weight
 * @param {Object} answers - Object mapping questionId to selected answer
 * @returns {Object} Weighted scores and difficulty stats by category
 */
export function calculateCategoryScores(questions, answers) {
  const categoryStats = {
    grammar: { earnedPoints: 0, maxPoints: 0, difficultyStats: { 1: { correct: 0, total: 0 }, 2: { correct: 0, total: 0 }, 3: { correct: 0, total: 0 } } },
    vocab: { earnedPoints: 0, maxPoints: 0, difficultyStats: { 1: { correct: 0, total: 0 }, 2: { correct: 0, total: 0 }, 3: { correct: 0, total: 0 } } },
    reading: { earnedPoints: 0, maxPoints: 0, difficultyStats: { 1: { correct: 0, total: 0 }, 2: { correct: 0, total: 0 }, 3: { correct: 0, total: 0 } } },
    cloze: { earnedPoints: 0, maxPoints: 0, difficultyStats: { 1: { correct: 0, total: 0 }, 2: { correct: 0, total: 0 }, 3: { correct: 0, total: 0 } } },
  };

  questions.forEach((question) => {
    const category = question.category.toLowerCase();
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
 * Format category name for display
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
 * Get color based on priority score
 */
function getPriorityColor(score) {
  if (score >= PRIORITY_THRESHOLDS.critical) return '#ef4444'; // Red
  if (score >= PRIORITY_THRESHOLDS.high) return '#f97316'; // Orange
  if (score >= PRIORITY_THRESHOLDS.medium) return '#eab308'; // Yellow
  return '#22c55e'; // Green
}

/**
 * Get priority label based on score
 */
function getPriorityLabel(score) {
  if (score >= PRIORITY_THRESHOLDS.critical) return 'Prioritas Kritis';
  if (score >= PRIORITY_THRESHOLDS.high) return 'Prioritas Tinggi';
  if (score >= PRIORITY_THRESHOLDS.medium) return 'Prioritas Sedang';
  return 'Prioritas Rendah';
}

/**
 * Test function for SAW algorithm
 */
export function testSAW() {
  const testScores = {
    grammar: 60,
    vocab: 90,
    reading: 70,
    cloze: 50,
  };

  console.log('Testing SAW Algorithm with scores:', testScores);
  const result = calculateSAWPriority(testScores);
  console.log('SAW Results:', result);

  return result;
}
