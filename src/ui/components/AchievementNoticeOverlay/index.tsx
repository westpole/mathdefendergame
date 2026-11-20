import { useEffect, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';

import { useGameStore } from '@store/useGameStore';
import {
  getAchievementEarnedTitle,
  getAchievementIcon,
  getAchievementRule,
} from '@ui/components/AchievementsOverlay/achievementDisplay';
import { getAchievementKey } from '@store/selectors/achievements';

const CONFETTI_PIECES = 42;
const CONFETTI_SHAPES = ['rect', 'strip', 'square', 'circle'] as const;
const CONFETTI_COLORS = 6;

/** Stable pseudo-random value in [0, 1) so the burst looks organic but renders the same every time. */
function seededRandom(index: number, salt: number): number {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

/** One confetti piece: a stable React key, its flake color/shape modifiers, and its motion variables. */
interface ConfettiPiece {
  id: string;
  flakeClassName: string;
  style: CSSProperties;
}

/** Per-piece motion and look, fed to the stylesheet as CSS custom properties. */
const CONFETTI: ConfettiPiece[] = Array.from({ length: CONFETTI_PIECES }, (_, index) => {
  const random = (salt: number) => seededRandom(index, salt);
  const spinDirection = random(7) < 0.5 ? -1 : 1;
  const shape = CONFETTI_SHAPES[Math.floor(random(1) * CONFETTI_SHAPES.length)];
  const delay = random(4) * 1.4;
  const fall = 2.8 + random(5) * 1.8;
  const swayDuration = 0.7 + random(9) * 0.8;
  const flutterDuration = 0.35 + random(11) * 0.5;

  return {
    id: `confetti-${index}`,
    flakeClassName: `achievement-confetti__flake--color-${index % CONFETTI_COLORS} achievement-confetti__flake--${shape}`,
    // CSSProperties has no index signature for custom properties, so the `--confetti-*` keys need the cast.
    style: {
      left: `${(random(2) * 104 - 2).toFixed(1)}%`,
      '--confetti-scale': (0.7 + random(3) * 0.6).toFixed(2),
      '--confetti-delay': `${delay.toFixed(2)}s`,
      '--confetti-fall': `${fall.toFixed(2)}s`,
      '--confetti-drift': `${Math.round((random(6) - 0.5) * 160)}px`,
      '--confetti-sway': `${Math.round(14 + random(8) * 26)}px`,
      '--confetti-sway-duration': `${swayDuration.toFixed(2)}s`,
      // Finite loop counts stop the sway and flutter once the piece has fallen off-screen.
      '--confetti-sway-count': Math.ceil(fall / swayDuration),
      '--confetti-spin': `${spinDirection * Math.round(360 + random(10) * 720)}deg`,
      '--confetti-flutter-duration': `${flutterDuration.toFixed(2)}s`,
      '--confetti-flutter-count': Math.ceil((delay + fall) / flutterDuration),
    } as CSSProperties,
  };
});

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
        {CONFETTI.map((piece) => (
          <span key={piece.id} className="achievement-confetti__piece" style={piece.style}>
            <span className={`achievement-confetti__flake ${piece.flakeClassName}`} />
          </span>
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
