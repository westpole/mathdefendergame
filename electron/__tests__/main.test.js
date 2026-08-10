/**
 * Unit tests for Electron main process
 * Tests window creation and IPC communication
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BrowserWindow, app, Menu, ipcMain } from 'electron';
import * as mainProcess from '../main.js';

// Mock electron modules are set up in vitest-electron.setup.ts

function createRuntimeOptions({ argv = ['node', 'electron'], isPackaged = false, platform = 'win32' } = {}) {
  vi.clearAllMocks();
  app.isPackaged = isPackaged;

  return {
    argv,
    platform,
    electron: {
      app,
      BrowserWindow,
      Menu,
      ipcMain,
    },
  };
}

describe('Electron Main Process', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    app.isPackaged = false;
  });

  describe('Application lifecycle', () => {
    it('should initialize app listeners', () => {
      mainProcess.initializeApp(createRuntimeOptions());

      expect(app.whenReady).toHaveBeenCalled();
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
      mainProcess.buildMenu(createRuntimeOptions({ argv: ['node', 'electron', '--dev'] }));

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
      const win = mainProcess.createWindow(createRuntimeOptions({ argv: ['node', 'electron', '--dev'] }));

      expect(win.loadURL).toHaveBeenCalledWith('http://localhost:5173');
    });

    it('should load file in production mode', () => {
      const win = mainProcess.createWindow(createRuntimeOptions());

      expect(win.loadFile).toHaveBeenCalledWith(expect.stringMatching(/build[\\/]index\.html$/));
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
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
        title: 'Math Defender',
        backgroundColor: '#1e2326',
      });
    });

    it('should create a window when the app activates with no open windows', () => {
      mainProcess.initializeApp(createRuntimeOptions());

      const activateHandler = app.on.mock.calls.find(([eventName]) => eventName === 'activate')?.[1];
      expect(activateHandler).toBeTypeOf('function');

      activateHandler();

      expect(BrowserWindow).toHaveBeenCalled();
    });

    it('should quit when all windows are closed on non-macOS platforms', () => {
      mainProcess.initializeApp(createRuntimeOptions({ platform: 'win32' }));

      const closeHandler = app.on.mock.calls.find(([eventName]) => eventName === 'window-all-closed')?.[1];
      expect(closeHandler).toBeTypeOf('function');

      closeHandler();

      expect(app.quit).toHaveBeenCalled();
    });

    it('should not quit when all windows are closed on macOS', () => {
      mainProcess.initializeApp(createRuntimeOptions({ platform: 'darwin' }));

      const closeHandler = app.on.mock.calls.find(([eventName]) => eventName === 'window-all-closed')?.[1];
      expect(closeHandler).toBeTypeOf('function');

      closeHandler();

      expect(app.quit).not.toHaveBeenCalled();
    });

    it('should not create a window when one already exists on activate', () => {
      BrowserWindow.getAllWindows.mockReturnValueOnce([{}]);
      mainProcess.initializeApp(createRuntimeOptions());

      const activateHandler = app.on.mock.calls.find(([eventName]) => eventName === 'activate')?.[1];
      expect(activateHandler).toBeTypeOf('function');

      activateHandler();

      expect(BrowserWindow).not.toHaveBeenCalled();
    });
  });
});
