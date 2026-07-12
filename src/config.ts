import type { Difficulty } from './types';

interface DifficultyConfig {
  speed: number;
  spawnRate: number;
}

export const GAME_CONFIG = {
  difficulties: {
    child: { speed: 0.5, spawnRate: 2500 },
    student: { speed: 1.0, spawnRate: 1800 },
    adult: { speed: 1.8, spawnRate: 1200 },
  } as Record<Difficulty, DifficultyConfig>,

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
