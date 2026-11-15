import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { GameHistoryEntry } from '@shared/types';
import { computeWeeklyGoalProgress, computeWeeklyStreak } from '@store/selectors/achievements';
import { GoalProgress } from '@ui/components/GoalProgress';

interface CalendarWeekSectionProps {
  history: GameHistoryEntry[];
  /** Weekly goal, or undefined when the goal is off. */
  weeklyScoreGoal: number | undefined;
  /** Guests can't set a goal, so they get a different hint. */
  isGuest: boolean;
  now: number;
}

/**
 * Weekly Report section for the calendar week (Monday to Sunday): weekly streak status
 * and goal progress. Kept separate from the report's rolling 7-day stats and labelled so.
 */
export function CalendarWeekSection({ history, weeklyScoreGoal, isGuest, now }: CalendarWeekSectionProps) {
  const { t } = useTranslation();
  const streak = useMemo(() => computeWeeklyStreak(history, now), [history, now]);
  const goalProgress = useMemo(
    () => (weeklyScoreGoal ? computeWeeklyGoalProgress(history, weeklyScoreGoal, now) : null),
    [history, weeklyScoreGoal, now],
  );

  return (
    <section
      aria-labelledby="weekly-report-calendar-week-title"
      className="home-report-progress-section"
      data-testid="weekly-report-calendar-week"
    >
      <div className="home-report-progress-header">
        <div>
          <h2 id="weekly-report-calendar-week-title">{t('achievements.goal.thisWeek')}</h2>
          <p className="home-report-progress-note" data-testid="weekly-report-streak">
            {t('achievements.streak.weeksInARow', { count: streak.streakWeeks })}
            {' · '}
            {streak.daysNeeded > 0
              ? t('achievements.streak.daysNeeded', { count: streak.daysNeeded })
              : t('achievements.streak.weekComplete')}
          </p>
        </div>
      </div>

      {goalProgress ? (
        <GoalProgress progress={goalProgress} />
      ) : (
        <p className="home-report-progress-note" data-testid="weekly-report-goal-off">
          {isGuest ? t('achievements.goal.guestHint') : t('achievements.goal.notSetHint')}
        </p>
      )}
    </section>
  );
}
