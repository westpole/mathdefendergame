import type { GameHistoryEntry, MathOperation } from '@shared/types';

import { computeOperationMastery, evaluateNewAchievements } from '../achievements';
import { at, makeRun, statsFor } from './achievementTestUtils';

const NOW = at(2026, 11, 12);

/** A run on 1 Nov + `index` days with stats for one operation. */
const opRun = (index: number, op: MathOperation, attempts: number, incorrect: number, avgTimeMs: number): GameHistoryEntry => (
  makeRun(at(2026, 11, 1 + index), { operationStats: statsFor(op, attempts, incorrect, avgTimeMs) })
);
const masteryIds = (history: GameHistoryEntry[], options?: { isAfterRun?: boolean }) => evaluateNewAchievements(history, null, NOW, options)
  .filter((award) => award.id.startsWith('mastery-'));

describe('operation mastery', () => {
  describe('computeOperationMastery', () => {
    it('earns + with 50 attempts at 92% and 2.8s', () => {
      const history = [opRun(0, '+', 25, 2, 2800), opRun(1, '+', 25, 2, 2800)];

      expect(computeOperationMastery(history, '+')).toMatchObject({
        attempts: 50, accuracy: 0.92, avgTimeMs: 2800, accuracyMet: true, speedMet: true, mastered: true, latestPlayedAt: at(2026, 11, 2),
      });
    });

    it('does not earn + at 91% but 3.4s', () => {
      const mastery = computeOperationMastery([opRun(0, '+', 100, 9, 3400)], '+');

      expect(mastery).toMatchObject({ accuracyMet: true, speedMet: false, mastered: false });
    });

    it('does not earn with fewer than 50 attempts', () => {
      expect(computeOperationMastery([opRun(0, '*', 49, 0, 1000)], '*')).toMatchObject({ attempts: 49, mastered: false });
    });

    it('uses the newest runs only, including the whole run that crosses 50', () => {
      const history = [
        opRun(0, '-', 100, 50, 9000),
        opRun(1, '-', 30, 3, 2000),
        opRun(2, '-', 30, 0, 3000),
      ];
      const mastery = computeOperationMastery(history, '-');

      expect(mastery.attempts).toBe(60);
      expect(mastery.accuracy).toBe(0.95);
      expect(mastery.avgTimeMs).toBe(2500);
    });

    it('weights the average time by attempts', () => {
      const mastery = computeOperationMastery([opRun(0, '/', 10, 0, 1000), opRun(1, '/', 40, 0, 5000)], '/');

      expect(mastery.avgTimeMs).toBe(4200);
    });

    it('counts exactly 90% and exactly the time limit as met', () => {
      expect(computeOperationMastery([opRun(0, '*', 50, 5, 4000)], '*')).toMatchObject({ mastered: true });
      expect(computeOperationMastery([opRun(0, '*', 50, 6, 4000)], '*')).toMatchObject({ mastered: false });
      expect(computeOperationMastery([opRun(0, '+', 50, 0, 3001)], '+')).toMatchObject({ mastered: false });
    });

    it('reports nothing for an operation with no attempts', () => {
      expect(computeOperationMastery([opRun(0, '+', 50, 0, 1000)], '/')).toMatchObject({
        attempts: 0, accuracy: 0, avgTimeMs: 0, accuracyMet: false, speedMet: false, mastered: false, latestPlayedAt: null,
      });
    });
  });

  describe('evaluator', () => {
    it('awards mastery with the operation, dated by the newest run in the window', () => {
      expect(masteryIds([opRun(0, '*', 50, 2, 3000)])).toEqual([
        { id: 'mastery-mul', earnedAt: at(2026, 11, 1), operation: '*' },
      ]);
    });

    it('backfills on the silent login check', () => {
      expect(masteryIds([opRun(0, '+', 50, 0, 2000), opRun(1, '/', 50, 0, 2000)], { isAfterRun: false }).map((award) => award.id))
        .toEqual(['mastery-add', 'mastery-div']);
    });

    it('never awards it twice and never takes it away', () => {
      const saved = [{ id: 'mastery-sub' as const, earnedAt: 1, operation: '-' as const }];
      const strong = [opRun(0, '-', 50, 0, 2000)];
      const weakLater = [...strong, opRun(5, '-', 60, 30, 8000)];

      expect(evaluateNewAchievements(strong, { achievements: saved }, NOW).filter((award) => award.id === 'mastery-sub')).toEqual([]);
      expect(masteryIds(weakLater)).toEqual([]);
    });

    it('ignores runs after the reference time', () => {
      expect(masteryIds([makeRun(at(2026, 12, 1), { operationStats: statsFor('+', 50, 0, 1000) })])).toEqual([]);
    });
  });
});
