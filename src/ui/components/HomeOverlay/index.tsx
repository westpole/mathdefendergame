import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useGameStore } from '@store/useGameStore';

/**
 * Renders the home dashboard with two clickable mode tiles plus a "Show game rules" hint link.
 *
 * - The Regular Play tile starts a campaign run immediately; both tiles are disabled after
 *   that click so repeat clicks cannot start a second run while `UIScene` is loading.
 * - The Practice Mode tile opens the practice operation selector (`practice-select` view)
 *   through `UIScene.openScreenView`; the run starts only after an operation is picked there.
 */
export function HomeOverlay() {
  const { t } = useTranslation();
  const [isStarting, setIsStarting] = useState(false);
  const openScreenView = useGameStore((state) => state.openScreenView);

  const handleStartRegularPlay = () => {
    if (isStarting) {
      return;
    }

    setIsStarting(true);
    void import('@game/scenes/UIScene').then(({ startGame }) => startGame({ mode: 'regular' }));
  };

  const handleOpenPracticeSelect = () => {
    void import('@game/scenes/UIScene').then(({ openScreenView: openView }) => openView('practice-select'));
  };

  return (
    <div className="overlay-screen overlay-screen--interactive city-background-layer" data-testid="main-menu">
      <div className="overlay-panel home-report-panel" data-testid="home-mode-select">
        <div className="home-quick-actions" data-testid="home-practice-controls">
          <button
            type="button"
            className="interactive-tile home-mode-tile"
            data-testid="home-regular-play-tile"
            disabled={isStarting}
            onClick={handleStartRegularPlay}
          >
            <span className="home-mode-tile__title">{t('ui.regularPlay')}</span>
            <span className="home-mode-tile__description">{t('ui.campaignDescription')}</span>
          </button>

          <button
            type="button"
            className="interactive-tile home-mode-tile"
            data-testid="home-practice-tile"
            disabled={isStarting}
            onClick={handleOpenPracticeSelect}
          >
            <span className="home-mode-tile__title">{t('ui.practiceMode')}</span>
            <span className="home-mode-tile__description">{t('ui.practiceDescription')}</span>
          </button>
        </div>

        <div className="home-rules-hint" data-testid="home-rules-hint">
          <button
            type="button"
            className="home-rules-hint__link"
            data-testid="home-rules-hint-link"
            onClick={() => openScreenView('rules')}
          >
            {t('rules.hint.link')}
          </button>
        </div>
      </div>
    </div>
  );
}
