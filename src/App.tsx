import { useEffect } from 'react';

import { destroyGame, ensurePhaserGame } from '@game/scenes/UIScene';
import { useGameStore } from '@store/useGameStore';
import { GameOverOverlay } from '@ui/components/GameOverOverlay';
import { HUDOverlay } from '@ui/components/HUDOverlay';
import { MainMenuOverlay } from '@ui/components/MainMenuOverlay';
import { StageMessageOverlay } from '@ui/components/StageMessageOverlay';
import { Loading } from '@ui/components/Loading';
import { ProfileOverlay } from '@ui/components/ProfileOverlay';
import { RulesOverlay } from '@ui/components/Rules';
import { CitySceneLayout } from '@ui/components/CitySceneLayout';
import { LoginOverlay } from '@ui/components/LoginOverlay';
import { StartMenuControls } from '@ui/components/StartMenuControls';

export function App() {
  const phase = useGameStore((state) => state.phase);
  const bootReady = useGameStore((state) => state.bootReady);
  const menuView = useGameStore((state) => state.menuView);
  const isStartPhase = bootReady && phase === 'start';

  useEffect(() => {
    const game = ensurePhaserGame();

    return () => {
      destroyGame(game);
    };
  }, []);

  return (
    <div id="app-shell">
      <div id="game-container" />
      <CitySceneLayout />
      <div id="ui-overlay">
        {!bootReady && <Loading />}
        {bootReady && phase === 'login' && <LoginOverlay />}
        {isStartPhase && menuView === 'home' && <MainMenuOverlay />}
        {isStartPhase && menuView === 'profile' && <ProfileOverlay />}
        {isStartPhase && menuView === 'rules' && <RulesOverlay />}
        {isStartPhase && <StartMenuControls />}
        {bootReady && phase === 'playing' && <HUDOverlay />}
        {bootReady && phase === 'stage-message' && <StageMessageOverlay />}
        {bootReady && phase === 'gameover' && <GameOverOverlay />}
      </div>
    </div>
  );
}
