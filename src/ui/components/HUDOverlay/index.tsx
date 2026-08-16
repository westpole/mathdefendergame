import { clsx } from 'clsx';
import { GAME_CONFIG } from '@game/config';
import { useGameStore } from '@store/useGameStore';

export function HUDOverlay() {
  const grade = useGameStore((state) => state.grade);
  const score = useGameStore((state) => state.score);
  const lives = useGameStore((state) => state.lives);
  const shield = useGameStore((state) => state.shield);
  const stageScore = useGameStore((state) => state.stageScore);
  const inputBuffer = useGameStore((state) => state.inputBuffer);

  const stageShieldMax = GAME_CONFIG.stageShieldMax;
  const stageTarget = GAME_CONFIG.grades[grade].stageClearCorrectAnswers;
  const clampedShield = Math.max(0, Math.min(stageShieldMax, shield));
  const livesTone = lives > 1 ? 'good' : lives > 0 ? 'warn' : 'danger';

  return (
    <div className="hud-layer">
      <section className="hud-panel hud-panel--left">
        <strong>Score: {score}</strong>
        <span>Grade: {grade}</span>
        <strong>Goal: Correct {stageScore}/{stageTarget}</strong>
      </section>

      <section className="hud-panel hud-panel--center">
        <div className="input-preview">
          {inputBuffer}
        </div>
      </section>

      <section className="hud-panel hud-panel--right">
        <div className="status-squares">
          <div className="status-square status-square--shield">
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
        </div>
      </section>
    </div>
  );
}
