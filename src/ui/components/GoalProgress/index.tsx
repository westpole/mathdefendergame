import { useTranslation } from 'react-i18next';

import type { WeeklyGoalProgress } from '@store/selectors/types';
import { toDisplayGoalPercent } from '@ui/utilities/format';

interface GoalProgressProps {
  progress: WeeklyGoalProgress;
}

/**
 * Weekly goal progress bar with the credited total, today's credit against the daily cap,
 * and how many runs this week didn't count. Shared by the Achievements and Weekly Report screens.
 *
 * @example
 * <GoalProgress progress={computeWeeklyGoalProgress(history, 1000, now)} />
 */
export function GoalProgress({ progress }: GoalProgressProps) {
  const { t } = useTranslation();
  const percent = toDisplayGoalPercent(progress.percent);
  const valueText = t('achievements.goal.progress', {
    credited: progress.creditedScore.toLocaleString(),
    goal: progress.goal.toLocaleString(),
  });

  return (
    <div className="goal-progress" data-testid="goal-progress">
      <div className="goal-progress__header">
        <strong className="goal-progress__value" data-testid="goal-progress-value">{valueText}</strong>
        <span className="goal-progress__percent">{`${percent}%`}</span>
      </div>
      <div
        aria-label={t('achievements.goal.progressLabel')}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={percent}
        aria-valuetext={`${valueText} (${percent}%)`}
        className="profile-progress-bar goal-progress__bar"
        role="progressbar"
      >
        <div
          className={`profile-progress-fill goal-progress__fill${progress.met ? ' goal-progress__fill--met' : ''}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="goal-progress__today" data-testid="goal-progress-today">
        {t('achievements.goal.today', {
          credited: progress.todayCredited.toLocaleString(),
          cap: progress.todayCap.toLocaleString(),
        })}
      </p>
      {progress.met ? (
        <p className="goal-progress__met" data-testid="goal-progress-met">
          <span aria-hidden="true">🎯 </span>
          {t('achievements.goal.met')}
        </p>
      ) : null}
      {progress.nonQualifyingRuns > 0 ? (
        <p className="goal-progress__note" data-testid="goal-progress-non-qualifying">
          {t('achievements.goal.nonQualifying', { count: progress.nonQualifyingRuns })}
        </p>
      ) : null}
    </div>
  );
}
