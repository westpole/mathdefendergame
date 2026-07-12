import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Difficulty, ScoreEntry } from '../types';

type OverlayPhase = 'booting' | 'start' | 'playing' | 'stage-message' | 'gameover';
type MenuView = 'home' | 'high-score' | 'rules';

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
  saveScore: (name: string, score: number, perfScore: number, difficulty: Difficulty) => void;
  getScores: (difficultyFilter?: Difficulty | null) => ScoreEntry[];
}

const difficultyOrder: Difficulty[] = ['child', 'student', 'adult'];
const leaderboardStorageKey = 'math-defender-game-store';

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

const initialState = {
  phase: 'booting' as OverlayPhase,
  menuView: 'home' as MenuView,
  bootReady: false,
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
      markBootReady: () => set({ bootReady: true, phase: 'start' }),
      setDifficulty: (difficulty) => set({ difficulty }),
      syncHUD: (payload) => set(payload),
      showStageMessage: (stageMessage) => set({ phase: 'stage-message', stageMessage }),
      showGameOver: (payload) => set({ phase: 'gameover', stageMessage: null, ...payload }),
      startPlaying: () => set({ phase: 'playing', stageMessage: null }),
      // @todo: check if still in use
      returnToMenu: () => set({ ...initialState, bootReady: true, phase: 'start', leaderboard: get().leaderboard }),
      // @todo: check if still in use
      openMenuView: (menuView) => set({ ...initialState, bootReady: true, phase: 'start', menuView, leaderboard: get().leaderboard }),
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
      }),
    },
  ),
);

export const gameStore = useGameStore;
export type { MenuView, OverlayPhase, StageMessageState };
