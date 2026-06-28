import Phaser from 'phaser';
import { Game } from '../game';
import { GAME_CONFIG } from '../config';
import type { Difficulty } from '../types';

const CANVAS_W = 500;
const CANVAS_H = 700;
const DANGER_Y = CANVAS_H - GAME_CONFIG.dangerZone; // 600

function colorToInt(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

export class GameScene extends Phaser.Scene {
  gameLogic!: Game;

  private meteorTexts: Map<number, Phaser.GameObjects.Text> = new Map();
  private particleGraphics!: Phaser.GameObjects.Graphics;
  private hudGraphics!: Phaser.GameObjects.Graphics;

  // HUD text objects
  private scoreText!: Phaser.GameObjects.Text;
  private diffText!: Phaser.GameObjects.Text;
  private stageText!: Phaser.GameObjects.Text;
  private stageScoreText!: Phaser.GameObjects.Text;
  private livesCountText!: Phaser.GameObjects.Text;
  private inputEchoText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { difficulty: Difficulty }): void {
    this.gameLogic = new Game({
      onHUDUpdate: () => this.updateHUD(),
      onFinishStage: (success) => this.handleFinishStage(success),
      onGameOver: () => this.handleGameOver(),
      onShake: () => this.cameras.main.shake(500, 0.01),
    });
    this.gameLogic.difficulty = data.difficulty ?? 'child';
    this.gameLogic.reset();
    this.gameLogic.state = 'playing';
    this.gameLogic.lastSpawn = Date.now();
  }

  create(): void {
    this.meteorTexts = new Map();

    // ── Static background elements ────────────────────────────────────────────
    const staticGfx = this.add.graphics().setDepth(0);

    // Danger line (dashed)
    staticGfx.lineStyle(2, 0xef4444, 1);
    const dashLen = 10, gapLen = 5;
    for (let x = 0; x < CANVAS_W; x += dashLen + gapLen) {
      staticGfx.lineBetween(x, DANGER_Y, Math.min(x + dashLen, CANVAS_W), DANGER_Y);
    }

    // Base station
    staticGfx.fillStyle(0x444444);
    staticGfx.fillRect(CANVAS_W / 2 - 30, CANVAS_H - 40, 60, 40);
    staticGfx.fillStyle(0x666666);
    staticGfx.fillRect(CANVAS_W / 2 - 10, CANVAS_H - 60, 20, 20);

    // ── Dynamic graphics ──────────────────────────────────────────────────────
    this.particleGraphics = this.add.graphics().setDepth(6);
    this.hudGraphics      = this.add.graphics().setDepth(52);

    // ── HUD static labels ─────────────────────────────────────────────────────
    const hudDepth = 51;
    const lStyle = { fontFamily: 'Roboto', fontSize: '12px', color: '#9ca3af' };

    this.scoreText      = this.add.text(10, 10, 'Score: 0',    { fontFamily: 'Roboto', fontSize: '16px', fontStyle: 'bold', color: '#ffffff' }).setDepth(hudDepth);
    this.diffText       = this.add.text(10, 30, 'Diff: child', { ...lStyle }).setDepth(hudDepth);
    this.stageText      = this.add.text(10, 47, 'Stage 1/28',  { ...lStyle }).setDepth(hudDepth);
    this.stageScoreText = this.add.text(10, 64, 'Goal: 0/200', { ...lStyle }).setDepth(hudDepth);

    // BASE SHIELD label
    this.add.text(250, 8, 'BASE SHIELD', { fontFamily: 'Roboto', fontSize: '11px', color: '#9ca3af' }).setOrigin(0.5, 0).setDepth(hudDepth);

    // Lives label + count (right side)
    this.add.text(492, 8, 'Lives', { fontFamily: 'Roboto', fontSize: '12px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(1, 0).setDepth(hudDepth);
    this.livesCountText = this.add.text(492, 26, '10', { fontFamily: 'Roboto', fontSize: '12px', color: '#ffffff' }).setOrigin(1, 0).setDepth(hudDepth);
    this.add.text(492, 55, 'ESC to Exit', { fontFamily: 'Roboto', fontSize: '10px', color: '#6b7280' }).setOrigin(1, 0).setDepth(hudDepth);

    // Input echo at bottom
    this.inputEchoText = this.add.text(CANVAS_W / 2, CANVAS_H - 48, '', {
      fontFamily: 'Roboto',
      fontSize: '30px',
      fontStyle: 'bold',
      color: '#facc15',
      shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 2, fill: true },
    }).setOrigin(0.5, 0.5).setDepth(hudDepth);

    // ── Continue event (from StageMessageScene) ───────────────────────────────
    this.events.on('continue-game', this.onContinueGame, this);

    // ── Keyboard input ────────────────────────────────────────────────────────
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.cleanupAndGoMenu();
        return;
      }
      if (this.gameLogic.state !== 'playing') return;

      if (e.key === 'Backspace') {
        this.gameLogic.inputBuffer = this.gameLogic.inputBuffer.slice(0, -1);
        this.updateHUD();
        return;
      }
      if ((e.key >= '0' && e.key <= '9') || e.key === '-') {
        if (this.gameLogic.inputBuffer.length < 5) {
          this.gameLogic.inputBuffer += e.key;
          this.updateHUD();
        }
        return;
      }
      if (e.key === 'Enter' && this.gameLogic.inputBuffer.length > 0) {
        this.gameLogic.checkAnswer();
      }
    });

    // Initial HUD paint
    this.updateHUD();
  }

  update(_time: number, delta: number): void {
    if (this.gameLogic.state !== 'playing') return;

    this.gameLogic.update(delta);

    // ── Sync meteor text objects ──────────────────────────────────────────────
    const activeIds = new Set(this.gameLogic.meteors.map(m => m.id));

    this.meteorTexts.forEach((txt, id) => {
      if (!activeIds.has(id)) {
        txt.destroy();
        this.meteorTexts.delete(id);
      }
    });

    for (const m of this.gameLogic.meteors) {
      if (!this.meteorTexts.has(m.id)) {
        const color = GAME_CONFIG.colors[m.op] ?? '#ffffff';
        const txt = this.add.text(m.x, m.y, m.text, {
          fontFamily: 'Roboto',
          fontSize: '24px',
          fontStyle: '600',
          color,
          shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 4, fill: true },
        }).setOrigin(0.5, 0.5).setDepth(5);
        this.meteorTexts.set(m.id, txt);
      } else {
        this.meteorTexts.get(m.id)!.setPosition(m.x, m.y);
      }
    }

    // ── Draw particles ────────────────────────────────────────────────────────
    this.particleGraphics.clear();
    for (const p of this.gameLogic.particles) {
      const alpha = Math.max(0, Math.min(1, p.life));
      this.particleGraphics.fillStyle(colorToInt(p.color), alpha);
      this.particleGraphics.fillCircle(p.x, p.y, 4);
    }
  }

  // ── HUD update ────────────────────────────────────────────────────────────
  updateHUD(): void {
    const g = this.gameLogic;

    this.scoreText.setText(`Score: ${g.score}`);
    this.diffText.setText(`Diff: ${g.difficulty}`);
    this.stageText.setText(`Stage ${g.stage}/28`);
    this.stageScoreText.setText(`Goal: ${g.stageScore}/200`);
    this.livesCountText.setText(String(g.lives));
    this.inputEchoText.setText(g.inputBuffer);

    // Lives bar + shield blocks via hudGraphics
    this.hudGraphics.clear();

    // Lives bar background
    this.hudGraphics.fillStyle(0x374151);
    this.hudGraphics.fillRect(345, 39, 145, 10);

    // Lives bar fill
    const pct = Math.max(0, Math.min(1, g.lives / GAME_CONFIG.initialLives));
    const barColor = g.lives > 6 ? 0x22c55e : g.lives > 3 ? 0xeab308 : 0xef4444;
    this.hudGraphics.fillStyle(barColor);
    this.hudGraphics.fillRect(345, 39, Math.round(pct * 145), 10);

    // Shield blocks (5 × 16w × 22h, gapped, centered at x=250)
    const blockW = 16, blockH = 22, blockGap = 5;
    const totalW = GAME_CONFIG.stageShieldMax * blockW + (GAME_CONFIG.stageShieldMax - 1) * blockGap;
    const startX = 250 - totalW / 2;
    for (let i = 0; i < GAME_CONFIG.stageShieldMax; i++) {
      this.hudGraphics.fillStyle(i < g.shield ? 0x60a5fa : 0x374151);
      this.hudGraphics.fillRect(startX + i * (blockW + blockGap), 26, blockW, blockH);
    }
  }

  // ── Stage finish ──────────────────────────────────────────────────────────
  private handleFinishStage(success: boolean): void {
    this.scene.pause();
    this.scene.launch('StageMessageScene', {
      success,
      stage:          this.gameLogic.stage,
      stageIncorrect: this.gameLogic.stageIncorrect,
      score:          this.gameLogic.score,
      lives:          this.gameLogic.lives,
    });
  }

  // ── Game over (lives = 0) ─────────────────────────────────────────────────
  private handleGameOver(): void {
    this.scene.start('GameOverScene', {
      difficulty:     this.gameLogic.difficulty,
      score:          this.gameLogic.score,
      correctCount:   this.gameLogic.correctCount,
      incorrectCount: this.gameLogic.incorrectCount,
      finalPerfScore: this.gameLogic.finalPerfScore,
    });
  }

  // ── Called via events from StageMessageScene ──────────────────────────────
  private onContinueGame(): void {
    if (this.gameLogic.state === 'gameover') {
      // All 28 stages cleared – go to GameOverScene
      this.scene.start('GameOverScene', {
        difficulty:     this.gameLogic.difficulty,
        score:          this.gameLogic.score,
        correctCount:   this.gameLogic.correctCount,
        incorrectCount: this.gameLogic.incorrectCount,
        finalPerfScore: this.gameLogic.finalPerfScore,
      });
      return;
    }

    this.gameLogic.resumeFromMessage();

    // Destroy existing meteor texts (slate is clean after resume)
    this.meteorTexts.forEach(t => t.destroy());
    this.meteorTexts.clear();
    this.particleGraphics.clear();

    this.updateHUD();
    this.scene.resume();
  }

  private cleanupAndGoMenu(): void {
    this.meteorTexts.forEach(t => t.destroy());
    this.meteorTexts.clear();
    this.scene.stop('StageMessageScene');
    this.scene.start('MainMenuScene');
  }
}
