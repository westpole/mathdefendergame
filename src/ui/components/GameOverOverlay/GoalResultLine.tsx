import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { describeRunGoalResult } from '@store/selectors/achievements';
import { selectActiveProfileHistory } from '@store/selectors/performance';
import { useGameStore } from '@store/useGameStore';
import { toDisplayGoalPercent } from '@ui/utilities/format';

/**
 * Game Over line saying whether the run just saved counted toward the weekly goal.
 * Renders nothing when the goal is off or for guests.
 */
export function GoalResultLine() {
  const { t, i18n } = useTranslation();
  const weeklyScoreGoal = useGameStore((state) => (
    state.activeUsername ? state.profiles[state.activeUsername]?.weeklyScoreGoal : undefined
  ));
  const history = useGameStore(selectActiveProfileHistory);

  const result = useMemo(() => {
    if (!weeklyScoreGoal || history.length === 0) {
      return null;
    }

    const latestRun = history.reduce((latest, entry) => (entry.playedAt > latest.playedAt ? entry : latest));
    return describeRunGoalResult(history, latestRun, weeklyScoreGoal);
  }, [history, weeklyScoreGoal]);

  if (!result) {
    return null;
  }

  let message: string;

  switch (result.kind) {
    case 'counted':
      message = t('achievements.goal.gameOver.counted', {
        credited: result.credited.toLocaleString(),
        percent: toDisplayGoalPercent(result.percent),
      });
      break;
    case 'capped':
      message = t('achievements.goal.gameOver.capped');
      break;
    case 'low-accuracy':
      message = t('achievements.goal.gameOver.lowAccuracy', {
        accuracy: new Intl.NumberFormat(i18n.resolvedLanguage).format(result.accuracyPercent),
      });
      break;
    default:
      message = t('achievements.goal.gameOver.tooShort');
  }

  return (
    <p className={`gameover-goal gameover-goal--${result.kind}`} data-testid="gameover-goal-line" role="status">
      {message}
    </p>
  );
}
