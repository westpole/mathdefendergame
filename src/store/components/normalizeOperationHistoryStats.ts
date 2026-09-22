import { MATH_OPERATIONS } from '@store/const';
import type { MathOperation, OperationHistoryStat } from '@shared/types';
import { createEmptyOperationHistoryStats } from '@store/utilities';

/**
 * Normalizes raw per-operation stats into the canonical record used by game history.
 *
 * This helper accepts persisted local-storage stats, preserves numeric values for each math
 * operator, pads any missing or malformed bucket with zeroes, and returns the app’s default
 * structure so startup never crashes on stale or partial data.
 *
 * @param rawStats - Raw operation-stat payload from persisted history.
 * @returns A normalized record keyed by each supported math operator.
 */
export function normalizeOperationHistoryStats(rawStats: unknown): Record<MathOperation, OperationHistoryStat> {
  const normalizedStats = createEmptyOperationHistoryStats();

  if (!rawStats || typeof rawStats !== 'object') {
    return normalizedStats;
  }

  for (const op of MATH_OPERATIONS) {
    const stat = (rawStats as Record<string, unknown>)[op];

    if (!stat || typeof stat !== 'object') {
      continue;
    }

    const statRecord = stat as Record<string, unknown>;
    normalizedStats[op] = {
      attempts: typeof statRecord.attempts === 'number' ? statRecord.attempts : 0,
      incorrect: typeof statRecord.incorrect === 'number' ? statRecord.incorrect : 0,
      avgTimeMs: typeof statRecord.avgTimeMs === 'number' ? statRecord.avgTimeMs : 0,
    };
  }

  return normalizedStats;
}
