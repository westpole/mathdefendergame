export interface Meteor {
  x: number;
  y: number;
  text: string;
  answer: number;
  op: string;
  speed: number;
  id: number;
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
  difficulty: Difficulty;
  date: number;
}

export type Difficulty = 'child' | 'student' | 'adult';

export type GameState = 'start' | 'playing' | 'message' | 'gameover';
