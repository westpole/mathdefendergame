import { clsx } from 'clsx';
import { useGameStore } from '@store/useGameStore';

export function HUDOverlay() {
  const difficulty = useGameStore((state) => state.difficulty);
  const score = useGameStore((state) => state.score);
  const lives = useGameStore((state) => state.lives);
  const shield = useGameStore((state) => state.shield);
  const stage = useGameStore((state) => state.stage);
  const stageScore = useGameStore((state) => state.stageScore);
  const inputBuffer = useGameStore((state) => state.inputBuffer);

  // these should be shared with Phaser game
  const initialLives = 10; // ??? initialLives should come from store
  const stageShieldMax = 5; // ??? should come from store

  const livesPct = Math.max(0, Math.min(100, (lives / initialLives) * 100));
  const livesTone = lives > 6 ? 'good' : lives > 3 ? 'warn' : 'danger';

  return (
    <div className="hud-layer">
      <section className="hud-panel hud-panel--left">
        <strong>Score: {score}</strong>
        <span>Diff: {difficulty}</span>
        <span>Stage {stage}/28</span>
        <span>Goal: {stageScore}/200</span>
      </section>

      <section className="hud-panel hud-panel--center">
        <div className="input-preview">
          {inputBuffer}
        </div>
      </section>

      <section className="hud-panel hud-panel--right">
        <div className="shield-row">
          <span className="hud-label">Base Shield</span>
          {Array.from({ length: stageShieldMax }, (_, index) => (
            <span
              key={index}
              className={clsx('shield-block', { 'is-filled': index < shield })}
            />
          ))}
        </div>

        <div className="lives-track">
          <strong>Lives: {lives}</strong>
          <div
            className={clsx('lives-fill', {
              'lives-fill--good': livesTone === 'good',
              'lives-fill--warn': livesTone === 'warn',
              'lives-fill--danger': livesTone === 'danger',
            })}
            style={{ width: `${livesPct}%` }}
          />
        </div>
      </section>
    </div>
  );
}
