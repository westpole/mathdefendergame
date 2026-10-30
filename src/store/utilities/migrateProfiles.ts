import type { PlayerProfile } from '@store/types';
import { normalizeGrade } from '@store/utilities/general';
import { resolveAvatarId } from '@shared/avatarCatalog';

/**
 * Normalizes persisted profile data into the current PlayerProfile contract.
 *
 * This migration accepts the raw local-storage profile payload, preserves valid values,
 * falls back to safe defaults for missing or malformed fields, and ignores non-object entries
 * so startup remains resilient after corrupted or partially migrated data.
 *
 * @param rawProfiles - Raw profile map read from persisted store state.
 * @returns A normalized profile map keyed by username with safe defaults for bad data.
 */
export function migrateProfiles(rawProfiles: unknown): Record<string, PlayerProfile> {
  if (!rawProfiles || typeof rawProfiles !== 'object') {
    return {};
  }

  const migrated: Record<string, PlayerProfile> = {};

  for (const [username, profile] of Object.entries(rawProfiles as Record<string, unknown>)) {
    if (!profile || typeof profile !== 'object') {
      continue;
    }

    const profileRecord = profile as Record<string, unknown>;
    const preferredGrade = normalizeGrade(profileRecord.preferredGrade);

    migrated[username] = {
      username: typeof profileRecord.username === 'string' ? profileRecord.username : username,
      password: typeof profileRecord.password === 'string' ? profileRecord.password : '',
      avatarId: resolveAvatarId(profileRecord.avatarId),
      bestScore: typeof profileRecord.bestScore === 'number' ? profileRecord.bestScore : 0,
      highestStage: typeof profileRecord.highestStage === 'number' ? profileRecord.highestStage : 1,
      preferredGrade,
      createdAt: typeof profileRecord.createdAt === 'number' ? profileRecord.createdAt : Date.now(),
      updatedAt: typeof profileRecord.updatedAt === 'number' ? profileRecord.updatedAt : Date.now(),
    };
  }

  return migrated;
}
