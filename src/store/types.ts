import type {
  GameHistoryEntry,
  Grade,
  DDAMathTier,
  DDAHeatState,
  GameMode,
  GradeNotice,
  PracticeOperation,
} from '@shared/types';
import type { AvatarId } from '@shared/avatarCatalog';

export type OverlayPhase = 'booting' | 'login' | 'start' | 'playing' | 'paused' | 'stage-message' | 'gameover';
export type ScreenView =
  | 'home'
  | 'practice-select'
  | 'profile'
  | 'performance'
  | 'rules'
  | 'weekly-report'
  | 'settings';
export type HistoryByProfile = Record<string, GameHistoryEntry[]>;
export type PauseOverlayReason = 'escape' | 'window-close' | 'background';

export interface PlayerProfile {
  username: string;
  password: string;
  avatarId?: AvatarId;
  bestScore: number;
  highestStage: number;
  preferredGrade: Grade;
  rulesHintDismissed?: boolean;
  /** Operation picked for this profile's most recent practice run; unset until one is started. */
  lastPracticeOperation?: PracticeOperation;
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
  screenView: ScreenView;
  runMode: GameMode;
  practiceOperation: PracticeOperation;
  bootReady: boolean;
  isMobileDevice: boolean;
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
  /** After-game promotion/demotion message. Transient: not persisted. */
  gradeNotice: GradeNotice | null;
  gameHistoryByProfile: HistoryByProfile;
  markBootReady: () => void;
  setMobileDevice: (isMobileDevice: boolean) => void;
  setGrade: (grade: Grade) => void;
  startRegularPlay: () => void;
  startPracticePlay: (operation?: PracticeOperation) => void;
  syncHUD: (payload: Partial<Pick<GameStoreState, 'grade' | 'score' | 'lives' | 'shield' | 'stage' | 'stageScore' | 'inputBuffer' | 'correctCount' | 'incorrectCount' | 'streak' | 'finalPerfScore' | 'ddaHeatState' | 'ddaMathTier' | 'ddaSpeedMultiplier' | 'ddaIsCooloffActive'>>) => void;
  showStageMessage: (payload: StageMessageState) => void;
  showStreakRewardMessage: (payload: StreakRewardMessageState) => void;
  clearStreakRewardMessage: () => void;
  showPauseOverlay: (reason: PauseOverlayReason) => void;
  hidePauseOverlay: () => void;
  showSavingBeforeClose: () => void;
  /** Shows the game-over screen. Must run after addGameHistory, which resolves the post-run grade. */
  showGameOver: (payload: Pick<GameStoreState, 'score' | 'correctCount' | 'incorrectCount' | 'finalPerfScore'>) => void;
  persistPrematureGameEnd: (payload: PrematureGameEndPayload) => void;
  dismissGradeNotice: () => void;
  startPlaying: () => void;
  openMenu: () => void;
  openScreenView: (screenView: ScreenView) => void;
  logOff: () => void;
  loginProfile: (username: string, password: string, keepLoggedIn: boolean) => LoginResult;
  selectProfileByUsername: (username: string, rememberProfile?: boolean) => LoginResult;
  createAndLoginProfile: (username: string, password: string, keepLoggedIn?: boolean) => LoginResult;
  createAndLoginSimpleProfile: (username: string) => LoginResult;
  updateActiveProfileAvatar: (avatarId: string) => LoginResult;
  dismissRulesHint: () => void;
  getActiveProfile: () => PlayerProfile | null;
  addGameHistory: (entry: GameHistoryEntry) => void;
  getGameHistory: (username?: string | null, limit?: number) => GameHistoryEntry[];
}
