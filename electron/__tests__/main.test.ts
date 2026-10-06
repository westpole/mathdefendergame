/**
 * Unit tests for Electron main process
 * Tests window creation and IPC communication
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BrowserWindow, app, Menu, dialog, ipcMain } from 'electron';
import * as electronModule from 'electron';
import * as mainProcess from '../main';

// Mock electron modules are set up in vitest-electron.setup.ts
const mockedBrowserWindow = vi.mocked(BrowserWindow);

type RuntimeOptionsInput = {
  argv?: string[];
  isPackaged?: boolean;
  platform?: NodeJS.Platform;
};

function setPackagedState(isPackaged: boolean) {
  Object.defineProperty(app, 'isPackaged', {
    configurable: true,
    writable: true,
    value: isPackaged,
  });
}

function createRuntimeOptions(
  { argv = ['node', 'electron'], isPackaged = false, platform = 'win32' }: RuntimeOptionsInput = {},
) {
  vi.clearAllMocks();
  setPackagedState(isPackaged);

  return {
    argv,
    platform,
    electron: electronModule,
  };
}

async function flushCloseFlow() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe('Electron Main Process', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setPackagedState(false);
  });

  describe('Application lifecycle', () => {
    it('should initialize app listeners', () => {
      mainProcess.initializeApp(createRuntimeOptions());

      expect(app.requestSingleInstanceLock).toHaveBeenCalled();
      expect(app.whenReady).toHaveBeenCalled();
      expect(app.on).toHaveBeenCalledWith('second-instance', expect.any(Function));
      expect(app.on).toHaveBeenCalledWith('window-all-closed', expect.any(Function));
      expect(app.on).toHaveBeenCalledWith('activate', expect.any(Function));
    });

    it('should quit app when all windows are closed', () => {
      expect(app.quit).toBeDefined();
      expect(typeof app.quit).toBe('function');
    });
  });

  describe('Menu', () => {
    it('should build an empty menu outside developer modes', () => {
      const menu = mainProcess.buildMenu(createRuntimeOptions());

      expect(Menu.buildFromTemplate).toHaveBeenCalledWith([]);
      expect(menu).toBeDefined();
    });

    it('should include developer tools menu in development mode', () => {
      mainProcess.buildMenu(createRuntimeOptions({ argv: ['node', 'electron', '--renderer-url=http://localhost:5173'] }));

      expect(Menu.buildFromTemplate).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          label: 'Developer',
          submenu: expect.arrayContaining([
            expect.objectContaining({ role: 'reload' }),
            expect.objectContaining({ role: 'toggleDevTools' }),
          ]),
        }),
      ]));
    });
  });

  describe('IPC Communication', () => {
    it('should register IPC handlers', () => {
      const handler = vi.fn();

      ipcMain.on('test-channel', handler);
      expect(ipcMain.on).toHaveBeenCalledWith('test-channel', handler);
    });

    it('should handle async IPC calls', () => {
      const handler = vi.fn(() => Promise.resolve('result'));

      ipcMain.handle('test-async', handler);
      expect(ipcMain.handle).toHaveBeenCalledWith('test-async', handler);
    });
  });

  describe('Window management', () => {
    it('should load URL in development mode', () => {
      const win = mainProcess.createWindow(
        createRuntimeOptions({ argv: ['node', 'electron', '--renderer-url=http://localhost:5173'] }),
      );

      expect(win.loadURL).toHaveBeenCalledWith('http://localhost:5173');
    });

    it('should load file in production mode', () => {
      const win = mainProcess.createWindow(createRuntimeOptions());

      expect(win.loadFile).toHaveBeenCalledWith(expect.stringMatching(/build[\\/]index\.html$/));
    });

    it('should allow overriding the renderer build directory for file-based runs', () => {
      const win = mainProcess.createWindow(
        createRuntimeOptions({ argv: ['node', 'electron', '--renderer-build-dir=dist-web'] }),
      );

      expect(win.loadFile).toHaveBeenCalledWith(expect.stringMatching(/dist-web[\\/]index\.html$/));
    });

    it('should open dev tools when requested', () => {
      const win = mainProcess.createWindow(createRuntimeOptions({ argv: ['node', 'electron', '--inspect'] }));

      expect(win.webContents.openDevTools).toHaveBeenCalled();
    });

    it('should not open dev tools in packaged builds', () => {
      const win = mainProcess.createWindow(createRuntimeOptions({
        argv: ['node', 'electron', '--inspect'],
        isPackaged: true,
      }));

      expect(win.webContents.openDevTools).not.toHaveBeenCalled();
    });

    it('should configure the application menu when creating a window', () => {
      mainProcess.createWindow(createRuntimeOptions());

      expect(Menu.setApplicationMenu).toHaveBeenCalledWith(expect.any(Object));
      expect(BrowserWindow).toHaveBeenCalledWith({
        width: 900,
        height: 900,
        minWidth: 700,
        minHeight: 700,
        show: false,
        backgroundColor: '#1e2326',
        title: 'Math Defender',
        webPreferences: {
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true,
          webSecurity: true,
          allowRunningInsecureContent: false,
          enableRemoteModule: false,
          webviewTag: false,
          devTools: true,
        },
      });
    });

    it('should prevent close, delegate confirmation to the renderer, and close when ready', async () => {
      mockedBrowserWindow.mockClear();

      const win = mainProcess.createWindow(createRuntimeOptions());
      const executeJavaScriptMock = vi.mocked(win.webContents.executeJavaScript);
      executeJavaScriptMock
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce('ready');

      const onCalls = vi.mocked(win.on).mock.calls as Array<[string, (...args: unknown[]) => void]>;
      const closeHandler = onCalls.find(([eventName]) => eventName === 'close')?.[1];

      expect(closeHandler).toBeTypeOf('function');

      const event = { preventDefault: vi.fn() };

      if (!closeHandler) {
        throw new Error('Expected BrowserWindow "close" handler to be registered, but none was found.');
      }

      closeHandler(event);
      await flushCloseFlow();

      expect(event.preventDefault).toHaveBeenCalledTimes(1);
      expect(dialog.showMessageBox).not.toHaveBeenCalled();
      expect(win.webContents.executeJavaScript).toHaveBeenCalledWith(
        expect.stringContaining('electron-close-query'),
      );
      expect(win.webContents.executeJavaScript).toHaveBeenCalledWith(
        expect.stringContaining('math-defender-close-cancelled'),
      );
      expect(win.close).toHaveBeenCalledTimes(1);
    });

    it('should close immediately without confirmation when no game is running', async () => {
      const win = mainProcess.createWindow(createRuntimeOptions());
      const executeJavaScriptMock = vi.mocked(win.webContents.executeJavaScript);

      executeJavaScriptMock.mockResolvedValueOnce(false);
      const onCalls = vi.mocked(win.on).mock.calls as Array<[string, (...args: unknown[]) => void]>;
      const closeHandler = onCalls.find(([eventName]) => eventName === 'close')?.[1];

      expect(closeHandler).toBeTypeOf('function');

      const event = { preventDefault: vi.fn() };

      if (!closeHandler) {
        throw new Error('Expected BrowserWindow "close" handler to be registered, but none was found.');
      }

      closeHandler(event);
      await flushCloseFlow();

      expect(event.preventDefault).toHaveBeenCalledTimes(1);
      expect(dialog.showMessageBox).not.toHaveBeenCalled();
      expect(win.close).toHaveBeenCalledTimes(1);
    });

    it('should keep the window open when the renderer cancels the close flow', async () => {
      mockedBrowserWindow.mockClear();

      const win = mainProcess.createWindow(createRuntimeOptions());
      const executeJavaScriptMock = vi.mocked(win.webContents.executeJavaScript);
      executeJavaScriptMock
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce('cancelled');
      const onCalls = vi.mocked(win.on).mock.calls as Array<[string, (...args: unknown[]) => void]>;
      const closeHandler = onCalls.find(([eventName]) => eventName === 'close')?.[1];

      expect(closeHandler).toBeTypeOf('function');

      const event = { preventDefault: vi.fn() };

      if (!closeHandler) {
        throw new Error('Expected BrowserWindow "close" handler to be registered, but none was found.');
      }

      closeHandler(event);
      await flushCloseFlow();

      expect(dialog.showMessageBox).not.toHaveBeenCalled();
      expect(win.webContents.executeJavaScript).toHaveBeenCalledWith(
        expect.stringContaining('electron-close-requested'),
      );
      expect(win.close).not.toHaveBeenCalled();
    });

    it('should create a window when the app activates with no open windows', () => {
      mainProcess.initializeApp(createRuntimeOptions());

      const mockedAppOnCalls = vi.mocked(app.on).mock.calls as Array<[string, (...args: unknown[]) => void]>;
      const activateHandler = mockedAppOnCalls.find(([eventName]) => eventName === 'activate')?.[1];
      expect(activateHandler).toBeTypeOf('function');

      if (!activateHandler) {
        throw new Error('Expected app "activate" handler to be registered, but none was found.');
      }

      activateHandler();

      expect(mockedBrowserWindow).toHaveBeenCalled();
    });

    it('should quit when all windows are closed on non-macOS platforms', () => {
      mainProcess.initializeApp(createRuntimeOptions({ platform: 'win32' }));

      const mockedAppOnCalls = vi.mocked(app.on).mock.calls as Array<[string, (...args: unknown[]) => void]>;
      const closeHandler = mockedAppOnCalls.find(([eventName]) => eventName === 'window-all-closed')?.[1];
      expect(closeHandler).toBeTypeOf('function');

      if (!closeHandler) {
        throw new Error('Expected app "window-all-closed" handler to be registered, but none was found.');
      }

      closeHandler();

      expect(app.quit).toHaveBeenCalled();
    });

    it('should not quit when all windows are closed on macOS', () => {
      mainProcess.initializeApp(createRuntimeOptions({ platform: 'darwin' }));

      const mockedAppOnCalls = vi.mocked(app.on).mock.calls as Array<[string, (...args: unknown[]) => void]>;
      const closeHandler = mockedAppOnCalls.find(([eventName]) => eventName === 'window-all-closed')?.[1];
      expect(closeHandler).toBeTypeOf('function');

      if (!closeHandler) {
        throw new Error('Expected app "window-all-closed" handler to be registered, but none was found.');
      }

      closeHandler();

      expect(app.quit).not.toHaveBeenCalled();
    });

    it('should not create a window when one already exists on activate', () => {
      mockedBrowserWindow.getAllWindows.mockReturnValueOnce([{} as unknown as BrowserWindow]);
      mainProcess.initializeApp(createRuntimeOptions());

      const mockedAppOnCalls = vi.mocked(app.on).mock.calls as Array<[string, (...args: unknown[]) => void]>;
      const activateHandler = mockedAppOnCalls.find(([eventName]) => eventName === 'activate')?.[1];
      expect(activateHandler).toBeTypeOf('function');

      if (!activateHandler) {
        throw new Error('Expected app "activate" handler to be registered, but none was found.');
      }

      activateHandler();

      expect(mockedBrowserWindow).not.toHaveBeenCalled();
    });

    it('should focus the existing window when a second instance is requested', () => {
      const existingWindow = {
        isMinimized: vi.fn().mockReturnValue(false),
        focus: vi.fn(),
      } as unknown as BrowserWindow;
      mockedBrowserWindow.getAllWindows.mockReturnValueOnce([existingWindow]);

      mainProcess.initializeApp(createRuntimeOptions());

      const mockedAppOnCalls = vi.mocked(app.on).mock.calls as Array<[string, (...args: unknown[]) => void]>;
      const secondInstanceHandler = mockedAppOnCalls.find(([eventName]) => eventName === 'second-instance')?.[1];
      expect(secondInstanceHandler).toBeTypeOf('function');

      if (!secondInstanceHandler) {
        throw new Error('Expected app "second-instance" handler to be registered, but none was found.');
      }
      secondInstanceHandler();

      expect(existingWindow.focus).toHaveBeenCalled();
    });

    it('should abort close confirmation when the window is already destroyed', async () => {
      const win = mainProcess.createWindow(createRuntimeOptions());
      const windowOnCalls = vi.mocked(win.on).mock.calls as Array<[string, (...args: unknown[]) => void]>;
      vi.mocked(win.isDestroyed).mockReturnValue(true);
      const closeHandler = windowOnCalls.find(([eventName]) => eventName === 'close')?.[1];

      if (!closeHandler) {
        throw new Error('Expected BrowserWindow "close" handler to be registered, but none was found.');
      }

      expect(closeHandler).toBeTypeOf('function');

      const event = { preventDefault: vi.fn() };
      closeHandler(event);
      await flushCloseFlow();

      expect(event.preventDefault).toHaveBeenCalledTimes(1);
      expect(vi.mocked(win.webContents.executeJavaScript)).not.toHaveBeenCalled();
      expect(win.close).toHaveBeenCalledTimes(1);
    });

    it('should ignore non-promise dispatch results during renderer shutdown notifications', async () => {
      const win = mainProcess.createWindow(createRuntimeOptions());
      vi.mocked(win.webContents.executeJavaScript)
        .mockResolvedValueOnce(true)
        .mockReturnValueOnce({} as unknown as Promise<unknown>)
        .mockResolvedValueOnce('ready');

      const windowOnCalls = vi.mocked(win.on).mock.calls as Array<[string, (...args: unknown[]) => void]>;
      const closeHandler = windowOnCalls.find(([eventName]) => eventName === 'close')?.[1];
      const event = { preventDefault: vi.fn() };

      if (!closeHandler) {
        throw new Error('Expected BrowserWindow "close" handler to be registered, but none was found.');
      }

      closeHandler(event);
      await flushCloseFlow();

      expect(vi.mocked(win.webContents.executeJavaScript)).toHaveBeenCalledWith(
        expect.stringContaining('electron-close-query'),
      );
      expect(vi.mocked(win.webContents.executeJavaScript)).toHaveBeenCalledWith(
        expect.stringContaining('math-defender-close-ready'),
      );
      expect(win.close).toHaveBeenCalledTimes(1);
    });

    it('should ignore duplicate close events while a close flow is already in progress', async () => {
      const win = mainProcess.createWindow(createRuntimeOptions());
      vi.mocked(win.webContents.executeJavaScript)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce('ready');

      const windowOnCalls = vi.mocked(win.on).mock.calls as Array<[string, (...args: unknown[]) => void]>;
      const closeHandler = windowOnCalls.find(([eventName]) => eventName === 'close')?.[1];
      const firstEvent = { preventDefault: vi.fn() };
      const secondEvent = { preventDefault: vi.fn() };

      if (!closeHandler) {
        throw new Error('Expected BrowserWindow "close" handler to be registered, but none was found.');
      }

      closeHandler(firstEvent);
      closeHandler(secondEvent);
      await flushCloseFlow();

      expect(firstEvent.preventDefault).toHaveBeenCalledTimes(1);
      expect(secondEvent.preventDefault).toHaveBeenCalledTimes(1);
      expect(win.close).toHaveBeenCalledTimes(1);
    });

    it('should skip the final close when the renderer confirms the window is already destroyed', async () => {
      const win = mainProcess.createWindow(createRuntimeOptions());
      vi.mocked(win.isDestroyed)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true);
      vi.mocked(win.webContents.executeJavaScript)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce('ready');

      const windowOnCalls = vi.mocked(win.on).mock.calls as Array<[string, (...args: unknown[]) => void]>;
      const closeHandler = windowOnCalls.find(([eventName]) => eventName === 'close')?.[1];
      const event = { preventDefault: vi.fn() };

      if (!closeHandler) {
        throw new Error('Expected BrowserWindow "close" handler to be registered, but none was found.');
      }

      closeHandler(event);
      await flushCloseFlow();

      expect(win.close).not.toHaveBeenCalled();
    });

    it('should ignore close events after a close has already been allowed', async () => {
      const win = mainProcess.createWindow(createRuntimeOptions());
      vi.mocked(win.webContents.executeJavaScript)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce('ready');

      const windowOnCalls = vi.mocked(win.on).mock.calls as Array<[string, (...args: unknown[]) => void]>;
      const closeHandler = windowOnCalls.find(([eventName]) => eventName === 'close')?.[1];
      const firstEvent = { preventDefault: vi.fn() };
      const secondEvent = { preventDefault: vi.fn() };

      if (!closeHandler) {
        throw new Error('Expected BrowserWindow "close" handler to be registered, but none was found.');
      }

      closeHandler(firstEvent);
      await flushCloseFlow();
      closeHandler(secondEvent);

      expect(firstEvent.preventDefault).toHaveBeenCalledTimes(1);
      expect(secondEvent.preventDefault).not.toHaveBeenCalled();
      expect(win.close).toHaveBeenCalledTimes(1);
    });
  });
});
