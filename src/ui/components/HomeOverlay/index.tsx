import { useTranslation } from 'react-i18next';

import { useGameStore } from '@store/useGameStore';

const PRACTICE_OPERATIONS = ['+', '-', '*', '/'] as const;

/**
 * Renders the home dashboard with quick-mode launch tiles for regular play and practice mode.
 */
export function HomeOverlay() {
  const { t } = useTranslation();
  const practiceOperation = useGameStore((state) => state.practiceOperation);
  const selectPracticeOperation = useGameStore((state) => state.selectPracticeOperation);

  const handleStartRegularPlay = () => {
    void import('@game/scenes/UIScene').then(({ startGame }) => startGame({ mode: 'regular' }));
  };

  const handleStartPracticeMode = () => {
    void import('@game/scenes/UIScene').then(({ startGame }) => {
      startGame({ mode: 'practice', practiceOperation });
    });
  };

  return (
    <div className="overlay-screen overlay-screen--interactive" data-testid="main-menu">
      <div className="overlay-panel home-report-panel" data-testid="home-mode-select">
        <div className="home-quick-actions" data-testid="home-practice-controls">
          <article className="home-mode-tile" data-testid="home-regular-play-tile">
            <h2>{t('ui.regularPlay')}</h2>
            <p>{t('ui.campaignDescription')}</p>
            <button
              type="button"
              data-testid="home-regular-play-button"
              className="secondary-button"
              onClick={handleStartRegularPlay}
            >
              {t('ui.startRegularPlay')}
            </button>
          </article>

          <article className="home-mode-tile" data-testid="home-practice-tile">
            <h2>{t('ui.practiceMode')}</h2>
            <p>{t('ui.practiceDescription')}</p>

            <div className="practice-operation-picker" aria-label={t('ui.practiceOperationSelector')}>
              {PRACTICE_OPERATIONS.map((operation) => (
                <button
                  key={operation}
                  type="button"
                  className={operation === practiceOperation ? 'practice-operation-button practice-operation-button--active' : 'practice-operation-button'}
                  data-testid={`practice-operation-${operation}`}
                  onClick={() => selectPracticeOperation(operation)}
                  aria-pressed={operation === practiceOperation}
                >
                  {operation}
                </button>
              ))}
            </div>

            <button
              type="button"
              data-testid="home-practice-start-button"
              className="secondary-button"
              onClick={handleStartPracticeMode}
            >
              {t('ui.startPracticeMode')}
            </button>
          </article>
        </div>
      </div>
    </div>
  );
}
