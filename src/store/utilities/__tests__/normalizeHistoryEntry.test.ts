import { describe, expect, it } from 'vitest';

import { normalizeHistoryEntry } from '../normalizeHistoryEntry';

describe('normalizeHistoryEntry', () => {
  it('normalizes a legacy game-history row into the canonical GameHistoryEntry shape', () => {
    const rawEntry = {
      key: 'legacy-entry',
      playedAt: 1_000,
      correctAnswers: 2,
      incorrectAnswers: 1,
      averageAnswerTimeMs: 2_500,
      mostProblematicOperation: '-',
      operationStats: {
        '+': { attempts: 2, incorrect: 1, avgTimeMs: 300 },
        '-': { attempts: 4, incorrect: 1, avgTimeMs: 900 },
        '*': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
        '/': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
      },
      gradeAtFinish: 'major-general',
      finalScore: 120,
      finalPerfScore: 95,
    };

    expect(normalizeHistoryEntry(rawEntry)).toEqual({
      key: 'legacy-entry',
      playedAt: 1_000,
      correctAnswers: 2,
      incorrectAnswers: 1,
      averageAnswerTimeMs: 2_500,
      mostProblematicOperation: '-',
      operationStats: {
        '+': { attempts: 2, incorrect: 1, avgTimeMs: 300 },
        '-': { attempts: 4, incorrect: 1, avgTimeMs: 900 },
        '*': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
        '/': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
      },
      gradeAtFinish: 'major-general',
      finalScore: 120,
      finalPerfScore: 95,
    });
  });

  it('falls back to safe defaults when the raw payload is missing or malformed', () => {
    expect(normalizeHistoryEntry(null)).toEqual({
      key: expect.stringMatching(/^game_history_/),
      playedAt: expect.any(Number),
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
    });

    expect(normalizeHistoryEntry({
      date: 9_000,
      correctCount: 7,
      incorrectCount: 3,
      mostProblematicOperation: 'x',
      grade: 'cadet',
      score: 60,
      perfScore: 40,
    })).toMatchObject({
      key: expect.stringMatching(/^game_history_/),
      playedAt: 9_000,
      correctAnswers: 7,
      incorrectAnswers: 3,
      mostProblematicOperation: null,
      gradeAtFinish: 'cadet',
      finalScore: 60,
      finalPerfScore: 40,
    });
  });
});
