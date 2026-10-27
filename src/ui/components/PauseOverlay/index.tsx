import { cancelElectronClose, endGameEarly, resumePausedGame } from '@game/scenes/UIScene';
import { useGameStore } from '@store/useGameStore';
import { useTranslation } from 'react-i18next';

/**
 * Renders the game pause/exit confirmation overlay.
 *
 * The overlay is driven by the central game store rather than local component
 * state so it stays in sync with Phaser lifecycle events such as tab
 * backgrounding, manual pauses, and Electron close requests.
 *
 * @returns The pause UI when a pause state exists, otherwise null.
 */
export function PauseOverlay() {
  const { t } = useTranslation();
  const pauseOverlay = useGameStore((state) => state.pauseOverlay);

  // The store is the source of truth for transient overlay state and may clear
  // this value whenever the game transitions back to an active state.
  if (!pauseOverlay) {
    return null;
  }

  // The store can intentionally pause the game while an app-close flow is still
  // saving progress. We expose a dedicated, non-interactive UI in that case so
  // the user understands the app is preserving state before shutdown.
  if (pauseOverlay.isSavingBeforeClose) {
    return (
      <div className="overlay-screen overlay-screen--interactive">
        <div className="overlay-panel modal-panel accent-success">
          <h1>{t('pause.savingProgressTitle')}</h1>
          <p>{t('pause.savingProgressDescription')}</p>
        </div>
      </div>
    );
  }

  // The same overlay is reused for multiple pause reasons, but the copy and
  // actions differ subtly depending on whether the user is leaving the app or
  // simply pausing the current session.
  const isWindowClosePrompt = pauseOverlay.reason === 'window-close';
  const isBackgroundPause = pauseOverlay.reason === 'background';
  const title = isWindowClosePrompt ? t('pause.confirmExitTitle') : t('pause.gamePausedTitle');
  const message = isWindowClosePrompt
    ? t('pause.confirmEndGameQuestion')
    : isBackgroundPause
      ? t('pause.backgroundPauseDescription')
      : t('pause.defaultPauseDescription');

  // The primary action depends on the pause source: the confirmation flow must
  // dismiss the close prompt without resuming gameplay, while regular pauses can
  // simply resume the current game state.
  const handleResume = isWindowClosePrompt ? cancelElectronClose : resumePausedGame;

  return (
    <div className="overlay-screen overlay-screen--interactive">
      <div className="overlay-panel modal-panel accent-danger">
        <h1>{title}</h1>
        <p>{message}</p>

        <div className="action-row">
          <button
            className="secondary-button"
            onClick={handleResume}
            type="button"
          >
            {isWindowClosePrompt ? t('pause.keepPlaying') : t('pause.resume')}
          </button>
          <button
            className="primary-button"
            // End-game action is passed the same close-app intent as the prompt so
            // the desktop shell can decide whether to terminate the app after the
            // game is finalized.
            onClick={() => endGameEarly({ closeApp: isWindowClosePrompt })}
            type="button"
          >
            {isWindowClosePrompt ? t('pause.endGameAndClose') : t('pause.endGame')}
          </button>
        </div>
      </div>
    </div>
  );
}
