import type { Grade, ScoreEntry } from '@shared/types';

import { createEmptyLeaderboard } from '@store/const';
import { normalizeGrade, sortAndTrimScores } from '@store/utilities';

/**
 * Normalizes the persisted per-grade leaderboard into the canonical scoreboard shape.
 *
 * This helper accepts the raw storage payload, converts each legacy score record to the
 * expected ScoreEntry contract with safe defaults, sorts each grade bucket by score/date,
 * trims each bucket to the top 10 entries, and ignores malformed buckets so corrupted
 * localStorage data will not crash the app during startup.
 *
 * @param rawLeaderboard - Raw leaderboard state persisted by the game store.
 * @returns A per-grade leaderboard map with each bucket normalized and capped to the top 10 entries.
 */
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
