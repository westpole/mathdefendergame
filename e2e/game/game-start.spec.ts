import { test, expect } from '../fixtures/electron-app';
import type { E2EWindow } from '../types';

test.describe('Game Start Flow', () => {
  test('should launch with login screen visible', async ({ page }) => {
    // Wait for the E2E bridge to be available
    await page.waitForFunction(() => (window as E2EWindow).__e2e !== undefined, { timeout: 5000 });

    // Get initial store state
    const state = await page.evaluate(() => (window as E2EWindow).__e2e!.getStoreState());

    expect(state.phase).toBe('login');
    expect(state.screenView).toBe('home');
  });

  test('should have Phaser game initialized', async ({ page }) => {
    await page.waitForFunction(() => (window as E2EWindow).__e2e !== undefined, { timeout: 5000 });

    // Check if BootScene is ready
    const bootSceneReady = await page.evaluate(() =>
      (window as E2EWindow).__e2e!.isSceneReady('BootScene')
    );

    expect(bootSceneReady).toBe(true);
  });

  test('can start a new game via store', async ({ page }) => {
    await page.waitForFunction(() => (window as E2EWindow).__e2e !== undefined, { timeout: 5000 });

    // Start the game through the owning scene layer
    await page.evaluate(() => {
      (window as E2EWindow).__e2e!.startGame();
    });

    // Verify state changed
    const newState = await page.evaluate(() => (window as E2EWindow).__e2e!.getStoreState());
    expect(newState.phase).toBe('playing');
    expect(newState.grade).toBe('trainee');
  });

  test('can access and manipulate GameScene', async ({ page }) => {
    await page.waitForFunction(() => (window as E2EWindow).__e2e !== undefined, { timeout: 5000 });

    // Start a game first
    await page.evaluate(() => {
      (window as E2EWindow).__e2e!.startGame();
    });

    // Wait a bit for scene to start
    await page.waitForTimeout(1000);

    // Check if GameScene exists
    const gameScene = await page.evaluate(() => {
      const scene = (window as E2EWindow).__e2e!.getScene('GameScene');
      return scene !== null;
    });

    expect(gameScene).toBe(true);
  });

  test('can control time and RNG for deterministic testing', async ({ page }) => {
    await page.waitForFunction(() => (window as E2EWindow).__e2e !== undefined, { timeout: 5000 });

    // Set a fixed seed for reproducible tests
    await page.evaluate(() => {
      (window as E2EWindow).__e2e!.setSeed(12345);
      (window as E2EWindow).__e2e!.freezeTime();
    });

    // Seed should be set in Phaser registry
    const seed = await page.evaluate(() => {
      const scene = (window as E2EWindow).__e2e!.getScene('BootScene');
      return scene?.game.registry.get('rngSeed');
    });

    expect(seed).toBe(12345);
  });

  test('can mock saving before closing while a game is active', async ({ page }) => {
    await page.waitForFunction(() => (window as E2EWindow).__e2e !== undefined, { timeout: 5000 });

    await page.evaluate(() => {
      (window as E2EWindow).__e2e!.startGame();
    });

    await page.waitForTimeout(250);

    const mocked = await page.evaluate(() => (window as E2EWindow).__e2e!.mockSavingBeforeClose());

    expect(mocked).toBe(true);

    const overlayState = await page.evaluate(() => {
      const state = (window as E2EWindow).__e2e!.getStoreState();

      return {
        phase: state.phase,
        isSavingBeforeClose: state.pauseOverlay?.isSavingBeforeClose ?? false,
        reason: state.pauseOverlay?.reason ?? null,
      };
    });

    expect(overlayState.phase).toBe('paused');
    expect(overlayState.isSavingBeforeClose).toBe(true);
    expect(overlayState.reason).toBe('window-close');
  });
});
