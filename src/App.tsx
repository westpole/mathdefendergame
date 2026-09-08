import { useEffect, useEffectEvent } from 'react';

import {
  destroyGame,
  ensurePhaserGame,
  onElectronCloseCancelled,
  onElectronCloseConfirmed,
  shouldConfirmElectronClose,
  onElectronCloseRequested,
  pauseGameForManualEnd,
} from '@game/scenes/UIScene';
import { subscribeToAppCloseEvents } from './platform/adapter';
import { useGameStore } from '@store/useGameStore';
import { GameOverOverlay } from '@ui/components/GameOverOverlay';
import { HUDOverlay } from '@ui/components/HUDOverlay';
import { HomeOverlay } from '@ui/components/HomeOverlay';
import { PauseOverlay } from '@ui/components/PauseOverlay';
import { StageMessageOverlay } from '@ui/components/StageMessageOverlay';
import { Loading } from '@ui/components/Loading';
import { PerformanceOverlay } from '@ui/components/PerformanceOverlay';
import { ProfileOverlay } from '@ui/components/ProfileOverlay';
import { RulesOverlay } from '@ui/components/Rules';
import { GameBgLayout } from '@ui/components/GameBgLayout';
import { LoginOverlay } from '@ui/components/LoginOverlay';
import { MenuControls } from '@ui/components/MenuControls';

export function App() {
  const phase = useGameStore((state) => state.phase);
  const bootReady = useGameStore((state) => state.bootReady);
  const menuView = useGameStore((state) => state.menuView);
  const isStartPhase = bootReady && phase === 'start';
  const handleVisibilityChange = useEffectEvent(() => {
    if (document.visibilityState !== 'hidden' || phase !== 'playing') {
      return;
    }

    pauseGameForManualEnd('background');
  });

  useEffect(() => {
    const game = ensurePhaserGame();
    const unsubscribe = subscribeToAppCloseEvents({
      onCloseRequested: onElectronCloseRequested,
      onCloseConfirmed: onElectronCloseConfirmed,
      onCloseCancelled: onElectronCloseCancelled,
      shouldConfirmClose: shouldConfirmElectronClose,
    });

    return () => {
      unsubscribe();
      destroyGame(game);
    };
  }, []);

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <div id="app-shell">
      <div id="game-container" />
      <GameBgLayout />
      <div id="ui-overlay">
        {!bootReady && <Loading />}
        {bootReady && phase === 'login' && <LoginOverlay />}
        {isStartPhase && menuView === 'home' && <HomeOverlay />}
        {isStartPhase && menuView === 'profile' && <ProfileOverlay />}
        {isStartPhase && menuView === 'performance' && <PerformanceOverlay />}
        {isStartPhase && menuView === 'rules' && <RulesOverlay />}
        {isStartPhase && <MenuControls />}
        {bootReady && phase === 'playing' && <HUDOverlay />}
        {bootReady && phase === 'paused' && <PauseOverlay />}
        {bootReady && phase === 'stage-message' && <StageMessageOverlay />}
        {bootReady && phase === 'gameover' && <GameOverOverlay />}
      </div>
    </div>
  );
}
