import { test, expect } from '../fixtures/electron-app';

import type { E2EWindow } from '../types';

test.describe('Visual Regression Tests', () => {
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
            { finalScore: 4200, correctAnswers: 14, incorrectAnswers: 5, averageAnswerTimeMs: 4200 },
            { finalScore: 8600, correctAnswers: 23, incorrectAnswers: 7, averageAnswerTimeMs: 3900 },
            { finalScore: 11800, correctAnswers: 31, incorrectAnswers: 10, averageAnswerTimeMs: 3600 },
          ],
        },
      });
    });

    await page.waitForSelector('[data-testid="profile-overlay"]');
    await page.waitForTimeout(1500);

    await expect(page).toHaveScreenshot('profile-screen.png', {
      maxDiffPixelRatio: 0.01,
    });
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
});
