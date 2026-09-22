import type { HistoryByProfile } from '@store/types';
import { sortHistory } from '@store/utilities/general';
import { normalizeHistoryEntry } from './normalizeHistoryEntry';

/**
 * Normalizes persisted per-profile history from storage into the canonical game-history shape.
 *
 * This helper accepts the raw local-storage payload used by the store, converts each
 * entry to the expected GameHistoryEntry contract with safe fallbacks for legacy or
 * missing keys, sorts each profile bucket newest-first, and ignores malformed profile
 * buckets so stale or partially corrupted persisted data does not break startup.
 *
 * @param rawHistoryByProfile - Raw history payload keyed by profile name.
 * @returns A normalized history map grouped by profile, with each bucket sorted newest to oldest.
 */
export function migrateGameHistoryByProfile(rawHistoryByProfile: unknown): HistoryByProfile {
  if (!rawHistoryByProfile || typeof rawHistoryByProfile !== 'object') {
    return {};
  }

  const migrated: HistoryByProfile = {};

  for (const [profileKey, entries] of Object.entries(rawHistoryByProfile as Record<string, unknown>)) {
    if (!Array.isArray(entries)) {
      continue;
    }

    migrated[profileKey] = sortHistory(entries.map((entry) => normalizeHistoryEntry(entry)));
  }

  return migrated;
}
