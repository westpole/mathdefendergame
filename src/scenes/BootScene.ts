import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  create(): void {
    // Wait for web fonts (Press Start 2P, Roboto) to load before rendering menu
    document.fonts.ready.then(() => {
      this.scene.start('MainMenuScene');
    });
  }
}
