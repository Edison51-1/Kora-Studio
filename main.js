const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn, execFile } = require('child_process');
const { buildArgs } = require('./export');

const fix = p => p.replace('app.asar' + path.sep, 'app.asar.unpacked' + path.sep);
const FFMPEG = fix(require('ffmpeg-static'));
const FFPROBE = fix(require('ffprobe-static').path);
const IMG = /\.(png|jpe?g|webp|bmp|gif)$/i;
let win, job = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1360, height: 820, minWidth: 1100, minHeight: 680,
    backgroundColor: '#0e0f13', autoHideMenuBar: true, title: 'KORA Studio',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

ipcMain.handle('pick', async () => {
  const r = await dialog.showOpenDialog(win, {
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Médias', extensions: ['mp4', 'mkv', 'mov', 'avi', 'webm', 'png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif', 'mp3', 'wav', 'm4a', 'ogg', 'flac', 'aac'] }]
  });
  return r.canceled ? [] : r.filePaths;
});

ipcMain.handle('probe', (_, file) => new Promise(resolve => {
  if (IMG.test(file)) return resolve({ type: 'image', duration: 5, hasAudio: false });
  execFile(FFPROBE, ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', file], (err, out) => {
    if (err) return resolve({ error: 'Fichier illisible' });
    try {
      const j = JSON.parse(out), s = j.streams || [];
      const hasVideo = s.some(x => x.codec_type === 'video' && !(x.disposition && x.disposition.attached_pic));
      const hasAudio = s.some(x => x.codec_type === 'audio');
      resolve({ type: hasVideo ? 'video' : 'audio', duration: parseFloat(j.format.duration) || 0, hasAudio });
    } catch (e) { resolve({ error: 'Fichier illisible' }); }
  });
}));

ipcMain.handle('save', async (_, ext) => {
  const r = await dialog.showSaveDialog(win, {
    defaultPath: 'kora-export.' + ext,
    filters: ext === 'mp4' ? [{ name: 'Vidéo MP4', extensions: ['mp4'] }] : [{ name: 'Audio', extensions: ['mp3', 'm4a', 'wav'] }]
  });
  return r.canceled ? null : r.filePath;
});

ipcMain.handle('export', (_, project, out) => new Promise(resolve => {
  let plan;
  try { plan = buildArgs(project, out); } catch (e) { return resolve({ ok: false, error: e.message }); }
  let tail = '';
  job = spawn(FFMPEG, plan.args);
  job.stderr.on('data', d => {
    const s = d.toString(); tail = (tail + s).slice(-1500);
    const m = [...s.matchAll(/time=(\d+):(\d+):(\d+\.?\d*)/g)].pop();
    if (m && plan.total) win.webContents.send('progress', Math.min(1, (+m[1] * 3600 + +m[2] * 60 + +m[3]) / plan.total));
  });
  job.on('error', e => resolve({ ok: false, error: e.message }));
  job.on('close', code => { const cancelled = job === null; job = null; resolve(code === 0 ? { ok: true } : { ok: false, error: cancelled ? 'Export annulé' : tail.split('\n').slice(-4).join(' ') }); });
}));

ipcMain.on('cancel', () => { if (job) { const j = job; job = null; j.kill('SIGKILL'); } });

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
