const { autoUpdater } = require('electron-updater');
const { ipcMain, dialog, BrowserWindow } = require('electron');
const log = require('electron-log');

// Configure logging
log.transports.file.level = 'info';
autoUpdater.logger = log;

class UpdateManager {
  constructor() {
    this.isUpdateDownloaded = false;
    this.isCheckingForUpdates = false;
  }

  /**
   * Initialize the update manager
   * Should be called when app is ready
   */
  init() {
    // Check for updates on startup
    this.checkForUpdates();

    // Check for updates every hour
    setInterval(() => {
      this.checkForUpdates();
    }, 60 * 60 * 1000);

    this.setupIPC();
  }

  /**
   * Check for updates from GitHub releases
   */
  checkForUpdates() {
    if (this.isCheckingForUpdates) return;

    this.isCheckingForUpdates = true;
    log.info('Checking for updates...');

    autoUpdater.checkForUpdatesAndNotify().catch((error) => {
      log.error('Update check failed:', error);
      this.isCheckingForUpdates = false;
    });

    this.isCheckingForUpdates = false;
  }

  /**
   * Setup IPC handlers for update notifications
   */
  setupIPC() {
    // Event: Update available
    autoUpdater.on('update-available', (info) => {
      log.info('Update available:', info);

      if (BrowserWindow.getAllWindows().length > 0) {
        BrowserWindow.getAllWindows()[0].webContents.send('update-available', {
          version: info.version,
          releaseDate: info.releaseDate,
          downloadUrl: info.downloadUrl,
        });
      }

      // Show native notification
      this.showUpdateNotification(
        'Update Available',
        `TrustInn ${info.version} is available. Click to download and install.`
      );
    });

    // Event: Update downloaded
    autoUpdater.on('update-downloaded', (info) => {
      log.info('Update downloaded:', info);
      this.isUpdateDownloaded = true;

      if (BrowserWindow.getAllWindows().length > 0) {
        BrowserWindow.getAllWindows()[0].webContents.send('update-downloaded', {
          version: info.version,
        });
      }

      // Show notification
      this.showUpdateNotification(
        'Update Ready to Install',
        `TrustInn ${info.version} is ready. Restart to complete installation.`,
        true
      );
    });

    // Event: Download progress
    autoUpdater.on('download-progress', (progressInfo) => {
      log.info('Download progress:', progressInfo);

      if (BrowserWindow.getAllWindows().length > 0) {
        BrowserWindow.getAllWindows()[0].webContents.send('update-progress', {
          percent: Math.round(progressInfo.percent),
          bytesPerSecond: progressInfo.bytesPerSecond,
          transferred: progressInfo.transferred,
          total: progressInfo.total,
        });
      }
    });

    // Event: Update error
    autoUpdater.on('error', (error) => {
      log.error('Updater error:', error);
    });

    // IPC: User wants to download update
    ipcMain.on('download-update', () => {
      log.info('User requested update download');
      autoUpdater.downloadUpdate().catch((error) => {
        log.error('Download failed:', error);
      });
    });

    // IPC: User wants to install update (quit and install)
    ipcMain.on('install-update', () => {
      log.info('User requested update installation');
      autoUpdater.quitAndInstall(false, true);
    });

    // IPC: Check for updates manually
    ipcMain.on('check-updates', () => {
      log.info('User requested manual update check');
      this.checkForUpdates();
    });

    // IPC: Get update status
    ipcMain.handle('get-update-status', () => {
      return {
        isUpdateDownloaded: this.isUpdateDownloaded,
        isCheckingForUpdates: this.isCheckingForUpdates,
      };
    });
  }

  /**
   * Show update notification using dialog
   */
  showUpdateNotification(title, message, isReady = false) {
    const mainWindow = BrowserWindow.getAllWindows()[0];
    if (!mainWindow) return;

    if (isReady) {
      dialog
        .showMessageBox(mainWindow, {
          type: 'info',
          title: title,
          message: message,
          buttons: ['Restart Now', 'Later'],
          defaultId: 0,
        })
        .then((result) => {
          if (result.response === 0) {
            autoUpdater.quitAndInstall(false, true);
          }
        });
    } else {
      dialog
        .showMessageBox(mainWindow, {
          type: 'info',
          title: title,
          message: message,
          buttons: ['Download', 'Later', 'Skip'],
          defaultId: 0,
        })
        .then((result) => {
          if (result.response === 0) {
            autoUpdater.downloadUpdate().catch((error) => {
              log.error('Download failed:', error);
            });
          } else if (result.response === 2) {
            // Skip this version
            log.info('User skipped update');
          }
        });
    }
  }
}

module.exports = { UpdateManager, autoUpdater };
