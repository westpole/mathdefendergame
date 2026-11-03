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

/** One operation row in the grade-progress summary. */
export interface GradeProgressOperation extends GradeOperationStatus {
  met: boolean;
  /** `current / required`, capped at 1. */
  ratio: number;
}

export interface GradeProgressSummary {
  effectiveGrade: Grade;
  /** Null at Major-General. */
  nextGrade: Grade | null;
  /** Rows for the next grade's requirements, or Major-General's requirements at the top grade. */
  operations: GradeProgressOperation[];
  /** Average of the capped operation ratios, for one summary bar. */
  overallRatio: number;
}

export interface WeeklyProgressReport {
  averageAccuracy: number;
  latestRunAt: number | null;
  runsCompleted: number;
  scoreEarned: number;
}
