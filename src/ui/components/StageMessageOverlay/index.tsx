import { clsx } from 'clsx';
import { useEffect } from 'react';
import { continueGame } from '@game/scenes/UIScene';
import { useGameStore } from '@store/useGameStore';

export function StageMessageOverlay() {
  const stageMessage = useGameStore((state) => state.stageMessage);

  useEffect(() => {
    if (!stageMessage) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !event.repeat) {
        continueGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [stageMessage]);

  if (!stageMessage) {
    return null;
  }

  const title = stageMessage.success
    ? `Stage ${stageMessage.stage} Cleared!`
    : 'Stage Lost';
  const remainingLifeLabel = stageMessage.lives === 1 ? 'life' : 'lives';

  return (
    <div className="overlay-screen overlay-screen--interactive ">
      <div
        className={clsx('overlay-panel', 'modal-panel', {
          'accent-success': stageMessage.success,
          'accent-danger': !stageMessage.success,
        })}
      >
        <h1>{title}</h1>

        {!stageMessage.success && stageMessage.lives > 0 && (
          <p>
            {`You lost this stage and 1 life. Remaining ${remainingLifeLabel}: ${stageMessage.lives}.`}
          </p>
        )}

        {stageMessage.success && stageMessage.stageIncorrect === 0 && (
          <p>Perfect work. You saved your town.</p>
        )}

        {stageMessage.success && stageMessage.stageIncorrect > 0 && (
          <p>You cleared the stage, but made {stageMessage.stageIncorrect} mistake{stageMessage.stageIncorrect > 1 ? 's' : ''}.</p>
        )}

        <div className="action-row">
          <button className="primary-button" onClick={continueGame} type="button">
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
