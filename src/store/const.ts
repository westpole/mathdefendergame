import { GAME_CONFIG } from '@game/config';
import type {
  DDAMathTier,
  DDAHeatState,
  Grade,
  ScoreEntry,
  MathOperation,
} from '@shared/types';

import type {
  OverlayPhase,
  ScreenView,
  PlayerProfile,
  GameStoreState,
} from './types';

export function createEmptyLeaderboard(): Record<Grade, ScoreEntry[]> {
  return {
    trainee: [],
    cadet: [],
    commander: [],
    'major-general': [],
  };
}

export const initialState = {
  phase: 'booting' as OverlayPhase,
  screenView: 'home' as ScreenView,
  bootReady: false,
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
  leaderboard: createEmptyLeaderboard(),
  gameHistoryByProfile: {},
};

export const MATH_OPERATIONS: MathOperation[] = ['+', '-', '*', '/'];
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
export const ACTIVE_PROGRESS_PHASES = new Set<GameStoreState['phase']>(['playing', 'paused', 'stage-message']);
