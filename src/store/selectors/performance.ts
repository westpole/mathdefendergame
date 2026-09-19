import type { GameHistoryEntry, MathOperation } from '@shared/types';

import type { GameStoreState } from '@store/useGameStore';

const GUEST_HISTORY_BUCKET = '__guest__';
const MATH_OPERATIONS: MathOperation[] = ['+', '-', '*', '/'];
const OPERATION_LABELS: Record<MathOperation, string> = {
  '+': 'Addition (+)',
  '-': 'Subtraction (-)',
  '*': 'Multiplication (*)',
  '/': 'Division (/)',
};
const EMPTY_HISTORY: GameHistoryEntry[] = [];

interface PerformanceAggregate {
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

function createEmptyAggregate(): Record<MathOperation, PerformanceAggregate> {
  return {
    '+': { attempts: 0, incorrect: 0, totalLatencyMs: 0 },
    '-': { attempts: 0, incorrect: 0, totalLatencyMs: 0 },
    '*': { attempts: 0, incorrect: 0, totalLatencyMs: 0 },
    '/': { attempts: 0, incorrect: 0, totalLatencyMs: 0 },
  };
}

function getOperationLabel(operation: MathOperation): string {
  return OPERATION_LABELS[operation];
}

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

export function selectActiveProfileHistory(state: GameStoreState): GameHistoryEntry[] {
  const profileKey = state.activeUsername ?? GUEST_HISTORY_BUCKET;
  return state.gameHistoryByProfile[profileKey] ?? EMPTY_HISTORY;
}

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
