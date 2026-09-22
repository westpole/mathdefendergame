import type { GameHistoryEntry } from '@shared/types';

import { isMathOperation, normalizeGrade } from '@store/utilities/general';

import { normalizeOperationHistoryStats } from './normalizeOperationHistoryStats';

/**
 * Normalizes a persisted history row into the canonical GameHistoryEntry shape.
 *
 * This helper accepts raw local-storage data, preserves valid fields, converts legacy
 * property names like date/grade/score into the current schema, fills missing values with
 * safe defaults, and avoids crashing on malformed entries during startup.
 *
 * @param rawEntry - Raw history entry read from persisted store state.
 * @returns A normalized game-history record that matches the current runtime contract.
 */
export function normalizeHistoryEntry(rawEntry: unknown): GameHistoryEntry {
  const legacyEntry = (rawEntry ?? {}) as Record<string, unknown>;

  return {
    key: typeof legacyEntry.key === 'string'
      ? legacyEntry.key
      : `game_history_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`,
    playedAt: typeof legacyEntry.playedAt === 'number'
      ? legacyEntry.playedAt
      : (typeof legacyEntry.date === 'number' ? legacyEntry.date : Date.now()),
    correctAnswers: typeof legacyEntry.correctAnswers === 'number'
      ? legacyEntry.correctAnswers
      : (typeof legacyEntry.correctCount === 'number' ? legacyEntry.correctCount : 0),
    incorrectAnswers: typeof legacyEntry.incorrectAnswers === 'number'
      ? legacyEntry.incorrectAnswers
      : (typeof legacyEntry.incorrectCount === 'number' ? legacyEntry.incorrectCount : 0),
    averageAnswerTimeMs: typeof legacyEntry.averageAnswerTimeMs === 'number'
      ? legacyEntry.averageAnswerTimeMs
      : 0,
    mostProblematicOperation: isMathOperation(legacyEntry.mostProblematicOperation)
      ? legacyEntry.mostProblematicOperation
      : null,
    operationStats: normalizeOperationHistoryStats(legacyEntry.operationStats),
    gradeAtFinish: normalizeGrade(legacyEntry.gradeAtFinish ?? legacyEntry.grade),
    finalScore: typeof legacyEntry.finalScore === 'number'
      ? legacyEntry.finalScore
      : (typeof legacyEntry.score === 'number' ? legacyEntry.score : 0),
    finalPerfScore: typeof legacyEntry.finalPerfScore === 'number'
      ? legacyEntry.finalPerfScore
      : (typeof legacyEntry.perfScore === 'number' ? legacyEntry.perfScore : 0),
  };
}
