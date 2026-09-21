import { MATH_OPERATIONS } from '@store/const';
import type { MathOperation, OperationHistoryStat } from '@shared/types';
import { createEmptyOperationHistoryStats } from '@store/utilities';

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
