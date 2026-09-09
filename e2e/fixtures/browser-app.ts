import { test as base, type Page } from '@playwright/test';

import type { E2EWindow } from '../types';

type Fixtures = {
  page: Page;
};

export const test = base.extend<Fixtures>({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(() => (window as E2EWindow).__e2e !== undefined, { timeout: 5000 });
    await page.waitForFunction(() => (window as E2EWindow).__e2e?.getStoreState().bootReady === true, { timeout: 5000 });

    await use(page);

    if (page.isClosed()) {
      return;
    }

    try {
      const endedGame = await page.evaluate(() => (window as E2EWindow).__e2e?.endActiveGame() ?? false);

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
      // Ignore teardown cleanup failures and let Playwright dispose the page.
    }
  },
});

export { expect } from '@playwright/test';
