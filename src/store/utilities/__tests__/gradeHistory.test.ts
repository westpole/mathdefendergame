import { describe, expect, it } from 'vitest';

import type { GameHistoryEntry, MathOperation } from '@shared/types';
import { buildGradeNotice, sumOperationScores } from '@game/utilities/gradeProgress';

import {
  buildGradeUpdate,
  getLifetimeOperationScores,
  resolveLifetimeGrade,
  resolveProfileHistoryKey,
} from '../general';

function createEntry(
  key: string,
  playedAt: number,
  correctByOperation: Partial<Record<MathOperation, number>>,
  incorrectByOperation: Partial<Record<MathOperation, number>> = {},
): GameHistoryEntry {
  const stat = (op: MathOperation) => {
    const incorrect = incorrectByOperation[op] ?? 0;
    return { attempts: (correctByOperation[op] ?? 0) + incorrect, incorrect, avgTimeMs: 900 };
  };

  return {
    key,
    playedAt,
    correctAnswers: 0,
    incorrectAnswers: 0,
    averageAnswerTimeMs: 900,
    mostProblematicOperation: null,
    operationStats: { '+': stat('+'), '-': stat('-'), '*': stat('*'), '/': stat('/') },
    gradeAtFinish: 'trainee',
    finalScore: 0,
    finalPerfScore: 0,
  };
}

describe('resolveProfileHistoryKey', () => {
  it('uses the username for a signed-in player and the guest bucket otherwise', () => {
    expect(resolveProfileHistoryKey('PilotOne')).toBe('PilotOne');
    expect(resolveProfileHistoryKey(null)).toBe('__guest__');
  });
});

describe('lifetime grade helpers', () => {
  it('read the guest bucket when no player is signed in', () => {
    const history = { __guest__: [createEntry('guest-1', 1, { '+': 250, '-': 150 })] };

    expect(getLifetimeOperationScores(null, history)['+']).toBe(250);
    expect(resolveLifetimeGrade(null, history)).toBe('cadet');
    expect(resolveLifetimeGrade('PilotOne', history)).toBe('trainee');
  });
});

describe('buildGradeUpdate', () => {
  it('promotes when the new run completes the next grade requirements', () => {
    const history = { PilotOne: [createEntry('run-1', 1, { '+': 240, '-': 150 })] };

    expect(buildGradeUpdate('PilotOne', history, createEntry('run-2', 2, { '+': 10 }))).toEqual({
      grade: 'cadet',
      gradeNotice: { kind: 'promoted', fromGrade: 'trainee', toGrade: 'cadet', operations: [] },
    });
  });

  it('demotes and lists the operations that fell short', () => {
    const history = { PilotOne: [createEntry('run-1', 1, { '+': 250, '-': 150 })] };

    const update = buildGradeUpdate('PilotOne', history, createEntry('run-2', 2, {}, { '-': 1 }));

    expect(update.grade).toBe('trainee');
    expect(update.gradeNotice).toEqual({
      kind: 'demoted',
      fromGrade: 'cadet',
      toGrade: 'trainee',
      operations: [{ op: '-', current: 149, required: 150 }],
    });
  });

  it('never demotes after a bad practice run', () => {
    const history = { PilotOne: [createEntry('run-1', 1, { '+': 250, '-': 150 })] };
    const badPractice = { ...createEntry('practice-1', 2, {}, { '-': 40 }), mode: 'practice' as const };

    expect(buildGradeUpdate('PilotOne', history, badPractice)).toEqual({ grade: 'cadet', gradeNotice: null });
  });

  it('promotes from practice gains at the practice weight', () => {
    // '+' needs 10 more: 20 practice points at weight 0.5 add exactly 10.
    const history = { PilotOne: [createEntry('run-1', 1, { '+': 240, '-': 150 })] };
    const enoughPractice = { ...createEntry('practice-1', 2, { '+': 20 }), mode: 'practice' as const };
    // 19 × 0.5 rounds down to 9, one short.
    const shortPractice = { ...createEntry('practice-2', 2, { '+': 19 }), mode: 'practice' as const };

    expect(buildGradeUpdate('PilotOne', history, enoughPractice).grade).toBe('cadet');
    expect(buildGradeUpdate('PilotOne', history, shortPractice).grade).toBe('trainee');
  });

  it('returns no notice when the grade does not change', () => {
    const update = buildGradeUpdate(null, {}, createEntry('guest-1', 1, { '+': 5 }));

    expect(update).toEqual({ grade: 'trainee', gradeNotice: null });
  });

  it('recalculates in date order when the new run is older than stored runs', () => {
    // Clamping makes order matter. Oldest first: '-' goes -1 → 0, then +150 → 150 (Cadet).
    // Adding the old run on top would give 150 − 1 = 149 (Trainee).
    const history = { PilotOne: [createEntry('newer', 10, { '+': 250, '-': 150 })] };
    const olderEntry = createEntry('older', 1, {}, { '-': 1 });

    const update = buildGradeUpdate('PilotOne', history, olderEntry);

    expect(update).toEqual({ grade: 'cadet', gradeNotice: null });
    expect(update.gradeNotice).toEqual(
      buildGradeNotice(sumOperationScores(history.PilotOne), sumOperationScores([...history.PilotOne, olderEntry])),
    );
  });
});
