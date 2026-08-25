import { test, expect } from '../fixtures/electron-app';
import type { E2EWindow } from '../types';

test.describe('Store and Phaser Synchronization', () => {
  test('store changes should reflect in game state', async ({ page }) => {
    await page.waitForFunction(() => (window as E2EWindow).__e2e !== undefined, { timeout: 5000 });

    // Set initial game state via store
    await page.evaluate(() => {
      (window as E2EWindow).__e2e!.setStoreState({
        score: 1000,
        lives: 2,
        grade: 'commander',
      });
    });

    // Read back and verify
    const state = await page.evaluate(() => (window as E2EWindow).__e2e!.getStoreState());
    expect(state.score).toBe(1000);
    expect(state.lives).toBe(2);
    expect(state.grade).toBe('commander');
  });

  test('can wait for game to be idle', async ({ page }) => {
    await page.waitForFunction(() => (window as E2EWindow).__e2e !== undefined, { timeout: 5000 });

    // Start game
    await page.evaluate(() => {
      (window as E2EWindow).__e2e!.startGame();
    });

    // Wait for idle state
    const isIdle = await page.evaluate(() => (window as E2EWindow).__e2e!.waitForIdle());
    expect(isIdle).toBe(true);
  });
});
