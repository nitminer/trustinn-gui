const { app, BrowserWindow, shell, session, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { startLocalServer, stopLocalServer } = require('../local-server/server');

const TRUSTINN_REMOTE_URL = 'https://trustinn.nitminer.com';
const LOCAL_API_PORT = 4310;

let mainWindow = null;

async function reloadLatest() {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  try {
    await session.defaultSession.clearCache();
  } catch (_) {
    // Ignore cache clear failures and still attempt a reload.
  }

  mainWindow.webContents.reloadIgnoringCache();
}

function restartDesktopApp() {
  app.relaunch();
  app.exit(0);
}

function setupApplicationMenu() {
  const template = [
    {
      label: 'TrustInn Desktop',
      submenu: [
        {
          label: 'Reload Latest',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            reloadLatest();
          }
        },
        {
          label: 'Restart App',
          accelerator: 'CmdOrCtrl+Shift+R',
          click: () => {
            restartDesktopApp();
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => app.quit()
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'togglefullscreen' },
        { role: 'toggleDevTools' }
      ]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function resolvePreferredDownloadDir() {
  const installDir = path.dirname(process.execPath);
  const preferred = path.join(installDir, 'TrustInnDownloads');

  try {
    fs.mkdirSync(preferred, { recursive: true });
    fs.accessSync(preferred, fs.constants.W_OK);
    return preferred;
  } catch (_) {
    const fallback = path.join(app.getPath('downloads'), 'TrustInnDownloads');
    fs.mkdirSync(fallback, { recursive: true });
    return fallback;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1200,
    minHeight: 760,
    backgroundColor: '#0b1020',
    autoHideMenuBar: false,
    icon: path.join(__dirname, '../assets/icons/icon-256.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.js'),
      additionalArguments: [
        `--trustinn-local-api-port=${LOCAL_API_PORT}`,
        `--trustinn-remote-origin=${TRUSTINN_REMOTE_URL}`
      ]
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.loadURL(TRUSTINN_REMOTE_URL);
}

async function bootstrap() {
  await startLocalServer({ port: LOCAL_API_PORT, allowedOrigin: TRUSTINN_REMOTE_URL });

  const preferredDownloadDir = resolvePreferredDownloadDir();

  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    callback({ requestHeaders: details.requestHeaders });
  });

  session.defaultSession.on('will-download', (event, item) => {
    const fileName = item.getFilename();
    const savePath = path.join(preferredDownloadDir, fileName);
    item.setSavePath(savePath);
  });

  setupApplicationMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}

app.whenReady().then(bootstrap);

app.on('window-all-closed', async () => {
  await stopLocalServer();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', async () => {
  await stopLocalServer();
});
