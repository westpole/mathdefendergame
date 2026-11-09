import { test, expect } from '../fixtures/electron-app';
import type { Page } from '@playwright/test';
import type { E2EWindow } from '../types';

async function loginToStartMenu(page: Page) {
  const username = `Pilot${Date.now()}`;

  await page.getByRole('button', { name: /create profile/i }).click();
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password', { exact: true }).fill('Abc12345');
  await page.getByLabel('Verify password').fill('Abc12345');
  await page.getByRole('button', { name: /^create$/i }).click();
  await expect(page.getByTestId('main-menu')).toBeVisible();
}

test.describe('Menu Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Override simple_login to false to test LoginOverlay component and reset language
    await page.addInitScript(() => {
      localStorage.setItem('__e2eFeatureFlags', JSON.stringify({ simple_login: false }));
      localStorage.setItem('math-defender-language', 'en');
    });
    await page.reload();
    await page.waitForFunction(() => (window as E2EWindow).__e2e !== undefined, { timeout: 5000 });
    await page.waitForFunction(() => (window as E2EWindow).__e2e?.getStoreState().bootReady === true, { timeout: 5000 });
  });

  test('should show login screen on launch', async ({ page }) => {
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
    expect(state.screenView).toBe('profile');
  });

  test('can navigate to rules view from the React menu', async ({ page }) => {
    await page.waitForFunction(() => (window as E2EWindow).__e2e !== undefined, { timeout: 5000 });
    await loginToStartMenu(page);

    await page.getByTestId('menu-toggle-button').click();
    await page.getByTestId('menu-option-rules').click();

    await expect(page.getByTestId('rules-overlay')).toBeVisible();
    await expect(page.getByTestId('rules-overlay')).toHaveAttribute('data-device', 'desktop');
    await expect(page.getByText(/press esc to pause/i)).toBeVisible();
    await expect(page.getByTestId('menu-options')).toHaveCount(0);

    const state = await page.evaluate(() => (window as E2EWindow).__e2e!.getStoreState());
    expect(state.screenView).toBe('rules');
  });

  test('opens rules from the home hint and remembers its dismissal', async ({ page }) => {
    await loginToStartMenu(page);

    await page.getByTestId('home-rules-hint-link').click();
    await expect(page.getByTestId('rules-overlay')).toBeVisible();

    await page.getByTestId('menu-toggle-button').click();
    await page.getByTestId('menu-option-home').click();
    // The hint unmounts as soon as it is dismissed, so click instead of check (which re-reads the state).
    await page.getByTestId('home-rules-hint-dismiss').click();

    await expect(page.getByTestId('home-rules-hint')).toHaveCount(0);
  });

  test('starts regular play by clicking the Regular Play tile', async ({ page }) => {
    await loginToStartMenu(page);

    await page.getByTestId('home-regular-play-tile').click();

    await page.waitForFunction(() => (window as E2EWindow).__e2e?.getStoreState().phase === 'playing', { timeout: 5000 });
    const state = await page.evaluate(() => (window as E2EWindow).__e2e!.getStoreState());
    expect(state.runMode).toBe('regular');
    await expect(page.getByTestId('main-menu')).toHaveCount(0);
  });

  test('pauses the practice start on the operation selector, then plays the picked operation', async ({ page }) => {
    await loginToStartMenu(page);

    await page.getByTestId('home-practice-tile').click();

    await expect(page.getByTestId('practice-select-overlay')).toBeVisible();
    // A brand-new profile has no practice history, so nothing is marked "Last practiced".
    await expect(page.getByTestId('practice-operation-last')).toHaveCount(0);
    let state = await page.evaluate(() => (window as E2EWindow).__e2e!.getStoreState());
    expect(state.phase).toBe('start');
    expect(state.screenView).toBe('practice-select');

    await page.getByTestId('practice-operation-*').click();

    await page.waitForFunction(() => (window as E2EWindow).__e2e?.getStoreState().phase === 'playing', { timeout: 5000 });
    state = await page.evaluate(() => (window as E2EWindow).__e2e!.getStoreState());
    expect(state.runMode).toBe('practice');
    expect(state.practiceOperation).toBe('*');
    expect(state.profiles[state.activeUsername!]?.lastPracticeOperation).toBe('*');
    await expect(page.getByTestId('practice-select-overlay')).toHaveCount(0);
  });

  test('opens the practice operation selector from the React menu and can go back home', async ({ page }) => {
    await loginToStartMenu(page);

    await page.getByTestId('menu-toggle-button').click();
    await page.getByTestId('menu-option-practice').click();

    await expect(page.getByTestId('practice-select-overlay')).toBeVisible();
    await expect(page.getByTestId('menu-options')).toHaveCount(0);

    await page.getByTestId('practice-select-back').click();

    await expect(page.getByTestId('main-menu')).toBeVisible();
    const state = await page.evaluate(() => (window as E2EWindow).__e2e!.getStoreState());
    expect(state.phase).toBe('start');
    expect(state.screenView).toBe('home');
  });

  test('can navigate to the performance view from the React menu', async ({ page }) => {
    await page.waitForFunction(() => (window as E2EWindow).__e2e !== undefined, { timeout: 5000 });
    await loginToStartMenu(page);

    await page.getByTestId('menu-toggle-button').click();
    await page.getByTestId('menu-option-performance').click();

    await expect(page.getByTestId('performance-overlay')).toBeVisible();
    await expect(page.getByTestId('menu-options')).toHaveCount(0);

    const state = await page.evaluate(() => (window as E2EWindow).__e2e!.getStoreState());
    expect(state.screenView).toBe('performance');
  });
});
