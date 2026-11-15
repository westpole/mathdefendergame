import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

import type { EarnedAchievement } from '@shared/types';
import { MASTERY_MAX_AVG_MS, MASTERY_MIN_ACCURACY, MASTERY_WINDOW_ATTEMPTS } from '@store/constants';
import { MASTERY_IDS, type OperationMastery } from '@store/selectors/achievements';
import { formatShortDate } from '@ui/components/WeeklyReportOverlay/utilities';

import { BadgeTile } from './BadgeGrid';
import { OPERATION_SYMBOLS } from './constants';

interface MasteryTileProps {
  mastery: OperationMastery;
  /** The saved mastery award for this operation, if earned. */
  earned: EarnedAchievement | undefined;
}

/**
 * Mastery tile for one operation: the earned date, the attempts still needed, or
 * accuracy and speed against the thresholds with the unmet part highlighted.
 */
export function MasteryTile({ mastery, earned }: MasteryTileProps) {
  const { t, i18n } = useTranslation();
  const { operation } = mastery;
  const percent = new Intl.NumberFormat(i18n.resolvedLanguage, { style: 'percent', maximumFractionDigits: 0 });
  const seconds = (tenths: number) => t('achievements.badges.mastery.seconds', {
    value: new Intl.NumberFormat(i18n.resolvedLanguage, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(tenths / 10),
  });
  let status;

  if (earned) {
    status = t('achievements.badges.mastery.earnedOn', { date: formatShortDate(earned.earnedAt) });
  } else if (mastery.attempts < MASTERY_WINDOW_ATTEMPTS) {
    status = t('achievements.badges.mastery.attempts', { attempts: mastery.attempts, window: MASTERY_WINDOW_ATTEMPTS });
  } else {
    // Floor so 89.9% never reads as 90%; the epsilon absorbs float error such as 0.29 * 100.
    const accuracy = percent.format(Math.floor((mastery.accuracy * 100) + 1e-9) / 100);
    // Round an unmet time up so 4,040 ms never reads as "4.0s" next to "needs 4.0s".
    const time = seconds(mastery.speedMet ? Math.round(mastery.avgTimeMs / 100) : Math.ceil(mastery.avgTimeMs / 100));
    const minAccuracy = percent.format(MASTERY_MIN_ACCURACY);
    const maxTime = seconds(MASTERY_MAX_AVG_MS[operation] / 100);

    status = (
      <span data-testid={`achievements-mastery-progress-${MASTERY_IDS[operation]}`}>
        <span aria-hidden="true">
          <span className={clsx('achievements-mastery__value', !mastery.accuracyMet && 'achievements-mastery__value--unmet')}>{accuracy}</span>
          {' / '}
          <span className={clsx('achievements-mastery__value', !mastery.speedMet && 'achievements-mastery__value--unmet')}>{time}</span>
          {' → '}
          {t('achievements.badges.mastery.needs', { accuracy: minAccuracy, time: maxTime })}
        </span>
        <span className="visually-hidden">
          {t('achievements.badges.mastery.statusLabel', { accuracy, time, minAccuracy, maxTime })}
        </span>
      </span>
    );
  }

  return (
    <BadgeTile
      id={MASTERY_IDS[operation]}
      isEarned={earned !== undefined}
      name={t('achievements.badges.mastery.name', { symbol: OPERATION_SYMBOLS[operation] })}
      testId={`achievements-badge-${MASTERY_IDS[operation]}`}
    >
      {status}
    </BadgeTile>
  );
}
