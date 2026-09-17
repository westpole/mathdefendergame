/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'e2e' ? [] : [viteSingleFile({ removeViteModuleLoader: true })])],
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
  resolve: {
    alias: {
      '@electron': fileURLToPath(new URL('./electron', import.meta.url)),
      '@game': fileURLToPath(new URL('./src/game', import.meta.url)),
      '@store': fileURLToPath(new URL('./src/store', import.meta.url)),
      '@ui': fileURLToPath(new URL('./src/ui', import.meta.url)),
      '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
      '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
    },
  },
  server: {
    host: true,      // or '0.0.0.0'
    port: 5173,
    strictPort: true,
  },
  define: {
    __E2E__: mode === 'e2e',
  },
}));
