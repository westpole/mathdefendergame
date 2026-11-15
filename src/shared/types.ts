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

/** Stable ids for saved awards. The id describes the rule; players see the translated name. */
export type AchievementId =
  | 'weekly-streak-bronze'
  | 'weekly-streak-silver'
  | 'weekly-streak-gold'
  | 'weekly-goal-met'
  | 'personal-best-week'
  | 'focus-of-the-week'
  | 'mastery-add'
  | 'mastery-sub'
  | 'mastery-mul'
  | 'mastery-div';

/** An award saved on a profile when it is earned. */
export interface EarnedAchievement {
  id: AchievementId;
  /** When the award was earned (the run that qualified it). */
  earnedAt: number;
  /** ISO week key (`2026-W46`) the award belongs to, for weekly awards and streak tiers. */
  weekKey?: string;
  /** Operation the award belongs to, for per-operation awards. */
  operation?: MathOperation;
}
