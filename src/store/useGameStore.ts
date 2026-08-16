import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { DDAMathTier, DDAHeatState, Grade, ScoreEntry } from '@shared/types';

type OverlayPhase = 'booting' | 'login' | 'start' | 'playing' | 'stage-message' | 'gameover';
type MenuView = 'home' | 'high-score' | 'rules';
type LegacyDifficulty = 'child' | 'student' | 'adult';

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
  lives: 10,
  shield: 5,
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
        leaderboard: get().leaderboard,
        profiles: get().profiles,
        activeUsername: get().activeUsername,
      }),
      openMenuView: (menuView) => set({
        ...initialState,
        bootReady: true,
        phase: 'start',
        menuView,
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
    }),
    {
      name: leaderboardStorageKey,
      version: 2,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState) => {
        const rawState = (persistedState ?? {}) as Record<string, unknown>;

        return {
          ...rawState,
          leaderboard: migrateLeaderboard(rawState.leaderboard),
          profiles: migrateProfiles(rawState.profiles),
          activeUsername:
            typeof rawState.activeUsername === 'string' || rawState.activeUsername === null
              ? rawState.activeUsername
              : null,
        };
      },
      partialize: (state) => ({
        leaderboard: state.leaderboard,
        profiles: state.profiles,
        activeUsername: state.activeUsername,
      }),
    },
  ),
);

export const gameStore = useGameStore;
export type { MenuView, OverlayPhase, StageMessageState };
