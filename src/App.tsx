import { useEffect } from 'react';

import {
  destroyGame,
  ensurePhaserGame,
  onElectronCloseCancelled,
  onElectronCloseConfirmed,
  shouldConfirmElectronClose,
  onElectronCloseRequested,
} from '@game/scenes/UIScene';
import { useGameStore } from '@store/useGameStore';
import { GameOverOverlay } from '@ui/components/GameOverOverlay';
import { HUDOverlay } from '@ui/components/HUDOverlay';
import { MainMenuOverlay } from '@ui/components/MainMenuOverlay';
import { PauseOverlay } from '@ui/components/PauseOverlay';
import { StageMessageOverlay } from '@ui/components/StageMessageOverlay';
import { Loading } from '@ui/components/Loading';
import { PerformanceOverlay } from '@ui/components/PerformanceOverlay';
import { ProfileOverlay } from '@ui/components/ProfileOverlay';
import { RulesOverlay } from '@ui/components/Rules';
import { GameBgLayout } from '@ui/components/GameBgLayout';
import { LoginOverlay } from '@ui/components/LoginOverlay';
import { StartMenuControls } from '@ui/components/StartMenuControls';

export function App() {
  const phase = useGameStore((state) => state.phase);
  const bootReady = useGameStore((state) => state.bootReady);
  const menuView = useGameStore((state) => state.menuView);
  const isStartPhase = bootReady && phase === 'start';

  useEffect(() => {
    const game = ensurePhaserGame();

    const handleCloseRequested = () => {
      onElectronCloseRequested();
    };

    const handleCloseQuery = () => {
      window.dispatchEvent(new CustomEvent('math-defender-close-query-result', {
        detail: {
          shouldConfirm: shouldConfirmElectronClose(),
        },
      }));
    };

    const handleCloseConfirmed = () => {
      onElectronCloseConfirmed();
    };

    const handleCloseCancelled = () => {
      onElectronCloseCancelled();
    };

    window.addEventListener('electron-close-query', handleCloseQuery);
    window.addEventListener('electron-close-requested', handleCloseRequested);
    window.addEventListener('electron-close-confirmed', handleCloseConfirmed);
    window.addEventListener('electron-close-cancelled', handleCloseCancelled);

    return () => {
      window.removeEventListener('electron-close-query', handleCloseQuery);
      window.removeEventListener('electron-close-requested', handleCloseRequested);
      window.removeEventListener('electron-close-confirmed', handleCloseConfirmed);
      window.removeEventListener('electron-close-cancelled', handleCloseCancelled);
      destroyGame(game);
    };
  }, []);

  return (
    <div id="app-shell">
      <div id="game-container" />
      <GameBgLayout />
      <div id="ui-overlay">
        {!bootReady && <Loading />}
        {bootReady && phase === 'login' && <LoginOverlay />}
        {isStartPhase && menuView === 'home' && <MainMenuOverlay />}
        {isStartPhase && menuView === 'profile' && <ProfileOverlay />}
        {isStartPhase && menuView === 'performance' && <PerformanceOverlay />}
        {isStartPhase && menuView === 'rules' && <RulesOverlay />}
        {isStartPhase && <StartMenuControls />}
        {bootReady && phase === 'playing' && <HUDOverlay />}
        {bootReady && phase === 'paused' && <PauseOverlay />}
        {bootReady && phase === 'stage-message' && <StageMessageOverlay />}
        {bootReady && phase === 'gameover' && <GameOverOverlay />}
      </div>
    </div>
  );
}
