import type {
  GameHistoryEntry,
  Grade,
  DDAMathTier,
  DDAHeatState,
  ScoreEntry,
} from '@shared/types';

export type OverlayPhase = 'booting' | 'login' | 'start' | 'playing' | 'paused' | 'stage-message' | 'gameover';
export type MenuView = 'home' | 'profile' | 'performance' | 'rules';
export type HistoryByProfile = Record<string, GameHistoryEntry[]>;
export type PauseOverlayReason = 'escape' | 'window-close' | 'background';

export interface PlayerProfile {
  username: string;
  password: string;
  bestScore: number;
  highestStage: number;
  preferredGrade: Grade;
  createdAt: number;
  updatedAt: number;
}

export interface LoginResult {
  success: boolean;
  error?: string;
}

export interface StageMessageState {
  success: boolean;
  stage: number;
  score: number;
  lives: number;
  stageIncorrect: number;
}

export interface StreakRewardMessageState {
  message: string;
}

export interface PauseOverlayState {
  reason: PauseOverlayReason;
  isSavingBeforeClose: boolean;
}

export interface PrematureGameEndPayload {
  grade: Grade;
  score: number;
  stage: number;
  historyEntry: GameHistoryEntry;
}

export interface GameStoreState {
  phase: OverlayPhase;
  menuView: MenuView;
  bootReady: boolean;
  activeUsername: string | null;
  rememberedUsername: string | null;
  profiles: Record<string, PlayerProfile>;
  grade: Grade;
  score: number;
  lives: number;
  shield: number;
  stage: number;
  stageScore: number;
  inputBuffer: string;
  correctCount: number;
  incorrectCount: number;
  streak: number;
  finalPerfScore: number;
  ddaHeatState: DDAHeatState;
  ddaMathTier: DDAMathTier;
  ddaSpeedMultiplier: number;
  ddaIsCooloffActive: boolean;
  stageMessage: StageMessageState | null;
  streakRewardMessage: StreakRewardMessageState | null;
  pauseOverlay: PauseOverlayState | null;
  leaderboard: Record<Grade, ScoreEntry[]>;
  gameHistoryByProfile: HistoryByProfile;
  markBootReady: () => void;
  setGrade: (grade: Grade) => void;
  syncHUD: (payload: Partial<Pick<GameStoreState, 'grade' | 'score' | 'lives' | 'shield' | 'stage' | 'stageScore' | 'inputBuffer' | 'correctCount' | 'incorrectCount' | 'streak' | 'finalPerfScore' | 'ddaHeatState' | 'ddaMathTier' | 'ddaSpeedMultiplier' | 'ddaIsCooloffActive'>>) => void;
  showStageMessage: (payload: StageMessageState) => void;
  showStreakRewardMessage: (payload: StreakRewardMessageState) => void;
  clearStreakRewardMessage: () => void;
  showPauseOverlay: (reason: PauseOverlayReason) => void;
  hidePauseOverlay: () => void;
  showSavingBeforeClose: () => void;
  showGameOver: (payload: Pick<GameStoreState, 'grade' | 'score' | 'correctCount' | 'incorrectCount' | 'finalPerfScore'>) => void;
  persistPrematureGameEnd: (payload: PrematureGameEndPayload) => void;
  startPlaying: () => void;
  returnToMenu: () => void;
  openMenuView: (menuView: MenuView) => void;
  logOff: () => void;
  loginProfile: (username: string, password: string, keepLoggedIn: boolean) => LoginResult;
  createAndLoginProfile: (username: string, password: string, keepLoggedIn?: boolean) => LoginResult;
  getActiveProfile: () => PlayerProfile | null;
  saveScore: (name: string, score: number, perfScore: number, grade: Grade) => void;
  getScores: (gradeFilter?: Grade | null) => ScoreEntry[];
  addGameHistory: (entry: GameHistoryEntry) => void;
  getGameHistory: (username?: string | null, limit?: number) => GameHistoryEntry[];
}
