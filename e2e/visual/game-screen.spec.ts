import type { Page } from '@playwright/test';

import { test, expect } from '../fixtures/electron-app';

import type { E2EWindow } from '../types';

test.describe('Visual Regression Tests', () => {
  test('select profile screen should match snapshot', async ({ page }) => {
    await page.waitForFunction(() => (window as E2EWindow).__e2e?.getStoreState().bootReady === true, {
      timeout: 5000,
    });

    // Seed fixed profiles; the remembered one is preselected so the dropdown shows a stable value.
    await page.evaluate(() => {
      const createdAt = Date.UTC(2026, 0, 1);
      const profile = (username: string, bestScore: number) => ({
        username,
        password: 'enc:v1:e2e',
        bestScore,
        highestStage: 3,
        preferredGrade: 'cadet' as const,
        createdAt,
        updatedAt: createdAt,
      });

      const e2e = (window as E2EWindow).__e2e!;
      // Unmount the selector first: it reads rememberedUsername only on mount (remember-me checkbox).
      e2e.setStoreState({ bootReady: false });
      e2e.setStoreState({
        bootReady: true,
        phase: 'login',
        activeUsername: null,
        rememberedUsername: 'CommanderRex',
        profiles: {
          AcePilot: profile('AcePilot', 340),
          CommanderRex: profile('CommanderRex', 12250),
        },
      });
    });

    const selector = page.getByTestId('profile-selector-screen');
    await expect(selector).toBeVisible();
    await expect(selector.locator('#profile-selector-username')).toContainText('CommanderRex');

    await expectStableScreenshot(page, 'select-profile-screen.png');
  });

  test('profile screen should match snapshot', async ({ page }) => {
    await page.waitForFunction(() => (window as E2EWindow).__e2e !== undefined, { timeout: 5000 });

    await page.evaluate(() => {
      const e2e = (window as E2EWindow).__e2e;
      if (!e2e) {
        throw new Error('E2E bridge not available');
      }

      e2e.setStoreState({
        activeUsername: 'CommanderRex',
        bootReady: true,
        phase: 'start',
        screenView: 'profile',
        grade: 'commander',
        score: 12250,
        correctCount: 28,
        incorrectCount: 8,
        gameHistoryByProfile: {
          CommanderRex: [
            {
              key: 'profile-run-1',
              playedAt: Date.now() - 172800000,
              finalScore: 4200,
              finalPerfScore: 68,
              gradeAtFinish: 'cadet',
              correctAnswers: 14,
              incorrectAnswers: 5,
              averageAnswerTimeMs: 4200,
              mostProblematicOperation: '*',
              operationStats: {
                '+': { attempts: 8, incorrect: 1, avgTimeMs: 2600 },
                '-': { attempts: 6, incorrect: 1, avgTimeMs: 2800 },
                '*': { attempts: 7, incorrect: 3, avgTimeMs: 3400 },
                '/': { attempts: 5, incorrect: 2, avgTimeMs: 3900 },
              },
            },
            {
              key: 'profile-run-2',
              playedAt: Date.now() - 129600000,
              finalScore: 8600,
              finalPerfScore: 79,
              gradeAtFinish: 'commander',
              correctAnswers: 23,
              incorrectAnswers: 7,
              averageAnswerTimeMs: 3900,
              mostProblematicOperation: '/',
              operationStats: {
                '+': { attempts: 11, incorrect: 1, avgTimeMs: 2200 },
                '-': { attempts: 8, incorrect: 1, avgTimeMs: 2400 },
                '*': { attempts: 8, incorrect: 2, avgTimeMs: 2800 },
                '/': { attempts: 9, incorrect: 3, avgTimeMs: 3600 },
              },
            },
            {
              key: 'profile-run-3',
              playedAt: Date.now() - 86400000,
              finalScore: 11800,
              finalPerfScore: 86,
              gradeAtFinish: 'commander',
              correctAnswers: 31,
              incorrectAnswers: 10,
              averageAnswerTimeMs: 3600,
              mostProblematicOperation: '/',
              operationStats: {
                '+': { attempts: 13, incorrect: 1, avgTimeMs: 1900 },
                '-': { attempts: 11, incorrect: 2, avgTimeMs: 2200 },
                '*': { attempts: 10, incorrect: 3, avgTimeMs: 2500 },
                '/': { attempts: 11, incorrect: 4, avgTimeMs: 3300 },
              },
            },
          ],
        },
      });
    });

    await expect(page.getByTestId('profile-overlay')).toBeVisible();

    await expectStableScreenshot(page, 'profile-screen.png');
  });

  test('performance screen should match snapshot', async ({ page }) => {
    await page.waitForFunction(() => (window as E2EWindow).__e2e !== undefined, { timeout: 5000 });

    await page.evaluate(() => {
      const e2e = (window as E2EWindow).__e2e;
      if (!e2e) {
        throw new Error('E2E bridge not available');
      }

      e2e.setStoreState({
        activeUsername: 'CommanderRex',
        bootReady: true,
        phase: 'start',
        screenView: 'performance',
        grade: 'commander',
        score: 17600,
        gameHistoryByProfile: {
          CommanderRex: [
            {
              key: 'run-1',
              playedAt: Date.now() - 86400000,
              correctAnswers: 18,
              incorrectAnswers: 5,
              averageAnswerTimeMs: 3600,
              mostProblematicOperation: '/',
              operationStats: {
                '+': { attempts: 12, incorrect: 2, avgTimeMs: 2100 },
                '-': { attempts: 9, incorrect: 1, avgTimeMs: 2400 },
                '*': { attempts: 8, incorrect: 3, avgTimeMs: 2800 },
                '/': { attempts: 7, incorrect: 4, avgTimeMs: 3900 },
              },
              gradeAtFinish: 'commander',
              finalScore: 9200,
              finalPerfScore: 84,
            },
            {
              key: 'run-2',
              playedAt: Date.now() - 43200000,
              correctAnswers: 25,
              incorrectAnswers: 6,
              averageAnswerTimeMs: 3200,
              mostProblematicOperation: '*',
              operationStats: {
                '+': { attempts: 14, incorrect: 2, avgTimeMs: 1900 },
                '-': { attempts: 11, incorrect: 1, avgTimeMs: 2200 },
                '*': { attempts: 11, incorrect: 3, avgTimeMs: 2600 },
                '/': { attempts: 9, incorrect: 5, avgTimeMs: 3700 },
              },
              gradeAtFinish: 'commander',
              finalScore: 12850,
              finalPerfScore: 88,
            },
          ],
        },
      });
    });

    await page.waitForSelector('[data-testid="performance-overlay"]');
    await page.waitForTimeout(1500);

    await expect(page).toHaveScreenshot('performance-screen.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('game canvas screen should match snapshot', async ({ page }) => {
    await page.waitForFunction(() => (window as E2EWindow).__e2e !== undefined, { timeout: 5000 });

    // Start game with fixed seed for consistency
    await page.evaluate(() => {
      const e2e = (window as E2EWindow).__e2e;
      if (!e2e) {
        throw new Error('E2E bridge not available');
      }

      e2e.setSeed(12345);
      e2e.startGame();
    });

    // Wait for game scene to initialize
    await page.waitForTimeout(1000);

    // Take screenshot
    await expect(page).toHaveScreenshot('game-canvas.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('home screen should match snapshot', async ({ page }) => {
    await seedStartScreen(page, 'home');

    const home = page.getByTestId('main-menu');
    await expect(home).toBeVisible();
    await expect(page.getByTestId('home-rules-hint')).toBeVisible();

    await expectStableScreenshot(page, 'home-screen.png');
  });

  test('menu screen should match snapshot', async ({ page }) => {
    await seedStartScreen(page, 'home');
    await expect(page.getByTestId('main-menu')).toBeVisible();

    await page.getByTestId('menu-toggle-button').click();
    await expect(page.getByTestId('menu-options')).toBeVisible();
    await expect(page.getByTestId('menu-option-home')).toHaveAttribute('aria-current', 'page');

    await expectStableScreenshot(page, 'menu-screen.png');
  });

  test('settings screen should match snapshot', async ({ page }) => {
    // The weekly goal's Suggested option depends on the current week, so pin the clock.
    await seedStartScreen(page, 'settings', { pinClock: true });

    await expect(page.getByTestId('settings-overlay')).toBeVisible();
    await expect(page.getByTestId('settings-avatar-option-avatar-3')).toBeVisible();

    await expectStableScreenshot(page, 'settings-screen.png');
  });

  test('rules screen should match snapshot', async ({ page }) => {
    await seedStartScreen(page, 'rules');

    await expect(page.getByTestId('rules-overlay')).toBeVisible();

    await expectStableScreenshot(page, 'rules-screen.png');
  });

  test('weekly report screen should match snapshot', async ({ page }) => {
    // The overlay reads Date.now() once on mount for the week window, so seed with the clock pinned.
    await seedStartScreen(page, 'weekly-report', { pinClock: true });

    const report = page.getByTestId('weekly-report-overlay');
    await expect(report).toBeVisible();
    await expect(report).toContainText('Jan 9 - Jan 15');
    await expect(page.getByTestId('home-weekly-empty-state')).toHaveCount(0);

    await expectStableScreenshot(page, 'weekly-report-screen.png');
  });

  test('achievements screen should match snapshot', async ({ page }) => {
    // Streak, goal and badges are worked out from the week of Date.now(), read once on mount.
    await seedStartScreen(page, 'achievements', { pinClock: true });

    await expect(page.getByTestId('achievements-overlay')).toBeVisible();
    await expect(page.getByTestId('achievements-streak-card')).toBeVisible();
    await expect(page.getByTestId('achievements-badges')).toBeVisible();

    await expectStableScreenshot(page, 'achievements-screen.png');
  });
});

type StartScreenView = 'home' | 'settings' | 'rules' | 'weekly-report' | 'achievements';

/** Fixed reference time (2026-01-15 12:00 UTC) for seeded run history and the pinned clock. */
const REFERENCE_NOW = Date.UTC(2026, 0, 15, 12);

/**
 * Seeds a logged-in profile with fixed data and opens the given start-phase screen view.
 *
 * @param page - Electron renderer page.
 * @param screenView - Start-phase view to open.
 * @param options.pinClock - Pins `Date.now()` to `REFERENCE_NOW` while the view mounts, then restores it.
 */
async function seedStartScreen(page: Page, screenView: StartScreenView, { pinClock = false } = {}) {
  await page.waitForFunction(() => (window as E2EWindow).__e2e?.getStoreState().bootReady === true, {
    timeout: 5000,
  });

  await page.evaluate(
    async ({ view, referenceNow, shouldPinClock }) => {
      const e2e = (window as E2EWindow).__e2e!;
      const createdAt = Date.UTC(2026, 0, 1);
      const dayMs = 24 * 60 * 60 * 1000;
      const realNow = Date.now;

      if (shouldPinClock) {
        Date.now = () => referenceNow;
      }

      try {
        e2e.setStoreState({
          bootReady: true,
          phase: 'start',
          screenView: view,
          activeUsername: 'CommanderRex',
          grade: 'commander',
          gradeNotice: null,
          profiles: {
            CommanderRex: {
              username: 'CommanderRex',
              password: 'enc:v1:e2e',
              bestScore: 12250,
              highestStage: 3,
              preferredGrade: 'cadet',
              avatarId: 'avatar-3',
              createdAt,
              updatedAt: createdAt,
            },
          },
          gameHistoryByProfile: {
            CommanderRex: [
              {
                key: 'weekly-run-1',
                playedAt: referenceNow - 3 * dayMs,
                finalScore: 8600,
                finalPerfScore: 79,
                gradeAtFinish: 'commander',
                correctAnswers: 23,
                incorrectAnswers: 7,
                averageAnswerTimeMs: 3900,
                mostProblematicOperation: '/',
                operationStats: {
                  '+': { attempts: 11, incorrect: 1, avgTimeMs: 2200 },
                  '-': { attempts: 8, incorrect: 1, avgTimeMs: 2400 },
                  '*': { attempts: 8, incorrect: 2, avgTimeMs: 2800 },
                  '/': { attempts: 9, incorrect: 3, avgTimeMs: 3600 },
                },
              },
              {
                key: 'weekly-run-2',
                playedAt: referenceNow - dayMs,
                finalScore: 11800,
                finalPerfScore: 86,
                gradeAtFinish: 'commander',
                correctAnswers: 31,
                incorrectAnswers: 10,
                averageAnswerTimeMs: 3600,
                mostProblematicOperation: '/',
                operationStats: {
                  '+': { attempts: 13, incorrect: 1, avgTimeMs: 1900 },
                  '-': { attempts: 11, incorrect: 2, avgTimeMs: 2200 },
                  '*': { attempts: 10, incorrect: 3, avgTimeMs: 2500 },
                  '/': { attempts: 11, incorrect: 4, avgTimeMs: 3300 },
                },
              },
            ],
          },
        });

        if (shouldPinClock) {
          // Two frames let React commit the mount that reads Date.now() before the real clock returns.
          await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        }
      } finally {
        Date.now = realNow;
      }
    },
    { view: screenView, referenceNow: REFERENCE_NOW, shouldPinClock: pinClock },
  );
}

/**
 * Waits for fonts, then captures a full-page snapshot with animations and caret disabled.
 * `toHaveScreenshot` retries until two consecutive captures match, so no fixed sleep is needed.
 * The diff tolerance comes from the `electron-visual` project config.
 */
async function expectStableScreenshot(page: Page, name: string) {
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveScreenshot(name, {
    animations: 'disabled',
    caret: 'hide',
  });
}
