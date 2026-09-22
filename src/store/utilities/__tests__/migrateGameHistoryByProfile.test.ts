import { describe, expect, it } from 'vitest';

import { migrateGameHistoryByProfile } from '../migrateGameHistoryByProfile';

describe('migrateGameHistoryByProfile', () => {
  it('normalizes legacy profile history and sorts the newest entries first', () => {
    const rawHistoryByProfile = {
      PilotOne: [
        {
          key: 'older-entry',
          playedAt: 1_000,
          correctAnswers: 2,
          incorrectAnswers: 1,
          averageAnswerTimeMs: 2_500,
          mostProblematicOperation: '-',
          operationStats: {
            '+': { attempts: 1, incorrect: 0, avgTimeMs: 250 },
            '-': { attempts: 3, incorrect: 1, avgTimeMs: 900 },
            '*': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
            '/': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
          },
          gradeAtFinish: 'cadet',
          finalScore: 80,
          finalPerfScore: 70,
        },
        {
          key: 'newer-entry',
          date: 3_000,
          correctCount: 5,
          incorrectCount: 2,
          averageAnswerTimeMs: 1_800,
          mostProblematicOperation: '+',
          operationStats: null,
          grade: 'commander',
          score: 140,
          perfScore: 88,
        },
      ],
      Guest: { not: 'an-array' },
    };

    const migrated = migrateGameHistoryByProfile(rawHistoryByProfile);

    expect(migrated).toEqual({
      PilotOne: [
        expect.objectContaining({
          key: 'newer-entry',
          playedAt: 3_000,
          correctAnswers: 5,
          incorrectAnswers: 2,
          averageAnswerTimeMs: 1_800,
          mostProblematicOperation: '+',
          gradeAtFinish: 'commander',
          finalScore: 140,
          finalPerfScore: 88,
        }),
        expect.objectContaining({
          key: 'older-entry',
          playedAt: 1_000,
          correctAnswers: 2,
          incorrectAnswers: 1,
          mostProblematicOperation: '-',
          gradeAtFinish: 'cadet',
          finalScore: 80,
          finalPerfScore: 70,
        }),
      ],
    });

    expect(migrated.Guest).toBeUndefined();
    expect(migrated.PilotOne[0].operationStats['+']).toEqual({ attempts: 0, incorrect: 0, avgTimeMs: 0 });
  });

  it('returns an empty object when the payload is not an object and ignores malformed profile buckets', () => {
    expect(migrateGameHistoryByProfile(null)).toEqual({});
    expect(migrateGameHistoryByProfile('not-an-object')).toEqual({});
    expect(migrateGameHistoryByProfile({ PilotOne: { bad: 'shape' } })).toEqual({});
    expect(migrateGameHistoryByProfile({
      validProfile: [
        { key: 'ok', playedAt: 500, correctAnswers: 1, incorrectAnswers: 0, finalScore: 10, finalPerfScore: 50 },
      ],
      brokenProfile: 'still-not-an-array',
    })).toEqual({
      validProfile: [expect.objectContaining({ key: 'ok', playedAt: 500, finalScore: 10 })],
    });
  });
});
