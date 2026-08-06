declare module '*.scss' {
  const content: Record<string, string>;
  export default content;
}

// E2E test mode flag (injected by Vite in e2e mode)
declare const __E2E__: boolean;

// E2E test bridge interface
interface E2ETestBridge {
  // Zustand store access
  getStoreState: () => any;
  setStoreState: (partial: any) => void;

  // Phaser scene access
  getScene: (key: string) => Phaser.Scene | null;
  isSceneReady: (key: string) => boolean;

  // Test control utilities
  setSeed: (seed: number) => void;
  freezeTime: () => void;
  stepFrame: () => void;

  // Async helpers
  waitForIdle: () => Promise<boolean>;
}

declare global {
  interface Window {
    __e2e?: E2ETestBridge;
  }
}
