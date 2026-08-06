import { useGameStore } from '../../src/store/useGameStore';
import type { GameStoreState } from '../../src/store/useGameStore';

// Define the test bridge interface locally to avoid import issues
interface E2ETestBridge {
  getStoreState: () => GameStoreState;
  setStoreState: (partial: Partial<GameStoreState>) => void;
  getScene: (key: string) => Phaser.Scene | null;
  isSceneReady: (key: string) => boolean;
  setSeed: (seed: number) => void;
  freezeTime: () => void;
  stepFrame: () => void;
  waitForIdle: () => Promise<boolean>;
}

export function installTestBridge(phaserGame: Phaser.Game) {
  // Augment window with test bridge
  const win = window as typeof window & { __e2e: E2ETestBridge };

  win.__e2e = {
    // Zustand — read/write state directly, no clicking through UI
    getStoreState: () => useGameStore.getState(),
    setStoreState: (partial: Partial<GameStoreState>) => useGameStore.setState(partial),

    // Phaser — reach into the active scene
    getScene: (key: string) => phaserGame.scene.getScene(key),
    isSceneReady: (key: string) => {
      const scene = phaserGame.scene.getScene(key);

      if (!scene) {
        return false;
      }

      // BootScene readiness is driven by the shared store.
      if (key === 'BootScene') {
        return useGameStore.getState().bootReady;
      }

      // Respect explicit scene readiness flags when available.
      const explicitReady = (scene as unknown as { isReady?: boolean })?.isReady;
      if (typeof explicitReady === 'boolean') {
        return explicitReady;
      }

      // Fall back to Phaser lifecycle state for scenes without custom flags.
      return scene.scene.isActive() || scene.scene.isPaused();
    },
    setSeed: (seed: number) => {
      phaserGame.registry.set('rngSeed', seed);
    },
    freezeTime: () => {
      phaserGame.scene.scenes.forEach(s => {
        if (s.time) {
          s.time.paused = true;
        }
      });
    },
    stepFrame: () => {
      // Manually step the game loop for deterministic frame-by-frame testing
      const now = performance.now();
      phaserGame.loop.step(now);
    },

    // Sync point for screenshots/assertions
    waitForIdle: () => new Promise<boolean>(resolve => {
      const check = () => {
        const hasActiveScenes = phaserGame.scene.scenes.some(s => s.scene.isActive());
        const allScenesStarted = phaserGame.scene.scenes.length > 0;

        if (hasActiveScenes && allScenesStarted) {
          resolve(true);
        } else {
          requestAnimationFrame(check);
        }
      };
      check();
    }),
  };
}
