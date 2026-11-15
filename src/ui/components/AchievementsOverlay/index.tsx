import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { selectActiveProfileHistory } from '@store/selectors/performance';
import { computeWeeklyStreak } from '@store/selectors/achievements';
import { useGameStore } from '@store/useGameStore';
import { ProfileIcon } from '@ui/components/ProfileIcon';
import { toGradeTitle } from '@ui/utilities/format';

import { StreakCard } from './StreakCard';

interface AchievementsOverlayProps {
  /** Reference time for week calculations. Defaults to the time the screen opened; stories pin it. */
  now?: number;
}

/**
 * Achievements screen for the active profile (or guest). Shows the weekly streak toward
 * the Relentless medal, worked out live from saved history.
 */
export function AchievementsOverlay({ now: nowOverride }: AchievementsOverlayProps) {
  const { t } = useTranslation();
  const activeUsername = useGameStore((state) => state.activeUsername);
  const activeProfile = useGameStore((state) => (state.activeUsername ? state.profiles[state.activeUsername] ?? null : null));
  const grade = useGameStore((state) => state.grade);
  const history = useGameStore(selectActiveProfileHistory);
  const [openedAt] = useState(() => Date.now());
  const now = nowOverride ?? openedAt;
  const streak = useMemo(() => computeWeeklyStreak(history, now), [history, now]);
  const gradeLabel = t(`grades.${grade}`, { defaultValue: toGradeTitle(grade) });

  return (
    <div className="overlay-screen overlay-screen--interactive" data-testid="achievements-overlay">
      <div className="overlay-panel home-report-panel achievements-panel">
        <div className="home-report-header">
          <ProfileIcon avatarId={activeProfile?.avatarId} label={t('ui.gradeIconLabel', { grade: gradeLabel })} size={96} />

          <div className="home-report-copy">
            <p className="home-report-eyebrow">{t('achievements.title')}</p>
            <h1>{activeUsername ?? t('ui.guestUsername')}</h1>
          </div>
        </div>

        {activeProfile ? null : (
          <p className="achievements-guest-hint" data-testid="achievements-guest-hint" role="note">
            {t('achievements.guestHint')}
          </p>
        )}

        <StreakCard now={now} streak={streak} />
      </div>
    </div>
  );
}
