import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { MATH_OPERATIONS } from '@shared/constants';
import type { MathOperation } from '@shared/types';
import { isFeatureEnabled } from '@shared/featureFlags';
import { selectFocusOperation } from '@store/selectors/achievements';
import { selectActiveProfileHistory } from '@store/selectors/performance';
import { useGameStore } from '@store/useGameStore';
import { OPERATION_I18N_KEYS } from '@ui/constants';

interface PracticeOperationOverlayProps {
  /** Reference time for the focus operation. Defaults to when the screen opened; stories pin it. */
  now?: number;
}

/**
 * Practice-mode pre-game step: shown when the player chooses Practice Mode, it pauses the
 * game start until an operation is picked, then launches the practice run with that operation.
 *
 * - The active profile's `lastPracticeOperation` is marked "Last practiced" (nothing is marked
 *   for a profile that has never started a practice run).
 * - The week's focus operation (Focus of the Week) gets a "Focus" tag when the
 *   `achievements` flag is on.
 * - After the first pick every option is disabled, so repeat clicks cannot start a second run
 *   while `UIScene` is still loading.
 * - "Back to Home" returns to the home screen through `UIScene.openScreenView`.
 */
export function PracticeOperationOverlay({ now: nowOverride }: PracticeOperationOverlayProps = {}) {
  const { t } = useTranslation();
  const [isStarting, setIsStarting] = useState(false);
  const lastPracticeOperation = useGameStore((state) =>
    state.activeUsername ? state.profiles[state.activeUsername]?.lastPracticeOperation : undefined,
  );

  const history = useGameStore(selectActiveProfileHistory);
  const [openedAt] = useState(() => Date.now());
  const now = nowOverride ?? openedAt;
  const isAchievementsEnabled = isFeatureEnabled('achievements');
  const focusOperation = useMemo(
    () => (isAchievementsEnabled ? selectFocusOperation(history, now) : null),
    [history, isAchievementsEnabled, now],
  );

  const handleSelectOperation = (operation: MathOperation) => {
    if (isStarting) {
      return;
    }

    setIsStarting(true);
    void import('@game/scenes/UIScene').then(({ startGame }) => {
      startGame({ mode: 'practice', practiceOperation: operation });
    });
  };

  const handleBackToHome = () => {
    void import('@game/scenes/UIScene').then(({ openScreenView }) => openScreenView('home'));
  };

  return (
    <div className="overlay-screen overlay-screen--interactive city-background-layer" data-testid="practice-select-overlay">
      <div className="overlay-panel practice-select-panel">
        <div className="menu-page-header">
          <h1>{t('ui.practiceSelectTitle')}</h1>
        </div>
        <p className="practice-select-hint">{t('ui.practiceSelectHint')}</p>

        <div className="practice-select-grid" role="group" aria-label={t('ui.practiceOperationSelector')}>
          {MATH_OPERATIONS.map((operation) => {
            const isLast = operation === lastPracticeOperation;
            const isFocus = operation === focusOperation;

            return (
              <button
                key={operation}
                type="button"
                className={clsx('interactive-tile', 'practice-select-option', isLast && 'practice-select-option--last')}
                data-testid={`practice-operation-${operation}`}
                disabled={isStarting}
                onClick={() => handleSelectOperation(operation)}
              >
                <span className="practice-select-option__symbol" aria-hidden="true">
                  {operation}
                </span>
                <span className="practice-select-option__label">{t(OPERATION_I18N_KEYS[operation])}</span>
                {isLast && (
                  <span className="practice-select-option__badge" data-testid="practice-operation-last">
                    {t('ui.lastPracticed')}
                  </span>
                )}
                {isFocus && (
                  <span className="practice-select-option__badge practice-select-option__badge--focus" data-testid="practice-operation-focus">
                    <span aria-hidden="true">🔍 </span>
                    {t('achievements.badges.focus.tag')}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="practice-select-actions">
          <button
            type="button"
            className="secondary-button"
            data-testid="practice-select-back"
            disabled={isStarting}
            onClick={handleBackToHome}
          >
            {t('ui.backToHome')}
          </button>
        </div>
      </div>
    </div>
  );
}
