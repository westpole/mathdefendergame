import { continueGame } from '../../../phaserGame';
import { useGameStore } from '../../../store/useGameStore';

export function StageMessageOverlay() {
  const stageMessage = useGameStore((state) => state.stageMessage);

  if (!stageMessage) {
    return null;
  }

  const title = stageMessage.success ? `Stage ${stageMessage.stage} Cleared!` : 'Base Destroyed';
  const accentClass = stageMessage.success ? 'accent-success' : 'accent-danger';

  return (
    <div className="overlay-screen">
      <div className={`overlay-panel modal-panel ${accentClass}`}>
        <h1>{title}</h1>
        <p>
          {stageMessage.success
            ? `Score: ${stageMessage.score} | Lives: ${stageMessage.lives}`
            : `You lost 1 life. Remaining lives: ${stageMessage.lives}.`}
        </p>
        {stageMessage.success && stageMessage.stageIncorrect === 0 && (
          <p>Perfect stage. Bonus life awarded.</p>
        )}
        <button className="primary-button" onClick={continueGame} type="button">
          Continue
        </button>
      </div>
    </div>
  );
}
