import { clsx } from 'clsx';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { continueGame } from '@game/scenes/UIScene';
import { useGameStore } from '@store/useGameStore';

/**
 * Stage message overlay component displaying the current stage result and streak rewards.
 * @returns The JSX element representing the stage message overlay.
 */
export function StageMessageOverlay() {
  const { t } = useTranslation();
  const stageMessage = useGameStore((state) => state.stageMessage);
  const streakRewardMessage = useGameStore((state) => state.streakRewardMessage);

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

  const getTitle = () => {
    if (streakRewardMessage) {
      return t('game.streakBonus');
    }

    if (stageMessage?.success) {
      return t('game.stageCleared', { stage: stageMessage.stage });
    }

    return t('game.stageLost');
  };

  return (
    <div className="overlay-screen overlay-screen--interactive ">
      <div
        className={clsx('overlay-panel', 'modal-panel', {
          'accent-success': stageMessage?.success,
          'accent-danger': !stageMessage?.success,
        })}
      >
        <h1>{getTitle()}</h1>

        {!stageMessage?.success && (stageMessage && stageMessage.lives > 0) && (
          <p>
            {t('game.lostLifeSummary', {
              count: stageMessage.lives,
            })}
          </p>
        )}

        {stageMessage?.success && stageMessage?.stageIncorrect === 0 && (
          <p>{t('game.perfectClear')}</p>
        )}

        {stageMessage?.success && stageMessage?.stageIncorrect > 0 && (
          <p>{t('game.mistakeSummary', { count: stageMessage.stageIncorrect })}</p>
        )}

        {streakRewardMessage && <p>{streakRewardMessage.message}</p>}

        {Boolean(stageMessage) && (
          <div className="action-row">
            <button className="primary-button" onClick={continueGame} type="button">
              {t('ui.continue')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
