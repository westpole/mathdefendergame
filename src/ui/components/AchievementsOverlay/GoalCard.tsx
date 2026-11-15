import { useTranslation } from 'react-i18next';

import type { WeeklyGoalProgress } from '@store/selectors/types';
import { useGameStore } from '@store/useGameStore';
import { GoalProgress } from '@ui/components/GoalProgress';

interface GoalCardProps {
  /** Progress for the current week, or null when the goal is off. */
  progress: WeeklyGoalProgress | null;
  /** Guests can't set a goal, so they get a hint instead of the Settings link. */
  isGuest: boolean;
}

/**
 * Weekly goal card: the progress bar when a goal is set, otherwise a prompt that opens
 * Settings (or a hint for guests).
 */
export function GoalCard({ progress, isGuest }: GoalCardProps) {
  const { t } = useTranslation();
  const openScreenView = useGameStore((state) => state.openScreenView);

  return (
    <section
      aria-labelledby="achievements-goal-title"
      className="achievements-card achievements-goal-card"
      data-testid="achievements-goal-card"
    >
      <h2 id="achievements-goal-title">{t('achievements.goal.title')}</h2>
      <p className="achievements-rule">{t('achievements.goal.thisWeek')}</p>

      {progress ? (
        <>
          <GoalProgress progress={progress} />
          <p className="achievements-note">{t('achievements.goal.helper')}</p>
        </>
      ) : (
        <div className="achievements-goal-empty" data-testid="achievements-goal-empty">
          <strong>{t('achievements.goal.notSet')}</strong>
          {isGuest ? (
            <p className="achievements-note">{t('achievements.goal.guestHint')}</p>
          ) : (
            <>
              <p className="achievements-note">{t('achievements.goal.notSetHint')}</p>
              <button
                className="secondary-button achievements-goal-empty__action"
                data-testid="achievements-goal-open-settings"
                onClick={() => openScreenView('settings')}
                type="button"
              >
                {t('achievements.goal.openSettings')}
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
