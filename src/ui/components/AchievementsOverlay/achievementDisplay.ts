import type { TFunction } from 'i18next';

import type { AchievementId, EarnedAchievement } from '@shared/types';
import { STREAK_TIER_IDS } from '@store/selectors/achievements';
import { OPERATION_I18N_KEYS } from '@ui/constants';

import { RELENTLESS_TIER_NAMES } from './constants';

const ACHIEVEMENT_ICONS: Partial<Record<AchievementId, string>> = {
  'weekly-streak-bronze': '🥉',
  'weekly-streak-silver': '🥈',
  'weekly-streak-gold': '🥇',
  'weekly-goal-met': '🎯',
  'personal-best-week': '📈',
  'focus-of-the-week': '🔍',
};

/** i18n keys for badges whose title and rule don't depend on the award's details. */
const BADGE_TEXT_KEYS: Partial<Record<AchievementId, { earned: string; rule: string }>> = {
  'weekly-goal-met': { earned: 'achievements.badges.goalMet.earned', rule: 'achievements.badges.goalMet.rule' },
  'personal-best-week': { earned: 'achievements.badges.personalBest.earned', rule: 'achievements.badges.personalBest.rule' },
  'focus-of-the-week': { earned: 'achievements.badges.focus.earned', rule: 'achievements.badges.focus.rule' },
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

  const keys = BADGE_TEXT_KEYS[achievement.id];
  return keys ? t(keys.earned) : achievement.id;
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

  const keys = BADGE_TEXT_KEYS[achievement.id];
  const operation = achievement.operation ? t(OPERATION_I18N_KEYS[achievement.operation]) : '';
  return keys ? t(keys.rule, { operation }) : null;
}
