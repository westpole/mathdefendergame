const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

const isDev = !app.isPackaged && process.argv.includes('--dev');
const isDebug = process.argv.includes('--inspect');

function sendMenuAction(win, view) {
  if (!win || win.isDestroyed()) {
    return;
  }

  win.webContents.executeJavaScript(
    `window.dispatchEvent(new CustomEvent('electron-menu-action', { detail: ${JSON.stringify({ view })} }));`,
  );
}

function buildMenu(win) {
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

function createWindow() {
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

  Menu.setApplicationMenu(buildMenu(win));

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '../build/index.html'));
  }

  // Open DevTools in debug mode (localhost only, not in packaged app)
  if (isDebug && !app.isPackaged) {
    win.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
