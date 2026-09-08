import { cancelElectronClose, endGameEarly, resumePausedGame } from '@game/scenes/UIScene';
import { useGameStore } from '@store/useGameStore';

export function PauseOverlay() {
  const pauseOverlay = useGameStore((state) => state.pauseOverlay);

  if (!pauseOverlay) {
    return null;
  }

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

  const isWindowClosePrompt = pauseOverlay.reason === 'window-close';
  const isBackgroundPause = pauseOverlay.reason === 'background';
  const title = isWindowClosePrompt ? 'Confirm Exit' : 'Game Paused';
  const message = isWindowClosePrompt
    ? 'Are you sure you want to end this game?'
    : isBackgroundPause
      ? 'Game paused because this tab moved to the background. Resume when you are ready or end this game.'
      : 'Game paused. You can resume any time or end this game.';
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
