const { contextBridge, ipcRenderer, webUtils } = require('electron');
contextBridge.exposeInMainWorld('kora', {
  pick: () => ipcRenderer.invoke('pick'),
  probe: p => ipcRenderer.invoke('probe', p),
  save: (ext, name) => ipcRenderer.invoke('save', ext, name),
  exportProject: (project, out) => ipcRenderer.invoke('export', project, out),
  saveProject: (d, asNew) => ipcRenderer.invoke('proj:save', d, asNew),
  openProject: () => ipcRenderer.invoke('proj:open'),
  cancel: () => ipcRenderer.send('cancel'),
  onProgress: cb => ipcRenderer.on('progress', (_, v) => cb(v)),
  pathOf: f => webUtils.getPathForFile(f)
});
