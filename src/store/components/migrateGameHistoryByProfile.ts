import type { HistoryByProfile } from '@store/types';
import { sortHistory } from '@store/utilities';
import { normalizeHistoryEntry } from './normalizeHistoryEntry';

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
