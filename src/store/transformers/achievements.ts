import type { EarnedAchievement, GameHistoryEntry } from '@shared/types';
import { evaluateNewAchievements } from '@store/selectors/achievements';
import type { PlayerProfile } from '../types';

/**
 * Checks a profile's history for awards it has not saved yet and appends them.
 *
 * @param profile - Named profile to update.
 * @param history - The profile's full history, including the run just saved.
 * @param now - Reference time.
 * @param isAfterRun - True after a run; false for the silent check on login.
 * @returns The profile (unchanged object when nothing is new) and the new awards.
 * @example
 * const { profile: next, newAchievements } = buildProfileWithNewAchievements(profile, history, Date.now(), true);
 */
export function buildProfileWithNewAchievements(
  profile: PlayerProfile,
  history: GameHistoryEntry[],
  now: number,
  isAfterRun: boolean,
): { profile: PlayerProfile; newAchievements: EarnedAchievement[] } {
  const newAchievements = evaluateNewAchievements(history, profile, now, { isAfterRun });

  if (newAchievements.length === 0) {
    return { profile, newAchievements };
  }

  return {
    profile: {
      ...profile,
      achievements: [...(profile.achievements ?? []), ...newAchievements],
      updatedAt: now,
    },
    newAchievements,
  };
}

/**
 * Adds new awards to the pending after-run notice, keeping any not yet dismissed.
 *
 * @param currentNotice - Notice already pending, if any.
 * @param newAchievements - Awards earned by the run just saved.
 * @returns The notice to show, or the current notice when nothing is new.
 * @example
 * const achievementNotice = mergeAchievementNotice(state.achievementNotice, newAchievements);
 */
export function mergeAchievementNotice(
  currentNotice: EarnedAchievement[] | null,
  newAchievements: EarnedAchievement[],
): EarnedAchievement[] | null {
  if (newAchievements.length === 0) {
    return currentNotice;
  }

  return [...(currentNotice ?? []), ...newAchievements];
}
