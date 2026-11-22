const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('kset', {
  get: () => ipcRenderer.invoke('settings:get'),
  save: patch => ipcRenderer.invoke('settings:set', patch),
  reset: () => ipcRenderer.invoke('settings:reset'),
  pickDir: () => ipcRenderer.invoke('dir:pick'),
  close: () => ipcRenderer.send('settings:close'),
  logs: () => ipcRenderer.send('shell:logs'),
  clearModels: () => ipcRenderer.invoke('models:clear'),
  onChange: cb => ipcRenderer.on('settings', (_, v) => cb(v))
});
