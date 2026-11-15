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

export interface WeeklyGoalProgress {
  /** Score credited this week from qualifying runs, after the daily cap. */
  creditedScore: number;
  goal: number;
  /** Credited score as a share of the goal, 0–100. */
  percent: number;
  met: boolean;
  /** Score credited today. */
  todayCredited: number;
  /** Most that can be credited on one day. */
  todayCap: number;
  /** Runs this week that didn't qualify (accuracy or answer count too low). */
  nonQualifyingRuns: number;
}

/** How one finished run counted toward the weekly goal. */
export type RunGoalResult =
  | { kind: 'counted'; credited: number; percent: number }
  | { kind: 'capped' }
  | { kind: 'low-accuracy'; accuracyPercent: number }
  | { kind: 'too-short' };

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
