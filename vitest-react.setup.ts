import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

import i18n from './src/i18n/config';

void i18n.changeLanguage('en');

// Mock the secure bridge API exposure (e.g., window.electron API layer)
Object.defineProperty(window, 'electron', {
  value: {
    // Mimic the exact channel methods you created in your preload.ts
    sendIpcMessage: vi.fn(),
    invokeIpcEvent: vi.fn().mockResolvedValue({ success: true }),
    onIpcReceive: vi.fn(() => {
      // Return a cleanup function if your real code expects one
      return () => {};
    }),
  },
  writable: true,
});
