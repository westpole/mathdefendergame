import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { playwright } from '@vitest/browser-playwright';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';

const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));
const isElectronOnlyRun = process.argv.some((arg, index, argv) => {
  return arg === '--project=electron' || (arg === '--project' && argv[index + 1] === 'electron');
});

const defaultCoverageThresholds = {
  // Global fallback thresholds if files don't match specific globs below
  statements: 60,
  branches: 60,
  functions: 60,
  lines: 60,

  // Target: React UI components (High coverage requirement)
  'src/ui/**': {
    statements: 90,
    branches: 85,
    functions: 90,
    lines: 90,
  },
  'src/App.tsx': {
    statements: 90,
    branches: 85,
    functions: 90,
    lines: 90,
  },

  // Target: Phaser game architecture (Typically harder to mock, lower threshold acceptable)
  'src/utilities/**/*.ts': {
    lines: 100,
    branches: 100,
    functions: 100,
    statements: 100
  },
  'src/scenes/**/*.ts': {
    lines: 20,
    branches: 20,
    functions: 20,
    statements: 20,
  },
  'src/game.ts': {
    branches: 90,
    functions: 100,
    statements: 100
  },

  // Target: Electron main process (Critical for app stability, high coverage required)
  'electron/**/*.js': {
    lines: 90,
    branches: 90,
    functions: 90,
    statements: 90
  },

  // Zustand store coverage (State management logic, should be well-tested)
  'src/store/**/*.ts': {
    branches: 90,
  },
};

const electronCoverageThresholds = {
  statements: 90,
  branches: 90,
  functions: 90,
  lines: 90,
};

export default defineConfig({
  test: {
    globals: true,

    reporters: [
      'default',
      'html',
    ],
    outputFile: {
      html: './reports/index.html',
    },

    // 1. GLOBAL COVERAGE MANAGEMENT
    // Configured here because Vitest aggregates coverage globally across projects.
    coverage: {
      provider: 'v8',
      enabled: false,
      reportsDirectory: './reports/coverage',
      reporter: [
        'text',             // Prints a compact table directly to the console
        'json',             // Outputs data for CI tools (SonarQube, etc.)
        'html',             // Generates an interactive local browser report
      ],
      include: isElectronOnlyRun ? ['electron/**'] : ['src/**', 'electron/**'],
      exclude: [
        'src/**/*.d.ts',
        '**/*.stories.{ts,tsx}',
        '**/.storybook/**',
        '**/__tests__/**',
        '**/__mocks__/**',
        'electron/__tests__/**',
        'src/config.ts',
        'src/types.ts',
        'src/main.tsx',
        'src/**/*.css',
      ],

      thresholds: isElectronOnlyRun ? electronCoverageThresholds : defaultCoverageThresholds,
    },

    // 2. ISOLATED TEST PROJECTS CONFIGURATION
    // Keeps execution environments totally independent of one another.
    projects: [
      {
        extends: true,
        plugins: [react()],
        test: {
          name: 'react',
          environment: 'happy-dom',
          // deps: { inline: [/react/, /@testing-library/] },
          setupFiles: ['./vitest-react.setup.ts'],
          include: ['src/components/**/*.{test,spec}.{ts,tsx}'],
          // alias: {
          //   '@': path.resolve(__dirname, './src'),
          // },
        }
      },
      {
        extends: true,
        test: {
          name: 'phaser',
          environment: 'jsdom', // Canvas mock required (handled in setup)
          setupFiles: ['./vitest-phaser.setup.ts'],
          include: [
            'src/scenes/**/*.test.ts',
            'src/utilities/**/*.test.ts',
            'src/__tests__/game.test.ts',
          ],
          // alias: {
          //   '@': path.resolve(__dirname, './src'),
          // },
        }
      },
      {
        extends: true,
        test: {
          name: 'electron',
          setupFiles: ['./vitest-electron.setup.ts'],
          include: ['electron/**/*.test.js'],
          environment: 'node', // Electron main/preload tests run in Node.js
        },
      },
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, '.storybook')
          })
        ],
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
      }
    ]
  },
});
