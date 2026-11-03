import type { DDAMathTier, Grade, MathOperation } from '@shared/types';

interface GradeConfig {
  /** Lifetime operation scores required to hold this grade. Empty for the entry grade. */
  requirements: Partial<Record<MathOperation, number>>;
  stageClearCorrectAnswers: number;
  cleanStageBonusPoints: number;
  baseFallSpeedPxSec: number;
  spawnRate: number;
  targetLatencyMs: number;
  dampingFactorAlpha: number;
  mathTier: DDAMathTier;
}

const DANGER_ZONE_HEIGHT_RATIO = 100 / 700;
const METEOR_SPAWN_HORIZONTAL_PADDING_RATIO = 60 / 700;
const MIN_METEOR_SPAWN_PADDING = 40;

export const GAME_CONFIG = {
  grades: {
    trainee: {
      requirements: {},
      stageClearCorrectAnswers: 7,
      cleanStageBonusPoints: 5,
      baseFallSpeedPxSec: 36,
      spawnRate: 2700,
      targetLatencyMs: 2600,
      dampingFactorAlpha: 0.12,
      mathTier: 1,
    },
    cadet: {
      requirements: { '+': 250, '-': 150 },
      stageClearCorrectAnswers: 10,
      cleanStageBonusPoints: 7,
      baseFallSpeedPxSec: 52,
      spawnRate: 2300,
      targetLatencyMs: 2300,
      dampingFactorAlpha: 0.13,
      mathTier: 2,
    },
    commander: {
      requirements: { '+': 750, '-': 550, '*': 250 },
      stageClearCorrectAnswers: 15,
      cleanStageBonusPoints: 10,
      baseFallSpeedPxSec: 72,
      spawnRate: 1900,
      targetLatencyMs: 2000,
      dampingFactorAlpha: 0.15,
      mathTier: 3,
    },
    'major-general': {
      requirements: { '+': 1250, '-': 1050, '*': 550, '/': 250 },
      stageClearCorrectAnswers: 20,
      cleanStageBonusPoints: 15,
      baseFallSpeedPxSec: 92,
      spawnRate: 1500,
      targetLatencyMs: 1700,
      dampingFactorAlpha: 0.17,
      mathTier: 4,
    },
  } as const satisfies Record<Grade, GradeConfig>,

  gradeOrder: ['trainee', 'cadet', 'commander', 'major-general'] as const,

  colors: {
    '+': '#4ade80', // Green
    '-': '#facc15', // Yellow
    '*': '#60a5fa', // Blue
    '/': '#d97706', // Brown/Orange
  } as Record<string, string>,

  dangerZone: 100, // px from bottom on the legacy 700px-tall layout
  initialLives: 3,
  stageShieldMax: 5,
  regularStageCount: 28, // stages to clear for a Regular Play victory
  streakRewardThreshold: 30, // correct answers in a row for +1 life (Regular Play only)
  scorePerCorrectAnswer: 1,
  scorePenaltyPerIncorrectAnswer: 1,

  CANVAS_WIDTH: 540,
  CANVAS_HEIGHT: 900,
};

export function getDangerZoneOffset(canvasHeight: number): number {
  return Math.round(canvasHeight * DANGER_ZONE_HEIGHT_RATIO);
}

export function getMeteorSpawnPadding(canvasWidth: number): number {
  return Math.max(MIN_METEOR_SPAWN_PADDING, Math.round(canvasWidth * METEOR_SPAWN_HORIZONTAL_PADDING_RATIO));
}
