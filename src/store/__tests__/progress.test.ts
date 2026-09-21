import type { GameHistoryEntry } from '@shared/types';

import { buildGradeProgressSummary, buildWeeklyProgressReport } from '../selectors/progress';

function createHistoryEntry(
  key: string,
  overrides: Partial<GameHistoryEntry> = {},
): GameHistoryEntry {
  return {
    key,
    playedAt: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    averageAnswerTimeMs: 0,
    mostProblematicOperation: null,
    operationStats: {
      '+': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
      '-': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
      '*': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
      '/': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
    },
    gradeAtFinish: 'trainee',
    finalScore: 0,
    finalPerfScore: 0,
    ...overrides,
  };
}

describe('progress selectors', () => {
  describe('buildGradeProgressSummary', () => {
    it('uses the current grade when there is no history and the phase is inactive', () => {
      expect(buildGradeProgressSummary({
        currentScore: 80,
        grade: 'cadet',
        history: [],
        phase: 'start',
      })).toEqual({
        effectiveGrade: 'cadet',
        progressScore: 0,
        currentThreshold: 101,
        nextGrade: 'commander',
        nextThreshold: 351,
        pointsLeft: 351,
        progressRatio: 0,
      });
    });

    it('includes active run score, clamps negatives, and derives the effective grade from history', () => {
      expect(buildGradeProgressSummary({
        currentScore: 100,
        grade: 'trainee',
        history: [
          createHistoryEntry('run-1', { finalScore: 200 }),
          createHistoryEntry('run-2', { finalScore: 200 }),
        ],
        phase: 'playing',
      })).toEqual({
        effectiveGrade: 'commander',
        progressScore: 500,
        currentThreshold: 351,
        nextGrade: 'major-general',
        nextThreshold: 751,
        pointsLeft: 251,
        progressRatio: 0.3725,
      });

      expect(buildGradeProgressSummary({
        currentScore: -25,
        grade: 'trainee',
        history: [
          createHistoryEntry('run-3', { finalScore: -10 }),
        ],
        phase: 'paused',
      })).toEqual({
        effectiveGrade: 'trainee',
        progressScore: 0,
        currentThreshold: 0,
        nextGrade: 'cadet',
        nextThreshold: 101,
        pointsLeft: 101,
        progressRatio: 0,
      });
    });

    it('handles the top grade by removing next-grade progress values', () => {
      expect(buildGradeProgressSummary({
        currentScore: 50,
        grade: 'trainee',
        history: [
          createHistoryEntry('run-1', { finalScore: 800 }),
        ],
        phase: 'stage-message',
      })).toEqual({
        effectiveGrade: 'major-general',
        progressScore: 850,
        currentThreshold: 751,
        nextGrade: null,
        nextThreshold: null,
        pointsLeft: 0,
        progressRatio: 0,
      });
    });
  });

  describe('buildWeeklyProgressReport', () => {
    it('returns zeroed values when no entries fall within the weekly window', () => {
      expect(buildWeeklyProgressReport([
        createHistoryEntry('old-run', {
          playedAt: 1,
          correctAnswers: 10,
          incorrectAnswers: 2,
          finalScore: 150,
        }),
      ], 10 * 24 * 60 * 60 * 1000)).toEqual({
        averageAccuracy: 0,
        latestRunAt: null,
        runsCompleted: 0,
        scoreEarned: 0,
      });
    });

    it('includes only entries inside the weekly window and computes accuracy from them', () => {
      const now = 1_000_000;
      const weekMs = 7 * 24 * 60 * 60 * 1000;

      expect(buildWeeklyProgressReport([
        createHistoryEntry('latest-run', {
          playedAt: now,
          correctAnswers: 9,
          incorrectAnswers: 1,
          finalScore: 120,
        }),
        createHistoryEntry('cutoff-run', {
          playedAt: now - weekMs,
          correctAnswers: 3,
          incorrectAnswers: 1,
          finalScore: 60,
        }),
        createHistoryEntry('future-run', {
          playedAt: now + 1,
          correctAnswers: 99,
          incorrectAnswers: 0,
          finalScore: 999,
        }),
        createHistoryEntry('old-run', {
          playedAt: now - weekMs - 1,
          correctAnswers: 50,
          incorrectAnswers: 0,
          finalScore: 500,
        }),
      ], now)).toEqual({
        averageAccuracy: 85.71428571428571,
        latestRunAt: now,
        runsCompleted: 2,
        scoreEarned: 180,
      });
    });
  });
});
