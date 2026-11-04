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
