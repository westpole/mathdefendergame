import type { GameHistoryEntry } from '@shared/types';

import { isMathOperation, normalizeGrade } from '@store/utilities';

import { normalizeOperationHistoryStats } from './normalizeOperationHistoryStats';

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
