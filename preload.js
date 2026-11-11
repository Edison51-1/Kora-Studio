const { contextBridge, ipcRenderer, webUtils } = require('electron');
contextBridge.exposeInMainWorld('kora', {
  pick: () => ipcRenderer.invoke('pick'),
  probe: p => ipcRenderer.invoke('probe', p),
  save: ext => ipcRenderer.invoke('save', ext),
  exportProject: (project, out) => ipcRenderer.invoke('export', project, out),
  cancel: () => ipcRenderer.send('cancel'),
  onProgress: cb => ipcRenderer.on('progress', (_, v) => cb(v)),
  pathOf: f => webUtils.getPathForFile(f)
});
