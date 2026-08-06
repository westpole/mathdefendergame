import { test as base, _electron as electron, ElectronApplication, Page } from '@playwright/test';
import path from 'path';

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
  },
});

export { expect } from '@playwright/test';
