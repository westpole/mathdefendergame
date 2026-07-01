import { create } from 'zustand';
import type { Difficulty } from '../types';

type OverlayPhase = 'booting' | 'start' | 'playing' | 'stage-message' | 'gameover';

interface StageMessageState {
  success: boolean;
  stage: number;
  score: number;
  lives: number;
  stageIncorrect: number;
}

interface GameStoreState {
  phase: OverlayPhase;
  bootReady: boolean;
  difficulty: Difficulty;
  score: number;
  lives: number;
  shield: number;
  stage: number;
  stageScore: number;
  correctCount: number;
  incorrectCount: number;
  finalPerfScore: number;
  stageMessage: StageMessageState | null;
  markBootReady: () => void;
  setDifficulty: (difficulty: Difficulty) => void;
  syncHUD: (payload: Partial<Pick<GameStoreState, 'difficulty' | 'score' | 'lives' | 'shield' | 'stage' | 'stageScore' | 'correctCount' | 'incorrectCount' | 'finalPerfScore'>>) => void;
  showStageMessage: (payload: StageMessageState) => void;
  showGameOver: (payload: Pick<GameStoreState, 'difficulty' | 'score' | 'correctCount' | 'incorrectCount' | 'finalPerfScore'>) => void;
  startPlaying: () => void;
  returnToMenu: () => void;
}

const initialState = {
  phase: 'booting' as OverlayPhase,
  bootReady: false,
  difficulty: 'child' as Difficulty,
  score: 0,
  lives: 10,
  shield: 5,
  stage: 1,
  stageScore: 0,
  correctCount: 0,
  incorrectCount: 0,
  finalPerfScore: 0,
  stageMessage: null,
};

export const useGameStore = create<GameStoreState>((set) => ({
  ...initialState,
  markBootReady: () => set({ bootReady: true, phase: 'start' }),
  setDifficulty: (difficulty) => set({ difficulty }),
  syncHUD: (payload) => set(payload),
  showStageMessage: (stageMessage) => set({ phase: 'stage-message', stageMessage }),
  showGameOver: (payload) => set({ phase: 'gameover', stageMessage: null, ...payload }),
  startPlaying: () => set({ phase: 'playing', stageMessage: null }),
  returnToMenu: () => set({ ...initialState, bootReady: true, phase: 'start' }),
}));

export const gameStore = useGameStore;
export type { OverlayPhase, StageMessageState };
