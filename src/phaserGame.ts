import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
import { gameStore } from './store/useGameStore';
import type { Difficulty } from './types';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 500,
  height: 700,
  backgroundColor: '#1a1a2e',
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

export function destroyPhaserGame(game: Phaser.Game): void {
  if (phaserGame !== game) {
    return;
  }

  phaserGame.destroy(true);
  phaserGame = null;
}

export function startGame(difficulty: Difficulty): void {
  const game = ensurePhaserGame();

  gameStore.getState().setDifficulty(difficulty);
  gameStore.getState().startPlaying();

  if (game.scene.isActive('GameScene') || game.scene.isPaused('GameScene')) {
    game.scene.stop('GameScene');
  }

  game.scene.start('GameScene', { difficulty });
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
