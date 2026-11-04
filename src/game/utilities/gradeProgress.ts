/**
 * Phaser Game Utilities - Grade Progress
 *
 * Pure helpers for per-operation grade progression. A grade is held while every
 * operation score meets that grade's requirements (`GAME_CONFIG.grades[grade].requirements`).
 * Operation scores are `correct − incorrect` per run; the lifetime total is clamped at 0
 * after each run so it can drop but never goes negative. Practice runs only add, at a
 * reduced weight (see `getEntryOperationScores`).
 *
 * Shared by the game core (grade at run start), the store (grade after a run and the
 * after-game notice), and the UI (progress toward the next grade).
 */

import type {
  GameHistoryEntry,
  Grade,
  GradeNotice,
  GradeOperationStatus,
  MathOperation,
  OperationHistoryStat,
  OperationScores,
} from '@shared/types';
import { MATH_OPERATIONS } from '@shared/constants';

import { GAME_CONFIG } from '../config';

type GradeRequirements = Partial<Record<MathOperation, number>>;

/**
 * Creates an operation-score record with every operation at 0.
 *
 * @returns Zeroed operation scores.
 * @example
 * createEmptyOperationScores(); // { '+': 0, '-': 0, '*': 0, '/': 0 }
 */
export function createEmptyOperationScores(): OperationScores {
  return { '+': 0, '-': 0, '*': 0, '/': 0 };
}

/**
 * Returns the requirements a player needs to hold a grade.
 *
 * @param grade - Grade to look up.
 * @returns Required lifetime score per operation; empty for Trainee.
 * @example
 * getGradeRequirements('cadet'); // { '+': 250, '-': 150 }
 */
export function getGradeRequirements(grade: Grade): GradeRequirements {
  return GAME_CONFIG.grades[grade].requirements;
}

/**
 * Converts one run's operation stats into operation scores (`correct − incorrect`).
 * The result can be negative.
 *
 * @param stats - Per-operation attempts and incorrect answers for one run.
 * @returns Score per operation for that run.
 * @example
 * getRunOperationScores({ ...stats, '+': { attempts: 10, incorrect: 3, avgTimeMs: 900 } })['+']; // 4
 */
export function getRunOperationScores(stats: Record<MathOperation, OperationHistoryStat>): OperationScores {
  const scores = createEmptyOperationScores();

  for (const op of MATH_OPERATIONS) {
    const stat = stats[op];
    scores[op] = stat ? stat.attempts - (2 * stat.incorrect) : 0;
  }

  return scores;
}

/**
 * Returns the operation scores a history entry contributes toward the grade.
 * Regular runs count in full. Practice runs only add: a negative operation score counts as 0,
 * and gains are scaled by `GAME_CONFIG.practiceScoreWeight` (rounded down), so practice is
 * safe for the grade but slower to grind than real play.
 *
 * @param entry - One saved run.
 * @returns Score per operation that the run adds to lifetime scores.
 * @example
 * // Practice run with '+' at 7 → 3 at weight 0.5; '-' at -4 → 0.
 * getEntryOperationScores(practiceEntry);
 */
export function getEntryOperationScores(entry: GameHistoryEntry): OperationScores {
  const scores = getRunOperationScores(entry.operationStats);

  if (entry.mode !== 'practice') {
    return scores;
  }

  for (const op of MATH_OPERATIONS) {
    scores[op] = Math.floor(Math.max(0, scores[op]) * GAME_CONFIG.practiceScoreWeight);
  }

  return scores;
}

/**
 * Adds a run's scores to lifetime scores, clamping each operation at 0.
 *
 * @param lifetime - Lifetime scores before the run.
 * @param run - Scores earned in the run (may be negative).
 * @returns Lifetime scores after the run.
 * @example
 * applyRunScores({ ...zero, '*': 3 }, { ...zero, '*': -5 })['*']; // 0
 */
export function applyRunScores(lifetime: OperationScores, run: OperationScores): OperationScores {
  const scores = createEmptyOperationScores();

  for (const op of MATH_OPERATIONS) {
    scores[op] = Math.max(0, lifetime[op] + run[op]);
  }

  return scores;
}

/**
 * Sums lifetime operation scores from history, oldest run first, clamping the running
 * total at 0 after each run.
 *
 * @param history - History entries in any order (the store keeps them newest-first).
 * @returns Lifetime score per operation.
 * @example
 * sumOperationScores(state.gameHistoryByProfile[profileKey] ?? []);
 */
export function sumOperationScores(history: GameHistoryEntry[]): OperationScores {
  const oldestFirst = [...history].sort((left, right) => left.playedAt - right.playedAt);

  return oldestFirst.reduce(
    (lifetime, entry) => applyRunScores(lifetime, getEntryOperationScores(entry)),
    createEmptyOperationScores(),
  );
}

/**
 * Compares operation scores with a grade's requirements.
 *
 * @param scores - Lifetime operation scores.
 * @param grade - Grade whose requirements are checked.
 * @returns One status per required operation, in `+ − × ÷` order.
 * @example
 * getRequirementStatuses(scores, 'cadet'); // [{ op: '+', current: 212, required: 250 }, ...]
 */
export function getRequirementStatuses(scores: OperationScores, grade: Grade): GradeOperationStatus[] {
  const requirements = getGradeRequirements(grade);

  return MATH_OPERATIONS.flatMap((op) => {
    const required = requirements[op];
    return required === undefined ? [] : [{ op, current: scores[op], required }];
  });
}

/**
 * Checks whether operation scores meet every requirement of a grade.
 *
 * @param scores - Lifetime operation scores.
 * @param grade - Grade to check.
 * @returns True when the player can hold the grade.
 * @example
 * meetsGradeRequirements(scores, 'commander');
 */
export function meetsGradeRequirements(scores: OperationScores, grade: Grade): boolean {
  return getRequirementStatuses(scores, grade).every(({ current, required }) => current >= required);
}

/**
 * Resolves the highest grade the scores qualify for. Grades are checked in order and
 * the walk stops at the first unmet grade, so a grade can't be skipped.
 *
 * @param scores - Lifetime operation scores.
 * @returns The grade the player holds.
 * @example
 * resolveGradeFromOperationScores(sumOperationScores(history));
 */
export function resolveGradeFromOperationScores(scores: OperationScores): Grade {
  let resolved: Grade = 'trainee';

  for (const grade of GAME_CONFIG.gradeOrder) {
    if (!meetsGradeRequirements(scores, grade)) {
      break;
    }

    resolved = grade;
  }

  return resolved;
}

/**
 * Builds the after-game message for a grade change.
 *
 * @param scoresBefore - Lifetime operation scores before the run.
 * @param scoresAfter - Lifetime operation scores after the run.
 * @returns A promotion or demotion notice, or null when the grade didn't change.
 * @example
 * buildGradeNotice(sumOperationScores(previousHistory), sumOperationScores(nextHistory));
 */
export function buildGradeNotice(scoresBefore: OperationScores, scoresAfter: OperationScores): GradeNotice | null {
  const fromGrade = resolveGradeFromOperationScores(scoresBefore);
  const toGrade = resolveGradeFromOperationScores(scoresAfter);

  if (fromGrade === toGrade) {
    return null;
  }

  const isPromotion = GAME_CONFIG.gradeOrder.indexOf(toGrade) > GAME_CONFIG.gradeOrder.indexOf(fromGrade);

  if (isPromotion) {
    return { kind: 'promoted', fromGrade, toGrade, operations: [] };
  }

  return {
    kind: 'demoted',
    fromGrade,
    toGrade,
    operations: getRequirementStatuses(scoresAfter, fromGrade).filter(({ current, required }) => current < required),
  };
}
