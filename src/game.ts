/**
 * Phaser Game Module
 *
 * This module initializes and manages the Phaser game instance.
 * It provides functions to start, continue, and return to the game menu.
 * It also handles scene transitions and game state management.
 */
import type { Meteor, Particle, Difficulty, GameState } from './types';
import { GAME_CONFIG } from './config';
import { generateMath } from './utilities/mathGen';
import { gameStore } from './store/useGameStore';

export interface GameCallbacks {
  onHUDUpdate: () => void;
  onFinishStage: (success: boolean) => void;
  onGameOver: () => void;
  onShake: () => void;
}

export class Game {
  state: GameState = 'start';

  lives: number = GAME_CONFIG.initialLives;
  shield: number = GAME_CONFIG.stageShieldMax;
  score: number = 0;
  stage: number = 1;
  stageScore: number = 0;

  difficulty: Difficulty = 'child';
  canvasHeight: number = GAME_CONFIG.CANVAS_HEIGHT;

  meteors: Meteor[] = [];
  particles: Particle[] = [];

  inputBuffer: string = '';
  correctCount: number = 0;
  incorrectCount: number = 0;
  stageIncorrect: number = 0;

  lastSpawn: number = 0;
  scoreAtStageStart: number = 0;
  livesAtStageStart: number = GAME_CONFIG.initialLives;
  finalPerfScore: number = 0;

  // Tracks whether the last stage transition was a success (used by resumeFromMessage)
  private lastStageSuccess: boolean = true;
  private pendingGameOver: boolean = false;

  private readonly cb: GameCallbacks;

  constructor(callbacks: GameCallbacks) {
    this.cb = callbacks;
  }

  reset(): void {
    this.lives = GAME_CONFIG.initialLives;
    this.shield = GAME_CONFIG.stageShieldMax;
    this.score = 0;
    this.stage = 1;
    this.stageScore = 0;
    this.correctCount = 0;
    this.incorrectCount = 0;
    this.stageIncorrect = 0;
    this.meteors = [];
    this.particles = [];
    this.inputBuffer = '';
    this.scoreAtStageStart = 0;
    this.livesAtStageStart = GAME_CONFIG.initialLives;
    this.lastStageSuccess = true;
    this.pendingGameOver = false;
    this.canvasHeight = GAME_CONFIG.CANVAS_HEIGHT;
    this.state = 'start';
    this.syncStore();
  }

  setCanvasHeight(height: number): void {
    this.canvasHeight = height;
  }

  spawnMeteor(): void {
    const expr = generateMath(this.stage);
    const settings = GAME_CONFIG.difficulties[this.difficulty];
    const speedMod = 1 + this.stage * 0.05;

    this.meteors.push({
      x: Math.random() * (GAME_CONFIG.CANVAS_WIDTH - 120) + 60,
      y: -50,
      text: expr.text,
      answer: expr.answer,
      op: expr.op,
      speed: settings.speed * speedMod,
      id: Math.random(),
    });
  }

  createExplosion(x: number, y: number, color: string): void {
    for (let i = 0; i < 15; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 5,
        vy: (Math.random() - 0.5) * 5,
        life: 1.0,
        color,
      });
    }
  }

  createConfetti(): void {
    for (let i = 0; i < 50; i++) {
      this.particles.push({
        x: GAME_CONFIG.CANVAS_WIDTH / 2,
        y: GAME_CONFIG.CANVAS_HEIGHT / 2,
        vx: (Math.random() - 0.5) * 15,
        vy: (Math.random() - 0.5) * 15,
        life: 2.0,
        color: '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0'),
      });
    }
  }

  checkAnswer(): void {
    const val = parseInt(this.inputBuffer, 10);
    if (isNaN(val)) return;

    const hitIndex = this.meteors.findIndex(m => m.answer === val);

    if (hitIndex !== -1) {
      const m = this.meteors[hitIndex];
      const hitColor = GAME_CONFIG.colors[m.op] ?? '#fff';
      this.createExplosion(m.x, m.y, hitColor);
      this.meteors.splice(hitIndex, 1);
      this.score += 10;
      this.stageScore += 10;
      this.correctCount++;
      this.inputBuffer = '';

      if (this.stageScore >= 200) {
        this.finishStage(true);
        return;
      }
    } else {
      this.incorrectCount++;
      this.stageIncorrect++;
      this.inputBuffer = '';
      this.cb.onShake();
    }

    this.cb.onHUDUpdate();
    this.syncStore();
  }

  hitBase(): void {
    this.shield--;
    this.cb.onHUDUpdate();
    this.syncStore();
    if (this.shield <= 0) {
      this.failStage();
    }
  }

  failStage(): void {
    this.lives--;
    this.cb.onHUDUpdate();
    this.syncStore();
    if (this.lives <= 0) {
      this.gameOver();
    } else {
      this.finishStage(false);
    }
  }

  finishStage(success: boolean): void {
    this.state = 'message';
    this.lastStageSuccess = success;

    if (success) {
      this.createConfetti();
      if (this.stageIncorrect === 0) {
        this.lives += 1; // Perfect bonus – applied before the UI callback reads lives
      }
      // Notify UI (game.stage still points to the cleared stage at this moment)
      this.cb.onFinishStage(true);
      this.syncStore();

      // Commit progress checkpoints
      this.stage++;
      this.scoreAtStageStart = this.score;
      this.livesAtStageStart = this.lives;

      if (this.stage > 28) {
        // Pre-calculate final score; let continueFromMessage handle the transition
        const total = this.correctCount + this.incorrectCount;
        const accuracy = total > 0 ? (this.correctCount / total) * 100 : 0;
        this.finalPerfScore = parseFloat(accuracy.toFixed(2));
        this.pendingGameOver = true;
      }
    } else {
      this.cb.onFinishStage(false);
      this.syncStore();
    }
  }

  resumeFromMessage(): void {
    if (this.pendingGameOver) {
      this.pendingGameOver = false;
      this.gameOver(true);
      return;
    }

    if (this.state === 'gameover') return;

    this.meteors = [];
    this.particles = [];
    this.inputBuffer = '';
    this.stageScore = 0;
    this.stageIncorrect = 0;
    this.shield = GAME_CONFIG.stageShieldMax;

    if (!this.lastStageSuccess) {
      // Revert score; lives were already decremented in failStage.
      // Update the lives checkpoint so a second failure doesn't restore them.
      this.score = this.scoreAtStageStart;
      this.livesAtStageStart = this.lives;
    }

    this.state = 'playing';
    this.cb.onHUDUpdate();
    this.syncStore();
  }

  gameOver(win = false): void {
    void win; // reserved for future win screen differentiation
    this.state = 'gameover';

    const total = this.correctCount + this.incorrectCount;
    const accuracy = total > 0 ? (this.correctCount / total) * 100 : 0;
    this.finalPerfScore = parseFloat(accuracy.toFixed(2));

    this.syncStore();
    this.cb.onGameOver();
  }

  update(_dt: number): void {
    const settings = GAME_CONFIG.difficulties[this.difficulty];

    if (Date.now() - this.lastSpawn > settings.spawnRate) {
      this.spawnMeteor();
      this.lastSpawn = Date.now();
    }

    const dangerY = this.canvasHeight - GAME_CONFIG.dangerZone;

    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const m = this.meteors[i];
      m.y += m.speed;
      if (m.y > dangerY) {
        this.meteors.splice(i, 1);
        this.hitBase();
        return; // Re-evaluate after shield/life state change
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.05;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  private syncStore(): void {
    gameStore.getState().syncHUD({
      difficulty: this.difficulty,
      score: this.score,
      lives: this.lives,
      shield: this.shield,
      stage: this.stage,
      stageScore: this.stageScore,
      inputBuffer: this.inputBuffer,
      correctCount: this.correctCount,
      incorrectCount: this.incorrectCount,
      finalPerfScore: this.finalPerfScore,
    });
  }
}
