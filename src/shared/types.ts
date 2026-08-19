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

export type MathOperation = '+' | '-' | '*' | '/';

export interface OperationHistoryStat {
  attempts: number;
  incorrect: number;
  avgTimeMs: number;
}

export interface GameHistoryEntry {
  key: string;
  playedAt: number;
  correctAnswers: number;
  incorrectAnswers: number;
  averageAnswerTimeMs: number;
  mostProblematicOperation: MathOperation | null;
  operationStats: Record<MathOperation, OperationHistoryStat>;
  gradeAtFinish: Grade;
  finalScore: number;
  finalPerfScore: number;
}

export type Grade = 'trainee' | 'cadet' | 'commander' | 'major-general';

export type DDAHeatState =
  | 'CRITICAL'
  | 'STRUGGLING'
  | 'BALANCED'
  | 'FLOW'
  | 'OVERDRIVE';

export type DDAMathTier = 1 | 2 | 3 | 4;

export type GameState = 'start' | 'playing' | 'paused' | 'message' | 'gameover';

export type GameOverReason = 'victory' | 'lives-depleted';
