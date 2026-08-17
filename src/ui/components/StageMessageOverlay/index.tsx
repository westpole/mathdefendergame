import { clsx } from 'clsx';
import { continueGame } from '@game/scenes/UIScene';
import { useGameStore } from '@store/useGameStore';

export function StageMessageOverlay() {
  const stageMessage = useGameStore((state) => state.stageMessage);

  if (!stageMessage) {
    return null;
  }

  const title = stageMessage.success
    ? `Stage ${stageMessage.stage} Cleared!`
    : stageMessage.lives > 0
      ? 'Stage Lost'
      : 'Stage Lost - No Lives Remaining';

  return (
    <div className="overlay-screen overlay-screen--interactive">
      <div
        className={clsx('overlay-panel', 'modal-panel', {
          'accent-success': stageMessage.success,
          'accent-danger': !stageMessage.success,
        })}
      >
        <h1>{title}</h1>
        <p>
          {stageMessage.lives > 0
            ? `You lost this stage and 1 life. Remaining lives: ${stageMessage.lives}.`
            : 'You lost this stage and your last life. Continue to return home.'}
        </p>
        {stageMessage.success && stageMessage.stageIncorrect === 0 && (
          <p>Perfect stage. Bonus life awarded.</p>
        )}
        <button autoFocus className="primary-button" onClick={continueGame} type="button">
          Continue
        </button>
      </div>
    </div>
  );
}
