import { GAME_CONFIG } from '@game/config';
import { useGameStore } from '@store/useGameStore';

import { GameStatusPanel, type GameStatusPanelItem } from './GameStatusPanel';
import { InputPanel } from './InputPanel';

/**
 * Renders the in-game HUD overlay for the current match state.
 * It reads live values from the shared game store and composes the score,
 * stage, resource, and mobile answer input panels.
 */
export function HUDOverlay() {
  const score = useGameStore((state) => state.score);
  const lives = useGameStore((state) => state.lives);
  const shield = useGameStore((state) => state.shield);
  const stage = useGameStore((state) => state.stage);
  const inputBuffer = useGameStore((state) => state.inputBuffer);
  const streak = useGameStore((state) => state.streak);

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

          <InputPanel />
        </section>

        <section className="hud-panel hud-panel--right">
          <GameStatusPanel items={rightStatusItems} />
        </section>
      </div>

    </>
  );
}
