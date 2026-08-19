/**
 * Phaser Game Scene Module
 *
 * This module defines the main game scene for the Phaser game.
 * It handles the game logic, rendering, and user input during gameplay.
 * It also manages the HUD and transitions between different game states.
 */
import Phaser from 'phaser';

import { Game } from '@game/main';
import { GAME_CONFIG } from '@game/config';
import { gameStore } from '@store/useGameStore';
import type { GameOverReason, Grade } from '@shared/types';

function colorToInt(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

export class GameScene extends Phaser.Scene {
  gameLogic!: Game;

  private meteorTexts: Map<number, Phaser.GameObjects.Text> = new Map();
  private particleGraphics!: Phaser.GameObjects.Graphics;
  private streakRewardTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly handleKeyDown = (e: KeyboardEvent): void => {
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
  };

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data?: { grade?: Grade; score?: number }): void {
    this.gameLogic = new Game({
      onHUDUpdate: () => this.updateHUD(),
      onFinishStage: (success) => this.handleFinishStage(success),
      onStreakReward: (lives) => this.handleStreakReward(lives),
      onGameOver: (reason) => this.handleGameOver(reason),
      onShake: () => this.cameras.main.shake(500, 0.01),
    });
    this.gameLogic.reset(data?.score ?? 0);
    this.gameLogic.setGrade(data?.grade ?? 'trainee');
    this.gameLogic.state = 'playing';
    this.gameLogic.lastSpawn = Date.now();
    gameStore.getState().startPlaying();
  }

  create(): void {
    this.meteorTexts = new Map();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);

    // ── Dynamic graphics ──────────────────────────────────────────────────────
    this.particleGraphics = this.add.graphics().setDepth(6);

    // ── Keyboard input ────────────────────────────────────────────────────────
    this.input.keyboard?.off('keydown', this.handleKeyDown, this);
    this.input.keyboard?.on('keydown', this.handleKeyDown, this);

    // ── Window resize listener ────────────────────────────────────────────────
    this.scale.on('resize', this.handleResize, this);
    this.gameLogic.setCanvasHeight(this.scale.height);

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
    gameStore.getState().syncHUD({
      inputBuffer: this.gameLogic.inputBuffer,
    });
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
  private handleGameOver(reason: GameOverReason): void {
    if (reason === 'lives-depleted') {
      gameStore.getState().returnToMenu();
      this.scene.stop();
      return;
    }

    gameStore.getState().showGameOver({
      grade:          this.gameLogic.grade,
      score:          this.gameLogic.score,
      correctCount:   this.gameLogic.correctCount,
      incorrectCount: this.gameLogic.incorrectCount,
      finalPerfScore: this.gameLogic.finalPerfScore,
    });
  }

  private handleStreakReward(lives: number): void {
    if (this.streakRewardTimer) {
      clearTimeout(this.streakRewardTimer);
      this.streakRewardTimer = null;
    }

    gameStore.getState().showStreakRewardMessage({
      message: `Congratulations! +1 life awarded for a 30 streak. Lives: ${lives}`,
    });

    this.streakRewardTimer = setTimeout(() => {
      this.streakRewardTimer = null;
      gameStore.getState().clearStreakRewardMessage();
      this.gameLogic.resumeAfterStreakReward();

      if (this.gameLogic.state === 'playing') {
        gameStore.getState().startPlaying();
      }
    }, 3000);
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
    this.clearStreakRewardTimer();
    this.clearTransientRenderables();
    gameStore.getState().returnToMenu();
    this.scene.stop();
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    this.gameLogic.setCanvasHeight(gameSize.height);
  }

  private handleShutdown(): void {
    this.input.keyboard?.off('keydown', this.handleKeyDown, this);
    this.scale.off('resize', this.handleResize, this);
    this.clearStreakRewardTimer();
    gameStore.getState().clearStreakRewardMessage();
    this.clearTransientRenderables();
  }

  private clearStreakRewardTimer(): void {
    if (!this.streakRewardTimer) {
      return;
    }

    clearTimeout(this.streakRewardTimer);
    this.streakRewardTimer = null;
  }

  private clearTransientRenderables(): void {
    this.meteorTexts.forEach(t => t.destroy());
    this.meteorTexts.clear();
    this.particleGraphics.clear();
  }
}
