import { test, expect } from '../fixtures/electron-app';

import type { E2EWindow } from '../types';

test.describe('Visual Regression Tests', () => {
  test('main menu should match snapshot', async ({ page }) => {
    await page.waitForFunction(() => (window as E2EWindow).__e2e !== undefined, { timeout: 5000 });

    // Wait for fonts and assets to load
    await page.waitForTimeout(1500);

    // Take screenshot of main menu
    await expect(page).toHaveScreenshot('main-menu.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('game start screen should match snapshot', async ({ page }) => {
    await page.waitForFunction(() => (window as E2EWindow).__e2e !== undefined, { timeout: 5000 });

    // Start game with fixed seed for consistency
    await page.evaluate(() => {
      const e2e = (window as E2EWindow).__e2e;
      if (!e2e) {
        throw new Error('E2E bridge not available');
      }

      e2e.setSeed(12345);
      const state = e2e.getStoreState();
      state.setGrade('trainee');
      state.startPlaying();
    });

    // Wait for game scene to initialize
    await page.waitForTimeout(1000);

    // Take screenshot
    await expect(page).toHaveScreenshot('game-start.png', {
      maxDiffPixelRatio: 0.01,
    });
  });
});
