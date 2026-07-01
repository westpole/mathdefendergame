import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  base: './', // Required for Electron file:// protocol in production
  build: {
    outDir: 'dist',
  },
  server: {
    port: 5173,
  },
});
