import { test, expect } from '../fixtures/electron-app';

import type { E2EWindow } from '../types';

test.describe('Electron wrapper smoke', () => {
  test('loads the built renderer and forwards close requests into the pause flow', async ({ electronApp, page }) => {
    await page.waitForFunction(() => (window as E2EWindow).__e2e !== undefined, { timeout: 5000 });
    await expect(page.getByTestId('login-screen')).toBeVisible();

    await page.evaluate(() => {
      const e2e = (window as E2EWindow).__e2e!;
      const username = `electron-smoke-${Date.now()}`;
      const state = e2e.getStoreState();

      state.createAndLoginProfile?.(username, 'Abc12345', false);
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

    await expect(page.getByRole('heading', { name: 'Confirm Exit' })).toBeVisible();

    const pausedState = await page.evaluate(() => (window as E2EWindow).__e2e!.getStoreState());

    expect(pausedState.phase).toBe('paused');
    expect(pausedState.pauseOverlay?.reason).toBe('window-close');

    await page.getByRole('button', { name: 'Keep playing' }).click();
    await expect(page.getByRole('heading', { name: 'Confirm Exit' })).toHaveCount(0);

    const resumedState = await page.evaluate(() => (window as E2EWindow).__e2e!.getStoreState());

    expect(resumedState.phase).toBe('playing');
  });
});
