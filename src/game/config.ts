import type { DDAMathTier, Grade } from '@shared/types';

interface GradeConfig {
  thresholdScore: number;
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
      thresholdScore: 0,
      stageClearCorrectAnswers: 7,
      cleanStageBonusPoints: 5,
      baseFallSpeedPxSec: 36,
      spawnRate: 2700,
      targetLatencyMs: 2600,
      dampingFactorAlpha: 0.12,
      mathTier: 1,
    },
    cadet: {
      thresholdScore: 101,
      stageClearCorrectAnswers: 10,
      cleanStageBonusPoints: 7,
      baseFallSpeedPxSec: 52,
      spawnRate: 2300,
      targetLatencyMs: 2300,
      dampingFactorAlpha: 0.13,
      mathTier: 2,
    },
    commander: {
      thresholdScore: 351,
      stageClearCorrectAnswers: 15,
      cleanStageBonusPoints: 10,
      baseFallSpeedPxSec: 72,
      spawnRate: 1900,
      targetLatencyMs: 2000,
      dampingFactorAlpha: 0.15,
      mathTier: 3,
    },
    'major-general': {
      thresholdScore: 751,
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

export function resolveGradeFromScore(score: number): Grade {
  let resolved: Grade = 'trainee';

  for (const grade of GAME_CONFIG.gradeOrder) {
    if (score >= GAME_CONFIG.grades[grade].thresholdScore) {
      resolved = grade;
    }
  }

  return resolved;
}
