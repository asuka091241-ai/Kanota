const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('updateAPI', {
  closeWindow: () => ipcRenderer.send('update:close'),
  startDownload: () => ipcRenderer.send('update:start-download'),
  retryCheck: () => ipcRenderer.send('update:retry-check'),
  onUpdateInfo: (cb) => ipcRenderer.on('update:info', (_, info) => cb(info)),
  onUpToDate: (cb) => ipcRenderer.on('update:up-to-date', (_, info) => cb(info)),
  onError: (cb) => ipcRenderer.on('update:error', (_, info) => cb(info)),
  onProgress: (cb) => ipcRenderer.on('update:progress', (_, pct) => cb(pct)),
  onStatus: (cb) => ipcRenderer.on('update:status', (_, status) => cb(status)),
});
