import { test as base, _electron as electron, ElectronApplication, Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'url';

import type { E2EWindow } from '../types';

type Fixtures = {
  electronApp: ElectronApplication;
  page: Page;
};

export const test = base.extend<Fixtures>({
  electronApp: async ({}, use) => {
    const appRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
    const app = await electron.launch({
      args: [appRoot],
      env: { ...process.env, E2E: 'true', PLAYWRIGHT_ELECTRON_RUN: '1' }, // flags app is under Playwright E2E test
    });
    await use(app);
    await app.close();
  },
  page: async ({ electronApp }, use) => {
    const page = await electronApp.firstWindow();

    // Set feature flags via localStorage BEFORE app loads
    await page.addInitScript(() => {
      localStorage.setItem('__e2eFeatureFlags', JSON.stringify({ simple_login: true }));
    });

    await page.waitForLoadState('domcontentloaded');
    await use(page);

    if (page.isClosed()) {
      return;
    }

    try {
      const bridgeReady = await page.evaluate(() => (window as E2EWindow).__e2e !== undefined);

      if (!bridgeReady) {
        return;
      }

      const endedGame = await page.evaluate(() => (window as E2EWindow).__e2e!.endActiveGame());

      if (endedGame) {
        await page.waitForFunction(() => {
          const e2e = (window as E2EWindow).__e2e;

          if (!e2e) {
            return true;
          }

          const state = e2e.getStoreState();
          return state.phase !== 'playing' && state.phase !== 'paused' && state.phase !== 'stage-message';
        }, { timeout: 5000 });
      }
    } catch {
      // Ignore teardown cleanup failures and let the app fixture close the window.
    }
  },
});

export { expect } from '@playwright/test';
