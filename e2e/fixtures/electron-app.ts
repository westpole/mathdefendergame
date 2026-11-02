import { test as base, _electron as electron, ElectronApplication, Page } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
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
    // Isolated profile per launch: parallel workers sharing one userData dir contend for localStorage.
    const userDataDir = await mkdtemp(path.join(tmpdir(), 'math-defender-e2e-'));
    // ELECTRON_RUN_AS_NODE is set by VS Code terminals; it makes electron.exe run as plain Node and reject Chromium flags.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ELECTRON_RUN_AS_NODE, ...inheritedEnv } = process.env;
    const env = { ...inheritedEnv, E2E: 'true', PLAYWRIGHT_ELECTRON_RUN: '1' }; // flags app is under Playwright E2E test

    const app = await electron.launch({
      args: [appRoot, `--user-data-dir=${userDataDir}`],
      env,
    });
    await use(app);
    await app.close();
    await rm(userDataDir, { recursive: true, force: true, maxRetries: 3 });
  },
  page: async ({ electronApp }, use) => {
    const page = await electronApp.firstWindow();

    // Set feature flags and pin English (i18n otherwise falls back to the OS locale) via localStorage BEFORE app loads
    await page.addInitScript(() => {
      localStorage.setItem('__e2eFeatureFlags', JSON.stringify({ simple_login: true }));
      localStorage.setItem('math-defender-language', 'en');
    });

    await page.waitForLoadState('domcontentloaded');

    // The first load can start before the init script is registered; reload so it always applies.
    const languagePinned = await page.evaluate(() => {
      const pinned = localStorage.getItem('math-defender-language') === 'en';
      localStorage.setItem('math-defender-language', 'en');
      return pinned;
    });

    if (!languagePinned) {
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
    }
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
