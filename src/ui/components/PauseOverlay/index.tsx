import { cancelElectronClose, endGameEarly, resumePausedGame } from '@game/scenes/UIScene';
import { useGameStore } from '@store/useGameStore';

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
          <h1>Saving progress</h1>
          <p>Saving data before closing...</p>
        </div>
      </div>
    );
  }

  // The same overlay is reused for multiple pause reasons, but the copy and
  // actions differ subtly depending on whether the user is leaving the app or
  // simply pausing the current session.
  const isWindowClosePrompt = pauseOverlay.reason === 'window-close';
  const isBackgroundPause = pauseOverlay.reason === 'background';
  const title = isWindowClosePrompt ? 'Confirm Exit' : 'Game Paused';
  const message = isWindowClosePrompt
    ? 'Are you sure you want to end this game?'
    : isBackgroundPause
      ? 'Game paused because this tab moved to the background. Resume when you are ready or end this game.'
      : 'Game paused. You can resume any time or end this game.';

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
            {isWindowClosePrompt ? 'Keep playing' : 'Resume'}
          </button>
          <button
            className="primary-button"
            // End-game action is passed the same close-app intent as the prompt so
            // the desktop shell can decide whether to terminate the app after the
            // game is finalized.
            onClick={() => endGameEarly({ closeApp: isWindowClosePrompt })}
            type="button"
          >
            {isWindowClosePrompt ? 'End game and close' : 'End game'}
          </button>
        </div>
      </div>
    </div>
  );
}
