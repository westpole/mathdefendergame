import type { GameHistoryEntry } from '@shared/types';

import { buildGradeProgressSummary, buildWeeklyProgressReport } from '../progress';

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
    it('starts a player with no history at Trainee with Cadet rows at zero', () => {
      expect(buildGradeProgressSummary([])).toEqual({
        effectiveGrade: 'trainee',
        nextGrade: 'cadet',
        operations: [
          { op: '+', current: 0, required: 250 },
          { op: '-', current: 0, required: 150 },
        ],
      });
    });

    it('shows the next grade requirements with lifetime scores', () => {
      expect(buildGradeProgressSummary([
        createHistoryEntry('run-1', {
          playedAt: 1,
          operationStats: {
            '+': { attempts: 800, incorrect: 0, avgTimeMs: 900 },
            '-': { attempts: 160, incorrect: 5, avgTimeMs: 900 },
            '*': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
            '/': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
          },
          // The old score rule would make this Major-General; it no longer matters.
          finalScore: 10_000,
        }),
      ])).toEqual({
        effectiveGrade: 'cadet',
        nextGrade: 'commander',
        operations: [
          { op: '+', current: 800, required: 750 },
          { op: '-', current: 150, required: 550 },
          { op: '*', current: 0, required: 250 },
        ],
      });
    });

    it('shows the Major-General requirements to hold at the top grade', () => {
      const summary = buildGradeProgressSummary([
        createHistoryEntry('run-1', {
          operationStats: {
            '+': { attempts: 1250, incorrect: 0, avgTimeMs: 900 },
            '-': { attempts: 1050, incorrect: 0, avgTimeMs: 900 },
            '*': { attempts: 550, incorrect: 0, avgTimeMs: 900 },
            '/': { attempts: 300, incorrect: 0, avgTimeMs: 900 },
          },
        }),
      ]);

      expect(summary.effectiveGrade).toBe('major-general');
      expect(summary.nextGrade).toBeNull();
      expect(summary.operations).toEqual([
        { op: '+', current: 1250, required: 1250 },
        { op: '-', current: 1050, required: 1050 },
        { op: '*', current: 550, required: 550 },
        { op: '/', current: 300, required: 250 },
      ]);
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
