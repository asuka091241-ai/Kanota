const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('stickyAPI', {
  getData: () => ipcRenderer.invoke('sticky:getData'),
  onUpdate: (cb) => ipcRenderer.on('sticky:update', (_, d) => cb(d)),
  onContextCommand: (cb) => ipcRenderer.on('sticky:context-command', (_, cmd) => cb(cmd)),
  toggleCollapse: (collapsed) => ipcRenderer.send('sticky:toggleCollapse', collapsed),
  togglePin: (pinned) => ipcRenderer.send('sticky:togglePin', pinned),
  changeStatus: (flow) => ipcRenderer.send('sticky:changeStatus', flow),
  resize: (height) => ipcRenderer.send('sticky:resize', height),
  dragMove: (dx, dy) => ipcRenderer.send('sticky:dragMove', dx, dy),
  updateColor: (id, color) => ipcRenderer.invoke('sticky:updateColor', id, color),
  removeFromDesktop: (id) => ipcRenderer.invoke('sticky:removeFromDesktop', id),
  showContextMenu: (payload) => ipcRenderer.invoke('sticky:showContextMenu', payload),
  addPomoTime: (cardId, ms) => ipcRenderer.send('sticky:addPomoTime', cardId, ms),
});
