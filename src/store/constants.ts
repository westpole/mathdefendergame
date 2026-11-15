import { GAME_CONFIG } from '@game/config';
import type {
  DDAMathTier,
  DDAHeatState,
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
