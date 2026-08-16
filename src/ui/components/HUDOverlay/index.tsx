import { clsx } from 'clsx';
import { GAME_CONFIG } from '@game/config';
import { useGameStore } from '@store/useGameStore';

export function HUDOverlay() {
  const grade = useGameStore((state) => state.grade);
  const score = useGameStore((state) => state.score);
  const lives = useGameStore((state) => state.lives);
  const shield = useGameStore((state) => state.shield);
  const stage = useGameStore((state) => state.stage);
  const stageScore = useGameStore((state) => state.stageScore);
  const inputBuffer = useGameStore((state) => state.inputBuffer);
  const ddaSpeedMultiplier = useGameStore((state) => state.ddaSpeedMultiplier);
  const ddaIsCooloffActive = useGameStore((state) => state.ddaIsCooloffActive);

  const initialLives = GAME_CONFIG.initialLives;
  const stageShieldMax = GAME_CONFIG.stageShieldMax;

  const nextPromotion = GAME_CONFIG.gradeOrder.find(
    (candidate) => GAME_CONFIG.grades[candidate].thresholdScore > score,
  );

  const livesPct = Math.max(0, Math.min(100, (lives / initialLives) * 100));
  const livesTone = livesPct > 60 ? 'good' : livesPct > 30 ? 'warn' : 'danger';

  return (
    <div className="hud-layer">
      <section className="hud-panel hud-panel--left">
        <strong>Score: {score}</strong>
        <span>Grade: {grade}</span>
        <span>
          {nextPromotion
            ? `Next: ${nextPromotion} @ ${GAME_CONFIG.grades[nextPromotion].thresholdScore}`
            : 'Top Rank Reached'}
        </span>
        <strong>Goal: {stageScore}/200</strong>
        <span>Stage {stage}/28</span>
        <span>Speed x{ddaSpeedMultiplier.toFixed(2)}</span>
        <span>{ddaIsCooloffActive ? 'Cooloff: ON' : 'Cooloff: OFF'}</span>
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
