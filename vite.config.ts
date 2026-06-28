import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Required for Electron file:// protocol in production
  build: {
    outDir: 'dist',
  },
  server: {
    port: 5173,
  },
});
