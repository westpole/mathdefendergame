import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Difficulty, ScoreEntry } from '@shared/types';

type OverlayPhase = 'booting' | 'login' | 'start' | 'playing' | 'stage-message' | 'gameover';
type MenuView = 'home' | 'high-score' | 'rules';

export interface PlayerProfile {
  username: string;
  password: string;
  bestScore: number;
  highestStage: number;
  preferredDifficulty: Difficulty;
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
  difficulty: Difficulty;
  score: number;
  lives: number;
  shield: number;
  stage: number;
  stageScore: number;
  inputBuffer: string;
  correctCount: number;
  incorrectCount: number;
  finalPerfScore: number;
  stageMessage: StageMessageState | null;
  leaderboard: Record<Difficulty, ScoreEntry[]>;
  markBootReady: () => void;
  setDifficulty: (difficulty: Difficulty) => void;
  syncHUD: (payload: Partial<Pick<GameStoreState, 'difficulty' | 'score' | 'lives' | 'shield' | 'stage' | 'stageScore' | 'inputBuffer' | 'correctCount' | 'incorrectCount' | 'finalPerfScore'>>) => void;
  showStageMessage: (payload: StageMessageState) => void;
  showGameOver: (payload: Pick<GameStoreState, 'difficulty' | 'score' | 'correctCount' | 'incorrectCount' | 'finalPerfScore'>) => void;
  startPlaying: () => void;
  returnToMenu: () => void;
  openMenuView: (menuView: MenuView) => void;
  createAndLoginProfile: (username: string, password: string) => LoginResult;
  getActiveProfile: () => PlayerProfile | null;
  saveScore: (name: string, score: number, perfScore: number, difficulty: Difficulty) => void;
  getScores: (difficultyFilter?: Difficulty | null) => ScoreEntry[];
}

const difficultyOrder: Difficulty[] = ['child', 'student', 'adult'];
const leaderboardStorageKey = 'math-defender-game-store';
const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8}$/;

function createEmptyLeaderboard(): Record<Difficulty, ScoreEntry[]> {
  return {
    child: [],
    student: [],
    adult: [],
  };
}

function sortAndTrimScores(scores: ScoreEntry[]): ScoreEntry[] {
  return [...scores]
    .sort((left, right) => right.combined - left.combined || right.date - left.date)
    .slice(0, 10);
}

function flattenLeaderboard(leaderboard: Record<Difficulty, ScoreEntry[]>): ScoreEntry[] {
  return difficultyOrder.flatMap((difficulty) => leaderboard[difficulty]);
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

const initialState = {
  phase: 'booting' as OverlayPhase,
  menuView: 'home' as MenuView,
  bootReady: false,
  activeUsername: null as string | null,
  profiles: {} as Record<string, PlayerProfile>,
  difficulty: 'child' as Difficulty,
  score: 0,
  lives: 10,
  shield: 5,
  stage: 1,
  stageScore: 0,
  inputBuffer: '',
  correctCount: 0,
  incorrectCount: 0,
  finalPerfScore: 0,
  stageMessage: null,
  leaderboard: createEmptyLeaderboard(),
};

export const useGameStore = create<GameStoreState>()(
  persist(
    (set, get) => ({
      ...initialState,
      markBootReady: () => set({ bootReady: true, phase: 'login' }),
      setDifficulty: (difficulty) => set({ difficulty }),
      syncHUD: (payload) => {
        set((state) => {
          const activeProfile = resolveActiveProfile(state.activeUsername, state.profiles);

          if (!activeProfile) {
            return payload;
          }

          const nextScore = payload.score ?? state.score;
          const nextStage = payload.stage ?? state.stage;
          const nextDifficulty = payload.difficulty ?? state.difficulty;

          return {
            ...payload,
            profiles: {
              ...state.profiles,
              [activeProfile.username]: {
                ...activeProfile,
                bestScore: Math.max(activeProfile.bestScore, nextScore),
                highestStage: Math.max(activeProfile.highestStage, nextStage),
                preferredDifficulty: nextDifficulty,
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
                preferredDifficulty: payload.difficulty,
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
          preferredDifficulty: get().difficulty,
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
      saveScore: (name, score, perfScore, difficulty) => {
        const entry: ScoreEntry = {
          key: `leaderboard_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`,
          name,
          score,
          perfScore,
          combined: score + perfScore,
          difficulty,
          date: Date.now(),
        };

        set((state) => ({
          leaderboard: {
            ...state.leaderboard,
            [difficulty]: sortAndTrimScores([...state.leaderboard[difficulty], entry]),
          },
        }));
      },
      getScores: (difficultyFilter = null) => {
        const { leaderboard } = get();

        if (difficultyFilter) {
          return leaderboard[difficultyFilter];
        }

        return flattenLeaderboard(leaderboard).sort(
          (left, right) => right.combined - left.combined || right.date - left.date,
        );
      },
    }),
    {
      name: leaderboardStorageKey,
      storage: createJSONStorage(() => localStorage),
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
