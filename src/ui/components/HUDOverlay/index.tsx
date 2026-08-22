import { clsx } from 'clsx';
import { GAME_CONFIG } from '@game/config';
import { useGameStore } from '@store/useGameStore';

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
          <div className="input-preview">
            {inputBuffer}
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
