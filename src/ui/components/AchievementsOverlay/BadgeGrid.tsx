import clsx from 'clsx';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import type { AchievementId, EarnedAchievement } from '@shared/types';
import type { PersonalBestStatus } from '@store/selectors/achievements';
import { formatShortDate } from '@ui/components/WeeklyReportOverlay/utilities';

import { getAchievementIcon } from './achievementDisplay';

interface BadgeTileProps {
  id: AchievementId;
  name: string;
  isEarned: boolean;
  testId: string;
  children: ReactNode;
}

/**
 * One square badge tile: icon, name and a status line. Locked tiles are greyed out.
 */
export function BadgeTile({ id, name, isEarned, testId, children }: BadgeTileProps) {
  return (
    <li className={clsx('achievements-badge', !isEarned && 'achievements-badge--locked')} data-testid={testId}>
      <span aria-hidden="true" className="achievements-badge__icon">{getAchievementIcon(id)}</span>
      <strong className="achievements-badge__name">{name}</strong>
      <span className="achievements-badge__status">{children}</span>
    </li>
  );
}

interface BadgeGridProps {
  /** Saved awards for a profile, or every award the history earns for a guest. */
  earned: EarnedAchievement[];
  personalBest: PersonalBestStatus;
  /** Extra tiles added by later badges (focus, mastery). */
  children?: ReactNode;
}

/**
 * Badge grid on the Achievements page: Goal Met (with a count) and Personal Best Week,
 * plus any tiles passed as children.
 */
export function BadgeGrid({ earned, personalBest, children }: BadgeGridProps) {
  const { t } = useTranslation();
  const goalMetCount = earned.filter((award) => award.id === 'weekly-goal-met').length;
  const lastPersonalBest = earned
    .filter((award) => award.id === 'personal-best-week')
    .reduce<EarnedAchievement | null>((latest, award) => (!latest || award.earnedAt > latest.earnedAt ? award : latest), null);

  let personalBestStatus: string;

  if (lastPersonalBest) {
    personalBestStatus = t('achievements.badges.personalBest.earnedOn', { date: formatShortDate(lastPersonalBest.earnedAt) });
  } else if (personalBest.baseline === null) {
    personalBestStatus = t('achievements.badges.personalBest.locked');
  } else {
    personalBestStatus = t('achievements.badges.personalBest.target', {
      // The badge needs more than the baseline, so round the target up.
      baseline: Math.ceil(personalBest.baseline).toLocaleString(),
      credited: personalBest.creditedScore.toLocaleString(),
    });
  }

  return (
    <section
      aria-labelledby="achievements-badges-title"
      className="achievements-card achievements-badges"
      data-testid="achievements-badges"
    >
      <h2 id="achievements-badges-title">{t('achievements.badges.title')}</h2>
      <ul className="achievements-badge-grid">
        <BadgeTile
          id="weekly-goal-met"
          isEarned={goalMetCount > 0}
          name={t('achievements.badges.goalMet.name')}
          testId="achievements-badge-goal-met"
        >
          {goalMetCount > 0
            ? t('achievements.badges.goalMet.count', { count: goalMetCount })
            : t('achievements.badges.goalMet.locked')}
        </BadgeTile>
        <BadgeTile
          id="personal-best-week"
          isEarned={lastPersonalBest !== null}
          name={t('achievements.badges.personalBest.name')}
          testId="achievements-badge-personal-best"
        >
          {personalBestStatus}
        </BadgeTile>
        {children}
      </ul>
    </section>
  );
}
