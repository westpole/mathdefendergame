import type { Grade, GradeOperationStatus, MathOperation } from '@shared/types';

export interface PerformanceAggregate {
  attempts: number;
  incorrect: number;
  totalLatencyMs: number;
}

export interface PerformanceRow {
  operation: MathOperation;
  label: string;
  accuracy: number;
  avgSpeedSeconds: number;
  masteryRating: string;
  attempts: number;
}

export interface GradeProgressSummary {
  effectiveGrade: Grade;
  /** Null at Major-General. */
  nextGrade: Grade | null;
  /** Rows for the next grade's requirements, or Major-General's requirements at the top grade. */
  operations: GradeOperationStatus[];
}

export interface WeeklyProgressReport {
  averageAccuracy: number;
  latestRunAt: number | null;
  runsCompleted: number;
  scoreEarned: number;
}

export interface WeeklyStreakSummary {
  /** Streak weeks in a row. The current week counts once it has enough active days. */
  streakWeeks: number;
  /** Active days so far in the current calendar week. */
  thisWeekActiveDays: number;
  /** Day keys (`YYYY-MM-DD`) of this week's active days. */
  thisWeekActiveDayKeys: string[];
  /** Active days still needed this week to make it a streak week (0 when reached). */
  daysNeeded: number;
  /** Streak shields banked now (0 or 1). Worked out from history, never saved. */
  shieldBanked: number;
  /** Completed short weeks a shield covered, oldest first. */
  shieldUsedWeekKeys: string[];
  /** From Friday on: the streak needs every remaining day of this week to survive (or can't). */
  atRisk: boolean;
}
