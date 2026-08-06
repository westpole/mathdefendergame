import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined, // Electron windows don't parallelize as cleanly as browser contexts
  projects: [
    { testDir: './e2e/ui' },
    { testDir: './e2e/game' },
    { testDir: './e2e/integration' },
    {
      testDir: './e2e/visual',
      expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01 } },
    },
  ],
  reporter: process.env.CI ? [['html'], ['github']] : 'list',
});
