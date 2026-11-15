import { GAME_CONFIG } from '@game/config';
import type {
  DDAMathTier,
  DDAHeatState,
  EarnedAchievement,
  Grade,
  GradeNotice,
  MathOperation,
} from '@shared/types';

import type {
  OverlayPhase,
  ScreenView,
  PlayerProfile,
} from './types';

export const initialState = {
  phase: 'booting' as OverlayPhase,
  screenView: 'home' as ScreenView,
  runMode: 'regular' as const,
  practiceOperation: '+' as const,
  bootReady: false,
  isMobileDevice: false,
  activeUsername: null as string | null,
  rememberedUsername: null as string | null,
  profiles: {} as Record<string, PlayerProfile>,
  grade: 'trainee' as Grade,
  score: 0,
  lives: GAME_CONFIG.initialLives,
  shield: GAME_CONFIG.stageShieldMax,
  stage: 1,
  stageScore: 0,
  inputBuffer: '',
  correctCount: 0,
  incorrectCount: 0,
  streak: 0,
  finalPerfScore: 0,
  ddaHeatState: 'BALANCED' as DDAHeatState,
  ddaMathTier: 1 as DDAMathTier,
  ddaSpeedMultiplier: 1,
  ddaIsCooloffActive: false,
  stageMessage: null,
  streakRewardMessage: null,
  pauseOverlay: null,
  gradeNotice: null as GradeNotice | null,
  achievementNotice: null as EarnedAchievement[] | null,
  gameHistoryByProfile: {},
};

export const GUEST_HISTORY_BUCKET = '__guest__';
export const gradeOrder: Grade[] = ['trainee', 'cadet', 'commander', 'major-general'];
export const leaderboardStorageKey = 'math-defender-game-store';
export const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8}$/;

export const OPERATION_LABELS: Record<MathOperation, string> = {
  '+': 'Addition (+)',
  '-': 'Subtraction (-)',
  '*': 'Multiplication (*)',
  '/': 'Division (/)',
};

export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Correct answers a local day needs, summed over its saved runs, to count as an active day. */
export const ACTIVE_DAY_MIN_CORRECT = 10;
/** Active days a calendar week needs to count as a streak week. */
export const STREAK_MIN_DAYS_PER_WEEK = 3;
/** Streak weeks in a row needed for the Relentless Bronze, Silver and Gold medals. */
export const STREAK_TIERS = [3, 6, 12] as const;
/** Streak weeks in a row that bank one streak shield. */
export const SHIELD_EVERY_N_WEEKS = 4;
/** Most streak shields a player can hold at once. */
export const SHIELD_MAX_BANKED = 1;
/** Lowest run accuracy (0–1) that counts toward the weekly goal. */
export const GOAL_MIN_ACCURACY = 0.85;
/** Fewest answers a run needs to count toward the weekly goal. */
export const GOAL_MIN_ANSWERS = 10;
/** Share of the weekly goal that can be credited on one day. */
export const GOAL_DAILY_CAP_RATIO = 0.4;
/** Weekly goal options offered in Settings. */
export const WEEKLY_GOAL_PRESETS = [500, 1000, 2500, 5000] as const;
/** Suggested goal = 4-week baseline × this multiplier. */
export const GOAL_SUGGESTION_MULTIPLIER = 1.1;
/** Suggested goals are rounded to the nearest multiple of this. */
export const GOAL_SUGGESTION_ROUND_TO = 50;
/** Complete weeks the baseline averages over, at most. */
export const BASELINE_WEEKS = 4;
/** Complete weeks of history needed before a baseline exists. */
export const BASELINE_MIN_WEEKS = 2;
/** Weeks before the current one used to pick the focus operation. */
export const FOCUS_WINDOW_WEEKS = 2;
/** Qualifying practice runs in the focus operation that earn Focus of the Week. */
export const FOCUS_PRACTICE_RUNS_REQUIRED = 3;
/** Lowest accuracy (0–1) over the recent window for a mastery badge. */
export const MASTERY_MIN_ACCURACY = 0.9;
/** Recent attempts per operation that mastery is measured over. */
export const MASTERY_WINDOW_ATTEMPTS = 50;
/** Slowest average answer time (ms) for a mastery badge, per operation. Tunable after release. */
export const MASTERY_MAX_AVG_MS: Record<MathOperation, number> = {
  '+': 3000,
  '-': 3000,
  '*': 4000,
  '/': 4000,
};
