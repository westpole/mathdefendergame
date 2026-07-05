import { GAME_CONFIG } from '../../../config';
import { useGameStore } from '../../../store/useGameStore';

export function HUDOverlay() {
  const difficulty = useGameStore((state) => state.difficulty);
  const score = useGameStore((state) => state.score);
  const lives = useGameStore((state) => state.lives);
  const shield = useGameStore((state) => state.shield);
  const stage = useGameStore((state) => state.stage);
  const stageScore = useGameStore((state) => state.stageScore);

  const livesPct = Math.max(0, Math.min(100, (lives / GAME_CONFIG.initialLives) * 100));
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
        <span className="hud-label">Base Shield</span>
        <div className="shield-row">
          {Array.from({ length: GAME_CONFIG.stageShieldMax }, (_, index) => (
            <span
              key={index}
              className={index < shield ? 'shield-block is-filled' : 'shield-block'}
            />
          ))}
        </div>
      </section>

      <section className="hud-panel hud-panel--right">
        <strong>Lives: {lives}</strong>
        <span>ESC to Exit</span>
        <div className="lives-track">
          <div className={`lives-fill lives-fill--${livesTone}`} style={{ width: `${livesPct}%` }} />
        </div>
      </section>
    </div>
  );
}
