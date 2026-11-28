const { app, BrowserWindow, ipcMain, dialog, Menu, screen, shell } = require('electron');
const path = require('path');
const { spawn, execFile } = require('child_process');
const fs = require('fs');
const os = require('os');
const { buildPlan, buildSpeechPlan } = require('./export');
const { runPlan } = require('./runner');
const asr = require('./asr');
const cfg = require('./settings');
const { classify, hostsFor, HF, MIRROR } = require('./asr-errors');

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
const modelsDir = () => path.join(app.getPath('userData'), 'models');
function techDetail(title, lines) {
  const h = hw(), p = perf();
  return [`KORA Studio ${app.getVersion()} — ${title}`, `Système : ${process.platform} ${process.arch} · Electron ${process.versions.electron} · Node ${process.versions.node}`,
    `Ordinateur : ${h.cores} cœurs, ${h.ramGB} Go de RAM · profil ${p.profile} (threads ${p.threads}, vitesse ${p.preset}, sous-titres ${p.asrModel})`, ...lines].join('\n');
}

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
    if (!r.ok && r.error !== 'Export annulé') { log('EXPORT', r.error); r.detail = techDetail('échec de l\'export', ['Erreur : ' + r.error, 'Format ' + project.fmt + ', ' + project.short + 'p, qualité ' + project.quality]); }
    return r;
  } catch (e) { log('EXPORT', e.stack || e.message); return { ok: false, error: e.message, detail: techDetail('échec de l\'export', [String(e.stack || e.message)]) }; }
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
  const hold = asrJob = { cancelled: false, proc: null, kill: null };
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kora-asr-')), send = m => win && !win.isDestroyed() && win.webContents.send('asr:progress', m);
  const fail = (stage, error, extra = []) => {
    const info = classify({ stage, message: error, code: '' });
    log('ASR', stage, error); return { ok: false, error, stage, info, modelsDir: modelsDir(), detail: techDetail('échec des sous-titres', [`Étape : ${stage}`, `Erreur : ${error}`, ...extra]) };
  };
  try {
    const pf = perf(), raw = path.join(tmp, 'speech.raw'), plan = buildSpeechPlan({ ...project, perf: pf }, raw);
    if (!plan) return fail('audio', 'Aucune vidéo avec du son sur la timeline.');
    send({ stage: 'audio', text: 'Préparation du son…', v: 0 });
    const r = await runPlan(plan, FFMPEG, v => send({ stage: 'audio', text: 'Préparation du son…', v }), hold, { lowPriority: pf.lowPriority });
    if (!r.ok) return r.error === 'Export annulé' ? { ok: false, error: 'Annulé' } : fail('audio', r.error);
    const hosts = hostsFor(settings.perf.modelHost), mdl = model || pf.asrModel;
    const res = await asr.transcribe(raw, { model: mdl, lang, cache: modelsDir(), threads: pf.asrThreads, lowPriority: pf.lowPriority, hosts }, m => {
      if (m.type === 'stage') send({ stage: m.stage, text: m.text, v: null });
      else if (m.type === 'progress' && m.p && m.p.status === 'progress') send({ stage: 'model', text: `Téléchargement du modèle (une seule fois)… ${Math.round(m.p.progress || 0)} %`, v: (m.p.progress || 0) / 100 });
      else if (m.type === 'status') send({ stage: m.stage || 'run', text: m.text, v: m.v == null ? null : m.v });
    }, hold);
    if (res.ok || res.error === 'Annulé') return res;
    const info = classify({ stage: res.stage, message: res.error, code: res.code });
    log('ASR', res.stage, res.error, res.code || '', res.stack || '');
    return { ok: false, error: res.error, stage: res.stage, info, modelsDir: modelsDir(),
      detail: techDetail('échec des sous-titres', [`Étape : ${res.stage || '?'}`, `Modèle : whisper-${mdl} · serveurs : ${hosts.join(', ')}`, `Erreur : ${res.error}`, res.code ? `Code : ${res.code}` : '', res.stack ? `Trace :\n${res.stack}` : ''].filter(Boolean)) };
  } catch (e) { return fail('run', e.message, [String(e.stack || '')]); }
  finally { asrJob = null; fs.rmSync(tmp, { recursive: true, force: true }); }
});
// Test de la connexion au serveur des modèles
ipcMain.handle('asr:diag', async () => {
  const one = async host => {
    const t0 = Date.now();
    try { const r = await fetch(host + 'Xenova/whisper-tiny/resolve/main/config.json', { signal: AbortSignal.timeout(8000) }); return { host: new URL(host).hostname, ok: r.ok, status: r.status, ms: Date.now() - t0 }; }
    catch (e) { const code = (e.cause && (e.cause.code || e.cause.message)) || e.message; return { host: new URL(host).hostname, ok: false, error: code, why: classify({ stage: 'model', message: String(code) }).title }; }
  };
  return Promise.all([HF, MIRROR].map(one));
});
const modelsReadme = () => 'Installer un modèle de sous-titres à la main\r\n\r\nSi le téléchargement automatique est impossible, tu peux copier les fichiers du modèle depuis un autre ordinateur ou un téléphone :\r\n1. Sur un appareil connecté, ouvre https://huggingface.co/Xenova/whisper-base/tree/main (ou le site miroir https://hf-mirror.com/Xenova/whisper-base/tree/main).\r\n2. Télécharge : config.json, generation_config.json, preprocessor_config.json, tokenizer.json, tokenizer_config.json, et dans le dossier onnx : encoder_model_quantized.onnx et decoder_model_merged_quantized.onnx.\r\n3. Mets-les dans : Xenova/whisper-base/ (les fichiers .onnx dans Xenova/whisper-base/onnx/) à l\'intérieur de ce dossier.\r\n4. Relance les sous-titres avec la précision « Équilibrée ».\r\n(Pour « Rapide », remplace base par tiny ; pour « Précis », par small.)\r\n';
ipcMain.handle('models:open', () => { try { fs.mkdirSync(path.join(modelsDir(), 'Xenova', 'whisper-base', 'onnx'), { recursive: true }); fs.writeFileSync(path.join(modelsDir(), 'LISEZ-MOI.txt'), modelsReadme()); } catch (e) { /* ok */ } return shell.openPath(modelsDir()); });
ipcMain.on('shell:show', (_, p) => { if (p && fs.existsSync(p)) shell.showItemInFolder(p); });
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
ipcMain.handle('models:clear', () => { try { fs.rmSync(modelsDir(), { recursive: true, force: true }); return true; } catch (e) { return false; } });
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
