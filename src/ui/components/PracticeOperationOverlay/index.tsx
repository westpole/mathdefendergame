import clsx from 'clsx';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { MATH_OPERATIONS } from '@shared/constants';
import type { MathOperation } from '@shared/types';
import { useGameStore } from '@store/useGameStore';
import { OPERATION_I18N_KEYS } from '@ui/constants';

/**
 * Practice-mode pre-game step: shown when the player chooses Practice Mode, it pauses the
 * game start until an operation is picked, then launches the practice run with that operation.
 *
 * - The active profile's `lastPracticeOperation` is marked "Last practiced" (nothing is marked
 *   for a profile that has never started a practice run).
 * - After the first pick every option is disabled, so repeat clicks cannot start a second run
 *   while `UIScene` is still loading.
 * - "Back to Home" returns to the home screen through `UIScene.openScreenView`.
 */
export function PracticeOperationOverlay() {
  const { t } = useTranslation();
  const [isStarting, setIsStarting] = useState(false);
  const lastPracticeOperation = useGameStore((state) =>
    state.activeUsername ? state.profiles[state.activeUsername]?.lastPracticeOperation : undefined,
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
