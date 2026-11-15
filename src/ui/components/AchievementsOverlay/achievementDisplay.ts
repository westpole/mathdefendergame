import type { TFunction } from 'i18next';

import type { AchievementId, EarnedAchievement } from '@shared/types';
import { STREAK_TIER_IDS } from '@store/selectors/achievements';

import { RELENTLESS_TIER_NAMES } from './constants';

const ACHIEVEMENT_ICONS: Partial<Record<AchievementId, string>> = {
  'weekly-streak-bronze': '🥉',
  'weekly-streak-silver': '🥈',
  'weekly-streak-gold': '🥇',
};

/**
 * Returns the emoji shown for an award.
 *
 * @param id - Award id.
 * @returns The award's icon.
 */
export function getAchievementIcon(id: AchievementId): string {
  return ACHIEVEMENT_ICONS[id] ?? '🏅';
}

/**
 * Returns the celebratory title for a newly earned award, such as "Relentless Bronze!".
 *
 * @param t - Translation function.
 * @param achievement - The earned award.
 * @returns The translated title.
 */
export function getAchievementEarnedTitle(t: TFunction, achievement: EarnedAchievement): string {
  const tierIndex = STREAK_TIER_IDS.findIndex((id) => id === achievement.id);

  if (tierIndex !== -1) {
    return t('achievements.relentless.earned', {
      tier: t(`achievements.relentless.tierWord.${RELENTLESS_TIER_NAMES[tierIndex]}`),
    });
  }

  return achievement.id;
}

/**
 * Returns the rule line shown under a newly earned award.
 *
 * @param t - Translation function.
 * @param achievement - The earned award.
 * @returns The translated rule, or null when the award has none.
 */
export function getAchievementRule(t: TFunction, achievement: EarnedAchievement): string | null {
  if (STREAK_TIER_IDS.some((id) => id === achievement.id)) {
    return t('achievements.relentless.subtitle');
  }

  return null;
}
