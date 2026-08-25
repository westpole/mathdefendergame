/**
 * Phaser Game UI Module
 *
 * This module initializes and manages the Phaser game instance.
 * It provides functions to start, continue, and return to the game menu.
 * It also handles scene transitions and game state management.
 */

import Phaser from 'phaser';

import { gameStore } from '@store/useGameStore';
import type { MenuView } from '@store/useGameStore';
import { GAME_CONFIG, resolveGradeFromScore } from '@game/config';

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
  const state = gameStore.getState();
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

export function pauseGameForManualEnd(reason: 'escape' | 'window-close'): void {
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

export function endGameEarly(options?: { closeApp?: boolean }): void {
  const scene = getGameScene();

  if (!scene) {
    if (options?.closeApp) {
      window.dispatchEvent(new CustomEvent('math-defender-close-ready'));
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

  gameStore.getState().returnToMenu();
}

export function openMenuView(menuView: MenuView): void {
  const game = ensurePhaserGame();

  if (game.scene.isActive('GameScene') || game.scene.isPaused('GameScene')) {
    game.scene.stop('GameScene');
  }

  gameStore.getState().openMenuView(menuView);
}

export function onElectronCloseRequested(): void {
  pauseGameForManualEnd('window-close');
}

export function shouldConfirmElectronClose(): boolean {
  const { phase } = gameStore.getState();

  return phase === 'playing' || phase === 'paused' || phase === 'stage-message';
}

export function onElectronCloseConfirmed(): void {
  const state = gameStore.getState();

  if (shouldConfirmElectronClose()) {
    endGameEarly({ closeApp: true });
    return;
  }

  state.showSavingBeforeClose();
  window.dispatchEvent(new CustomEvent('math-defender-close-ready'));
}

export function onElectronCloseCancelled(): void {
  const state = gameStore.getState();

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
