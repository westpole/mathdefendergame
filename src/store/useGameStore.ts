import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { GAME_CONFIG } from '@game/config';
import type {
  DDAMathTier,
  DDAHeatState,
  GameHistoryEntry,
  Grade,
  MathOperation,
  OperationHistoryStat,
  ScoreEntry,
} from '@shared/types';

type OverlayPhase = 'booting' | 'login' | 'start' | 'playing' | 'stage-message' | 'gameover';
type MenuView = 'home' | 'high-score' | 'rules';
type LegacyDifficulty = 'child' | 'student' | 'adult';
type HistoryByProfile = Record<string, GameHistoryEntry[]>;

export interface PlayerProfile {
  username: string;
  password: string;
  bestScore: number;
  highestStage: number;
  preferredGrade: Grade;
  createdAt: number;
  updatedAt: number;
}

interface LoginResult {
  success: boolean;
  error?: string;
}

interface StageMessageState {
  success: boolean;
  stage: number;
  score: number;
  lives: number;
  stageIncorrect: number;
}

const MATH_OPERATIONS: MathOperation[] = ['+', '-', '*', '/'];
const GUEST_HISTORY_BUCKET = '__guest__';
const MAX_HISTORY_ENTRIES_PER_PROFILE = 50;

export interface GameStoreState {
  phase: OverlayPhase;
  menuView: MenuView;
  bootReady: boolean;
  activeUsername: string | null;
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
  finalPerfScore: number;
  ddaHeatState: DDAHeatState;
  ddaMathTier: DDAMathTier;
  ddaSpeedMultiplier: number;
  ddaIsCooloffActive: boolean;
  stageMessage: StageMessageState | null;
  leaderboard: Record<Grade, ScoreEntry[]>;
  gameHistoryByProfile: HistoryByProfile;
  markBootReady: () => void;
  setGrade: (grade: Grade) => void;
  syncHUD: (payload: Partial<Pick<GameStoreState, 'grade' | 'score' | 'lives' | 'shield' | 'stage' | 'stageScore' | 'inputBuffer' | 'correctCount' | 'incorrectCount' | 'finalPerfScore' | 'ddaHeatState' | 'ddaMathTier' | 'ddaSpeedMultiplier' | 'ddaIsCooloffActive'>>) => void;
  showStageMessage: (payload: StageMessageState) => void;
  showGameOver: (payload: Pick<GameStoreState, 'grade' | 'score' | 'correctCount' | 'incorrectCount' | 'finalPerfScore'>) => void;
  startPlaying: () => void;
  returnToMenu: () => void;
  openMenuView: (menuView: MenuView) => void;
  loginProfile: (username: string, password: string) => LoginResult;
  createAndLoginProfile: (username: string, password: string) => LoginResult;
  getActiveProfile: () => PlayerProfile | null;
  saveScore: (name: string, score: number, perfScore: number, grade: Grade) => void;
  getScores: (gradeFilter?: Grade | null) => ScoreEntry[];
  addGameHistory: (entry: GameHistoryEntry) => void;
  getGameHistory: (username?: string | null, limit?: number) => GameHistoryEntry[];
}

const gradeOrder: Grade[] = ['trainee', 'cadet', 'commander', 'major-general'];
const leaderboardStorageKey = 'math-defender-game-store';
const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8}$/;

function createEmptyLeaderboard(): Record<Grade, ScoreEntry[]> {
  return {
    trainee: [],
    cadet: [],
    commander: [],
    'major-general': [],
  };
}

function createEmptyOperationHistoryStats(): Record<MathOperation, OperationHistoryStat> {
  return {
    '+': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
    '-': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
    '*': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
    '/': { attempts: 0, incorrect: 0, avgTimeMs: 0 },
  };
}

function sortAndTrimHistory(entries: GameHistoryEntry[]): GameHistoryEntry[] {
  return [...entries]
    .sort((left, right) => right.playedAt - left.playedAt)
    .slice(0, MAX_HISTORY_ENTRIES_PER_PROFILE);
}

function isMathOperation(value: unknown): value is MathOperation {
  return value === '+' || value === '-' || value === '*' || value === '/';
}

function normalizeOperationHistoryStats(rawStats: unknown): Record<MathOperation, OperationHistoryStat> {
  const normalizedStats = createEmptyOperationHistoryStats();

  if (!rawStats || typeof rawStats !== 'object') {
    return normalizedStats;
  }

  for (const op of MATH_OPERATIONS) {
    const stat = (rawStats as Record<string, unknown>)[op];

    if (!stat || typeof stat !== 'object') {
      continue;
    }

    const statRecord = stat as Record<string, unknown>;
    normalizedStats[op] = {
      attempts: typeof statRecord.attempts === 'number' ? statRecord.attempts : 0,
      incorrect: typeof statRecord.incorrect === 'number' ? statRecord.incorrect : 0,
      avgTimeMs: typeof statRecord.avgTimeMs === 'number' ? statRecord.avgTimeMs : 0,
    };
  }

  return normalizedStats;
}

function normalizeHistoryEntry(rawEntry: unknown): GameHistoryEntry {
  const legacyEntry = (rawEntry ?? {}) as Record<string, unknown>;

  return {
    key: typeof legacyEntry.key === 'string'
      ? legacyEntry.key
      : `game_history_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`,
    playedAt: typeof legacyEntry.playedAt === 'number'
      ? legacyEntry.playedAt
      : (typeof legacyEntry.date === 'number' ? legacyEntry.date : Date.now()),
    correctAnswers: typeof legacyEntry.correctAnswers === 'number'
      ? legacyEntry.correctAnswers
      : (typeof legacyEntry.correctCount === 'number' ? legacyEntry.correctCount : 0),
    incorrectAnswers: typeof legacyEntry.incorrectAnswers === 'number'
      ? legacyEntry.incorrectAnswers
      : (typeof legacyEntry.incorrectCount === 'number' ? legacyEntry.incorrectCount : 0),
    averageAnswerTimeMs: typeof legacyEntry.averageAnswerTimeMs === 'number'
      ? legacyEntry.averageAnswerTimeMs
      : 0,
    mostProblematicOperation: isMathOperation(legacyEntry.mostProblematicOperation)
      ? legacyEntry.mostProblematicOperation
      : null,
    operationStats: normalizeOperationHistoryStats(legacyEntry.operationStats),
    gradeAtFinish: normalizeGrade(legacyEntry.gradeAtFinish ?? legacyEntry.grade),
    finalScore: typeof legacyEntry.finalScore === 'number'
      ? legacyEntry.finalScore
      : (typeof legacyEntry.score === 'number' ? legacyEntry.score : 0),
    finalPerfScore: typeof legacyEntry.finalPerfScore === 'number'
      ? legacyEntry.finalPerfScore
      : (typeof legacyEntry.perfScore === 'number' ? legacyEntry.perfScore : 0),
  };
}

function migrateGameHistoryByProfile(rawHistoryByProfile: unknown): HistoryByProfile {
  if (!rawHistoryByProfile || typeof rawHistoryByProfile !== 'object') {
    return {};
  }

  const migrated: HistoryByProfile = {};

  for (const [profileKey, entries] of Object.entries(rawHistoryByProfile as Record<string, unknown>)) {
    if (!Array.isArray(entries)) {
      continue;
    }

    migrated[profileKey] = sortAndTrimHistory(entries.map((entry) => normalizeHistoryEntry(entry)));
  }

  return migrated;
}

function sortAndTrimScores(scores: ScoreEntry[]): ScoreEntry[] {
  return [...scores]
    .sort((left, right) => right.combined - left.combined || right.date - left.date)
    .slice(0, 10);
}

function flattenLeaderboard(leaderboard: Record<Grade, ScoreEntry[]>): ScoreEntry[] {
  return gradeOrder.flatMap((grade) => leaderboard[grade]);
}

function validatePassword(password: string): boolean {
  return passwordPolicy.test(password);
}

function resolveActiveProfile(
  activeUsername: string | null,
  profiles: Record<string, PlayerProfile>,
): PlayerProfile | null {
  if (!activeUsername) {
    return null;
  }

  return profiles[activeUsername] ?? null;
}

function isGrade(value: unknown): value is Grade {
  return value === 'trainee' || value === 'cadet' || value === 'commander' || value === 'major-general';
}

function mapLegacyDifficultyToGrade(value: LegacyDifficulty): Grade {
  switch (value) {
    case 'child':
      return 'trainee';
    case 'student':
      return 'cadet';
    case 'adult':
      return 'major-general';
    default:
      return 'trainee';
  }
}

function normalizeGrade(value: unknown): Grade {
  if (isGrade(value)) {
    return value;
  }

  if (value === 'child' || value === 'student' || value === 'adult') {
    return mapLegacyDifficultyToGrade(value);
  }

  return 'trainee';
}

function migrateProfiles(rawProfiles: unknown): Record<string, PlayerProfile> {
  if (!rawProfiles || typeof rawProfiles !== 'object') {
    return {};
  }

  const migrated: Record<string, PlayerProfile> = {};

  for (const [username, profile] of Object.entries(rawProfiles as Record<string, unknown>)) {
    if (!profile || typeof profile !== 'object') {
      continue;
    }

    const legacyProfile = profile as Record<string, unknown>;
    const preferredGrade = normalizeGrade(
      legacyProfile.preferredGrade ?? legacyProfile.preferredDifficulty,
    );

    migrated[username] = {
      username: typeof legacyProfile.username === 'string' ? legacyProfile.username : username,
      password: typeof legacyProfile.password === 'string' ? legacyProfile.password : '',
      bestScore: typeof legacyProfile.bestScore === 'number' ? legacyProfile.bestScore : 0,
      highestStage: typeof legacyProfile.highestStage === 'number' ? legacyProfile.highestStage : 1,
      preferredGrade,
      createdAt: typeof legacyProfile.createdAt === 'number' ? legacyProfile.createdAt : Date.now(),
      updatedAt: typeof legacyProfile.updatedAt === 'number' ? legacyProfile.updatedAt : Date.now(),
    };
  }

  return migrated;
}

function migrateLeaderboard(rawLeaderboard: unknown): Record<Grade, ScoreEntry[]> {
  const nextLeaderboard = createEmptyLeaderboard();

  if (!rawLeaderboard || typeof rawLeaderboard !== 'object') {
    return nextLeaderboard;
  }

  for (const [bucketKey, entries] of Object.entries(rawLeaderboard as Record<string, unknown>)) {
    if (!Array.isArray(entries)) {
      continue;
    }

    const bucketGrade = normalizeGrade(bucketKey);
    const migratedEntries: ScoreEntry[] = entries.map((entry) => {
      const legacyEntry = (entry ?? {}) as Record<string, unknown>;
      const entryGrade = normalizeGrade(legacyEntry.grade ?? legacyEntry.difficulty ?? bucketGrade);

      return {
        key: typeof legacyEntry.key === 'string'
          ? legacyEntry.key
          : `leaderboard_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`,
        name: typeof legacyEntry.name === 'string' ? legacyEntry.name : 'Anonymous',
        score: typeof legacyEntry.score === 'number' ? legacyEntry.score : 0,
        perfScore: typeof legacyEntry.perfScore === 'number' ? legacyEntry.perfScore : 0,
        combined: typeof legacyEntry.combined === 'number'
          ? legacyEntry.combined
          : (typeof legacyEntry.score === 'number' ? legacyEntry.score : 0)
            + (typeof legacyEntry.perfScore === 'number' ? legacyEntry.perfScore : 0),
        grade: entryGrade,
        date: typeof legacyEntry.date === 'number' ? legacyEntry.date : Date.now(),
      };
    });

    nextLeaderboard[bucketGrade] = sortAndTrimScores([
      ...nextLeaderboard[bucketGrade],
      ...migratedEntries,
    ]);
  }

  return nextLeaderboard;
}

const initialState = {
  phase: 'booting' as OverlayPhase,
  menuView: 'home' as MenuView,
  bootReady: false,
  activeUsername: null as string | null,
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
  finalPerfScore: 0,
  ddaHeatState: 'BALANCED' as DDAHeatState,
  ddaMathTier: 1 as DDAMathTier,
  ddaSpeedMultiplier: 1,
  ddaIsCooloffActive: false,
  stageMessage: null,
  leaderboard: createEmptyLeaderboard(),
  gameHistoryByProfile: {},
};

export const useGameStore = create<GameStoreState>()(
  persist(
    (set, get) => ({
      ...initialState,
      markBootReady: () => set({ bootReady: true, phase: 'login' }),
      setGrade: (grade) => set({ grade }),
      syncHUD: (payload) => {
        set((state) => {
          const activeProfile = resolveActiveProfile(state.activeUsername, state.profiles);

          if (!activeProfile) {
            return payload;
          }

          const nextScore = payload.score ?? state.score;
          const nextStage = payload.stage ?? state.stage;
          const nextGrade = payload.grade ?? state.grade;

          return {
            ...payload,
            profiles: {
              ...state.profiles,
              [activeProfile.username]: {
                ...activeProfile,
                bestScore: Math.max(activeProfile.bestScore, nextScore),
                highestStage: Math.max(activeProfile.highestStage, nextStage),
                preferredGrade: nextGrade,
                updatedAt: Date.now(),
              },
            },
          };
        });
      },
      showStageMessage: (stageMessage) => set({ phase: 'stage-message', stageMessage }),
      showGameOver: (payload) => {
        set((state) => {
          const activeProfile = resolveActiveProfile(state.activeUsername, state.profiles);

          if (!activeProfile) {
            return { phase: 'gameover', stageMessage: null, ...payload };
          }

          return {
            phase: 'gameover',
            stageMessage: null,
            ...payload,
            profiles: {
              ...state.profiles,
              [activeProfile.username]: {
                ...activeProfile,
                bestScore: Math.max(activeProfile.bestScore, payload.score),
                highestStage: Math.max(activeProfile.highestStage, state.stage),
                preferredGrade: payload.grade,
                updatedAt: Date.now(),
              },
            },
          };
        });
      },
      startPlaying: () => set({ phase: 'playing', stageMessage: null }),
      returnToMenu: () => set({
        ...initialState,
        bootReady: true,
        phase: 'start',
        score: get().score,
        grade: get().grade,
        leaderboard: get().leaderboard,
        profiles: get().profiles,
        activeUsername: get().activeUsername,
      }),
      openMenuView: (menuView) => set({
        ...initialState,
        bootReady: true,
        phase: 'start',
        menuView,
        score: get().score,
        grade: get().grade,
        leaderboard: get().leaderboard,
        profiles: get().profiles,
        activeUsername: get().activeUsername,
      }),
      loginProfile: (username, password) => {
        const normalizedUsername = username.trim();

        if (!normalizedUsername) {
          return {
            success: false,
            error: 'Username is required.',
          };
        }

        const profile = get().profiles[normalizedUsername];

        if (!profile) {
          return {
            success: false,
            error: 'Username not found. Switch to Create profile to register this commander.',
          };
        }

        if (profile.password !== password) {
          return {
            success: false,
            error: 'Incorrect password. Check your credentials or create a new profile if needed.',
          };
        }

        set({
          activeUsername: normalizedUsername,
          grade: profile.preferredGrade,
          phase: 'start',
          menuView: 'home',
        });

        return { success: true };
      },
      createAndLoginProfile: (username, password) => {
        const normalizedUsername = username.trim();

        if (!normalizedUsername) {
          return {
            success: false,
            error: 'Username is required.',
          };
        }

        if (get().profiles[normalizedUsername]) {
          return {
            success: false,
            error: 'Username already exists. Pick a different username.',
          };
        }

        if (!validatePassword(password)) {
          return {
            success: false,
            error: 'Password must be exactly 8 characters and include uppercase, lowercase, and a number.',
          };
        }

        const now = Date.now();
        const profile: PlayerProfile = {
          username: normalizedUsername,
          password,
          bestScore: 0,
          highestStage: 1,
          preferredGrade: get().grade,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          profiles: {
            ...state.profiles,
            [normalizedUsername]: profile,
          },
          activeUsername: normalizedUsername,
          phase: 'start',
          menuView: 'home',
        }));

        return { success: true };
      },
      getActiveProfile: () => {
        const state = get();
        return resolveActiveProfile(state.activeUsername, state.profiles);
      },
      saveScore: (name, score, perfScore, grade) => {
        const entry: ScoreEntry = {
          key: `leaderboard_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`,
          name,
          score,
          perfScore,
          combined: score + perfScore,
          grade,
          date: Date.now(),
        };

        set((state) => ({
          leaderboard: {
            ...state.leaderboard,
            [grade]: sortAndTrimScores([...state.leaderboard[grade], entry]),
          },
        }));
      },
      getScores: (gradeFilter = null) => {
        const { leaderboard } = get();

        if (gradeFilter) {
          return leaderboard[gradeFilter];
        }

        return flattenLeaderboard(leaderboard).sort(
          (left, right) => right.combined - left.combined || right.date - left.date,
        );
      },
      addGameHistory: (entry) => {
        set((state) => {
          const profileKey = state.activeUsername ?? GUEST_HISTORY_BUCKET;
          const historyForProfile = state.gameHistoryByProfile[profileKey] ?? [];

          return {
            gameHistoryByProfile: {
              ...state.gameHistoryByProfile,
              [profileKey]: sortAndTrimHistory([...historyForProfile, entry]),
            },
          };
        });
      },
      getGameHistory: (username = null, limit = 20) => {
        const state = get();
        const profileKey = username ?? state.activeUsername ?? GUEST_HISTORY_BUCKET;
        const historyForProfile = state.gameHistoryByProfile[profileKey] ?? [];

        return historyForProfile.slice(0, Math.max(0, limit));
      },
    }),
    {
      name: leaderboardStorageKey,
      version: 3,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState) => {
        const rawState = (persistedState ?? {}) as Record<string, unknown>;

        return {
          ...rawState,
          leaderboard: migrateLeaderboard(rawState.leaderboard),
          profiles: migrateProfiles(rawState.profiles),
          gameHistoryByProfile: migrateGameHistoryByProfile(rawState.gameHistoryByProfile),
          activeUsername:
            typeof rawState.activeUsername === 'string' || rawState.activeUsername === null
              ? rawState.activeUsername
              : null,
        };
      },
      partialize: (state) => ({
        leaderboard: state.leaderboard,
        profiles: state.profiles,
        gameHistoryByProfile: state.gameHistoryByProfile,
        activeUsername: state.activeUsername,
      }),
    },
  ),
);

export const gameStore = useGameStore;
export type { MenuView, OverlayPhase, StageMessageState };
