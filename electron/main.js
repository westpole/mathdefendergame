const path = require('path');

function getRuntimeContext(options = {}) {
  return {
    electron: options.electron ?? require('electron'),
    argv: options.argv ?? process.argv,
    platform: options.platform ?? process.platform,
  };
}

function sendMenuAction(win, view) {
  if (!win || win.isDestroyed()) {
    return;
  }

  win.webContents.executeJavaScript(
    `window.dispatchEvent(new CustomEvent('electron-menu-action', { detail: ${JSON.stringify({ view })} }));`,
  );
}

function buildMenu(win, options = {}) {
  const { electron, argv } = getRuntimeContext(options);
  const { app, Menu } = electron;
  const isDev = !app.isPackaged && argv.includes('--dev');
  const isDebug = argv.includes('--inspect');
  const template = [
    {
      label: 'Play Game',
      click: () => sendMenuAction(win, 'home'),
    },
    {
      label: 'High Score',
      click: () => sendMenuAction(win, 'high-score'),
    },
    {
      label: 'Rules',
      click: () => sendMenuAction(win, 'rules'),
    },
  ];

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
  console.error('[electron-main] createWindow');
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

  Menu.setApplicationMenu(buildMenu(win, options));

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '../build/index.html'));
  }

  // Open DevTools in debug mode (localhost only, not in packaged app)
  if (isDebug && !app.isPackaged) {
    win.webContents.openDevTools();
  }

  return win;
}

function initializeApp(options = {}) {
  console.error('[electron-main] initializeApp');
  const { electron, platform } = getRuntimeContext(options);
  const { app, BrowserWindow } = electron;
  app.whenReady().then(() => {
    console.error('[electron-main] whenReady');
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
console.error('[electron-main]', {
  processType: process.type,
  defaultApp: process.defaultApp,
  requireMain: require.main && require.main.filename,
  moduleFile: module.filename,
});

/* c8 ignore next 3 */
if (process.type === 'browser') {
  initializeApp();
}

module.exports = {
  sendMenuAction,
  buildMenu,
  createWindow,
  initializeApp,
};
