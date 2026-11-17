import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useGameStore } from '@store/useGameStore';
import {
  getAchievementEarnedTitle,
  getAchievementIcon,
  getAchievementRule,
} from '@ui/components/AchievementsOverlay/achievementDisplay';
import { getAchievementKey } from '@store/selectors/achievements';

const CONFETTI_PIECES = 24;

/**
 * After-run celebration for newly earned awards. Waits until the grade notice is
 * dismissed, so the two never overlap. The button, Escape, or Enter dismisses it.
 */
export function AchievementNoticeOverlay() {
  const { t } = useTranslation();
  const achievementNotice = useGameStore((state) => state.achievementNotice);
  const hasGradeNotice = useGameStore((state) => state.gradeNotice !== null);
  const dismissAchievementNotice = useGameStore((state) => state.dismissAchievementNotice);
  const isVisible = !hasGradeNotice && achievementNotice !== null && achievementNotice.length > 0;

  useEffect(() => {
    if (!isVisible) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore auto-repeat so a key still held from the grade notice doesn't skip this one.
      if (!event.repeat && (event.key === 'Escape' || event.key === 'Enter')) {
        event.preventDefault();
        dismissAchievementNotice();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, dismissAchievementNotice]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="overlay-screen overlay-screen--interactive achievement-notice-screen" data-testid="achievement-notice-overlay">
      <div aria-hidden="true" className="achievement-confetti" data-testid="achievement-confetti">
        {Array.from({ length: CONFETTI_PIECES }, (_, index) => (
          <span key={index} className={`achievement-confetti__piece achievement-confetti__piece--${index % 6}`} style={{ left: `${(index * 37) % 100}%`, animationDelay: `${(index % 8) * 0.12}s` }} />
        ))}
      </div>

      <section
        aria-describedby="achievement-notice-body"
        aria-labelledby="achievement-notice-title"
        aria-modal="true"
        className="overlay-panel achievement-notice-panel"
        role="dialog"
      >
        <div className="overlay-header">
          <h1 id="achievement-notice-title">{t('achievements.notice.title', { count: achievementNotice.length })}</h1>
        </div>

        <ul className="achievement-notice-list">
          {achievementNotice.map((achievement) => {
            const rule = getAchievementRule(t, achievement);

            return (
              <li key={getAchievementKey(achievement)} className="achievement-notice-item" data-testid={`achievement-notice-${achievement.id}`}>
                <span aria-hidden="true" className="achievement-notice-item__icon">{getAchievementIcon(achievement.id)}</span>
                <span className="achievement-notice-item__copy">
                  <strong>{getAchievementEarnedTitle(t, achievement)}</strong>
                  {rule ? <span className="achievement-notice-item__rule">{rule}</span> : null}
                </span>
              </li>
            );
          })}
        </ul>

        <p className="achievement-notice-body" id="achievement-notice-body">{t('achievements.notice.body')}</p>

        <div className="action-row center-content">
          <button
            autoFocus
            className="primary-button"
            data-testid="achievement-notice-dismiss"
            onClick={dismissAchievementNotice}
            type="button"
          >
            {t('achievements.notice.dismiss')}
          </button>
        </div>
      </section>
    </div>
  );
}
