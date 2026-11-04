/**
 * Unit tests for gradeProgress utility
 * Tests per-operation scores, lifetime clamping, grade resolution, and grade notices
 */
import type { GameHistoryEntry, MathOperation, OperationScores } from '@shared/types';

import {
  applyRunScores,
  buildGradeNotice,
  createEmptyOperationScores,
  getEntryOperationScores,
  getRequirementStatuses,
  getRunOperationScores,
  meetsGradeRequirements,
  resolveGradeFromOperationScores,
  sumOperationScores,
} from '../gradeProgress';

type CorrectIncorrect = Partial<Record<MathOperation, [correct: number, incorrect: number]>>;

function scores(values: Partial<OperationScores>): OperationScores {
  return { ...createEmptyOperationScores(), ...values };
}

function buildEntry(playedAt: number, answers: CorrectIncorrect): GameHistoryEntry {
  const stat = (op: MathOperation) => {
    const [correct, incorrect] = answers[op] ?? [0, 0];
    return { attempts: correct + incorrect, incorrect, avgTimeMs: 1000 };
  };

  return {
    key: `entry-${playedAt}`,
    playedAt,
    correctAnswers: 0,
    incorrectAnswers: 0,
    averageAnswerTimeMs: 1000,
    mostProblematicOperation: null,
    operationStats: { '+': stat('+'), '-': stat('-'), '*': stat('*'), '/': stat('/') },
    gradeAtFinish: 'trainee',
    finalScore: 0,
    finalPerfScore: 0,
  };
}

const CADET = scores({ '+': 250, '-': 150 });
const COMMANDER = scores({ '+': 750, '-': 550, '*': 250 });
const MAJOR_GENERAL = scores({ '+': 1250, '-': 1050, '*': 550, '/': 250 });

describe('gradeProgress', () => {
  describe('getRunOperationScores', () => {
    it('scores each operation as correct minus incorrect in the happy path', () => {
      const entry = buildEntry(1, { '+': [10, 3], '*': [4, 0] });

      expect(getRunOperationScores(entry.operationStats)).toEqual(scores({ '+': 7, '*': 4 }));
    });

    it('returns a negative score for a bad run in the fail path', () => {
      const entry = buildEntry(1, { '*': [10, 15] });

      expect(getRunOperationScores(entry.operationStats)['*']).toBe(-5);
    });
  });

  describe('applyRunScores', () => {
    it('adds run scores to lifetime scores in the happy path', () => {
      expect(applyRunScores(scores({ '+': 10 }), scores({ '+': 5, '-': 2 }))).toEqual(scores({ '+': 15, '-': 2 }));
    });

    it('clamps each operation at 0 in the fail path', () => {
      expect(applyRunScores(scores({ '*': 3 }), scores({ '*': -5 }))['*']).toBe(0);
    });
  });

  describe('sumOperationScores', () => {
    it('returns zeros for empty history', () => {
      expect(sumOperationScores([])).toEqual(createEmptyOperationScores());
    });

    it('clamps the running total after each run, oldest first, regardless of input order', () => {
      const newest = buildEntry(2, { '+': [30, 0] });
      const oldest = buildEntry(1, { '+': [0, 40] });

      // −40 then +30 gives 30, not −10 and not 0.
      expect(sumOperationScores([newest, oldest])['+']).toBe(30);
    });

    it('never lets a bad practice run lower lifetime scores', () => {
      const regular = buildEntry(1, { '-': [150, 0] });
      const badPractice = { ...buildEntry(2, { '-': [0, 40] }), mode: 'practice' as const };

      expect(sumOperationScores([regular, badPractice])['-']).toBe(150);
    });

    it('adds practice gains at the practice weight', () => {
      const practice = { ...buildEntry(1, { '+': [10, 3] }), mode: 'practice' as const };

      expect(sumOperationScores([practice])['+']).toBe(3);
    });
  });

  describe('getEntryOperationScores', () => {
    it('counts a regular run in full, including losses', () => {
      const entry = { ...buildEntry(1, { '+': [10, 3], '*': [0, 5] }), mode: 'regular' as const };

      expect(getEntryOperationScores(entry)).toEqual(scores({ '+': 7, '*': -5 }));
    });

    it('treats an entry without a mode as a regular run', () => {
      expect(getEntryOperationScores(buildEntry(1, { '-': [2, 4] }))['-']).toBe(-2);
    });

    it('floors practice losses at 0 and rounds weighted gains down', () => {
      // At weight 0.5: '+' 7 → 3, '-' 1 → 0, '*' −5 → 0, '/' 20 → 10.
      const entry = {
        ...buildEntry(1, { '+': [10, 3], '-': [1, 0], '*': [0, 5], '/': [20, 0] }),
        mode: 'practice' as const,
      };

      expect(getEntryOperationScores(entry)).toEqual(scores({ '+': 3, '-': 0, '*': 0, '/': 10 }));
    });
  });

  describe('getRequirementStatuses', () => {
    it('lists only the operations the grade requires', () => {
      expect(getRequirementStatuses(scores({ '+': 212, '*': 9 }), 'cadet')).toEqual([
        { op: '+', current: 212, required: 250 },
        { op: '-', current: 0, required: 150 },
      ]);
    });

    it('returns no rows for Trainee', () => {
      expect(getRequirementStatuses(CADET, 'trainee')).toEqual([]);
    });
  });

  describe('resolveGradeFromOperationScores', () => {
    it('resolves each grade at its exact requirements in the happy path', () => {
      expect(resolveGradeFromOperationScores(createEmptyOperationScores())).toBe('trainee');
      expect(resolveGradeFromOperationScores(CADET)).toBe('cadet');
      expect(resolveGradeFromOperationScores(COMMANDER)).toBe('commander');
      expect(resolveGradeFromOperationScores(MAJOR_GENERAL)).toBe('major-general');
    });

    it('stays one grade lower when a single operation is one point short', () => {
      expect(resolveGradeFromOperationScores(scores({ '+': 250, '-': 149 }))).toBe('trainee');
      expect(resolveGradeFromOperationScores({ ...COMMANDER, '-': 549 })).toBe('cadet');
    });

    it('never skips a grade', () => {
      expect(resolveGradeFromOperationScores({ ...MAJOR_GENERAL, '*': 0 })).toBe('cadet');
    });

    it('agrees with meetsGradeRequirements', () => {
      expect(meetsGradeRequirements(COMMANDER, 'commander')).toBe(true);
      expect(meetsGradeRequirements(COMMANDER, 'major-general')).toBe(false);
      expect(meetsGradeRequirements(createEmptyOperationScores(), 'trainee')).toBe(true);
    });
  });

  describe('buildGradeNotice', () => {
    it('returns a promotion notice without operations in the happy path', () => {
      expect(buildGradeNotice(scores({ '+': 245, '-': 150 }), CADET)).toEqual({
        kind: 'promoted',
        fromGrade: 'trainee',
        toGrade: 'cadet',
        operations: [],
      });
    });

    it('returns a demotion notice listing only the operations below the old grade', () => {
      expect(buildGradeNotice(COMMANDER, { ...COMMANDER, '-': 549 })).toEqual({
        kind: 'demoted',
        fromGrade: 'commander',
        toGrade: 'cadet',
        operations: [{ op: '-', current: 549, required: 550 }],
      });
    });

    it('handles a drop of two grades', () => {
      const notice = buildGradeNotice(COMMANDER, { ...COMMANDER, '+': 100 });

      expect(notice).toMatchObject({ kind: 'demoted', fromGrade: 'commander', toGrade: 'trainee' });
      expect(notice?.operations).toEqual([{ op: '+', current: 100, required: 750 }]);
    });

    it('returns null when the grade does not change', () => {
      expect(buildGradeNotice(CADET, { ...CADET, '+': 400 })).toBeNull();
      expect(buildGradeNotice(createEmptyOperationScores(), createEmptyOperationScores())).toBeNull();
    });
  });
});
