import { test, expect } from '../fixtures/electron-app';
import type { Page } from '@playwright/test';
import type { E2EWindow } from '../types';

async function loginToStartMenu(page: Page) {
  const username = `Pilot${Date.now()}`;

  await page.getByRole('tab', { name: 'Create profile' }).click();
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill('Abc12345');
  await page.getByRole('button', { name: 'Create profile' }).click();
  await expect(page.getByTestId('main-menu')).toBeVisible();
}

test.describe('Menu Navigation', () => {
  test('should show login screen on launch', async ({ page }) => {
    await page.waitForFunction(() => (window as E2EWindow).__e2e !== undefined, { timeout: 5000 });

    const loginScreen = page.locator('[data-testid="login-screen"]');
    await expect(loginScreen).toBeVisible();
    await expect(page.getByTestId('menu-toggle-button')).toHaveCount(0);
  });

  test('shows start menu options only after clicking Menu', async ({ page }) => {
    await page.waitForFunction(() => (window as E2EWindow).__e2e !== undefined, { timeout: 5000 });
    await loginToStartMenu(page);

    await expect(page.getByTestId('menu-options')).toHaveCount(0);

    await page.getByTestId('menu-toggle-button').click();

    await expect(page.getByTestId('menu-overlay')).toBeVisible();
    await expect(page.getByTestId('menu-close-button')).toBeVisible();
    await expect(page.getByTestId('menu-options')).toBeVisible();
    await expect(page.getByTestId('menu-option-home')).toBeVisible();
    await expect(page.getByTestId('menu-option-profile')).toBeVisible();
    await expect(page.getByTestId('menu-option-performance')).toBeVisible();
    await expect(page.getByTestId('menu-option-rules')).toBeVisible();
  });

  test('can close the start menu using the close button', async ({ page }) => {
    await page.waitForFunction(() => (window as E2EWindow).__e2e !== undefined, { timeout: 5000 });
    await loginToStartMenu(page);

    await page.getByTestId('menu-toggle-button').click();
    await expect(page.getByTestId('menu-overlay')).toBeVisible();

    await page.getByTestId('menu-close-button').click();

    await expect(page.getByTestId('menu-overlay')).toHaveCount(0);
    await expect(page.getByTestId('menu-options')).toHaveCount(0);
  });

  test('can navigate to the profile view from the React menu', async ({ page }) => {
    await page.waitForFunction(() => (window as E2EWindow).__e2e !== undefined, { timeout: 5000 });
    await loginToStartMenu(page);

    await page.getByTestId('menu-toggle-button').click();
    await page.getByTestId('menu-option-profile').click();

    await expect(page.getByTestId('profile-overlay')).toBeVisible();
    await expect(page.getByTestId('menu-options')).toHaveCount(0);

    const state = await page.evaluate(() => (window as E2EWindow).__e2e!.getStoreState());
    expect(state.menuView).toBe('profile');
  });

  test('can navigate to rules view from the React menu', async ({ page }) => {
    await page.waitForFunction(() => (window as E2EWindow).__e2e !== undefined, { timeout: 5000 });
    await loginToStartMenu(page);

    await page.getByTestId('menu-toggle-button').click();
    await page.getByTestId('menu-option-rules').click();

    await expect(page.getByTestId('rules-overlay')).toBeVisible();
    await expect(page.getByTestId('menu-options')).toHaveCount(0);

    const state = await page.evaluate(() => (window as E2EWindow).__e2e!.getStoreState());
    expect(state.menuView).toBe('rules');
  });

  test('can navigate to the performance view from the React menu', async ({ page }) => {
    await page.waitForFunction(() => (window as E2EWindow).__e2e !== undefined, { timeout: 5000 });
    await loginToStartMenu(page);

    await page.getByTestId('menu-toggle-button').click();
    await page.getByTestId('menu-option-performance').click();

    await expect(page.getByTestId('performance-overlay')).toBeVisible();
    await expect(page.getByTestId('menu-options')).toHaveCount(0);

    const state = await page.evaluate(() => (window as E2EWindow).__e2e!.getStoreState());
    expect(state.menuView).toBe('performance');
  });
});
