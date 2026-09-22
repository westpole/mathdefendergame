import type { PlayerProfile } from '@store/types';
import { normalizeGrade } from '@store/utilities/general';

/**
 * Normalizes persisted profile data from legacy storage into the current PlayerProfile contract.
 *
 * This migration accepts the raw local-storage profile payload, preserves valid values,
 * falls back to safe defaults for missing or malformed fields, supports legacy grade keys such
 * as preferredDifficulty, and ignores non-object entries so startup remains resilient after
 * corrupted or partially migrated data.
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

    const legacyProfile = profile as Record<string, unknown>;
    const preferredGrade = normalizeGrade(
      legacyProfile.preferredGrade ?? legacyProfile.preferredDifficulty,
    );

    migrated[username] = {
      username: typeof legacyProfile.username === 'string' ? legacyProfile.username : username,
      password: typeof legacyProfile.password === 'string' ? legacyProfile.password : '',
      bestScore: typeof legacyProfile.bestScore === 'number' ? legacyProfile.bestScore : 0,
      highestStage: typeof legacyProfile.highestStage === 'number' ? legacyProfile.highestStage : 1,
      preferredGrade,
      createdAt: typeof legacyProfile.createdAt === 'number' ? legacyProfile.createdAt : Date.now(),
      updatedAt: typeof legacyProfile.updatedAt === 'number' ? legacyProfile.updatedAt : Date.now(),
    };
  }

  return migrated;
}
