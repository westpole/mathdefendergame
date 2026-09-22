import type { GameHistoryEntry, MathOperation } from '@shared/types';

import type { GameStoreState } from '@store/types';
import { OPERATION_LABELS, GUEST_HISTORY_BUCKET, MATH_OPERATIONS } from '@store/const';

import type { PerformanceAggregate, PerformanceRow } from './types';

const EMPTY_HISTORY: GameHistoryEntry[] = [];

/**
 * Creates a zeroed aggregate bucket for each supported math operation.
 *
 * @returns A record keyed by operation with attempts, wrong-answer counts,
 * and accumulated latency ready for aggregation.
 */
function createEmptyAggregate(): Record<MathOperation, PerformanceAggregate> {
  return {
    '+': { attempts: 0, incorrect: 0, totalLatencyMs: 0 },
    '-': { attempts: 0, incorrect: 0, totalLatencyMs: 0 },
    '*': { attempts: 0, incorrect: 0, totalLatencyMs: 0 },
    '/': { attempts: 0, incorrect: 0, totalLatencyMs: 0 },
  };
}

/**
 * Resolves the display label for a math operation used in performance summaries.
 *
 * @param operation - The operation being labeled.
 * @returns A human readable label such as Addition or Multiplication.
 */
function getOperationLabel(operation: MathOperation): string {
  return OPERATION_LABELS[operation];
}

/**
 * Determines a qualitative mastery band for an operation using accuracy,
 * average response time, and total attempts.
 *
 * @param accuracy - Overall accuracy percentage for the operation, from 0 to 100.
 * @param avgSpeedSeconds - Average response time in seconds.
 * @param attempts - Total attempts recorded for the operation.
 * @returns A label describing skill level such as Mastered or Needs Practice.
 */
function resolveMasteryRating(accuracy: number, avgSpeedSeconds: number, attempts: number): string {
  if (attempts === 0) {
    return 'No Data';
  }

  if (accuracy >= 95 && avgSpeedSeconds <= 1) {
    return 'Mastered';
  }

  if (accuracy >= 85 && avgSpeedSeconds <= 2) {
    return 'Proficient';
  }

  if (accuracy >= 70) {
    return 'Needs Practice';
  }

  return 'Weak Spot';
}

/**
 * Selects the history for the currently active profile, or the guest bucket when no
 * profile is active.
 *
 * @param state - The current game store state.
 * @returns The history entries for the active player profile, or an empty array.
 */
export function selectActiveProfileHistory(state: GameStoreState): GameHistoryEntry[] {
  const profileKey = state.activeUsername ?? GUEST_HISTORY_BUCKET;
  return state.gameHistoryByProfile[profileKey] ?? EMPTY_HISTORY;
}

/**
 * Aggregates a player's operation history into rows that include accuracy,
 * average speed, attempt counts, and a mastery classification for each operation.
 *
 * @param history - The full history entries to aggregate across all operations.
 * @returns Per-operation performance rows sorted by the app's supported math order.
 */
export function buildPerformanceRows(history: GameHistoryEntry[]): PerformanceRow[] {
  const aggregates = createEmptyAggregate();

  for (const entry of history) {
    for (const operation of MATH_OPERATIONS) {
      const stat = entry.operationStats[operation];
      const aggregate = aggregates[operation];

      aggregate.attempts += stat.attempts;
      aggregate.incorrect += stat.incorrect;
      aggregate.totalLatencyMs += stat.avgTimeMs * stat.attempts;
    }
  }

  return MATH_OPERATIONS.map((operation) => {
    const aggregate = aggregates[operation];
    const accuracy = aggregate.attempts > 0
      ? ((aggregate.attempts - aggregate.incorrect) / aggregate.attempts) * 100
      : 0;
    const avgSpeedSeconds = aggregate.attempts > 0
      ? aggregate.totalLatencyMs / aggregate.attempts / 1000
      : 0;

    return {
      operation,
      label: getOperationLabel(operation),
      accuracy,
      avgSpeedSeconds,
      masteryRating: resolveMasteryRating(accuracy, avgSpeedSeconds, aggregate.attempts),
      attempts: aggregate.attempts,
    };
  });
}
