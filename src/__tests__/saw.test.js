import { describe, it, expect } from 'vitest';
import { determineCEFR, calculateSAWPriority } from '../lib/saw';

describe('determineCEFR', () => {
  it('should return A1 if stats are missing or empty', () => {
    expect(determineCEFR(null)).toBe('A1');
    expect(determineCEFR({})).toBe('A1');
  });

  it('should return A1 if Level 1 accuracy is below 60%', () => {
    const stats = {
      1: { correct: 1, total: 3 },
      2: { correct: 0, total: 0 },
      3: { correct: 0, total: 0 }
    };
    expect(determineCEFR(stats)).toBe('A1');
  });

  it('should return A2 if Level 1 accuracy is 60% or above', () => {
    const stats = {
      1: { correct: 2, total: 3 },
      2: { correct: 0, total: 0 },
      3: { correct: 0, total: 0 }
    };
    expect(determineCEFR(stats)).toBe('A2');
  });

  it('should return B1 if Level 2 accuracy is 40% or above', () => {
    const stats = {
      1: { correct: 3, total: 3 },
      2: { correct: 2, total: 5 },
      3: { correct: 0, total: 0 }
    };
    expect(determineCEFR(stats)).toBe('B1');
  });

  it('should not return B2 or C1/C2 if Level 3 questions are not tested', () => {
    const stats = {
      1: { correct: 10, total: 10 },
      2: { correct: 10, total: 10 },
      3: { correct: 0, total: 0 }
    };
    // Even with 100% on Level 2, should cap at B1 because no L3 questions were tested.
    expect(determineCEFR(stats)).toBe('B1');
  });

  it('should return B2 if Level 3 questions are tested and Level 2 accuracy is 70% or above', () => {
    const stats = {
      1: { correct: 5, total: 5 },
      2: { correct: 7, total: 10 },
      3: { correct: 1, total: 5 }
    };
    expect(determineCEFR(stats)).toBe('B2');
  });

  it('should return C1/C2 if Level 3 accuracy >= 70% and Level 2 accuracy >= 80%', () => {
    const stats = {
      1: { correct: 5, total: 5 },
      2: { correct: 8, total: 10 },
      3: { correct: 4, total: 5 }
    };
    expect(determineCEFR(stats)).toBe('C1/C2');
  });
});
