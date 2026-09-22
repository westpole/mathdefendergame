import type { GameStoreState } from '@store/types';

export type E2EWindow = Window & typeof globalThis & {
  __e2e?: {
    setSeed: (seed: number) => void;
    startGame: () => void;
    endActiveGame: () => boolean;
    mockSavingBeforeClose: () => boolean;
    getStoreState: () => GameStoreState;
    setStoreState: (state: Partial<{
      score: number;
      lives: number;
      grade: string;
      screenView: string;
    }>) => void;
    isSceneReady: (sceneKey: string) => boolean;
    getScene: (sceneKey: string) => any | null;
    waitForIdle: () => Promise<boolean>;
    freezeTime: () => void;
    stepFrame: () => void;
  };
};
