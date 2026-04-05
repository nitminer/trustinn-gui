const { app, BrowserWindow, shell, session } = require('electron');
const path = require('path');
const { startLocalServer, stopLocalServer } = require('../local-server/server');

const TRUSTINN_REMOTE_URL = 'https://trustinn.nitminer.com';
const LOCAL_API_PORT = 4310;

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1200,
    minHeight: 760,
    backgroundColor: '#0b1020',
    autoHideMenuBar: true,
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

  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    callback({ requestHeaders: details.requestHeaders });
  });

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
