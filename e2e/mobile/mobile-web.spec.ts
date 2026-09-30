import type { Page } from '@playwright/test';

import { test, expect } from '../fixtures/browser-app-login';

import type { E2EWindow } from '../types';

async function loginToStartMenu(page: Page, username: string) {
  await expect(page.getByTestId('login-screen')).toBeVisible();
  await page.getByRole('button', { name: 'Create Profile' }).click();
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password', { exact: true }).fill('Abc12345');
  await page.getByLabel('Verify password').fill('Abc12345');
  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByTestId('main-menu')).toBeVisible();
}

test.describe('Mobile web validation', () => {
  test('tracks viewport orientation and keeps start overlays usable', async ({ page }, testInfo) => {
    const viewport = page.viewportSize();

    expect(viewport).not.toBeNull();

    const orientation = await page.evaluate(() => document.documentElement.dataset.appOrientation);

    expect(orientation).toBe(viewport!.width > viewport!.height ? 'landscape' : 'portrait');

    await loginToStartMenu(page, `mobile-${testInfo.project.name}-${Date.now()}`);
    await page.getByTestId('menu-toggle-button').tap();
    await expect(page.getByTestId('menu-overlay')).toBeVisible();

    await page.getByTestId('menu-option-rules').tap();
    await expect(page.getByTestId('rules-overlay')).toBeVisible();

    const rulesBounds = await page.getByTestId('rules-overlay').boundingBox();

    expect(rulesBounds).not.toBeNull();
    expect(rulesBounds!.width).toBeLessThanOrEqual(viewport!.width);
    expect(rulesBounds!.height).toBeLessThanOrEqual(viewport!.height);
  });

  test('supports pausing game by touching the game canvas', async ({ page }) => {
    await loginToStartMenu(page, `mobile-play-${Date.now()}`);
    await page.getByTestId('menu-toggle-button').tap();
    await page.getByTestId('menu-option-play').tap();

    await page.evaluate(() => {
      const e2e = (window as E2EWindow).__e2e;

      if (!e2e) {
        throw new Error('E2E bridge not available');
      }

      e2e.setSeed(12345);
    });

    await expect(page.getByTestId('mobile-input-panel')).toBeVisible();
    const inputPreview = page.locator('.input-preview');

    await page.getByRole('button', { name: 'Digit 1' }).tap();
    await page.getByRole('button', { name: 'Digit 2' }).tap();
    await expect(inputPreview).toHaveText('12');

    const stateAfterDigits = await page.evaluate(() => (window as E2EWindow).__e2e!.getStoreState());

    expect(stateAfterDigits.inputBuffer).toBe('12');

    await page.getByRole('button', { name: 'Backspace' }).tap();
    await expect(inputPreview).toHaveText('1');

    const canvasBounds = await page.locator('#game-container canvas').boundingBox();

    expect(canvasBounds).not.toBeNull();
    await page.touchscreen.tap(canvasBounds!.x + canvasBounds!.width / 2, canvasBounds!.y + 20);

    const pausedState = await page.evaluate(() => (window as E2EWindow).__e2e!.getStoreState());

    expect(pausedState.phase).toBe('paused');
    expect(pausedState.pauseOverlay?.reason).toBe('escape');
    await expect(page.getByRole('heading', { name: 'Game Paused' })).toBeVisible();
  });
});
