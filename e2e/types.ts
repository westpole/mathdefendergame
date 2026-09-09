export type E2EWindow = Window & typeof globalThis & {
  __e2e?: {
    setSeed: (seed: number) => void;
    startGame: () => void;
    endActiveGame: () => boolean;
    mockSavingBeforeClose: () => boolean;
    getStoreState: () => {
      setGrade: (grade: string) => void;
      startPlaying: () => void;
      createAndLoginProfile?: (username: string, password: string, keepLoggedIn?: boolean) => { success: boolean; error?: string };
      phase: string;
      grade: string;
      score: number;
      lives: number;
      inputBuffer: string;
      menuView: string;
      pauseOverlay: {
        reason: string;
        isSavingBeforeClose: boolean;
      } | null;
    };
    setStoreState: (state: Partial<{
      score: number;
      lives: number;
      grade: string;
      menuView: string;
    }>) => void;
    isSceneReady: (sceneKey: string) => boolean;
    getScene: (sceneKey: string) => any | null;
    waitForIdle: () => Promise<boolean>;
    freezeTime: () => void;
    stepFrame: () => void;
  };
};
