import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

import type { EarnedAchievement } from '@shared/types';
import { STREAK_TIERS } from '@store/constants';
import { STREAK_TIER_IDS } from '@store/selectors/achievements';
import { formatShortDate } from '@ui/components/WeeklyReportOverlay/utilities';

import { getAchievementIcon } from './achievementDisplay';
import { RELENTLESS_TIER_NAMES } from './constants';

interface MedalShelfProps {
  /** Saved awards for a profile, or every award the history earns for a guest. */
  earned: EarnedAchievement[];
}

/**
 * Relentless medal shelf: Bronze, Silver and Gold, each locked with its requirement or
 * earned with its date.
 */
export function MedalShelf({ earned }: MedalShelfProps) {
  const { t } = useTranslation();

  return (
    <section
      aria-labelledby="achievements-medal-shelf-title"
      className="achievements-card achievements-medal-shelf"
      data-testid="achievements-medal-shelf"
    >
      <h2 id="achievements-medal-shelf-title">{t('achievements.relentless.title')}</h2>
      <p className="achievements-rule">{t('achievements.relentless.subtitle')}</p>

      <ul aria-label={t('achievements.relentless.shelfLabel')} className="achievements-medals">
        {STREAK_TIER_IDS.map((id, index) => {
          const tierName = RELENTLESS_TIER_NAMES[index];
          const award = earned.find((item) => item.id === id);

          return (
            <li
              key={id}
              className={clsx('achievements-medal', `achievements-medal--${tierName}`, !award && 'achievements-medal--locked')}
              data-testid={`achievements-medal-${tierName}`}
            >
              <span aria-hidden="true" className="achievements-medal__icon">
                {award ? getAchievementIcon(id) : '🔒'}
              </span>
              <strong className="achievements-medal__name">{t(`achievements.relentless.tier.${tierName}`)}</strong>
              <span className="achievements-medal__status">
                {award
                  ? t('achievements.relentless.earnedOn', { date: formatShortDate(award.earnedAt) })
                  : (
                    <>
                      <span className="visually-hidden">{t('achievements.relentless.locked')}: </span>
                      {t('achievements.relentless.requirement', { count: STREAK_TIERS[index] })}
                    </>
                  )}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
