import { vi } from 'vitest';

// Mock the built-in 'electron' module for the Main process
vi.mock('electron', () => {
  const menu = { items: [] };

  return {
    app: {
      getPath: vi.fn().mockReturnValue('/mocked/path'),
      getAppPath: vi.fn().mockReturnValue('/mocked/app/path'),
      isPackaged: false,
      whenReady: vi.fn(() => Promise.resolve()),
      on: vi.fn(),
      quit: vi.fn(),
    },
    ipcMain: {
      on: vi.fn(),
      handle: vi.fn(),
      removeHandler: vi.fn(),
    },
    Menu: {
      buildFromTemplate: vi.fn().mockReturnValue(menu),
      setApplicationMenu: vi.fn(),
    },
    dialog: {
      showOpenDialog: vi.fn().mockResolvedValue({ canceled: false, filePaths: [] }),
      showMessageBox: vi.fn().mockResolvedValue({ response: 1 }),
    },
    BrowserWindow: Object.assign(
      vi.fn().mockImplementation(function mockBrowserWindow() {
        return {
        loadURL: vi.fn(),
        loadFile: vi.fn(),
        on: vi.fn(),
        show: vi.fn(),
        close: vi.fn(),
        isDestroyed: vi.fn().mockReturnValue(false),
        webContents: {
          openDevTools: vi.fn(),
          send: vi.fn(),
          executeJavaScript: vi.fn().mockResolvedValue(true),
        },
      };
      }),
      {
        getAllWindows: vi.fn().mockReturnValue([]),
      },
    ),
  };
});
