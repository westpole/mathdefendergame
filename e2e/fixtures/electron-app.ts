import { test as base, _electron as electron, ElectronApplication, Page } from '@playwright/test';
import path from 'path';

import type { E2EWindow } from '../types';

type Fixtures = {
  electronApp: ElectronApplication;
  page: Page;
};

export const test = base.extend<Fixtures>({
  electronApp: async ({}, use) => {
    const app = await electron.launch({
      args: [path.join(__dirname, '../../electron/main.js')],
      env: { ...process.env, E2E: 'true' }, // flag your app is under test
    });
    await use(app);
    await app.close();
  },
  page: async ({ electronApp }, use) => {
    const page = await electronApp.firstWindow();
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
