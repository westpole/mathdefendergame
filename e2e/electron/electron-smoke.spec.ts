import { test, expect } from '../fixtures/electron-app';

import type { E2EWindow } from '../types';

test.describe('Electron wrapper smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.reload();
    await page.waitForFunction(() => (window as E2EWindow).__e2e !== undefined, { timeout: 5000 });
    await page.waitForFunction(() => (window as E2EWindow).__e2e?.getStoreState().bootReady === true, { timeout: 5000 });
  });

  test('loads the built renderer and forwards close requests into the pause flow', async ({ electronApp, page }) => {
    await expect(page.getByTestId('profile-selector-screen')).toBeVisible();

    await page.evaluate(() => {
      const e2e = (window as E2EWindow).__e2e!;
      const username = `electron-smoke-${Date.now()}`;
      const state = e2e.getStoreState();

      state.createAndLoginSimpleProfile(username);
      e2e.startGame();
    });

    await page.waitForFunction(() => (window as E2EWindow).__e2e!.getStoreState().phase === 'playing', { timeout: 5000 });

    await electronApp.evaluate(({ BrowserWindow }) => {
      const activeWindow = BrowserWindow.getAllWindows()[0];

      if (!activeWindow) {
        throw new Error('No Electron window available');
      }

      activeWindow.close();
    });

    await expect(page.getByRole('heading', { name: /confirm exit/i })).toBeVisible();

    const pausedState = await page.evaluate(() => (window as E2EWindow).__e2e!.getStoreState());

    expect(pausedState.phase).toBe('paused');
    expect(pausedState.pauseOverlay?.reason).toBe('window-close');

    await page.getByRole('button', { name: /keep playing/i }).click();
    await expect(page.getByRole('heading', { name: /confirm exit/i })).toHaveCount(0);

    const resumedState = await page.evaluate(() => (window as E2EWindow).__e2e!.getStoreState());

    expect(resumedState.phase).toBe('playing');
  });
});
