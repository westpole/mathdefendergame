import type { PlayerProfile } from '@store/types';
import { normalizeGrade } from '@store/utilities/general';

export interface LegacyProfileMigrationReport {
  status: 'success' | 'failed';
  details: string;
  migratedProfiles: number;
  droppedProfiles: number;
  removedLegacyFields: number;
}

export interface LegacyProfileMigrationResult {
  profiles: Record<string, PlayerProfile>;
  report: LegacyProfileMigrationReport;
}

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
      bestScore: typeof profileRecord.bestScore === 'number' ? profileRecord.bestScore : 0,
      highestStage: typeof profileRecord.highestStage === 'number' ? profileRecord.highestStage : 1,
      preferredGrade,
      createdAt: typeof profileRecord.createdAt === 'number' ? profileRecord.createdAt : Date.now(),
      updatedAt: typeof profileRecord.updatedAt === 'number' ? profileRecord.updatedAt : Date.now(),
    };
  }

  return migrated;
}

/**
 * Performs a one-time legacy profile migration and generates a short status report.
 *
 * This helper accepts legacy grade aliases (such as preferredDifficulty), rewrites each profile
 * into the canonical PlayerProfile shape, drops malformed entries, and returns a compact report
 * that can be surfaced after hydration.
 *
 * @param rawProfiles - Raw profile payload read from an older persisted store version.
 * @returns Canonical profiles plus a migration report with success/failure details.
 */
export function migrateLegacyProfiles(rawProfiles: unknown): LegacyProfileMigrationResult {
  if (!rawProfiles || typeof rawProfiles !== 'object') {
    return {
      profiles: {},
      report: {
        status: 'failed',
        details: 'Legacy payload invalid. Reset profiles to empty map.',
        migratedProfiles: 0,
        droppedProfiles: 0,
        removedLegacyFields: 0,
      },
    };
  }

  const migrated: Record<string, PlayerProfile> = {};
  let droppedProfiles = 0;
  let removedLegacyFields = 0;

  for (const [username, profile] of Object.entries(rawProfiles as Record<string, unknown>)) {
    if (!profile || typeof profile !== 'object') {
      droppedProfiles += 1;
      continue;
    }

    const profileRecord = profile as Record<string, unknown>;
    const hasLegacyGradeField = Object.prototype.hasOwnProperty.call(
      profileRecord,
      'preferredDifficulty',
    );

    if (hasLegacyGradeField) {
      removedLegacyFields += 1;
    }

    const preferredGrade = normalizeGrade(
      profileRecord.preferredGrade ?? profileRecord.preferredDifficulty,
    );

    migrated[username] = {
      username: typeof profileRecord.username === 'string' ? profileRecord.username : username,
      password: typeof profileRecord.password === 'string' ? profileRecord.password : '',
      bestScore: typeof profileRecord.bestScore === 'number' ? profileRecord.bestScore : 0,
      highestStage: typeof profileRecord.highestStage === 'number' ? profileRecord.highestStage : 1,
      preferredGrade,
      createdAt: typeof profileRecord.createdAt === 'number' ? profileRecord.createdAt : Date.now(),
      updatedAt: typeof profileRecord.updatedAt === 'number' ? profileRecord.updatedAt : Date.now(),
    };
  }

  return {
    profiles: migrated,
    report: {
      status: 'success',
      details: `Migrated ${Object.keys(migrated).length} profile(s). Dropped ${droppedProfiles} invalid profile(s). Removed ${removedLegacyFields} legacy field(s).`,
      migratedProfiles: Object.keys(migrated).length,
      droppedProfiles,
      removedLegacyFields,
    },
  };
}
