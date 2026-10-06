import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as electron from 'electron';
import type { MenuItemConstructorOptions } from 'electron';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type ElectronRuntimeOptions = {
  electron?: typeof import('electron');
  argv?: string[];
  platform?: NodeJS.Platform;
  rendererUrl?: string | null;
  rendererBuildDir?: string | null;
};

type RendererEntry =
  | {
      type: 'url';
      target: string;
    }
  | {
      type: 'file';
      target: string;
    };

type CloseDecision = 'ready' | 'cancelled';

function getRuntimeContext(options: ElectronRuntimeOptions = {}) {
  return {
    electron: options.electron ?? electron,
    argv: options.argv ?? process.argv,
    platform: options.platform ?? process.platform,
  };
}

function getArgValue(argv: string[], prefix: string): string | null {
  return argv.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? null;
}

function resolveRendererEntry(options: ElectronRuntimeOptions = {}): RendererEntry {
  const { electron: runtimeElectron, argv } = getRuntimeContext(options);
  const { app } = runtimeElectron;
  const explicitRendererUrl = options.rendererUrl ?? getArgValue(argv, '--renderer-url=');
  const explicitRendererBuildDir = options.rendererBuildDir ?? getArgValue(argv, '--renderer-build-dir=');

  if (!app.isPackaged && explicitRendererUrl) {
    return {
      type: 'url',
      target: explicitRendererUrl,
    };
  }

  const buildDirectory = explicitRendererBuildDir ?? 'build';

  return {
    type: 'file',
    target: path.resolve(__dirname, '..', buildDirectory, 'index.html'),
  };
}

function buildMenu(options: ElectronRuntimeOptions = {}) {
  const { electron: runtimeElectron, argv } = getRuntimeContext(options);
  const { app, Menu } = runtimeElectron;
  const isDev = !app.isPackaged && resolveRendererEntry(options).type === 'url';
  const isDebug = argv.includes('--inspect');
  const template: MenuItemConstructorOptions[] = [];

  if (isDev || isDebug) {
    template.push({
      label: 'Developer',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { role: 'togglefullscreen', label: 'Toggle Full Screen F11', accelerator: 'F11' },
      ],
    });
  }

  return Menu.buildFromTemplate(template);
}

function createWindow(options: ElectronRuntimeOptions = {}) {
  const { electron: runtimeElectron, argv } = getRuntimeContext(options);
  const { app, BrowserWindow, Menu } = runtimeElectron;
  const rendererEntry = resolveRendererEntry(options);
  const isDev = !app.isPackaged && rendererEntry.type === 'url';
  const isDebug = argv.includes('--inspect');
  const webPreferences = {
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
    webSecurity: true,
    allowRunningInsecureContent: false,
    enableRemoteModule: false,
    webviewTag: false,
    devTools: !app.isPackaged,
  } as electron.BrowserWindowConstructorOptions['webPreferences'] & {
    enableRemoteModule?: boolean;
  };

  const win = new BrowserWindow({
    width: 900,
    height: 900,
    minWidth: 700,
    minHeight: 700,
    show: false,
    backgroundColor: '#1e2326',
    title: 'Math Defender',
    webPreferences,
  });

  Menu.setApplicationMenu(buildMenu(options));

  win.once('ready-to-show', () => {
    win.show();
  });

  if (isDev) {
    void win.loadURL(rendererEntry.target);
  } else {
    void win.loadFile(rendererEntry.target);
  }

  if (isDebug && !app.isPackaged) {
    win.webContents.openDevTools();
  }

  let allowWindowClose = false;
  let closeFlowInProgress = false;

  const notifyRenderer = (eventName: string): void => {
    if (win.isDestroyed()) {
      return;
    }

    const dispatchResult = win.webContents.executeJavaScript(
      `window.dispatchEvent(new CustomEvent('${eventName}'));`,
    );

    if (
      dispatchResult &&
      typeof dispatchResult === 'object' &&
      'catch' in dispatchResult &&
      typeof dispatchResult.catch === 'function'
    ) {
      dispatchResult.catch(() => {
        // Ignore renderer dispatch failures during shutdown.
      });
    }
  };

  const shouldConfirmClose = async (): Promise<boolean> => {
    if (win.isDestroyed()) {
      return false;
    }

    try {
      return await win.webContents.executeJavaScript(`
        new Promise((resolve) => {
          const timeout = setTimeout(() => resolve(false), 500);
          window.addEventListener(
            'math-defender-close-query-result',
            (event) => {
              clearTimeout(timeout);
              resolve(Boolean(event.detail?.shouldConfirm));
            },
            { once: true },
          );
          window.dispatchEvent(new CustomEvent('electron-close-query'));
        });
      `);
    } catch {
      return false;
    }
  };

  const waitForRendererCloseDecision = async (): Promise<CloseDecision> => {
    if (win.isDestroyed()) {
      return 'cancelled';
    }

    try {
      return await win.webContents.executeJavaScript(`
        new Promise((resolve) => {
          const timeout = setTimeout(() => resolve('cancelled'), 5000);
          const handleReady = () => {
            clearTimeout(timeout);
            resolve('ready');
          };
          const handleCancelled = () => {
            clearTimeout(timeout);
            resolve('cancelled');
          };

          window.addEventListener('math-defender-close-ready', handleReady, { once: true });
          window.addEventListener('math-defender-close-cancelled', handleCancelled, { once: true });
        });
      `);
    } catch {
      return 'cancelled';
    }
  };

  const handleCloseIntent = async (): Promise<void> => {
    if (closeFlowInProgress || allowWindowClose) {
      return;
    }

    closeFlowInProgress = true;

    try {
      const confirmClose = await shouldConfirmClose();

      if (!confirmClose) {
        allowWindowClose = true;
        win.close();
        return;
      }

      notifyRenderer('electron-close-requested');

      const closeDecision = await waitForRendererCloseDecision();

      if (closeDecision !== 'ready') {
        return;
      }

      if (!win.isDestroyed()) {
        allowWindowClose = true;
        win.close();
      }
    } finally {
      closeFlowInProgress = false;
    }
  };

  win.on('close', (event) => {
    if (allowWindowClose) {
      return;
    }

    event.preventDefault();
    void handleCloseIntent();
  });

  return win;
}

function initializeApp(options: ElectronRuntimeOptions = {}) {
  const { electron: runtimeElectron, platform } = getRuntimeContext(options);
  const { app, BrowserWindow } = runtimeElectron;
  const isPlaywrightRun = process.env.PLAYWRIGHT_ELECTRON_RUN === '1';

  if (!isPlaywrightRun && !app.requestSingleInstanceLock()) {
    app.quit();
    return;
  }

  app.whenReady().then(() => {
    createWindow(options);
  });

  app.on('second-instance', () => {
    const existingWindows = BrowserWindow.getAllWindows();
    const [mainWindow] = existingWindows;

    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }

      mainWindow.focus();
    }
  });

  app.on('window-all-closed', () => {
    if (platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow(options);
    }
  });
}

if (process.type === 'browser' || process.env.PLAYWRIGHT_ELECTRON_RUN === '1') {
  initializeApp();
}

export { buildMenu, createWindow, resolveRendererEntry, initializeApp };
