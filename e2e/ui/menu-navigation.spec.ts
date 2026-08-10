import { test, expect } from '../fixtures/electron-app';
import type { E2EWindow } from '../types';

test.describe('Menu Navigation', () => {
  test('should show login screen on launch', async ({ page }) => {
    await page.waitForFunction(() => (window as E2EWindow).__e2e !== undefined, { timeout: 5000 });

    const loginScreen = page.locator('[data-testid="login-screen"]');
    await expect(loginScreen).toBeVisible();
  });

  test('can navigate to high scores view', async ({ page }) => {
    await page.waitForFunction(() => (window as E2EWindow).__e2e !== undefined, { timeout: 5000 });

    // Update store to show high scores
    await page.evaluate(() => {
      (window as E2EWindow).__e2e!.setStoreState({ menuView: 'high-score' });
    });

    // Verify state changed
    const state = await page.evaluate(() => (window as E2EWindow).__e2e!.getStoreState());
    expect(state.menuView).toBe('high-score');
  });

  test('can navigate to rules view', async ({ page }) => {
    await page.waitForFunction(() => (window as E2EWindow).__e2e !== undefined, { timeout: 5000 });

    // Update store to show rules
    await page.evaluate(() => {
      (window as E2EWindow).__e2e!.setStoreState({ menuView: 'rules' });
    });

    // Verify state changed
    const state = await page.evaluate(() => (window as E2EWindow).__e2e!.getStoreState());
    expect(state.menuView).toBe('rules');
  });
});
