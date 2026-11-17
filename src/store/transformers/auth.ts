import { DEFAULT_AVATAR_ID } from '@shared/avatarCatalog';
import type {
  GameStoreState,
  LoginResult,
  PlayerProfile,
} from '../types';

/**
 * Trims and normalizes a username input value used in auth flows.
 *
 * @param username - Raw username from user input.
 * @returns Trimmed username.
 * @example
 * const normalized = normalizeUsername('  PilotOne  ');
 * // "PilotOne"
 */
export function normalizeUsername(username: string): string {
  return username.trim();
}

/**
 * Creates a failed login result when a required username is missing.
 *
 * @returns Failed login result object.
 * @example
 * const result = createMissingUsernameResult();
 * // { success: false, error: 'Username is required.' }
 */
export function createMissingUsernameResult(): LoginResult {
  return {
    success: false,
    error: 'Username is required.',
  };
}

/**
 * Builds a persisted player profile object for a new account.
 *
 * @param username - Normalized username.
 * @param preferredGrade - Initial preferred grade for the profile.
 * @param now - Timestamp used for created and updated fields.
 * @returns New player profile record.
 * @example
 * const profile = buildNewProfile('PilotOne', 'trainee', Date.now());
 */
export function buildNewProfile(
  username: string,
  preferredGrade: GameStoreState['grade'],
  now: number,
): PlayerProfile {
  return {
    username,
    avatarId: DEFAULT_AVATAR_ID,
    bestScore: 0,
    highestStage: 1,
    preferredGrade,
    createdAt: now,
    updatedAt: now,
  };
}
