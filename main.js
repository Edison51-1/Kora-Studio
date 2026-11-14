const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn, execFile } = require('child_process');
const fs = require('fs');
const os = require('os');
const { buildPlan } = require('./export');
const { runPlan } = require('./runner');

const fix = p => p.replace('app.asar' + path.sep, 'app.asar.unpacked' + path.sep);
const FFMPEG = fix(require('ffmpeg-static'));
const FFPROBE = fix(require('ffprobe-static').path);
const IMG = /\.(png|jpe?g|webp|bmp|gif)$/i;
let win, job = null, projPath = null;

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

ipcMain.handle('save', async (_, ext, name) => {
  const r = await dialog.showSaveDialog(win, {
    defaultPath: (name || 'kora-export') + '.' + ext,
    filters: ext === 'mp4' ? [{ name: 'Vidéo MP4', extensions: ['mp4'] }] : [{ name: 'Audio', extensions: ['mp3', 'm4a', 'wav'] }]
  });
  if (r.canceled) return null;
  return /\.(mp4|mp3|m4a|wav)$/i.test(r.filePath) ? r.filePath : r.filePath + '.' + ext;
});

ipcMain.handle('export', async (_, project, out) => {
  if (job) return { ok: false, error: 'Un export est déjà en cours' };
  const hold = job = { cancelled: false, proc: null };
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kora-'));
  try {
    (project.text || []).forEach((t, i) => { t.pngPath = path.join(tmp, 't' + i + '.png'); fs.writeFileSync(t.pngPath, Buffer.from(t.png.split(',')[1], 'base64')); delete t.png; });
    const plan = buildPlan(project, out, tmp);
    return await runPlan(plan, FFMPEG, v => win && !win.isDestroyed() && win.webContents.send('progress', v), hold);
  } catch (e) { return { ok: false, error: e.message }; }
  finally { job = null; fs.rmSync(tmp, { recursive: true, force: true }); }
});

ipcMain.handle('proj:save', async (_, data, asNew) => {
  if (!projPath || asNew) {
    const r = await dialog.showSaveDialog(win, { defaultPath: 'projet.kora', filters: [{ name: 'Projet KORA', extensions: ['kora'] }] });
    if (r.canceled) return null; projPath = r.filePath;
  }
  fs.writeFileSync(projPath, data); return { name: path.basename(projPath) };
});
ipcMain.handle('proj:open', async () => {
  const r = await dialog.showOpenDialog(win, { properties: ['openFile'], filters: [{ name: 'Projet KORA', extensions: ['kora'] }] });
  if (r.canceled) return null; projPath = r.filePaths[0];
  return { name: path.basename(projPath), data: fs.readFileSync(projPath, 'utf8') };
});
ipcMain.on('cancel', () => { if (job) { job.cancelled = true; if (job.proc) job.proc.kill('SIGKILL'); } });

app.whenReady().then(createWindow);
app.on('before-quit', () => { if (job) { job.cancelled = true; if (job.proc) job.proc.kill('SIGKILL'); } });
app.on('window-all-closed', () => app.quit());
