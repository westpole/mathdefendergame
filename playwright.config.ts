import { defineConfig, devices } from '@playwright/test';

const e2eBaseUrl = 'http://127.0.0.1:4173';

/**
 * Set by the Docker e2e images (docker/e2e/Dockerfile).
 * - `E2E_TARGET=electron`: the image prebuilds build/, so the preview server is not needed.
 * - `E2E_ARTIFACTS_DIR`: mounted host folder that collects test-results and the HTML report.
 */
const isElectronOnlyTarget = process.env.E2E_TARGET === 'electron';
const artifactsDir = process.env.E2E_ARTIFACTS_DIR;
const htmlReporterOptions = artifactsDir ? { outputFolder: `${artifactsDir}/playwright-report`, open: 'never' as const } : {};

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined, // Electron windows don't parallelize as cleanly as browser contexts
  outputDir: artifactsDir ? `${artifactsDir}/test-results` : undefined,
  webServer: isElectronOnlyTarget
    ? undefined
    : {
        command: 'npm run build:web:e2e && npx vite preview --host 127.0.0.1 --port 4173',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        url: e2eBaseUrl,
      },
  projects: [
    {
      name: 'web-mobile-portrait',
      testDir: './e2e/mobile',
      use: {
        ...devices['Pixel 7'],
        baseURL: e2eBaseUrl,
      },
    },
    {
      name: 'web-mobile-landscape',
      testDir: './e2e/mobile',
      use: {
        ...devices['Pixel 7'],
        baseURL: e2eBaseUrl,
        viewport: { width: 915, height: 412 },
      },
    },
    { name: 'electron-ui', testDir: './e2e/ui' },
    { name: 'electron-game', testDir: './e2e/game' },
    { name: 'electron-integration', testDir: './e2e/integration' },
    { name: 'electron-smoke', testDir: './e2e/electron' },
    {
      name: 'electron-visual',
      testDir: './e2e/visual',
      expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01 } },
    },
  ],
  reporter: process.env.CI ? [['html', htmlReporterOptions], ['github']] : 'list',
});
