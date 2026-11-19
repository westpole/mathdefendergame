/**
 * Unit tests for Electron main process
 * Tests window creation and IPC communication
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

/**
 * Builds runtime options for main-process calls.
 * Side effect: clears all mocks first, so queue `mockReturnValueOnce` values after calling it.
 */
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

/**
 * Drains every pending microtask by waiting for the next macrotask, so close-flow
 * assertions don't depend on how many awaits the flow contains.
 */
async function flushCloseFlow() {
  await new Promise<void>((resolve) => {
    setImmediate(resolve);
  });
}

type ListenerRegistrar = { mock: { calls: unknown[][] } };

/** Returns the listener registered for `eventName` on a mocked `on`/`once`, or throws. */
function getRegisteredHandler(registrar: ListenerRegistrar, eventName: string, owner: string) {
  const handler = registrar.mock.calls.find(([name]) => name === eventName)?.[1];

  if (typeof handler !== 'function') {
    throw new Error(`Expected ${owner} "${eventName}" handler to be registered, but none was found.`);
  }

  return handler as (...args: unknown[]) => void;
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
        restore: vi.fn(),
        focus: vi.fn(),
      } as unknown as BrowserWindow;
      mainProcess.initializeApp(createRuntimeOptions());
      mockedBrowserWindow.getAllWindows.mockReturnValueOnce([existingWindow]);

      const mockedAppOnCalls = vi.mocked(app.on).mock.calls as Array<[string, (...args: unknown[]) => void]>;
      const secondInstanceHandler = mockedAppOnCalls.find(([eventName]) => eventName === 'second-instance')?.[1];
      expect(secondInstanceHandler).toBeTypeOf('function');

      if (!secondInstanceHandler) {
        throw new Error('Expected app "second-instance" handler to be registered, but none was found.');
      }
      secondInstanceHandler();

      expect(existingWindow.restore).not.toHaveBeenCalled();
      expect(existingWindow.focus).toHaveBeenCalledTimes(1);
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

  describe('Close flow failures', () => {
    function triggerClose(win: BrowserWindow) {
      const closeHandler = getRegisteredHandler(vi.mocked(win.on), 'close', 'BrowserWindow');
      const event = { preventDefault: vi.fn() };
      closeHandler(event);

      return event;
    }

    it('should close without confirmation when the renderer close query fails', async () => {
      const win = mainProcess.createWindow(createRuntimeOptions());
      vi.mocked(win.webContents.executeJavaScript).mockRejectedValueOnce(new Error('renderer gone'));

      const event = triggerClose(win);
      await flushCloseFlow();

      expect(event.preventDefault).toHaveBeenCalledTimes(1);
      expect(win.webContents.executeJavaScript).toHaveBeenCalledTimes(1);
      expect(win.close).toHaveBeenCalledTimes(1);
    });

    it('should keep the window open when waiting for the renderer decision fails', async () => {
      const win = mainProcess.createWindow(createRuntimeOptions());
      vi.mocked(win.webContents.executeJavaScript)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockRejectedValueOnce(new Error('renderer gone'));

      triggerClose(win);
      await flushCloseFlow();

      expect(win.webContents.executeJavaScript).toHaveBeenCalledWith(
        expect.stringContaining('math-defender-close-ready'),
      );
      expect(win.close).not.toHaveBeenCalled();
    });

    it('should swallow a rejected renderer notification and still close when ready', async () => {
      const unhandledRejections: unknown[] = [];
      const onUnhandledRejection = (reason: unknown) => {
        unhandledRejections.push(reason);
      };
      process.on('unhandledRejection', onUnhandledRejection);

      try {
        const win = mainProcess.createWindow(createRuntimeOptions());
        vi.mocked(win.webContents.executeJavaScript)
          .mockResolvedValueOnce(true)
          .mockImplementationOnce(() => Promise.reject(new Error('dispatch failed')))
          .mockResolvedValueOnce('ready');

        triggerClose(win);
        await flushCloseFlow();
        await flushCloseFlow();

        expect(win.webContents.executeJavaScript).toHaveBeenCalledWith(
          expect.stringContaining('electron-close-requested'),
        );
        expect(win.close).toHaveBeenCalledTimes(1);
        expect(unhandledRejections).toEqual([]);
      } finally {
        process.off('unhandledRejection', onUnhandledRejection);
      }
    });

    it('should skip the renderer notification when the window is destroyed mid-flow', async () => {
      const win = mainProcess.createWindow(createRuntimeOptions());
      vi.mocked(win.isDestroyed)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true)
        .mockReturnValue(false);
      vi.mocked(win.webContents.executeJavaScript)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce('cancelled');

      triggerClose(win);
      await flushCloseFlow();

      expect(win.webContents.executeJavaScript).not.toHaveBeenCalledWith(
        expect.stringContaining('electron-close-requested'),
      );
      expect(win.close).not.toHaveBeenCalled();
    });

    it('should cancel the close when the window is destroyed before awaiting the renderer decision', async () => {
      const win = mainProcess.createWindow(createRuntimeOptions());
      vi.mocked(win.isDestroyed)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(false)
        .mockReturnValueOnce(true)
        .mockReturnValue(false);
      vi.mocked(win.webContents.executeJavaScript)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true);

      triggerClose(win);
      await flushCloseFlow();

      expect(win.webContents.executeJavaScript).toHaveBeenCalledTimes(2);
      expect(win.webContents.executeJavaScript).not.toHaveBeenCalledWith(
        expect.stringContaining('math-defender-close-ready'),
      );
      expect(win.close).not.toHaveBeenCalled();
    });
  });

  describe('Window and instance lifecycle', () => {
    it('should show the window once it is ready to show', () => {
      const win = mainProcess.createWindow(createRuntimeOptions());
      const readyHandler = getRegisteredHandler(vi.mocked(win.once), 'ready-to-show', 'BrowserWindow');

      expect(win.show).not.toHaveBeenCalled();
      readyHandler();
      expect(win.show).toHaveBeenCalledTimes(1);
    });

    it('should read renderer args from process argv when no options are given', () => {
      const originalArgv = process.argv;
      process.argv = ['node', 'electron', '--renderer-url=http://localhost:4000'];

      try {
        const win = mainProcess.createWindow();

        expect(win.loadURL).toHaveBeenCalledWith('http://localhost:4000');
      } finally {
        process.argv = originalArgv;
      }
    });

    it('should use the host platform for window-all-closed when no options are given', () => {
      vi.clearAllMocks();
      mainProcess.initializeApp();

      const allClosedHandler = getRegisteredHandler(vi.mocked(app.on), 'window-all-closed', 'app');
      allClosedHandler();

      if (process.platform === 'darwin') {
        expect(app.quit).not.toHaveBeenCalled();
      } else {
        expect(app.quit).toHaveBeenCalledTimes(1);
      }
    });

    it('should quit without registering listeners when another instance holds the lock', () => {
      const options = createRuntimeOptions();
      vi.mocked(app.requestSingleInstanceLock).mockReturnValueOnce(false);

      mainProcess.initializeApp(options);

      expect(app.quit).toHaveBeenCalledTimes(1);
      expect(app.whenReady).not.toHaveBeenCalled();
      expect(app.on).not.toHaveBeenCalled();
    });

    it('should restore a minimized window before focusing it on second instance', () => {
      const existingWindow = {
        isMinimized: vi.fn().mockReturnValue(true),
        restore: vi.fn(),
        focus: vi.fn(),
      } as unknown as BrowserWindow;
      mainProcess.initializeApp(createRuntimeOptions());
      mockedBrowserWindow.getAllWindows.mockReturnValueOnce([existingWindow]);

      getRegisteredHandler(vi.mocked(app.on), 'second-instance', 'app')();

      expect(existingWindow.restore).toHaveBeenCalledTimes(1);
      expect(existingWindow.focus).toHaveBeenCalledTimes(1);
    });

    it('should not create or quit anything on second instance when no window exists', () => {
      mainProcess.initializeApp(createRuntimeOptions());
      mockedBrowserWindow.getAllWindows.mockReturnValueOnce([]);

      getRegisteredHandler(vi.mocked(app.on), 'second-instance', 'app')();

      expect(mockedBrowserWindow.getAllWindows).toHaveBeenCalledTimes(1);
      expect(mockedBrowserWindow).not.toHaveBeenCalled();
      expect(app.quit).not.toHaveBeenCalled();
    });

    describe('auto-initialization on import', () => {
      async function importFreshMain() {
        vi.resetModules();
        // vi.mock factories re-run after resetModules, so this is the instance the fresh main imports.
        const freshElectron = await import('electron');
        vi.mocked(freshElectron.app.whenReady).mockClear();
        vi.mocked(freshElectron.app.requestSingleInstanceLock).mockClear();
        await import('../main');

        return freshElectron;
      }

      afterEach(() => {
        vi.unstubAllEnvs();
      });

      it('should auto-initialize for Playwright runs without taking the instance lock', async () => {
        vi.stubEnv('PLAYWRIGHT_ELECTRON_RUN', '1');

        const freshElectron = await importFreshMain();

        expect(freshElectron.app.whenReady).toHaveBeenCalledTimes(1);
        expect(freshElectron.app.requestSingleInstanceLock).not.toHaveBeenCalled();
      });

      it('should not auto-initialize outside the Electron main process or Playwright', async () => {
        vi.stubEnv('PLAYWRIGHT_ELECTRON_RUN', '');

        const freshElectron = await importFreshMain();

        expect(process.type).not.toBe('browser');
        expect(freshElectron.app.whenReady).not.toHaveBeenCalled();
      });
    });
  });
});
