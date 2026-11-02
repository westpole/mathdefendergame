import { useTranslation } from 'react-i18next';

import { useGameStore } from '@store/useGameStore';

const PRACTICE_OPERATIONS = ['+', '-', '*', '/'] as const;

/**
 * Renders the home dashboard with quick-mode launch tiles for regular play and practice mode,
 * plus a dismissible "Show game rules" hint that is remembered per profile.
 */
export function HomeOverlay() {
  const { t } = useTranslation();
  const practiceOperation = useGameStore((state) => state.practiceOperation);
  const selectPracticeOperation = useGameStore((state) => state.selectPracticeOperation);
  const openScreenView = useGameStore((state) => state.openScreenView);
  const dismissRulesHint = useGameStore((state) => state.dismissRulesHint);
  const isRulesHintDismissed = useGameStore((state) =>
    state.activeUsername ? state.profiles[state.activeUsername]?.rulesHintDismissed === true : false,
  );

  const handleStartRegularPlay = () => {
    void import('@game/scenes/UIScene').then(({ startGame }) => startGame({ mode: 'regular' }));
  };

  const handleStartPracticeMode = () => {
    void import('@game/scenes/UIScene').then(({ startGame }) => {
      startGame({ mode: 'practice', practiceOperation });
    });
  };

  return (
    <div className="overlay-screen overlay-screen--interactive city-background-layer" data-testid="main-menu">
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

        {!isRulesHintDismissed && (
          <div className="home-rules-hint" data-testid="home-rules-hint">
            <button
              type="button"
              className="home-rules-hint__link"
              data-testid="home-rules-hint-link"
              onClick={() => openScreenView('rules')}
            >
              {t('rules.hint.link')}
            </button>
            <label className="home-rules-hint__dismiss">
              <input type="checkbox" data-testid="home-rules-hint-dismiss" onChange={dismissRulesHint} />
              {t('rules.hint.dismiss')}
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
