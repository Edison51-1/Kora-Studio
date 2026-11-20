const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn, execFile } = require('child_process');
const fs = require('fs');
const os = require('os');
const { buildPlan, buildSpeechPlan } = require('./export');
const { runPlan } = require('./runner');
const asr = require('./asr');

const fix = p => p.replace('app.asar' + path.sep, 'app.asar.unpacked' + path.sep);
const FFMPEG = fix(require('ffmpeg-static'));
const FFPROBE = fix(require('ffprobe-static').path);
const IMG = /\.(png|jpe?g|webp|bmp|gif)$/i;
let win, job = null, asrJob = null, projPath = null, dirty = false;
const peaksCache = new Map();

// Journal des erreurs (dossier de données de l'application)
function log(...a) {
  try {
    const f = path.join(app.getPath('userData'), 'logs', 'kora.log'); fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.appendFileSync(f, `[${new Date().toISOString()}] ${a.join(' ')}\n`);
  } catch (e) { /* ignoré */ }
}
const logPath = () => path.join(app.getPath('userData'), 'logs', 'kora.log');
const autoPath = () => path.join(app.getPath('userData'), 'autosave.kora');

function createWindow() {
  win = new BrowserWindow({
    width: 1400, height: 860, minWidth: 1100, minHeight: 700,
    backgroundColor: '#0c0d10', autoHideMenuBar: true, title: 'KORA Studio',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  win.on('close', e => {
    if (!dirty) return;
    const r = dialog.showMessageBoxSync(win, { type: 'question', buttons: ['Annuler', 'Quitter sans enregistrer'], defaultId: 0, cancelId: 0, title: 'KORA Studio',
      message: 'Des modifications ne sont pas enregistrées.', detail: 'Une copie de sauvegarde automatique est conservée : tu pourras la récupérer au prochain lancement.' });
    if (r === 0) e.preventDefault();
  });
}

ipcMain.handle('pick', async () => {
  const r = await dialog.showOpenDialog(win, { properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Médias', extensions: ['mp4', 'mkv', 'mov', 'avi', 'webm', 'm4v', 'png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif', 'mp3', 'wav', 'm4a', 'ogg', 'flac', 'aac'] }] });
  return r.canceled ? [] : r.filePaths;
});

ipcMain.handle('probe', (_, file) => new Promise(resolve => {
  if (IMG.test(file)) return resolve({ type: 'image', duration: 5, hasAudio: false });
  execFile(FFPROBE, ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', file], (err, out) => {
    if (err) return resolve({ error: 'Fichier illisible' });
    try {
      const j = JSON.parse(out), s = j.streams || [];
      const hasVideo = s.some(x => x.codec_type === 'video' && !(x.disposition && x.disposition.attached_pic));
      resolve({ type: hasVideo ? 'video' : 'audio', duration: parseFloat(j.format.duration) || 0, hasAudio: s.some(x => x.codec_type === 'audio') });
    } catch (e) { resolve({ error: 'Fichier illisible' }); }
  });
}));

ipcMain.handle('save', async (_, ext, name) => {
  const r = await dialog.showSaveDialog(win, { defaultPath: (name || 'kora-export') + '.' + ext,
    filters: ext === 'mp4' ? [{ name: 'Vidéo MP4', extensions: ['mp4'] }] : [{ name: 'Audio', extensions: ['mp3', 'm4a', 'wav'] }] });
  if (r.canceled) return null;
  return /\.(mp4|mp3|m4a|wav)$/i.test(r.filePath) ? r.filePath : r.filePath + '.' + ext;
});

ipcMain.handle('export', async (_, project, out) => {
  if (job) return { ok: false, error: 'Un export est déjà en cours' };
  const hold = job = { cancelled: false, proc: null };
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kora-'));
  try {
    const dump = (it, i, pre) => { if (it.png) { it.pngPath = path.join(tmp, `${pre}${i}.png`); fs.writeFileSync(it.pngPath, Buffer.from(it.png.split(',')[1], 'base64')); delete it.png; } };
    (project.text || []).forEach((t, i) => dump(t, i, 't')); (project.over || []).forEach((t, i) => dump(t, i, 'o'));
    const plan = buildPlan(project, out, tmp);
    const r = await runPlan(plan, FFMPEG, v => win && !win.isDestroyed() && win.webContents.send('progress', v), hold);
    if (!r.ok && r.error !== 'Export annulé') { log('EXPORT', r.error); r.error += ' (journal : ' + logPath() + ')'; }
    return r;
  } catch (e) { log('EXPORT', e.stack || e.message); return { ok: false, error: e.message }; }
  finally { job = null; fs.rmSync(tmp, { recursive: true, force: true }); }
});

ipcMain.on('cancel', () => { if (job) { job.cancelled = true; if (job.proc) job.proc.kill('SIGKILL'); } });

// Forme d'onde réelle : 50 valeurs par seconde
ipcMain.handle('peaks', (_, file) => {
  if (peaksCache.has(file)) return peaksCache.get(file);
  return new Promise(resolve => {
    const pr = spawn(FFMPEG, ['-v', 'error', '-nostdin', '-i', file, '-vn', '-ac', '1', '-ar', '8000', '-f', 's16le', '-'], { stdio: ['ignore', 'pipe', 'ignore'] });
    try { os.setPriority(pr.pid, 10); } catch (e) { /* ok */ }
    const peaks = []; let rest = Buffer.alloc(0);
    pr.stdout.on('data', d => {
      let b = rest.length ? Buffer.concat([rest, d]) : d; const n = Math.floor(b.length / 320);
      for (let i = 0; i < n; i++) { let m = 0; for (let j = 0; j < 160; j++) { const v = Math.abs(b.readInt16LE(i * 320 + j * 2)); if (v > m) m = v; } peaks.push(Math.min(255, Math.round(m / 32768 * 255 * 1.6))); }
      rest = b.subarray(n * 320);
    });
    pr.on('error', () => resolve(null));
    pr.on('close', () => { const u = Uint8Array.from(peaks); peaksCache.set(file, u); resolve(u); });
  });
});

// Sous-titres automatiques
ipcMain.handle('asr:start', async (_, project, model, lang) => {
  if (asrJob) return { ok: false, error: 'Une transcription est déjà en cours' };
  const hold = asrJob = { cancelled: false, proc: null, worker: null };
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kora-asr-')), send = m => win && !win.isDestroyed() && win.webContents.send('asr:progress', m);
  try {
    const raw = path.join(tmp, 'speech.raw'), plan = buildSpeechPlan(project, raw);
    if (!plan) return { ok: false, error: 'Aucune vidéo avec du son sur la timeline.' };
    send({ stage: 'audio', text: 'Préparation du son…', v: 0 });
    const r = await runPlan(plan, FFMPEG, v => send({ stage: 'audio', text: 'Préparation du son…', v }), hold);
    if (!r.ok) return r;
    const res = await asr.transcribe(raw, { model, lang, cache: path.join(app.getPath('userData'), 'models') }, m => {
      if (m.type === 'progress' && m.p) send({ stage: 'model', text: m.p.status === 'progress' ? 'Téléchargement du modèle (une seule fois)…' : 'Chargement du modèle…', v: (m.p.progress || 0) / 100 });
      else if (m.type === 'status') send({ stage: 'run', text: m.text, v: null });
    }, hold);
    if (!res.ok) log('ASR', res.error);
    return res;
  } catch (e) { log('ASR', e.stack || e.message); return { ok: false, error: e.message }; }
  finally { asrJob = null; fs.rmSync(tmp, { recursive: true, force: true }); }
});
ipcMain.on('asr:cancel', () => { if (asrJob) { asrJob.cancelled = true; if (asrJob.proc) asrJob.proc.kill('SIGKILL'); if (asrJob.worker) asrJob.worker.terminate(); } });
ipcMain.handle('srt:open', async () => {
  const r = await dialog.showOpenDialog(win, { properties: ['openFile'], filters: [{ name: 'Sous-titres SRT', extensions: ['srt'] }] });
  return r.canceled ? null : fs.readFileSync(r.filePaths[0], 'utf8');
});

// Projets, sauvegarde automatique, état « modifié »
ipcMain.handle('proj:save', async (_, data, asNew) => {
  if (!projPath || asNew) {
    const r = await dialog.showSaveDialog(win, { defaultPath: 'projet.kora', filters: [{ name: 'Projet KORA', extensions: ['kora'] }] });
    if (r.canceled) return null; projPath = r.filePath;
  }
  fs.writeFileSync(projPath, data); try { fs.rmSync(autoPath(), { force: true }); } catch (e) { /* ok */ }
  return { name: path.basename(projPath) };
});
ipcMain.handle('proj:open', async () => {
  const r = await dialog.showOpenDialog(win, { properties: ['openFile'], filters: [{ name: 'Projet KORA', extensions: ['kora'] }] });
  if (r.canceled) return null; projPath = r.filePaths[0];
  return { name: path.basename(projPath), data: fs.readFileSync(projPath, 'utf8') };
});
ipcMain.on('auto:save', (_, data) => { try { fs.writeFileSync(autoPath(), data); } catch (e) { log('AUTOSAVE', e.message); } });
ipcMain.handle('auto:load', () => { try { return fs.existsSync(autoPath()) ? fs.readFileSync(autoPath(), 'utf8') : null; } catch (e) { return null; } });
ipcMain.on('auto:clear', () => { try { fs.rmSync(autoPath(), { force: true }); } catch (e) { /* ok */ } });
ipcMain.on('dirty', (_, v) => { dirty = !!v; });
ipcMain.handle('log:path', () => logPath());

const quitAll = () => { for (const j of [job, asrJob]) if (j) { j.cancelled = true; if (j.proc) j.proc.kill('SIGKILL'); if (j.worker) j.worker.terminate(); } };
app.whenReady().then(createWindow);
app.on('before-quit', quitAll);
app.on('window-all-closed', () => app.quit());
