/**
 * Phaser Game Module
 *
 * This module initializes and manages the Phaser game instance.
 * It provides functions to start, continue, and return to the game menu.
 * It also handles scene transitions and game state management.
 */
import { gameStore } from '@store/useGameStore';
import type {
  GameHistoryEntry,
  GameOverReason,
  GameState,
  Grade,
  MathOperation,
  Meteor,
  OperationHistoryStat,
  Particle,
} from '@shared/types';

import { GAME_CONFIG } from './config';
import { DDAController, type DDAConfiguration } from './utilities/DDAController';
import { generateMath } from './utilities/mathGen';

export interface GameCallbacks {
  onHUDUpdate: () => void;
  onFinishStage: (success: boolean) => void;
  onStreakReward: (lives: number) => void;
  onGameOver: (reason: GameOverReason) => void;
  onShake: () => void;
}

export interface PrematureEndSnapshot {
  grade: Grade;
  score: number;
  stage: number;
  correctCount: number;
  incorrectCount: number;
  finalPerfScore: number;
  historyEntry: GameHistoryEntry;
}

type RoundOperationTelemetry = Record<MathOperation, {
  attempts: number;
  incorrect: number;
  totalLatencyMs: number;
}>;

const MATH_OPERATIONS: MathOperation[] = ['+', '-', '*', '/'];
const GUEST_HISTORY_BUCKET = '__guest__';

function createEmptyRoundOperationTelemetry(): RoundOperationTelemetry {
  return {
    '+': { attempts: 0, incorrect: 0, totalLatencyMs: 0 },
    '-': { attempts: 0, incorrect: 0, totalLatencyMs: 0 },
    '*': { attempts: 0, incorrect: 0, totalLatencyMs: 0 },
    '/': { attempts: 0, incorrect: 0, totalLatencyMs: 0 },
  };
}

function cloneRoundOperationTelemetry(source: RoundOperationTelemetry): RoundOperationTelemetry {
  return {
    '+': { ...source['+'] },
    '-': { ...source['-'] },
    '*': { ...source['*'] },
    '/': { ...source['/'] },
  };
}

function isMathOperation(value: unknown): value is MathOperation {
  return value === '+' || value === '-' || value === '*' || value === '/';
}

function getLifetimeScoreBeforeCurrentRun(
  activeUsername: string | null,
  gameHistoryByProfile: Record<string, GameHistoryEntry[]>,
): number {
  const profileKey = activeUsername ?? GUEST_HISTORY_BUCKET;
  return (gameHistoryByProfile[profileKey] ?? []).reduce((sum, entry) => sum + entry.finalScore, 0);
}

export class Game {
  state: GameState = 'start';

  lives: number = GAME_CONFIG.initialLives;
  shield: number = GAME_CONFIG.stageShieldMax;
  score: number = 0;
  stage: number = 1;
  stageScore: number = 0;

  grade: Grade = 'trainee';
  canvasHeight: number = GAME_CONFIG.CANVAS_HEIGHT;

  meteors: Meteor[] = [];
  particles: Particle[] = [];

  inputBuffer: string = '';
  correctCount: number = 0;
  incorrectCount: number = 0;
  stageIncorrect: number = 0;
  stageCorrect: number = 0;
  streak: number = 0;

  lastSpawn: number = 0;
  scoreAtStageStart: number = 0;
  livesAtStageStart: number = GAME_CONFIG.initialLives;
  finalPerfScore: number = 0;
  roundResolvedAnswerCount: number = 0;
  roundTotalAnswerLatencyMs: number = 0;
  roundOperationTelemetry: RoundOperationTelemetry = createEmptyRoundOperationTelemetry();
  correctCountAtStageStart: number = 0;
  incorrectCountAtStageStart: number = 0;
  roundResolvedAnswerCountAtStageStart: number = 0;
  roundTotalAnswerLatencyMsAtStageStart: number = 0;
  roundOperationTelemetryAtStageStart: RoundOperationTelemetry = createEmptyRoundOperationTelemetry();

  // Tracks whether the last stage transition was a success (used by resumeFromMessage)
  private lastStageSuccess: boolean = true;
  private pendingStageClearAfterStreakReward: boolean = false;
  private pendingGameOver: boolean = false;
  private pendingGameOverReason: GameOverReason = 'lives-depleted';
  private lifetimeScoreAtRunStart: number = 0;
  private dda: DDAController;

  private readonly cb: GameCallbacks;

  constructor(callbacks: GameCallbacks) {
    this.cb = callbacks;
    this.dda = new DDAController(getDDAConfigForGrade(this.grade));
  }

  setGrade(grade: Grade): void {
    this.applyGradeBaseline(grade);
  }

  reset(startingScore = 0): void {
    const storeState = gameStore.getState();

    this.lives = GAME_CONFIG.initialLives;
    this.shield = GAME_CONFIG.stageShieldMax;
    this.score = Math.max(0, startingScore);
    this.lifetimeScoreAtRunStart = getLifetimeScoreBeforeCurrentRun(
      storeState.activeUsername,
      storeState.gameHistoryByProfile,
    );
    this.stage = 1;
    this.stageScore = 0;
    this.correctCount = 0;
    this.incorrectCount = 0;
    this.stageIncorrect = 0;
    this.stageCorrect = 0;
    this.streak = 0;
    this.meteors = [];
    this.particles = [];
    this.inputBuffer = '';
    this.roundResolvedAnswerCount = 0;
    this.roundTotalAnswerLatencyMs = 0;
    this.roundOperationTelemetry = createEmptyRoundOperationTelemetry();
    this.scoreAtStageStart = 0;
    this.livesAtStageStart = GAME_CONFIG.initialLives;
    this.lastStageSuccess = true;
    this.pendingStageClearAfterStreakReward = false;
    this.pendingGameOver = false;
    this.pendingGameOverReason = 'lives-depleted';
    this.applyGradeBaseline('trainee');
    this.syncGradeFromScore();
    this.captureStageCheckpoint();
    this.canvasHeight = GAME_CONFIG.CANVAS_HEIGHT;
    this.state = 'start';
    this.syncStore();
  }

  setCanvasHeight(height: number): void {
    this.canvasHeight = height;
  }

  spawnMeteor(): void {
    const difficultyState = this.dda.getDifficultyState();
    const expr = generateMath(this.stage, difficultyState.mathTier);

    this.meteors.push({
      x: Math.random() * (GAME_CONFIG.CANVAS_WIDTH - 120) + 60,
      y: -50,
      text: expr.text,
      answer: expr.answer,
      op: expr.op,
      speed: difficultyState.effectiveFallSpeed,
      id: Math.random(),
      spawnTimeMs: Date.now(),
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
      const latencyMs = Math.max(0, Date.now() - m.spawnTimeMs);
      const hitColor = GAME_CONFIG.colors[m.op] ?? '#fff';
      this.createExplosion(m.x, m.y, hitColor);
      this.meteors.splice(hitIndex, 1);
      this.dda.recordSample({ isCorrect: true, latencyMs, baseHit: false });
      this.recordOperationAttempt(m.op, latencyMs, false);
      this.score += GAME_CONFIG.scorePerCorrectAnswer;
      this.stageScore += 1;
      this.stageCorrect += 1;
      this.correctCount++;
      this.streak += 1;
      this.inputBuffer = '';
      this.syncGradeFromScore();

      let streakRewardTriggered = false;

      if (this.streak >= 30) {
        this.lives += 1;
        this.streak = 0;
        streakRewardTriggered = true;
      }

      const stageTarget = GAME_CONFIG.grades[this.grade].stageClearCorrectAnswers;
      if (this.stageCorrect >= stageTarget) {
        if (streakRewardTriggered) {
          this.pendingStageClearAfterStreakReward = true;
          this.pauseForStreakReward();
          return;
        }
        this.finishStage(true);
        return;
      }

      if (streakRewardTriggered) {
        this.pauseForStreakReward();
        return;
      }
    } else {
      const oldestMeteor = this.getOldestMeteor();
      const latencyMs = oldestMeteor ? Math.max(0, Date.now() - oldestMeteor.spawnTimeMs) : 3000;
      this.dda.recordSample({
        isCorrect: false,
        latencyMs,
        baseHit: false,
      });
      this.recordOperationAttempt(oldestMeteor?.op, latencyMs, true);
      this.incorrectCount++;
      this.stageIncorrect++;
      this.streak = 0;
      this.score = Math.max(0, this.score - GAME_CONFIG.scorePenaltyPerIncorrectAnswer);
      this.syncGradeFromScore();
      this.inputBuffer = '';
      this.cb.onShake();
    }

    this.cb.onHUDUpdate();
    this.syncStore();
  }

  hitBase(impactMeteor?: Meteor): void {
    const latencyMs = impactMeteor ? Math.max(0, Date.now() - impactMeteor.spawnTimeMs) : 0;
    this.dda.recordSample({ isCorrect: false, latencyMs, baseHit: true });
    this.recordOperationAttempt(impactMeteor?.op, latencyMs, true);
    this.streak = 0;
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
      this.pendingGameOver = true;
      this.pendingGameOverReason = 'lives-depleted';
    }

    this.finishStage(false);
  }

  finishStage(success: boolean): void {
    this.state = 'message';
    this.lastStageSuccess = success;

    if (success) {
      this.createConfetti();

      if (this.stageIncorrect === 0) {
        this.score += GAME_CONFIG.grades[this.grade].cleanStageBonusPoints;
        this.syncGradeFromScore();
      }
      // Notify UI (game.stage still points to the cleared stage at this moment)
      this.cb.onFinishStage(true);
      this.syncStore();

      // Commit progress checkpoints
      this.stage++;
      this.scoreAtStageStart = this.score;
      this.livesAtStageStart = this.lives;
      this.captureStageCheckpoint();

      if (this.stage > 28) {
        // Pre-calculate final score; let continueFromMessage handle the transition
        const total = this.correctCount + this.incorrectCount;
        const accuracy = total > 0 ? (this.correctCount / total) * 100 : 0;
        this.finalPerfScore = parseFloat(accuracy.toFixed(2));
        this.pendingGameOver = true;
        this.pendingGameOverReason = 'victory';
      }
    } else {
      this.meteors = [];
      this.cb.onFinishStage(false);
      this.syncStore();
    }
  }

  resumeFromMessage(): void {
    if (this.pendingGameOver) {
      this.pendingGameOver = false;
      this.gameOver(this.pendingGameOverReason === 'victory');
      return;
    }

    if (this.state === 'gameover') return;

    this.meteors = [];
    this.particles = [];
    this.inputBuffer = '';
    this.stageScore = 0;
    this.stageIncorrect = 0;
    this.stageCorrect = 0;
    this.shield = GAME_CONFIG.stageShieldMax;

    if (!this.lastStageSuccess) {
      // Revert score; lives were already decremented in failStage.
      // Update the lives checkpoint so a second failure doesn't restore them.
      this.score = this.scoreAtStageStart;
      this.livesAtStageStart = this.lives;
      this.syncGradeFromScore();
    }

    this.state = 'playing';
    this.cb.onHUDUpdate();
    this.syncStore();
  }

  pauseForManualEndPrompt(): void {
    if (this.state === 'gameover' || this.state === 'message') {
      return;
    }

    this.state = 'paused';
    this.cb.onHUDUpdate();
    this.syncStore();
  }

  resumeFromManualPause(): void {
    if (this.state !== 'paused') {
      return;
    }

    this.state = 'playing';
    this.cb.onHUDUpdate();
    this.syncStore();
  }

  buildPrematureEndSnapshot(): PrematureEndSnapshot {
    const shouldRollbackCurrentStage = this.state === 'playing' || this.state === 'paused';

    if (shouldRollbackCurrentStage) {
      this.rollbackCurrentStageProgress();
    }

    const total = this.correctCount + this.incorrectCount;
    const accuracy = total > 0 ? (this.correctCount / total) * 100 : 0;
    this.finalPerfScore = parseFloat(accuracy.toFixed(2));

    const historyEntry = this.buildGameHistoryEntry();

    this.syncStore();

    return {
      grade: this.grade,
      score: this.score,
      stage: this.stage,
      correctCount: this.correctCount,
      incorrectCount: this.incorrectCount,
      finalPerfScore: this.finalPerfScore,
      historyEntry,
    };
  }

  resumeAfterStreakReward(): void {
    if (this.state !== 'paused') {
      return;
    }

    if (this.pendingStageClearAfterStreakReward) {
      this.pendingStageClearAfterStreakReward = false;
      this.finishStage(true);
      return;
    }

    this.state = 'playing';
    this.cb.onHUDUpdate();
    this.syncStore();
  }

  gameOver(win = false): void {
    this.state = 'gameover';

    const total = this.correctCount + this.incorrectCount;
    const accuracy = total > 0 ? (this.correctCount / total) * 100 : 0;
    this.finalPerfScore = parseFloat(accuracy.toFixed(2));
    const historyEntry = this.buildGameHistoryEntry();

    gameStore.getState().addGameHistory(historyEntry);

    this.syncStore();
    this.cb.onGameOver(win ? 'victory' : 'lives-depleted');
  }

  update(dt: number): void {
    const settings = GAME_CONFIG.grades[this.grade];
    const difficultyState = this.dda.getDifficultyState();

    if (
      Date.now() - this.lastSpawn > settings.spawnRate &&
      this.meteors.length < difficultyState.maxActiveMeteors
    ) {
      this.spawnMeteor();
      this.lastSpawn = Date.now();
    }

    const dangerY = this.canvasHeight - GAME_CONFIG.dangerZone;

    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const m = this.meteors[i];
      const normalizedY = Math.max(0, Math.min(1, m.y / dangerY));
      const tickSpeedPxSec = this.dda.getMeteorTickSpeed(normalizedY);
      m.speed = tickSpeedPxSec;
      m.y += tickSpeedPxSec * (dt / 1000);
      if (m.y > dangerY) {
        this.meteors.splice(i, 1);
        this.hitBase(m);
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
      grade: this.grade,
      score: this.score,
      lives: this.lives,
      shield: this.shield,
      stage: this.stage,
      stageScore: this.stageScore,
      inputBuffer: this.inputBuffer,
      correctCount: this.correctCount,
      incorrectCount: this.incorrectCount,
      streak: this.streak,
      finalPerfScore: this.finalPerfScore,
      ddaHeatState: this.dda.getDifficultyState().heatState,
      ddaMathTier: this.dda.getDifficultyState().mathTier,
      ddaSpeedMultiplier: this.dda.getDifficultyState().fallSpeedMultiplier,
      ddaIsCooloffActive: this.dda.getDifficultyState().isCooloffActive,
    });
  }

  private pauseForStreakReward(): void {
    this.state = 'paused';
    this.cb.onHUDUpdate();
    this.syncStore();
    this.cb.onStreakReward(this.lives);
  }

  private syncGradeFromScore(): void {
    const nextGrade = resolveGradeFromScore(this.getLifetimeProgressScore());

    if (nextGrade === this.grade) {
      return;
    }

    this.applyGradeBaseline(nextGrade);
  }

  private applyGradeBaseline(grade: Grade): void {
    this.grade = grade;
    this.dda = new DDAController(getDDAConfigForGrade(grade));
  }

  private getLifetimeProgressScore(): number {
    return Math.max(0, this.lifetimeScoreAtRunStart + this.score);
  }

  private getOldestMeteor(): Meteor | null {
    if (this.meteors.length === 0) {
      return null;
    }

    return this.meteors.reduce((oldest, meteor) => {
      return meteor.spawnTimeMs < oldest.spawnTimeMs ? meteor : oldest;
    }, this.meteors[0]);
  }

  private recordOperationAttempt(op: unknown, latencyMs: number, isIncorrect: boolean): void {
    this.roundResolvedAnswerCount += 1;
    this.roundTotalAnswerLatencyMs += Math.max(0, latencyMs);

    if (!isMathOperation(op)) {
      return;
    }

    const operationTelemetry = this.roundOperationTelemetry[op];
    operationTelemetry.attempts += 1;
    operationTelemetry.totalLatencyMs += Math.max(0, latencyMs);

    if (isIncorrect) {
      operationTelemetry.incorrect += 1;
    }
  }

  private buildOperationHistoryStats(): Record<MathOperation, OperationHistoryStat> {
    const operationStats: Record<MathOperation, OperationHistoryStat> = {
      '+': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
      '-': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
      '*': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
      '/': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
    };

    for (const op of MATH_OPERATIONS) {
      const telemetry = this.roundOperationTelemetry[op];
      operationStats[op] = {
        attempts: telemetry.attempts,
        incorrect: telemetry.incorrect,
        avgTimeMs: telemetry.attempts > 0
          ? Math.round(telemetry.totalLatencyMs / telemetry.attempts)
          : 0,
      };
    }

    return operationStats;
  }

  private buildGameHistoryEntry(): GameHistoryEntry {
    const averageAnswerTimeMs = this.roundResolvedAnswerCount > 0
      ? Math.round(this.roundTotalAnswerLatencyMs / this.roundResolvedAnswerCount)
      : 0;
    const operationStats = this.buildOperationHistoryStats();

    return {
      key: `game_history_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`,
      playedAt: Date.now(),
      correctAnswers: this.correctCount,
      incorrectAnswers: this.incorrectCount,
      averageAnswerTimeMs,
      mostProblematicOperation: this.resolveMostProblematicOperation(operationStats),
      operationStats,
      gradeAtFinish: this.grade,
      finalScore: this.score,
      finalPerfScore: this.finalPerfScore,
    };
  }

  private captureStageCheckpoint(): void {
    this.correctCountAtStageStart = this.correctCount;
    this.incorrectCountAtStageStart = this.incorrectCount;
    this.roundResolvedAnswerCountAtStageStart = this.roundResolvedAnswerCount;
    this.roundTotalAnswerLatencyMsAtStageStart = this.roundTotalAnswerLatencyMs;
    this.roundOperationTelemetryAtStageStart = cloneRoundOperationTelemetry(this.roundOperationTelemetry);
  }

  private rollbackCurrentStageProgress(): void {
    this.score = this.scoreAtStageStart;
    this.lives = this.livesAtStageStart;
    this.correctCount = this.correctCountAtStageStart;
    this.incorrectCount = this.incorrectCountAtStageStart;
    this.roundResolvedAnswerCount = this.roundResolvedAnswerCountAtStageStart;
    this.roundTotalAnswerLatencyMs = this.roundTotalAnswerLatencyMsAtStageStart;
    this.roundOperationTelemetry = cloneRoundOperationTelemetry(this.roundOperationTelemetryAtStageStart);
    this.stageScore = 0;
    this.stageCorrect = 0;
    this.stageIncorrect = 0;
    this.streak = 0;
    this.meteors = [];
    this.particles = [];
    this.inputBuffer = '';
    this.shield = GAME_CONFIG.stageShieldMax;
    this.pendingStageClearAfterStreakReward = false;
    this.pendingGameOver = false;
    this.pendingGameOverReason = 'lives-depleted';
    this.syncGradeFromScore();
  }

  private resolveMostProblematicOperation(
    operationStats: Record<MathOperation, OperationHistoryStat>,
  ): MathOperation | null {
    let selectedOp: MathOperation | null = null;
    let selectedErrorRate = -1;
    let selectedIncorrect = -1;
    let selectedAvgTimeMs = -1;

    for (const op of MATH_OPERATIONS) {
      const stat = operationStats[op];

      if (stat.attempts === 0) {
        continue;
      }

      const errorRate = stat.incorrect / stat.attempts;
      const isBetter =
        errorRate > selectedErrorRate
        || (errorRate === selectedErrorRate && stat.incorrect > selectedIncorrect)
        || (
          errorRate === selectedErrorRate
          && stat.incorrect === selectedIncorrect
          && stat.avgTimeMs > selectedAvgTimeMs
        );

      if (isBetter) {
        selectedOp = op;
        selectedErrorRate = errorRate;
        selectedIncorrect = stat.incorrect;
        selectedAvgTimeMs = stat.avgTimeMs;
      }
    }

    return selectedOp;
  }
}

function getDDAConfigForGrade(grade: Grade): Partial<DDAConfiguration> {
  const settings = GAME_CONFIG.grades[grade];

  return {
    targetLatencyMs: settings.targetLatencyMs,
    dampingFactorAlpha: settings.dampingFactorAlpha,
    baseFallSpeedPxSec: settings.baseFallSpeedPxSec,
    startingMathTier: settings.mathTier,
  };
}

function resolveGradeFromScore(score: number): Grade {
  let resolved: Grade = 'trainee';

  for (const grade of GAME_CONFIG.gradeOrder) {
    if (score >= GAME_CONFIG.grades[grade].thresholdScore) {
      resolved = grade;
    }
  }

  return resolved;
}
