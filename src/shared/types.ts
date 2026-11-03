export type GameMode = 'regular' | 'practice';
export type PracticeOperation = '+' | '-' | '*' | '/';

export interface Meteor {
  x: number;
  y: number;
  text: string;
  answer: number;
  op: MathOperation;
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
  op: MathOperation;
}

export type MathOperation = PracticeOperation;

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
  mode?: GameMode;
}

export type Grade = 'trainee' | 'cadet' | 'commander' | 'major-general';

/** Lifetime (or per-run) operation score: correct minus incorrect answers per operation. */
export type OperationScores = Record<MathOperation, number>;

/** One operation's score compared with a grade requirement. */
export interface GradeOperationStatus {
  op: MathOperation;
  current: number;
  required: number;
}

/** After-game message describing a grade change. */
export interface GradeNotice {
  kind: 'promoted' | 'demoted';
  fromGrade: Grade;
  toGrade: Grade;
  /** For a demotion: the operations below `fromGrade`'s requirements. Empty for a promotion. */
  operations: GradeOperationStatus[];
}

export type DDAHeatState =
  | 'CRITICAL'
  | 'STRUGGLING'
  | 'BALANCED'
  | 'FLOW'
  | 'OVERDRIVE';

export type DDAMathTier = 1 | 2 | 3 | 4;

export type GameState = 'start' | 'playing' | 'paused' | 'message' | 'gameover';

export type GameOverReason = 'victory' | 'lives-depleted';
