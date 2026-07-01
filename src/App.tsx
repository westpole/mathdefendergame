import { useEffect } from 'react';
import { destroyPhaserGame, ensurePhaserGame } from './phaserGame';
import { useGameStore } from './store/useGameStore';
import { GameOverOverlay } from './ui/components/GameOverOverlay';
import { HUDOverlay } from './ui/components/HUDOverlay';
import { MainMenuOverlay } from './ui/components/MainMenuOverlay';
import { StageMessageOverlay } from './ui/components/StageMessageOverlay';

export function App() {
  const phase = useGameStore((state) => state.phase);
  const bootReady = useGameStore((state) => state.bootReady);

  useEffect(() => {
    const game = ensurePhaserGame();

    return () => {
      destroyPhaserGame(game);
    };
  }, []);

  return (
    <div id="app-shell">
      <div id="game-container" />
      <div id="ui-overlay">
        {!bootReady && (
          <div className="overlay-screen">
            <div className="overlay-panel">
              <h1>MATH DEFENDER</h1>
              <p>Loading game assets and fonts…</p>
            </div>
          </div>
        )}
        {bootReady && phase === 'start' && <MainMenuOverlay />}
        {bootReady && phase === 'playing' && <HUDOverlay />}
        {bootReady && phase === 'stage-message' && <StageMessageOverlay />}
        {bootReady && phase === 'gameover' && <GameOverOverlay />}
      </div>
    </div>
  );
}
