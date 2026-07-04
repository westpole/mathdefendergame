const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

const isDev = !app.isPackaged && process.argv.includes('--dev');

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

  if (isDev) {
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
    minWidth: 600,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: 'Math Defender',
    backgroundColor: '#1a1a2e',
  });

  Menu.setApplicationMenu(buildMenu(win));

  if (isDev) {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
