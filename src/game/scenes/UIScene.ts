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
import { GAME_CONFIG } from '@game/config';

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

  gameStore.getState().setGrade('trainee');
  gameStore.getState().startPlaying();

  if (game.scene.isActive('GameScene') || game.scene.isPaused('GameScene')) {
    game.scene.stop('GameScene');
  }

  game.scene.start('GameScene', { grade: 'trainee' });
}

export function continueGame(): void {
  const scene = getGameScene();

  if (scene) {
    scene.continueFromOverlay();
  }
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
