import type { Page } from '@playwright/test';

import { test, expect } from '../fixtures/browser-app';

import type { E2EWindow } from '../types';

async function loginToStartMenu(page: Page, username: string) {
  await expect(page.getByTestId('login-screen')).toBeVisible();
  await page.getByRole('button', { name: 'Create Profile' }).tap();
  await page.getByLabel('Username').fill(username);
  await page.locator('#login-password').fill('Abc12345');
  await page.getByLabel('Verify password').fill('Abc12345');
  await page.getByRole('button', { name: 'Create' }).tap();
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

  test('supports touch answer entry and pause controls', async ({ page }) => {
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

    await page.getByRole('button', { name: 'Pause' }).tap();
    await expect(page.getByRole('heading', { name: 'Game Paused' })).toBeVisible();

    await page.getByRole('button', { name: 'Resume' }).tap();
    await expect(page.getByRole('heading', { name: 'Game Paused' })).toHaveCount(0);
  });
});
