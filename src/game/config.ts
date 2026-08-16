import type { DDAMathTier, Grade } from '@shared/types';

interface GradeConfig {
  thresholdScore: number;
  baseFallSpeedPxSec: number;
  spawnRate: number;
  targetLatencyMs: number;
  dampingFactorAlpha: number;
  mathTier: DDAMathTier;
}

export const GAME_CONFIG = {
  grades: {
    trainee: {
      thresholdScore: 0,
      baseFallSpeedPxSec: 36,
      spawnRate: 2700,
      targetLatencyMs: 2600,
      dampingFactorAlpha: 0.12,
      mathTier: 1,
    },
    cadet: {
      thresholdScore: 150,
      baseFallSpeedPxSec: 52,
      spawnRate: 2300,
      targetLatencyMs: 2300,
      dampingFactorAlpha: 0.13,
      mathTier: 2,
    },
    commander: {
      thresholdScore: 250,
      baseFallSpeedPxSec: 72,
      spawnRate: 1900,
      targetLatencyMs: 2000,
      dampingFactorAlpha: 0.15,
      mathTier: 3,
    },
    'major-general': {
      thresholdScore: 350,
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

  dangerZone: 100, // px from bottom
  initialLives: 10,
  stageShieldMax: 5,

  CANVAS_WIDTH: 700,
  CANVAS_HEIGHT: 700,
};
