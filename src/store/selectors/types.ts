import type { GameHistoryEntry, Grade, MathOperation } from '@shared/types';
import { GameStoreState } from '@store/types';

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
  progressScore: number;
  currentThreshold: number;
  nextGrade: Grade | null;
  nextThreshold: number | null;
  pointsLeft: number;
  progressRatio: number;
}

export interface WeeklyProgressReport {
  averageAccuracy: number;
  latestRunAt: number | null;
  runsCompleted: number;
  scoreEarned: number;
}

export interface BuildGradeProgressInput {
  currentScore: number;
  grade: Grade;
  history: GameHistoryEntry[];
  phase: GameStoreState['phase'];
}
