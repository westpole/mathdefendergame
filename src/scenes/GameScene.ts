import Phaser from 'phaser';
import { Game } from '../game';
import { GAME_CONFIG } from '../config';
import { gameStore } from '../store/useGameStore';
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
    gameStore.getState().startPlaying();
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

    // Input echo at bottom
    this.inputEchoText = this.add.text(CANVAS_W / 2, CANVAS_H - 48, '', {
      fontFamily: 'Roboto',
      fontSize: '30px',
      fontStyle: 'bold',
      color: '#facc15',
      shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 2, fill: true },
    }).setOrigin(0.5, 0.5).setDepth(51);

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
    this.inputEchoText.setText(this.gameLogic.inputBuffer);
  }

  // ── Stage finish ──────────────────────────────────────────────────────────
  private handleFinishStage(success: boolean): void {
    gameStore.getState().showStageMessage({
      success,
      stage:          this.gameLogic.stage,
      stageIncorrect: this.gameLogic.stageIncorrect,
      score:          this.gameLogic.score,
      lives:          this.gameLogic.lives,
    });
  }

  // ── Game over (lives = 0) ─────────────────────────────────────────────────
  private handleGameOver(): void {
    gameStore.getState().showGameOver({
      difficulty:     this.gameLogic.difficulty,
      score:          this.gameLogic.score,
      correctCount:   this.gameLogic.correctCount,
      incorrectCount: this.gameLogic.incorrectCount,
      finalPerfScore: this.gameLogic.finalPerfScore,
    });
  }

  public continueFromOverlay(): void {
    this.gameLogic.resumeFromMessage();
    this.clearTransientRenderables();
    this.updateHUD();

    if (this.gameLogic.state !== 'gameover') {
      gameStore.getState().startPlaying();
    }
  }

  private cleanupAndGoMenu(): void {
    this.clearTransientRenderables();
    gameStore.getState().returnToMenu();
    this.scene.stop();
  }

  private clearTransientRenderables(): void {
    this.meteorTexts.forEach(t => t.destroy());
    this.meteorTexts.clear();
    this.particleGraphics.clear();
  }
}
