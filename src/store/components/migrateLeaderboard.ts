import type { Grade, ScoreEntry } from '@shared/types';

import { createEmptyLeaderboard } from '@store/const';
import { normalizeGrade, sortAndTrimScores } from '@store/utilities';

export function migrateLeaderboard(rawLeaderboard: unknown): Record<Grade, ScoreEntry[]> {
  const nextLeaderboard = createEmptyLeaderboard();

  if (!rawLeaderboard || typeof rawLeaderboard !== 'object') {
    return nextLeaderboard;
  }

  for (const [bucketKey, entries] of Object.entries(rawLeaderboard as Record<string, unknown>)) {
    if (!Array.isArray(entries)) {
      continue;
    }

    const bucketGrade = normalizeGrade(bucketKey);
    const migratedEntries: ScoreEntry[] = entries.map((entry) => {
      const legacyEntry = (entry ?? {}) as Record<string, unknown>;
      const entryGrade = normalizeGrade(legacyEntry.grade ?? legacyEntry.difficulty ?? bucketGrade);

      return {
        key: typeof legacyEntry.key === 'string'
          ? legacyEntry.key
          : `leaderboard_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`,
        name: typeof legacyEntry.name === 'string' ? legacyEntry.name : 'Anonymous',
        score: typeof legacyEntry.score === 'number' ? legacyEntry.score : 0,
        perfScore: typeof legacyEntry.perfScore === 'number' ? legacyEntry.perfScore : 0,
        combined: typeof legacyEntry.combined === 'number'
          ? legacyEntry.combined
          : (typeof legacyEntry.score === 'number' ? legacyEntry.score : 0)
            + (typeof legacyEntry.perfScore === 'number' ? legacyEntry.perfScore : 0),
        grade: entryGrade,
        date: typeof legacyEntry.date === 'number' ? legacyEntry.date : Date.now(),
      };
    });

    nextLeaderboard[bucketGrade] = sortAndTrimScores([
      ...nextLeaderboard[bucketGrade],
      ...migratedEntries,
    ]);
  }

  return nextLeaderboard;
}
