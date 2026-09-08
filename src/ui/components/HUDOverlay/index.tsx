import type { ChangeEvent } from 'react';

import { clsx } from 'clsx';
import {
  appendAnswerInputCharacter,
  pauseGameForManualEnd,
  removeAnswerInputCharacter,
  setAnswerInputBuffer,
  submitAnswerInput,
} from '@game/scenes/UIScene';
import { GAME_CONFIG } from '@game/config';
import { useGameStore } from '@store/useGameStore';

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

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setAnswerInputBuffer(event.target.value);
  };

  return (
    <>
      <div className="hud-layer">
        <section className="hud-panel hud-panel--left">
          <div className="status-squares">
            <div className="status-square status-square--score">
              <span className="status-square__label">Score</span>
              <strong className="status-square__value">{score}</strong>
            </div>

            <div className="status-square status-square--stage">
              <span className="status-square__label">Stage</span>
              <strong className="status-square__value">{stage}</strong>
            </div>
          </div>
        </section>

        <section className="hud-panel hud-panel--center">
          <div className="input-preview">{inputBuffer}</div>

          <div className="mobile-input-panel" data-testid="mobile-input-panel">
            <label className="mobile-input-panel__label" htmlFor="mobile-answer-input">
              Answer input
            </label>
            <input
              aria-label="Answer input"
              autoComplete="off"
              className="mobile-input-panel__field"
              enterKeyHint="done"
              id="mobile-answer-input"
              inputMode="numeric"
              onChange={handleInputChange}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  submitAnswerInput();
                }
              }}
              pattern="-?[0-9]*"
              spellCheck={false}
              type="text"
              value={inputBuffer}
            />

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

            <button
              className="mobile-input-panel__pause secondary-button"
              onClick={() => pauseGameForManualEnd('escape')}
              type="button"
            >
              Pause
            </button>
          </div>
        </section>

        <section className="hud-panel hud-panel--right">
          <div className="status-squares">
            <div className={clsx('status-square status-square--shield', {
                'status-square--good': shieldsTone === 'good',
                'status-square--warn': shieldsTone === 'warn',
                'status-square--danger': shieldsTone === 'danger',
              })}>
              <span className="status-square__label">Base Shield</span>
              <strong className="status-square__value">{clampedShield}</strong>
            </div>

            <div
              className={clsx('status-square status-square--lives', {
                'status-square--good': livesTone === 'good',
                'status-square--warn': livesTone === 'warn',
                'status-square--danger': livesTone === 'danger',
              })}
            >
              <span className="status-square__label">Lives</span>
              <strong className="status-square__value">{lives}</strong>
            </div>

            <div className="status-square status-square--streak">
              <span className="status-square__label">Streak</span>
              <strong className="status-square__value">{streak}</strong>
            </div>
          </div>
        </section>
      </div>

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
