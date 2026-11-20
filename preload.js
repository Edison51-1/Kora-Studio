const { contextBridge, ipcRenderer, webUtils } = require('electron');
contextBridge.exposeInMainWorld('kora', {
  pick: () => ipcRenderer.invoke('pick'),
  probe: p => ipcRenderer.invoke('probe', p),
  save: (ext, name) => ipcRenderer.invoke('save', ext, name),
  exportProject: (project, out) => ipcRenderer.invoke('export', project, out),
  peaks: p => ipcRenderer.invoke('peaks', p),
  startSubtitles: (project, model, lang) => ipcRenderer.invoke('asr:start', project, model, lang),
  cancelSubtitles: () => ipcRenderer.send('asr:cancel'),
  onSubtitleProgress: cb => ipcRenderer.on('asr:progress', (_, v) => cb(v)),
  openSrt: () => ipcRenderer.invoke('srt:open'),
  saveProject: (d, asNew) => ipcRenderer.invoke('proj:save', d, asNew),
  openProject: () => ipcRenderer.invoke('proj:open'),
  autoSave: d => ipcRenderer.send('auto:save', d),
  autoLoad: () => ipcRenderer.invoke('auto:load'),
  autoClear: () => ipcRenderer.send('auto:clear'),
  setDirty: v => ipcRenderer.send('dirty', v),
  logPath: () => ipcRenderer.invoke('log:path'),
  cancel: () => ipcRenderer.send('cancel'),
  onProgress: cb => ipcRenderer.on('progress', (_, v) => cb(v)),
  pathOf: f => webUtils.getPathForFile(f)
});
