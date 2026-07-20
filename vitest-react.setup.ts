import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest'; // Included from your previous question!

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
