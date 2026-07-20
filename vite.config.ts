/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

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
});
