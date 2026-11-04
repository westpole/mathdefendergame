import { sortHistory } from '../utilities/general';
import type {
  GameStoreState,
  PlayerProfile,
  PrematureGameEndPayload,
} from '../types';

/**
 * Builds updated game history buckets by appending and re-sorting a new history entry.
 *
 * @param gameHistoryByProfile - Existing history map.
 * @param profileKey - Target profile or guest history key.
 * @param entry - New history entry to append.
 * @returns Updated history map.
 * @example
 * const nextHistory = buildHistoryByProfileWithEntry(state.gameHistoryByProfile, 'PilotOne', entry);
 */
export function buildHistoryByProfileWithEntry(
  gameHistoryByProfile: GameStoreState['gameHistoryByProfile'],
  profileKey: string,
  entry: PrematureGameEndPayload['historyEntry'],
): GameStoreState['gameHistoryByProfile'] {
  const historyForProfile = gameHistoryByProfile[profileKey] ?? [];

  return {
    ...gameHistoryByProfile,
    [profileKey]: sortHistory([...historyForProfile, entry]),
  };
}

/**
 * Builds profile updates for score and stage progression after a completed run.
 *
 * @param profile - Active profile to update.
 * @param score - Final or persisted score.
 * @param stage - Final or persisted stage.
 * @param grade - Resolved lifetime grade.
 * @returns Updated profile object.
 * @example
 * const updated = buildProgressedProfile(profile, 500, 7, 'commander');
 */
export function buildProgressedProfile(
  profile: PlayerProfile,
  score: number,
  stage: number,
  grade: GameStoreState['grade'],
): PlayerProfile {
  return {
    ...profile,
    bestScore: Math.max(profile.bestScore, score),
    highestStage: Math.max(profile.highestStage, stage),
    preferredGrade: grade,
    updatedAt: Date.now(),
  };
}

