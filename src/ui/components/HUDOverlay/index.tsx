import {
  appendAnswerInputCharacter,
  pauseGameForManualEnd,
  removeAnswerInputCharacter,
  submitAnswerInput,
} from '@game/scenes/UIScene';
import { GAME_CONFIG } from '@game/config';
import { useGameStore } from '@store/useGameStore';

import { GameStatusPanel, type GameStatusPanelItem } from './GameStatusPanel';

const mobileKeypadValues = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

export function HUDOverlay() {
  const score = useGameStore((state) => state.score);
  const lives = useGameStore((state) => state.lives);
  const shield = useGameStore((state) => state.shield);
  const stage = useGameStore((state) => state.stage);
  const inputBuffer = useGameStore((state) => state.inputBuffer);
  const streak = useGameStore((state) => state.streak);
  const streakRewardMessage = useGameStore((state) => state.streakRewardMessage);

  const stageShieldMax = GAME_CONFIG.stageShieldMax;
  const clampedShield = Math.max(0, Math.min(stageShieldMax, shield));
  const shieldsTone = clampedShield >= 4 ? 'good' : clampedShield >= 2 ? 'warn' : 'danger';
  const livesTone = lives > 2 ? 'good' : lives > 1 ? 'warn' : 'danger';
  const leftStatusItems: ReadonlyArray<GameStatusPanelItem> = [
    { id: 'score', label: 'Score', value: score, variant: 'score' },
    { id: 'stage', label: 'Stage', value: stage, variant: 'stage' },
  ];
  const rightStatusItems: ReadonlyArray<GameStatusPanelItem> = [
    {
      id: 'shield',
      label: 'Base Shield',
      tone: shieldsTone,
      value: clampedShield,
      variant: 'shield',
    },
    { id: 'lives', label: 'Lives', tone: livesTone, value: lives, variant: 'lives' },
    { id: 'streak', label: 'Streak', value: streak, variant: 'streak' },
  ];

  return (
    <>
      <div className="hud-layer">
        <section className="hud-panel hud-panel--left">
          <GameStatusPanel items={leftStatusItems} />
        </section>

        <section className="hud-panel hud-panel--center">
          <div className="input-preview">{inputBuffer}</div>

          <div className="mobile-input-panel" data-testid="mobile-input-panel">
            <div className="mobile-input-panel__keypad" aria-label="Answer keypad" role="group">
              {mobileKeypadValues.map((keyValue) => (
                <button
                  aria-label={keyValue === '-' ? 'Negative sign' : `Digit ${keyValue}`}
                  className="mobile-input-panel__key"
                  key={keyValue}
                  onClick={() => appendAnswerInputCharacter(keyValue)}
                  type="button"
                >
                  {keyValue}
                </button>
              ))}

              <button
                aria-label="Backspace"
                className="mobile-input-panel__key mobile-input-panel__key--secondary"
                onClick={removeAnswerInputCharacter}
                type="button"
              >
                Del
              </button>
              <button
                aria-label="Submit answer"
                className="mobile-input-panel__key mobile-input-panel__key--primary"
                onClick={submitAnswerInput}
                type="button"
              >
                Enter
              </button>
            </div>
          </div>

          <button
            aria-label="Pause"
            className="mobile-input-panel__pause"
            onClick={() => pauseGameForManualEnd('escape')}
            type="button"
          >
            Pause
          </button>
        </section>

        <section className="hud-panel hud-panel--right">
          <GameStatusPanel items={rightStatusItems} />
        </section>
      </div>

      {/* @todo: refactor: it has to be with other messages */}
      {streakRewardMessage && (
        <div className="streak-reward-overlay" role="status" aria-live="polite">
          <div className="streak-reward-overlay__panel">
            <h2>Streak Bonus</h2>
            <p>{streakRewardMessage.message}</p>
          </div>
        </div>
      )}
    </>
  );
}
