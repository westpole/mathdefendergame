import { GAME_CONFIG } from '@game/config';
import {
  getRequirementStatuses,
  resolveGradeFromOperationScores,
  sumOperationScores,
} from '@game/utilities/gradeProgress';
import type { GameHistoryEntry } from '@shared/types';
import { WEEK_MS } from '@store/constants';
import type { GradeProgressSummary, WeeklyProgressReport } from './types';

/**
 * Builds per-operation progress toward the next grade from lifetime history.
 * Live run values are not included: grades change only after a run is saved.
 *
 * @param history - All runs for the active profile (any order).
 * @returns The effective grade, the next grade, and one row per operation the next
 * grade requires. At Major-General the rows show the Major-General requirements to hold.
 * @example
 * const progress = buildGradeProgressSummary(selectActiveProfileHistory(state));
 */
export function buildGradeProgressSummary(history: GameHistoryEntry[]): GradeProgressSummary {
  const scores = sumOperationScores(history);
  const effectiveGrade = resolveGradeFromOperationScores(scores);
  const gradeOrder = GAME_CONFIG.gradeOrder;
  const currentIndex = gradeOrder.indexOf(effectiveGrade);
  const nextGrade = currentIndex < gradeOrder.length - 1 ? gradeOrder[currentIndex + 1] : null;

  return {
    effectiveGrade,
    nextGrade,
    operations: getRequirementStatuses(scores, nextGrade ?? effectiveGrade),
  };
}

/**
 * Summarizes a player's recent weekly performance from a history list.
 *
 * @param history - The full game history to inspect.
 * @param now - The reference timestamp used to determine the weekly window.
 * Defaults to the current time.
 * @returns A report covering total runs, average accuracy, latest run timestamp,
 * and total score earned within the last week.
 */
export function buildWeeklyProgressReport(
  history: GameHistoryEntry[],
  now: number = Date.now(),
): WeeklyProgressReport {
  const cutoff = now - WEEK_MS;
  const weeklyEntries = history.filter((entry) => entry.playedAt >= cutoff && entry.playedAt <= now);
  const totalCorrectAnswers = weeklyEntries.reduce((sum, entry) => sum + entry.correctAnswers, 0);
  const totalIncorrectAnswers = weeklyEntries.reduce((sum, entry) => sum + entry.incorrectAnswers, 0);
  const resolvedAnswers = totalCorrectAnswers + totalIncorrectAnswers;

  return {
    averageAccuracy: resolvedAnswers > 0 ? (totalCorrectAnswers / resolvedAnswers) * 100 : 0,
    latestRunAt: weeklyEntries.length > 0 ? weeklyEntries[0].playedAt : null,
    runsCompleted: weeklyEntries.length,
    scoreEarned: weeklyEntries.reduce((sum, entry) => sum + entry.finalScore, 0),
  };
}
