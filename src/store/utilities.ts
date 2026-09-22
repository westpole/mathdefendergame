import type {
  GameHistoryEntry,
  MathOperation,
  OperationHistoryStat,
  ScoreEntry,
  Grade,
} from '@shared/types';
import { gradeOrder, passwordPolicy, GUEST_HISTORY_BUCKET } from './const';
import type { PlayerProfile, HistoryByProfile } from '@store/types';
import { resolveGradeFromScore } from '@game/config';

/**
 * Returns history entries ordered newest-first so recent play sessions appear first.
 *
 * @param entries - The history list to sort.
 * @returns A new array sorted by most recent played time descending.
 */
export function sortHistory(entries: GameHistoryEntry[]): GameHistoryEntry[] {
  return [...entries]
    .sort((left, right) => right.playedAt - left.playedAt);
}

/**
 * Checks whether a value is one of the supported math operations used by the game.
 *
 * @param value - The runtime value to validate.
 * @returns True when the value is a valid math operator.
 */
export function isMathOperation(value: unknown): value is MathOperation {
  return value === '+' || value === '-' || value === '*' || value === '/';
}

/**
 * Creates a zeroed per-operation stats record with default counters for attempts,
 * incorrect answers, and average response latency.
 *
 * @returns A stats object keyed by each supported operation.
 */
export function createEmptyOperationHistoryStats(): Record<MathOperation, OperationHistoryStat> {
  return {
    '+': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
    '-': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
    '*': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
    '/': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
  };
}

/**
 * Sorts scores by combined value and date, then keeps only the top ten entries.
 *
 * @param scores - The leaderboard entries to rank.
 * @returns A top-ten score list sorted descending by score and recency.
 */
export function sortAndTrimScores(scores: ScoreEntry[]): ScoreEntry[] {
  return [...scores]
    .sort((left, right) => right.combined - left.combined || right.date - left.date)
    .slice(0, 10);
}

/**
 * Flattens a grade-indexed leaderboard into a single ordered list.
 *
 * @param leaderboard - Score entries grouped by grade.
 * @returns A flat list ordered by the configured grade sequence.
 */
export function flattenLeaderboard(leaderboard: Record<Grade, ScoreEntry[]>): ScoreEntry[] {
  return gradeOrder.flatMap((grade) => leaderboard[grade]);
}

/**
 * Validates whether a password satisfies the app's password rules.
 *
 * @param password - The candidate password string.
 * @returns True when the password matches the configured policy.
 */
export function validatePassword(password: string): boolean {
  return passwordPolicy.test(password);
}

/**
 * Narrows an unknown value to a valid game grade.
 *
 * @param value - The value to test.
 * @returns True when the value matches one of the supported grade names.
 */
export function isGrade(value: unknown): value is Grade {
  return value === 'trainee' || value === 'cadet' || value === 'commander' || value === 'major-general';
}

/**
 * Converts an unknown value into a valid grade, defaulting to trainee when invalid.
 *
 * @param value - The raw value to normalize.
 * @returns A valid Grade value, falling back to trainee.
 */
export function normalizeGrade(value: unknown): Grade {
  if (isGrade(value)) {
    return value;
  }

  return 'trainee';
}

/**
 * Resolves the currently active profile from the username and profile map.
 *
 * @param activeUsername - The username of the active player or null when no profile is selected.
 * @param profiles - The profile map keyed by username.
 * @returns The matching profile object or null when the user is not found or logged out.
 */
export function resolveActiveProfile(
  activeUsername: string | null,
  profiles: Record<string, PlayerProfile>,
): PlayerProfile | null {
  if (!activeUsername) {
    return null;
  }

  return profiles[activeUsername] ?? null;
}

/**
 * Calculates the total lifetime score for a profile, using the guest bucket when no
 * active username is present.
 *
 * @param activeUsername - The player username or null for the guest profile.
 * @param gameHistoryByProfile - Stored history grouped by profile key.
 * @returns The summed final score for the selected profile.
 */
function getLifetimeScoreForProfile(
  activeUsername: string | null,
  gameHistoryByProfile: HistoryByProfile,
): number {
  const profileKey = activeUsername ?? GUEST_HISTORY_BUCKET;

  if (!gameHistoryByProfile[profileKey]) {
    return 0;
  }

  return gameHistoryByProfile[profileKey]
    .reduce((sum, entry) => sum + entry.finalScore, 0);
}

/**
 * Derives the player's lifetime grade from their accumulated score history.
 *
 * @param activeUsername - The active profile username or null for guest history.
 * @param gameHistoryByProfile - Stored history grouped by profile.
 * @returns The grade implied by the current lifetime score.
 */
export function resolveLifetimeGrade(
  activeUsername: string | null,
  gameHistoryByProfile: HistoryByProfile,
): Grade {
  return resolveGradeFromScore(getLifetimeScoreForProfile(activeUsername, gameHistoryByProfile));
}
