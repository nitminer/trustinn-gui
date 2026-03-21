const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = process.mainModule.filename.indexOf('app.asar') === -1;
const { setupIPC } = require('./ipc/ipcHandler');
const { createLocalExecutor } = require('./local-executor');
const { UpdateManager } = require('./updater');
const { spawn } = require('child_process');

let mainWindow;
let nextProcess;
const updateManager = new UpdateManager();

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      sandbox: true,
    },
    icon: path.join(__dirname, 'assets/icon.png'),
  });

  const startUrl = isDev
    ? 'http://localhost:3030'
    : `file://${path.join(__dirname, '../out/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

const startNextServer = () => {
  if (isDev) {
    nextProcess = spawn('npm', ['run', 'dev'], {
      cwd: __dirname.replace('public', ''),
      stdio: 'inherit',
    });
  }
};

app.on('ready', () => {
  startNextServer();
  
  setTimeout(() => {
    createWindow();
    setupMenu();
    setupIPC(mainWindow);
    createLocalExecutor();
    
    // Initialize auto-updater (only in production)
    if (!isDev) {
      updateManager.init();
    }
  }, isDev ? 3000 : 1000);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (nextProcess) nextProcess.kill();
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

const setupMenu = () => {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            if (nextProcess) nextProcess.kill();
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
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};
