import Phaser from 'phaser';

interface StageMessageData {
  success: boolean;
  stage: number;
  stageIncorrect: number;
  score: number;
  lives: number;
}

export class StageMessageScene extends Phaser.Scene {
  private stageData!: StageMessageData;

  constructor() {
    super({ key: 'StageMessageScene' });
  }

  init(data: StageMessageData): void {
    this.stageData = data;
  }

  create(): void {
    const { success, stage, stageIncorrect, score, lives } = this.stageData;

    // Semi-transparent backdrop
    this.add.rectangle(250, 350, 500, 700, 0x000000, 0.82);

    // Panel
    const borderColor = success ? 0x22c55e : 0xef4444;
    const panelGfx = this.add.graphics();
    panelGfx.fillStyle(0x1f2937, 1);
    panelGfx.fillRoundedRect(100, 185, 300, 330, 16);
    panelGfx.lineStyle(2, borderColor, 1);
    panelGfx.strokeRoundedRect(100, 185, 300, 330, 16);

    // Visual emoji
    this.add.text(250, 205, success ? '🎉' : '💥', { fontSize: '44px' }).setOrigin(0.5, 0);

    // Title
    const titleColor  = success ? '#4ade80' : '#ef4444';
    const titleText   = success ? `STAGE ${stage} CLEARED!` : 'BASE DESTROYED';
    this.add.text(250, 268, titleText, {
      fontFamily: '"Press Start 2P"',
      fontSize: '13px',
      color: titleColor,
      align: 'center',
      wordWrap: { width: 268 },
    }).setOrigin(0.5, 0);

    // Stats
    let statsStr: string;
    if (success) {
      statsStr = `Score: ${score}\nLives: ${lives}`;
      if (stageIncorrect === 0) statsStr += '\n\nPerfect! +1 Life!';
    } else {
      statsStr = `You lost 1 Life to retry.\nRemaining Lives: ${lives}`;
    }

    this.add.text(250, 340, statsStr, {
      fontFamily: 'Roboto',
      fontSize: '15px',
      color: '#d1d5db',
      align: 'center',
      lineSpacing: 6,
    }).setOrigin(0.5, 0);

    // Continue button
    const btnBg = this.add.rectangle(250, 465, 165, 46, 0x7c3aed)
      .setInteractive({ useHandCursor: true });

    const btnTxt = this.add.text(250, 465, 'CONTINUE', {
      fontFamily: 'Roboto',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#ffffff',
    }).setOrigin(0.5, 0.5);

    // Subtle bounce animation
    this.tweens.add({
      targets: [btnBg, btnTxt],
      scaleY: 1.08,
      duration: 520,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    btnBg.on('pointerover', () => btnBg.setFillStyle(0x6d28d9));
    btnBg.on('pointerout',  () => btnBg.setFillStyle(0x7c3aed));
    btnBg.on('pointerdown', () => {
      const gameScene = this.scene.get('GameScene');
      gameScene.events.emit('continue-game');
      this.scene.stop();
    });
  }
}
