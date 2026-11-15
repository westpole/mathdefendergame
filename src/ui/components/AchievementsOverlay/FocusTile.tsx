import { useTranslation } from 'react-i18next';

import type { EarnedAchievement } from '@shared/types';
import type { FocusProgress } from '@store/selectors/achievements';
import { OPERATION_I18N_KEYS } from '@ui/constants';

import { BadgeTile } from './BadgeGrid';

interface FocusTileProps {
  focus: FocusProgress;
  /** This week's Focus of the Week award, if earned. */
  earnedThisWeek: EarnedAchievement | undefined;
}

/**
 * Focus of the Week tile: the week's focus operation with a three-step practice
 * progress indicator, or a hint when there is no focus yet.
 */
export function FocusTile({ focus, earnedThisWeek }: FocusTileProps) {
  const { t } = useTranslation();
  const operation = earnedThisWeek?.operation ?? focus.operation;
  const operationLabel = operation ? t(OPERATION_I18N_KEYS[operation]) : '';
  let status: string;

  if (earnedThisWeek) {
    status = t('achievements.badges.focus.done', { operation: operationLabel });
  } else if (focus.operation) {
    status = t('achievements.badges.focus.progress', {
      operation: operationLabel,
      done: Math.min(focus.practiceRuns, focus.required),
      required: focus.required,
    });
  } else {
    status = t('achievements.badges.focus.none');
  }

  return (
    <BadgeTile
      id="focus-of-the-week"
      isEarned={earnedThisWeek !== undefined}
      name={t('achievements.badges.focus.name')}
      testId="achievements-badge-focus"
    >
      {status}
      {focus.operation && !earnedThisWeek ? (
        <span aria-hidden="true" className="achievements-steps" data-testid="achievements-focus-steps">
          {Array.from({ length: focus.required }, (_, index) => (
            <span
              key={index}
              className={`achievements-steps__step${index < focus.practiceRuns ? ' achievements-steps__step--done' : ''}`}
            />
          ))}
        </span>
      ) : null}
    </BadgeTile>
  );
}
