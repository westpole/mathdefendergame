import type { GameHistoryEntry, MathOperation } from '@shared/types';

import {
  computeFocusProgress,
  evaluateNewAchievements,
  getPracticeRunOperation,
  selectFocusOperation,
} from '../achievements';
import { at, makeRun, statsFor } from './achievementTestUtils';

// Thursday 12 Nov 2026; the week starts Monday 9 Nov, the focus window is 26 Oct – 8 Nov.
const NOW = at(2026, 11, 12);

const flagged = (playedAt: number, op: MathOperation): GameHistoryEntry => makeRun(playedAt, { mostProblematicOperation: op });
const practice = (playedAt: number, op: MathOperation, overrides: Partial<GameHistoryEntry> = {}): GameHistoryEntry => makeRun(playedAt, {
  mode: 'practice',
  correctAnswers: 18,
  incorrectAnswers: 2,
  operationStats: statsFor(op, 20, 2, 3000),
  ...overrides,
});

describe('Focus of the Week', () => {
  describe('getPracticeRunOperation', () => {
    it('uses the operation with the most attempts for practice runs only', () => {
      expect(getPracticeRunOperation(practice(NOW, '*'))).toBe('*');
      expect(getPracticeRunOperation(makeRun(NOW, { operationStats: statsFor('*', 20, 0, 1) }))).toBeNull();
      expect(getPracticeRunOperation(makeRun(NOW, { mode: 'practice' }))).toBeNull();
    });

    it('picks the dominant operation when a practice run has mixed attempts', () => {
      const stats = { ...statsFor('*', 18, 1, 1), '+': { attempts: 2, incorrect: 0, avgTimeMs: 1 } };

      expect(getPracticeRunOperation(makeRun(NOW, { mode: 'practice', operationStats: stats }))).toBe('*');
    });

    it('breaks ties in + - * / order', () => {
      const stats = { ...statsFor('/', 5, 0, 1), '-': { attempts: 5, incorrect: 0, avgTimeMs: 1 } };

      expect(getPracticeRunOperation(makeRun(NOW, { mode: 'practice', operationStats: stats }))).toBe('-');
    });
  });

  describe('selectFocusOperation', () => {
    it('picks the most frequent problematic operation in the 2 weeks before this week', () => {
      const history = [
        ...[0, 1, 2, 3].map((day) => flagged(at(2026, 11, 2 + day), '*')),
        flagged(at(2026, 10, 27), '-'),
        flagged(at(2026, 10, 28), '-'),
      ];

      expect(selectFocusOperation(history, NOW)).toBe('*');
    });

    it('ignores runs older than the window and runs from this week, so the focus stays fixed', () => {
      const history = [
        flagged(at(2026, 11, 3), '-'),
        ...[0, 1, 2].map((day) => flagged(at(2026, 10, 20 + day), '*')),
        ...[0, 1, 2].map((day) => flagged(at(2026, 11, 9 + day), '/')),
      ];

      expect(selectFocusOperation(history, NOW)).toBe('-');
    });

    it('breaks a tie with the lower lifetime accuracy, then + - * / order', () => {
      const weakMinus = makeRun(at(2026, 10, 1), { operationStats: { ...statsFor('-', 10, 6, 1), '*': { attempts: 10, incorrect: 1, avgTimeMs: 1 } } });
      const tied = [flagged(at(2026, 11, 2), '*'), flagged(at(2026, 11, 3), '-')];

      expect(selectFocusOperation([weakMinus, ...tied], NOW)).toBe('-');
      expect(selectFocusOperation(tied, NOW)).toBe('-');
      expect(selectFocusOperation([flagged(at(2026, 11, 2), '/'), flagged(at(2026, 11, 3), '*')], NOW)).toBe('*');
    });

    it('treats a run at Monday 00:00 as this week, outside the window', () => {
      const history = [flagged(at(2026, 11, 9, 0, 0), '/'), flagged(at(2026, 11, 8, 23, 59), '+')];

      expect(selectFocusOperation(history, NOW)).toBe('+');
    });

    it('looks back across an empty week inside the window', () => {
      expect(selectFocusOperation([flagged(at(2026, 10, 26), '-')], NOW)).toBe('-');
    });

    it('has no focus when no run in the window flagged an operation', () => {
      expect(selectFocusOperation([makeRun(at(2026, 11, 3))], NOW)).toBeNull();
      expect(selectFocusOperation([], NOW)).toBeNull();
    });
  });

  describe('computeFocusProgress', () => {
    it('counts only qualifying practice runs in the focus operation this week', () => {
      const history = [
        flagged(at(2026, 11, 3), '*'),
        practice(at(2026, 11, 9), '*'),
        practice(at(2026, 11, 10), '*', { correctAnswers: 15, incorrectAnswers: 5 }),
        practice(at(2026, 11, 10, 15), '-'),
        makeRun(at(2026, 11, 11), { operationStats: statsFor('*', 20, 0, 1) }),
      ];

      expect(computeFocusProgress(history, NOW)).toEqual({ operation: '*', practiceRuns: 1, required: 3, completedAt: null });
    });

    it('reports no progress without a focus', () => {
      expect(computeFocusProgress([practice(at(2026, 11, 9), '*')], NOW)).toEqual({
        operation: null, practiceRuns: 0, required: 3, completedAt: null,
      });
    });
  });

  describe('evaluator', () => {
    it('awards Focus of the Week on the 3rd qualifying practice run, with week and operation', () => {
      const history = [flagged(at(2026, 11, 3), '*'), ...[9, 10, 11].map((day) => practice(at(2026, 11, day), '*'))];
      const awards = evaluateNewAchievements(history, { achievements: [] }, NOW).filter((award) => award.id === 'focus-of-the-week');

      expect(awards).toEqual([{ id: 'focus-of-the-week', earnedAt: at(2026, 11, 11), weekKey: '2026-W46', operation: '*' }]);
    });

    it('backfills past weeks on the silent check and does not repeat them', () => {
      const history = [
        flagged(at(2026, 10, 20), '/'),
        ...[26, 27, 28].map((day) => practice(at(2026, 10, day), '/')),
      ];
      const awards = evaluateNewAchievements(history, null, NOW, { isAfterRun: false }).filter((award) => award.id === 'focus-of-the-week');

      expect(awards).toEqual([{ id: 'focus-of-the-week', earnedAt: at(2026, 10, 28), weekKey: '2026-W44', operation: '/' }]);
      expect(evaluateNewAchievements(history, { achievements: awards }, NOW).filter((award) => award.id === 'focus-of-the-week')).toEqual([]);
    });

    it('needs 3 runs', () => {
      const history = [flagged(at(2026, 11, 3), '*'), practice(at(2026, 11, 9), '*'), practice(at(2026, 11, 10), '*')];

      expect(evaluateNewAchievements(history, null, NOW).some((award) => award.id === 'focus-of-the-week')).toBe(false);
    });
  });
});
