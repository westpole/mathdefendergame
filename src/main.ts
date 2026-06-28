import './styles.css';
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { GameScene } from './scenes/GameScene';
import { StageMessageScene } from './scenes/StageMessageScene';
import { GameOverScene } from './scenes/GameOverScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 500,
  height: 700,
  backgroundColor: '#1a1a2e',
  parent: 'game-container',
  scene: [BootScene, MainMenuScene, GameScene, StageMessageScene, GameOverScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    keyboard: true,
  },
};

new Phaser.Game(config);
