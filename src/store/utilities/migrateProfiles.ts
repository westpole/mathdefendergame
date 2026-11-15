import type { PlayerProfile } from '@store/types';
import { normalizeGrade } from '@store/utilities/general';
import { resolveAvatarId } from '@shared/avatarCatalog';
import { ACHIEVEMENT_IDS, MATH_OPERATIONS, WEEKLY_ACHIEVEMENT_IDS } from '@shared/constants';
import { getAchievementKey } from '@store/selectors/achievements';
import type { EarnedAchievement, PracticeOperation } from '@shared/types';

/**
 * Keeps a persisted practice operation only when it is one of the supported operations.
 *
 * @param value - Raw persisted value.
 * @returns The operation, or `undefined` when missing or malformed.
 */
function resolvePracticeOperation(value: unknown): PracticeOperation | undefined {
  return MATH_OPERATIONS.find((operation) => operation === value);
}

/**
 * Keeps only well-formed saved awards. Unknown ids, malformed entries, weekly awards
 * without a week key, and duplicates (first one wins) are dropped.
 *
 * @param value - Raw persisted value.
 * @returns A clean award list; empty when missing or malformed.
 */
function resolveAchievements(value: unknown): EarnedAchievement[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seenKeys = new Set<string>();

  return value.flatMap((item): EarnedAchievement[] => {
    if (!item || typeof item !== 'object') {
      return [];
    }

    const record = item as Record<string, unknown>;
    const id = ACHIEVEMENT_IDS.find((achievementId) => achievementId === record.id);

    if (!id || typeof record.earnedAt !== 'number' || !Number.isFinite(record.earnedAt)) {
      return [];
    }

    const weekKey = typeof record.weekKey === 'string' ? record.weekKey : undefined;

    if (WEEKLY_ACHIEVEMENT_IDS.includes(id) && !weekKey) {
      return [];
    }

    const key = getAchievementKey({ id, weekKey });

    if (seenKeys.has(key)) {
      return [];
    }

    seenKeys.add(key);
    const operation = resolvePracticeOperation(record.operation);

    return [{
      id,
      earnedAt: record.earnedAt,
      ...(weekKey && { weekKey }),
      ...(operation && { operation }),
    }];
  });
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

    const lastPracticeOperation = resolvePracticeOperation(profileRecord.lastPracticeOperation);

    migrated[username] = {
      username: typeof profileRecord.username === 'string' ? profileRecord.username : username,
      password: typeof profileRecord.password === 'string' ? profileRecord.password : '',
      avatarId: resolveAvatarId(profileRecord.avatarId),
      bestScore: typeof profileRecord.bestScore === 'number' ? profileRecord.bestScore : 0,
      highestStage: typeof profileRecord.highestStage === 'number' ? profileRecord.highestStage : 1,
      preferredGrade,
      ...(lastPracticeOperation && { lastPracticeOperation }),
      achievements: resolveAchievements(profileRecord.achievements),
      createdAt: typeof profileRecord.createdAt === 'number' ? profileRecord.createdAt : Date.now(),
      updatedAt: typeof profileRecord.updatedAt === 'number' ? profileRecord.updatedAt : Date.now(),
    };
  }

  return migrated;
}
