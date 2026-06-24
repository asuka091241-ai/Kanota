const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Data
  loadData: () => ipcRenderer.invoke('load-data'),
  saveData: (data) => ipcRenderer.invoke('save-data', data),
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  loadTrash: () => ipcRenderer.invoke('load-trash'),
  saveTrash: (trash) => ipcRenderer.invoke('save-trash', trash),

  // Sticky windows
  openSticky: (cardData, screenX, screenY) => ipcRenderer.invoke('open-sticky', cardData, screenX, screenY),
  deleteSticky: (cardId) => ipcRenderer.invoke('delete-sticky', cardId),
  uiRemoveSticky: (cardId) => ipcRenderer.invoke('ui-remove-sticky', cardId),
  syncStickyData: (cardData) => ipcRenderer.invoke('sync-sticky-data', cardData),
  deleteKanbanCard: (cardId, sourceCol) => ipcRenderer.invoke('delete-kanban-card', cardId, sourceCol),
  removeFromDesktop: (cardId) => ipcRenderer.invoke('sticky:removeFromDesktop', cardId),
  showKanbanContextMenu: (payload) => ipcRenderer.invoke('kanban:showContextMenu', payload),
  getStickyWindowState: (cardId) => ipcRenderer.invoke('sticky:getWindowState', cardId),

  // Listen for events from main process
  onStickyClosed: (callback) => ipcRenderer.on('sticky-closed', (_, cardId) => callback(cardId)),
  onStickyRemoved: (callback) => ipcRenderer.on('sticky-removed', (_, cardId) => callback(cardId)),
  onStickyStatusChanged: (callback) => ipcRenderer.on('sticky-status-changed', (_, cardId, newStatus) => callback(cardId, newStatus)),
  onKanbanCardDeleted: (callback) => ipcRenderer.on('kanban-card-deleted', (_, cardId, col, stickyIds) => callback(cardId, col, stickyIds)),
  onStickyColorChanged: (callback) => ipcRenderer.on('sticky-color-changed', (_, cardId, color) => callback(cardId, color)),
  onKanbanContextCommand: (callback) => ipcRenderer.on('kanban:context-command', (_, payload) => callback(payload)),
  // New events
  onStickyRemoved2: (callback) => ipcRenderer.on('sticky:removed', (_, cardId) => callback(cardId)),
  onStickyStatusChanged2: (callback) => ipcRenderer.on('sticky:statusChanged', (_, cardId, newStatus) => callback(cardId, newStatus)),
  onKanbanCardDeleted2: (callback) => ipcRenderer.on('kanban:cardDeleted', (_, cardId, col) => callback(cardId, col)),
  onStickyColorChanged2: (callback) => ipcRenderer.on('sticky:colorChanged', (_, cardId, color) => callback(cardId, color)),

  onKanbanOpenDetail: (callback) => ipcRenderer.on('kanban:openCardDetail', (_, cardId, col) => callback(cardId, col)),

  // Drag out tracking
  startDragTracking: () => ipcRenderer.invoke('drag-start-tracking'),
  stopDragTracking: () => ipcRenderer.invoke('drag-stop-tracking'),

  // Window controls
  minimize: () => ipcRenderer.invoke('minimize'),
  maximize: () => ipcRenderer.invoke('maximize'),
  close: () => ipcRenderer.invoke('close'),
  hideToTray: () => ipcRenderer.invoke('hide-to-tray'),
  quitApp: () => ipcRenderer.invoke('quit-app'),
  setAlwaysOnTop: (v) => ipcRenderer.invoke('set-always-on-top', v),
});
