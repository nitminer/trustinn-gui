const { contextBridge, ipcRenderer } = require('electron');

// Expose IPC functionality to renderer process securely
contextBridge.exposeInMainWorld('electronAPI', {
  // Code execution
  executeCode: (language, code, input) =>
    ipcRenderer.invoke('execute-code', { language, code, input }),

  // File operations
  readFile: (filePath) =>
    ipcRenderer.invoke('read-file', filePath),
  writeFile: (filePath, content) =>
    ipcRenderer.invoke('write-file', filePath, content),
  deleteFile: (filePath) =>
    ipcRenderer.invoke('delete-file', filePath),

  // Directory operations
  listDirectory: (dirPath) =>
    ipcRenderer.invoke('list-directory', dirPath),
  createDirectory: (dirPath) =>
    ipcRenderer.invoke('create-directory', dirPath),

  // System info
  getSystemInfo: () =>
    ipcRenderer.invoke('get-system-info'),

  // Window controls
  minimizeWindow: () =>
    ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () =>
    ipcRenderer.invoke('maximize-window'),
  closeWindow: () =>
    ipcRenderer.invoke('close-window'),

  // File dialogs
  selectFile: (options) =>
    ipcRenderer.invoke('select-file', options),
  selectDirectory: (options) =>
    ipcRenderer.invoke('select-directory', options),
  saveFile: (options) =>
    ipcRenderer.invoke('save-file', options),

  // Electron version
  versions: {
    electron: process.versions.electron,
    node: process.versions.node,
    chrome: process.versions.chrome,
  },

  // Platform info
  platform: process.platform,
  nodeVersion: process.versions.node,
});
