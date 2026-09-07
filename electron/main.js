const path = require('path');

function getRuntimeContext(options = {}) {
  return {
    electron: options.electron ?? require('electron'),
    argv: options.argv ?? process.argv,
    platform: options.platform ?? process.platform,
  };
}

function buildMenu(options = {}) {
  const { electron, argv } = getRuntimeContext(options);
  const { app, Menu } = electron;
  const isDev = !app.isPackaged && argv.includes('--dev');
  const isDebug = argv.includes('--inspect');
  const template = [];

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

function createWindow(options = {}) {
  const { electron, argv } = getRuntimeContext(options);
  const { app, BrowserWindow, Menu } = electron;
  const isDev = !app.isPackaged && argv.includes('--dev');
  const isDebug = argv.includes('--inspect');
  const win = new BrowserWindow({
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

  Menu.setApplicationMenu(buildMenu(options));

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '../build/index.html'));
  }

  // Open DevTools in debug mode (localhost only, not in packaged app)
  if (isDebug && !app.isPackaged) {
    win.webContents.openDevTools();
  }

  let allowWindowClose = false;
  let closeFlowInProgress = false;

  const notifyRenderer = (eventName) => {
    if (win.isDestroyed()) {
      return;
    }

    const dispatchResult = win.webContents.executeJavaScript(
      `window.dispatchEvent(new CustomEvent('${eventName}'));`,
    );

    if (dispatchResult && typeof dispatchResult.catch === 'function') {
      dispatchResult.catch(() => {
        // Ignore renderer dispatch failures during shutdown.
      });
    }
  };

  const shouldConfirmClose = async () => {
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

  const waitForRendererCloseDecision = async () => {
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

  const handleCloseIntent = async () => {
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

function initializeApp(options = {}) {
  const { electron, platform } = getRuntimeContext(options);
  const { app, BrowserWindow } = electron;
  app.whenReady().then(() => {
    createWindow(options);
  });

  app.on('window-all-closed', () => {
    if (platform !== 'darwin') app.quit();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(options);
  });
}

/* c8 ignore next 3 */
if (process.type === 'browser') {
  initializeApp();
}

module.exports = {
  buildMenu,
  createWindow,
  initializeApp,
};
