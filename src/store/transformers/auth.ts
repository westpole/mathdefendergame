import { encryptPassword } from '../utilities/passwordEncryption';
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
 * @param password - Plain text or synthetic password before encryption.
 * @param preferredGrade - Initial preferred grade for the profile.
 * @param now - Timestamp used for created and updated fields.
 * @returns New player profile record.
 * @example
 * const profile = buildNewProfile('PilotOne', 'Abc12345', 'trainee', Date.now());
 */
export function buildNewProfile(
  username: string,
  password: string,
  preferredGrade: GameStoreState['grade'],
  now: number,
): PlayerProfile {
  return {
    username,
    password: encryptPassword(password),
    bestScore: 0,
    highestStage: 1,
    preferredGrade,
    createdAt: now,
    updatedAt: now,
  };
}

