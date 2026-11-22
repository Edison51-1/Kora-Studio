const { app, BrowserWindow, ipcMain, dialog, Menu, screen, shell } = require('electron');
const path = require('path');
const { spawn, execFile } = require('child_process');
const fs = require('fs');
const os = require('os');
const { buildPlan, buildSpeechPlan } = require('./export');
const { runPlan } = require('./runner');
const asr = require('./asr');
const cfg = require('./settings');

const fix = p => p.replace('app.asar' + path.sep, 'app.asar.unpacked' + path.sep);
const FFMPEG = fix(require('ffmpeg-static'));
const FFPROBE = fix(require('ffprobe-static').path);
const IMG = /\.(png|jpe?g|webp|bmp|gif)$/i;
let win, setWin = null, job = null, asrJob = null, projPath = null, dirty = false, settings = cfg.DEFAULTS;
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
const setPath = () => path.join(app.getPath('userData'), 'settings.json');
const hw = () => ({ cores: os.cpus().length || 1, ramGB: +(os.totalmem() / 1073741824).toFixed(1) });
const perf = () => cfg.resolvePerf(settings, hw());
function loadSettings() { try { settings = cfg.merge(cfg.DEFAULTS, JSON.parse(fs.readFileSync(setPath(), 'utf8'))); } catch (e) { settings = cfg.merge(cfg.DEFAULTS, {}); } }
function saveSettings(patch) {
  settings = cfg.merge(settings, patch);
  try { fs.mkdirSync(path.dirname(setPath()), { recursive: true }); fs.writeFileSync(setPath(), JSON.stringify(settings, null, 2)); } catch (e) { log('SETTINGS', e.message); }
  for (const w of [win, setWin]) if (w && !w.isDestroyed()) w.webContents.send('settings', { settings, perf: perf(), hw: hw() });
  if (win && !win.isDestroyed()) win.webContents.setZoomFactor(Math.min(1.5, Math.max(.7, settings.general.uiZoom || 1)));
}
const snapshot = () => ({ settings, perf: perf(), hw: hw() });

function createWindow() {
  loadSettings();
  const wa = screen.getPrimaryDisplay().workAreaSize;
  win = new BrowserWindow({
    width: Math.min(1400, wa.width), height: Math.min(860, wa.height), minWidth: 760, minHeight: 480,
    backgroundColor: '#0c0d10', autoHideMenuBar: false, title: 'KORA Studio',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  win.webContents.on('did-finish-load', () => win.webContents.setZoomFactor(Math.min(1.5, Math.max(.7, settings.general.uiZoom || 1))));
  if (wa.width <= 1400 || wa.height <= 800) win.maximize(); // petit écran : on utilise toute la place
  buildMenu();
  if (process.env.KORA_TEST_JS) win.webContents.once('did-finish-load', () => setTimeout(() => win.webContents.executeJavaScript(fs.readFileSync(process.env.KORA_TEST_JS, 'utf8')), 2000)); // outil de test
  win.on('close', e => {
    if (!dirty || !settings.project.confirmQuit) return;
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
  const dir = settings.general.exportDir && fs.existsSync(settings.general.exportDir) ? settings.general.exportDir : '';
  const r = await dialog.showSaveDialog(win, { defaultPath: path.join(dir, (name || 'kora-export') + '.' + ext),
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
    project.perf = perf();
    const plan = buildPlan(project, out, tmp);
    const r = await runPlan(plan, FFMPEG, v => win && !win.isDestroyed() && win.webContents.send('progress', v), hold, { lowPriority: project.perf.lowPriority });
    if (!r.ok && r.error !== 'Export annulé') { log('EXPORT', r.error); r.error += ' (journal : ' + logPath() + ')'; }
    return r;
  } catch (e) { log('EXPORT', e.stack || e.message); return { ok: false, error: e.message }; }
  finally { job = null; fs.rmSync(tmp, { recursive: true, force: true }); }
});

ipcMain.on('cancel', () => { if (job) { job.cancelled = true; if (job.proc) job.proc.kill('SIGKILL'); } });

// Forme d'onde réelle : 50 valeurs par seconde
ipcMain.handle('peaks', (_, file) => {
  if (settings.perf.waveforms === 'none') return new Uint8Array(0);
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
    const pf = perf(), raw = path.join(tmp, 'speech.raw'), plan = buildSpeechPlan({ ...project, perf: pf }, raw);
    if (!plan) return { ok: false, error: 'Aucune vidéo avec du son sur la timeline.' };
    send({ stage: 'audio', text: 'Préparation du son…', v: 0 });
    const r = await runPlan(plan, FFMPEG, v => send({ stage: 'audio', text: 'Préparation du son…', v }), hold, { lowPriority: pf.lowPriority });
    if (!r.ok) return r;
    const res = await asr.transcribe(raw, { model: model || pf.asrModel, lang, cache: path.join(app.getPath('userData'), 'models'), threads: pf.asrThreads, lowPriority: pf.lowPriority }, m => {
      if (m.type === 'progress' && m.p) send({ stage: 'model', text: m.p.status === 'progress' ? 'Téléchargement du modèle (une seule fois)…' : 'Chargement du modèle…', v: (m.p.progress || 0) / 100 });
      else if (m.type === 'status') send({ stage: 'run', text: m.text, v: m.v == null ? null : m.v });
    }, hold);
    if (!res.ok) log('ASR', res.error);
    return res;
  } catch (e) { log('ASR', e.stack || e.message); return { ok: false, error: e.message }; }
  finally { asrJob = null; fs.rmSync(tmp, { recursive: true, force: true }); }
});
ipcMain.on('asr:cancel', () => { if (asrJob) { asrJob.cancelled = true; if (asrJob.proc) asrJob.proc.kill('SIGKILL'); if (asrJob.kill) asrJob.kill(); } });
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
ipcMain.handle('settings:get', () => snapshot());
ipcMain.handle('settings:set', (_, patch) => { saveSettings(patch); return snapshot(); });
ipcMain.handle('settings:reset', () => { settings = cfg.merge(cfg.DEFAULTS, {}); saveSettings({}); return snapshot(); });
ipcMain.on('settings:open', () => openSettings());
ipcMain.handle('dir:pick', async () => { const r = await dialog.showOpenDialog(setWin || win, { properties: ['openDirectory', 'createDirectory'] }); return r.canceled ? null : r.filePaths[0]; });
ipcMain.on('proj:new', () => { projPath = null; });
ipcMain.on('settings:close', () => { if (setWin) setWin.close(); });
ipcMain.on('shell:logs', () => shell.showItemInFolder(logPath()) || shell.openPath(path.dirname(logPath())));
ipcMain.handle('models:clear', () => { try { fs.rmSync(path.join(app.getPath('userData'), 'models'), { recursive: true, force: true }); return true; } catch (e) { return false; } });
ipcMain.on('app:about', () => dialog.showMessageBox(win, { type: 'info', title: 'À propos', message: 'KORA Studio ' + app.getVersion(), detail: 'Éditeur vidéo, image et audio.\nMoteur : FFmpeg. Sous-titres : Whisper (hors ligne).\n\nDossier des données : ' + app.getPath('userData') }));

function openSettings() {
  if (setWin) return setWin.focus();
  const wa = screen.getPrimaryDisplay().workAreaSize;
  setWin = new BrowserWindow({ parent: win, modal: true, width: Math.min(760, wa.width - 40), height: Math.min(680, wa.height - 60), title: 'Paramètres — KORA Studio', backgroundColor: '#0c0d10', minimizable: false,
    webPreferences: { preload: path.join(__dirname, 'settings-preload.js'), contextIsolation: true, nodeIntegration: false } });
  setWin.setMenu(null); setWin.loadFile(path.join(__dirname, 'renderer', 'settings.html')); setWin.on('closed', () => { setWin = null; });
}
function buildMenu() {
  const send = c => () => win && !win.isDestroyed() && win.webContents.send('menu', c);
  const I = (label, cmd, accelerator, reg = true) => ({ label, click: send(cmd), accelerator, registerAccelerator: reg });
  const sep = { type: 'separator' };
  const fmt = (label, v) => ({ label, type: 'radio', checked: v === settings.general.defaultFormat, click: send('fmt:' + v) });
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'Fichier', submenu: [I('Nouveau projet', 'new', 'CmdOrCtrl+N'), I('Ouvrir un projet…', 'open', 'CmdOrCtrl+O'), I('Enregistrer', 'save', 'CmdOrCtrl+S', false), I('Enregistrer sous…', 'saveas', 'CmdOrCtrl+Shift+S'), sep,
      I('Importer des médias…', 'import', 'CmdOrCtrl+I'), I('Importer des sous-titres (.srt)…', 'srt'), sep, I('Exporter la vidéo…', 'export', 'CmdOrCtrl+E'), I('Exporter le clip sélectionné…', 'exportClip'), I('Convertir la vidéo sélectionnée en MP3…', 'mp3'), sep, { role: 'quit', label: 'Quitter' }] },
    { label: 'Édition', submenu: [I('Annuler', 'undo', 'CmdOrCtrl+Z', false), I('Rétablir', 'redo', 'CmdOrCtrl+Y', false), sep, I('Couper à la tête de lecture', 'cut', 'C', false), I('Copier le clip', 'copy', 'CmdOrCtrl+C', false), I('Coller le clip', 'paste', 'CmdOrCtrl+V', false), I('Dupliquer', 'dup'), I('Supprimer', 'del', 'Delete', false)] },
    { label: 'Insertion', submenu: [I('Texte', 'text', 'T', false), I('Stickers et flèches…', 'sticker'), I('Sous-titres automatiques…', 'subs'), I('Image ou vidéo par-dessus…', 'overlay'), I('Deux vidéos côte à côte…', 'pair')] },
    { label: 'Affichage', submenu: [I('Bibliothèque', 'toggleLib', 'CmdOrCtrl+1'), I('Inspecteur', 'toggleInsp', 'CmdOrCtrl+2'), I('Timeline plus haute', 'tlUp', 'CmdOrCtrl+Up'), I('Timeline plus basse', 'tlDown', 'CmdOrCtrl+Down'), I('Mode compact', 'compact'), sep,
      I('Agrandir l\'interface', 'zoomIn', 'CmdOrCtrl+Plus'), I('Réduire l\'interface', 'zoomOut', 'CmdOrCtrl+-'), I('Taille normale', 'zoomReset', 'CmdOrCtrl+0'), { role: 'togglefullscreen', label: 'Plein écran' }, sep, I('Réinitialiser la disposition', 'resetLayout')] },
    { label: 'Format', submenu: [fmt('16:9 · YouTube', '16:9'), fmt('9:16 · TikTok / Shorts / Reels', '9:16'), fmt('1:1 · Carré', '1:1'), fmt('4:5 · Instagram', '4:5')] },
    { label: 'Outils', submenu: [{ label: 'Paramètres…', accelerator: 'CmdOrCtrl+,', click: openSettings }, sep, I('Sous-titres automatiques…', 'subs'), I('Convertir en MP3…', 'mp3'), sep, { label: 'Ouvrir le dossier des journaux', click: () => shell.openPath(path.dirname(logPath())) }] },
    { label: 'Aide', submenu: [I('Raccourcis clavier', 'help', '?', false), { label: 'À propos de KORA Studio', click: () => ipcMain.emit('app:about') }] }
  ]));
}

const quitAll = () => { for (const j of [job, asrJob]) if (j) { j.cancelled = true; if (j.proc) j.proc.kill('SIGKILL'); if (j.kill) j.kill(); } };
app.whenReady().then(createWindow);
app.on('before-quit', quitAll);
app.on('window-all-closed', () => app.quit());
