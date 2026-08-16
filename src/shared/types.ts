export interface Meteor {
  x: number;
  y: number;
  text: string;
  answer: number;
  op: string;
  speed: number;
  id: number;
  spawnTimeMs: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export interface MathExpression {
  text: string;
  answer: number;
  op: string;
}

export interface ScoreEntry {
  key: string;
  name: string;
  score: number;
  perfScore: number;
  combined: number;
  grade: Grade;
  date: number;
}

export type Grade = 'trainee' | 'cadet' | 'commander' | 'major-general';

export type DDAHeatState =
  | 'CRITICAL'
  | 'STRUGGLING'
  | 'BALANCED'
  | 'FLOW'
  | 'OVERDRIVE';

export type DDAMathTier = 1 | 2 | 3 | 4;

export type GameState = 'start' | 'playing' | 'message' | 'gameover';
