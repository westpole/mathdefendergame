/**
 * Phaser Game UI Module
 *
 * This module initializes and manages the Phaser game instance.
 * It provides functions to start, continue, and return to the game menu.
 * It also handles scene transitions and game state management.
 */

import Phaser from 'phaser';

import { useGameStore } from '@store/useGameStore';
import type { MenuView, PauseOverlayReason } from '@store/types';
import { GAME_CONFIG, resolveGradeFromScore } from '@game/config';
import { notifyAppCloseCancelled, notifyAppCloseReady } from '../../platform/adapter';

import { BootScene } from './BootScene';
import { GameScene } from './GameScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_CONFIG.CANVAS_WIDTH,
  height: GAME_CONFIG.CANVAS_HEIGHT,
  transparent: true,
  backgroundColor: 'rgba(0, 0, 0, 0)',
  parent: 'game-container',
  scene: [BootScene, GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: true,
  },
  input: {
    keyboard: true,
  },
};

let phaserGame: Phaser.Game | null = null;

export function ensurePhaserGame(): Phaser.Game {
  if (!phaserGame) {
    phaserGame = new Phaser.Game(config);
  }

  return phaserGame;
}

export function destroyGame(game: Phaser.Game): void {
  if (phaserGame !== game) {
    return;
  }

  phaserGame.destroy(true);
  phaserGame = null;
}

export function startGame(): void {
  const game = ensurePhaserGame();
  const state = useGameStore.getState();
  const startingScore = Math.max(0, state.score);
  const startingGrade = resolveGradeFromScore(startingScore);

  state.setGrade(startingGrade);
  state.startPlaying();

  if (game.scene.isActive('GameScene') || game.scene.isPaused('GameScene')) {
    game.scene.stop('GameScene');
  }

  game.scene.start('GameScene', { grade: startingGrade, score: startingScore });
}

export function continueGame(): void {
  const scene = getGameScene();

  if (scene) {
    scene.continueFromOverlay();
  }
}

export function setAnswerInputBuffer(nextValue: string): void {
  const scene = getGameScene();

  if (!scene) {
    return;
  }

  scene.setAnswerInputBuffer(nextValue);
}

export function appendAnswerInputCharacter(char: string): void {
  const scene = getGameScene();

  if (!scene) {
    return;
  }

  scene.appendAnswerInputCharacter(char);
}

export function removeAnswerInputCharacter(): void {
  const scene = getGameScene();

  if (!scene) {
    return;
  }

  scene.removeAnswerInputCharacter();
}

export function submitAnswerInput(): void {
  const scene = getGameScene();

  if (!scene) {
    return;
  }

  scene.submitAnswerInput();
}

export function pauseGameForManualEnd(reason: PauseOverlayReason): void {
  const scene = getGameScene();

  if (!scene) {
    return;
  }

  scene.pauseForManualEndPrompt(reason);
}

export function resumePausedGame(): void {
  const scene = getGameScene();

  if (!scene) {
    return;
  }

  scene.resumeFromManualPausePrompt();
}

export function cancelElectronClose(): void {
  const state = useGameStore.getState();

  if (state.phase === 'paused' && state.pauseOverlay?.reason === 'window-close') {
    resumePausedGame();
  }

  notifyAppCloseCancelled();
}

export function endGameEarly(options?: { closeApp?: boolean }): void {
  const scene = getGameScene();

  if (!scene) {
    if (options?.closeApp) {
      notifyAppCloseReady();
    }
    return;
  }

  scene.endGameEarly(options);
}

export function returnToMenu(): void {
  const game = ensurePhaserGame();

  if (game.scene.isActive('GameScene') || game.scene.isPaused('GameScene')) {
    game.scene.stop('GameScene');
  }

  useGameStore.getState().returnToMenu();
}

export function openMenuView(menuView: MenuView): void {
  const game = ensurePhaserGame();

  if (game.scene.isActive('GameScene') || game.scene.isPaused('GameScene')) {
    game.scene.stop('GameScene');
  }

  useGameStore.getState().openMenuView(menuView);
}

export function logOff(): void {
  const game = ensurePhaserGame();

  if (game.scene.isActive('GameScene') || game.scene.isPaused('GameScene')) {
    game.scene.stop('GameScene');
  }

  useGameStore.getState().logOff();
}

export function onElectronCloseRequested(): void {
  pauseGameForManualEnd('window-close');
}

export function shouldConfirmElectronClose(): boolean {
  const { phase } = useGameStore.getState();

  return phase === 'playing' || phase === 'paused' || phase === 'stage-message';
}

export function onElectronCloseConfirmed(): void {
  const state = useGameStore.getState();

  if (shouldConfirmElectronClose()) {
    endGameEarly({ closeApp: true });
    return;
  }

  state.showSavingBeforeClose();
  notifyAppCloseReady();
}

export function onElectronCloseCancelled(): void {
  const state = useGameStore.getState();

  if (state.phase !== 'paused' || state.pauseOverlay?.reason !== 'window-close') {
    return;
  }

  resumePausedGame();
}

function getGameScene(): GameScene | null {
  if (!phaserGame) {
    return null;
  }

  try {
    return phaserGame.scene.getScene('GameScene') as GameScene;
  } catch {
    return null;
  }
}
