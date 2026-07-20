import { vi } from 'vitest';

// Mock the built-in 'electron' module for the Main process
vi.mock('electron', () => {
  return {
    app: {
      getPath: vi.fn().mockReturnValue('/mocked/path'),
      getAppPath: vi.fn().mockReturnValue('/mocked/app/path'),
      isPackaged: false,
    },
    ipcMain: {
      on: vi.fn(),
      handle: vi.fn(),
      removeHandler: vi.fn(),
    },
    dialog: {
      showOpenDialog: vi.fn().mockResolvedValue({ canceled: false, filePaths: [] }),
    },
    BrowserWindow: vi.fn().mockImplementation(() => ({
      loadURL: vi.fn(),
      webContents: { send: vi.fn() },
      on: vi.fn(),
    })),
  };
});
