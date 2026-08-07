import { useEffect } from 'react';

import { destroyGame, ensurePhaserGame, openMenuView } from '@game/scenes/UIScene';
import type { MenuView, OverlayPhase } from '@store/useGameStore';
import { useGameStore } from '@store/useGameStore';
import { GameOverOverlay } from '@ui/components/GameOverOverlay';
import { HUDOverlay } from '@ui/components/HUDOverlay';
import { MainMenuOverlay } from '@ui/components/MainMenuOverlay';
import { StageMessageOverlay } from '@ui/components/StageMessageOverlay';
import { Loading } from '@ui/components/Loading';
import { HighScoreOverlay } from '@ui/components/HighScoreOverlay';
import { RulesOverlay } from '@ui/components/Rules';
import { CitySceneLayout } from '@ui/components/CitySceneLayout';

interface ElectronMenuEventDetail {
  view: MenuView;
}

function isElectronMenuEnabledForPhase(phase: OverlayPhase): boolean {
  return phase === 'start' || phase === 'gameover';
}

export function App() {
  const phase = useGameStore((state) => state.phase);
  const bootReady = useGameStore((state) => state.bootReady);
  const menuView = useGameStore((state) => state.menuView);

  useEffect(() => {
    const game = ensurePhaserGame();

    return () => {
      destroyGame(game);
    };
  }, []);

  useEffect(() => {
    function handleElectronMenuAction(event: Event) {
      const phase = useGameStore.getState().phase;
      if (!isElectronMenuEnabledForPhase(phase)) {
        return;
      }

      const menuEvent = event as CustomEvent<ElectronMenuEventDetail>;

      openMenuView(menuEvent.detail.view);
    }

    window.addEventListener('electron-menu-action', handleElectronMenuAction);

    return () => {
      window.removeEventListener('electron-menu-action', handleElectronMenuAction);
    };
  }, []);

  return (
    <div id="app-shell">
      <div id="game-container" />
      <CitySceneLayout />
      <div id="ui-overlay">
        {!bootReady && <Loading />}
        {bootReady && phase === 'start' && menuView === 'home' && <MainMenuOverlay />}
        {bootReady && phase === 'start' && menuView === 'high-score' && <HighScoreOverlay />}
        {bootReady && phase === 'start' && menuView === 'rules' && <RulesOverlay />}
        {bootReady && phase === 'playing' && <HUDOverlay />}
        {bootReady && phase === 'stage-message' && <StageMessageOverlay />}
        {bootReady && phase === 'gameover' && <GameOverOverlay />}
      </div>
    </div>
  );
}
