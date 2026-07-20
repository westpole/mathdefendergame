/**
 * Phaser Boot Scene Module
 *
 * This module defines the BootScene class, which is responsible for initializing the Phaser game.
 * It ensures that necessary resources, such as web fonts, are loaded before transitioning to the main menu.
 * The BootScene is the first scene that runs when the game starts.
 */
import Phaser from 'phaser';
import { gameStore } from '../store/useGameStore';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    // Wait for web fonts (Press Start 2P, Roboto) to load before rendering menu
    document.fonts.ready.then(() => {
      gameStore.getState().markBootReady();
    });
  }
}
