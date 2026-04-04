const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { autoUpdater } = require('electron-updater');
const fs = require('fs');

let mainWindow;

// Config file path
const CONFIG_FILE = path.join(app.getPath('userData'), 'app-config.json');

// Default config
const DEFAULT_CONFIG = {
  apiUrl: 'https://trustinn.nitminer.com',
  appTitle: 'TrustInn',
};

// Load or create config file
function getConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading config file:', error);
  }
  return DEFAULT_CONFIG;
}

// Save config file
function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Error saving config file:', error);
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'electron-preload.js'),
      sandbox: true,
    },
    icon: path.join(__dirname, 'icon.png'),
  });

  const startUrl = 'https://trustinn.nitminer.com';

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  createWindow();
  
  // Check for updates in production
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle any IPC communication from renderer
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// IPC handlers for app config (API URL, etc.)
ipcMain.handle('get-app-config', () => {
  return getConfig();
});

ipcMain.handle('set-app-config', (event, newConfig) => {
  const currentConfig = getConfig();
  const updatedConfig = { ...currentConfig, ...newConfig };
  saveConfig(updatedConfig);
  return updatedConfig;
});

ipcMain.handle('get-app-path', () => {
  return app.getPath('userData');
});

// Menu
const template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Exit',
        accelerator: 'CmdOrCtrl+Q',
        click: () => {
          app.quit();
        },
      },
    ],
  },
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
    ],
  },
  {
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' },
    ],
  },
  {
    label: 'Help',
    submenu: [
      {
        label: 'About TrustInn',
        click: () => {
          // About dialog
        },
      },
    ],
  },
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
