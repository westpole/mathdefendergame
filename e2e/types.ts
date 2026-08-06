export type E2EWindow = Window & typeof globalThis & {
  __e2e?: {
    setSeed: (seed: number) => void;
    getStoreState: () => {
      setDifficulty: (difficulty: string) => void;
      startPlaying: () => void;
      phase: string;
      difficulty: string;
      score: number;
      lives: number;
      menuView: string;
    };
    setStoreState: (state: Partial<{
      score: number;
      lives: number;
      difficulty: string;
      menuView: string;
    }>) => void;
    isSceneReady: (sceneKey: string) => boolean;
    getScene: (sceneKey: string) => any | null;
    waitForIdle: () => Promise<boolean>;
    freezeTime: () => void;
  };
};
