import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

import { STREAK_TIERS } from '@store/constants';
import { buildWeekDays, findNextStreakTier, toDayKey } from '@store/selectors/achievements';
import type { WeeklyStreakSummary } from '@store/selectors/types';

import { RELENTLESS_TIER_NAMES, WEEKDAY_KEYS } from './constants';

interface StreakCardProps {
  streak: WeeklyStreakSummary;
  now: number;
}

/**
 * Weekly streak card: streak length, the next Relentless tier, the rule, and one dot per
 * day of the current week (filled when active, outlined for today).
 */
export function StreakCard({ streak, now }: StreakCardProps) {
  const { t } = useTranslation();
  const nextTier = findNextStreakTier(streak.streakWeeks, STREAK_TIERS);
  const todayKey = toDayKey(now);
  const activeDayKeys = new Set(streak.thisWeekActiveDayKeys);
  const weekDays = buildWeekDays(now);

  return (
    <section
      aria-labelledby="achievements-streak-title"
      className="achievements-card achievements-streak-card"
      data-testid="achievements-streak-card"
    >
      <p className="home-report-eyebrow" id="achievements-streak-title">{t('achievements.streak.cardLabel')}</p>
      <strong className="achievements-streak-count" data-testid="achievements-streak-weeks">
        {t('achievements.streak.weeksInARow', { count: streak.streakWeeks })}
      </strong>
      <p className="achievements-streak-next" data-testid="achievements-streak-next">
        {nextTier
          ? t('achievements.streak.next', {
            count: nextTier.weeks,
            tier: t(`achievements.relentless.tierWord.${RELENTLESS_TIER_NAMES[nextTier.index]}`),
          })
          : t('achievements.streak.allTiersReached')}
      </p>
      <p className="achievements-rule">
        <span className="achievements-rule__name">{t('achievements.relentless.title')}</span>
        {' · '}
        <span>{t('achievements.relentless.subtitle')}</span>
      </p>

      <ul aria-label={t('achievements.streak.dayDotsLabel')} className="achievements-day-dots" data-testid="achievements-day-dots">
        {weekDays.map(({ dayKey }, index) => {
          const weekday = WEEKDAY_KEYS[index];
          const isActive = activeDayKeys.has(dayKey);
          const isToday = dayKey === todayKey;
          const dayName = t(`achievements.weekday.long.${weekday}`);
          const label = t(isActive ? 'achievements.streak.dayActive' : 'achievements.streak.dayInactive', {
            day: isToday ? `${dayName} (${t('achievements.streak.today')})` : dayName,
          });

          return (
            <li key={dayKey} className="achievements-day">
              <span
                aria-label={label}
                className={clsx(
                  'achievements-day__dot',
                  isActive && 'achievements-day__dot--active',
                  isToday && 'achievements-day__dot--today',
                )}
                data-testid={`achievements-day-${weekday}`}
                role="img"
              />
              <span aria-hidden="true" className="achievements-day__label">
                {t(`achievements.weekday.short.${weekday}`)}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="achievements-streak-status" data-testid="achievements-streak-status" role="status">
        {streak.daysNeeded > 0
          ? t('achievements.streak.daysNeeded', { count: streak.daysNeeded })
          : t('achievements.streak.weekComplete')}
      </p>
      <p className="achievements-note">{t('achievements.streak.activeDayRule')}</p>
    </section>
  );
}
