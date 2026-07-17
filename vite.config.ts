/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  plugins: [react()],
  base: './',
  // Required for Electron file:// protocol in production
  build: {
    outDir: 'build',
    rollupOptions: {
      // Exclude specific files from the bundle
      external: [
        // Excludes all files inside any __mocks__ folder
        /.*\/__mocks__\/.*/,
        // Excludes all files inside any __tests__ folder
        /.*\/__tests__\/.*/,
        // Excludes all Storybook files (e.g., button.stories.tsx)
        /.*\.stories\..*/,
      ],
    },
  },
  server: {
    port: 5173
  },
  test: {
    projects: [{
      extends: true,
      plugins: [
      // The plugin will run tests for the stories defined in your Storybook config
      // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
      storybookTest({
        configDir: path.join(dirname, '.storybook')
      })],
      test: {
        name: 'storybook',
        browser: {
          enabled: true,
          headless: true,
          provider: playwright({}),
          instances: [{
            browser: 'chromium'
          }]
        }
      }
    }]
  }
});
