const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const ICO = {
  play: '<polygon points="6 3 20 12 6 21 6 3"/>', pause: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
  skipb: '<polygon points="19 20 9 12 19 4 19 20"/><line x1="5" x2="5" y1="19" y2="5"/>', skipf: '<polygon points="5 4 15 12 5 20 5 4"/><line x1="19" x2="19" y1="5" y2="19"/>',
  scissors: '<circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>', redo: '<path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
  film: '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18M3 7.5h4M3 12h18M3 16.5h4M17 3v18M17 7.5h4M17 16.5h4"/>',
  image: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
  left: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>', right: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  type: '<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/>',
  save: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
  open: '<path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"/>',
  captions: '<rect width="18" height="14" x="3" y="5" rx="2"/><path d="M7 15h4M15 15h2M7 11h2M13 11h4"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h0a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>'
};
const ico = n => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICO[n]}</svg>`;
$$('i[data-i]').forEach(e => e.innerHTML = ico(e.dataset.i));

const FONTS = [['Arial, Helvetica, sans-serif', 'Sans-serif'], ['Georgia, "Times New Roman", serif', 'Serif'], ['"Courier New", monospace', 'Monospace'], ['Impact, "Arial Black", sans-serif', 'Impact'], ['"Comic Sans MS", cursive', 'Manuscrite'], ['Verdana, Geneva, sans-serif', 'Verdana'], ['"Trebuchet MS", sans-serif', 'Trebuchet']];
const IANIMS = [['none', 'Aucune'], ['zoomin', 'Zoom avant'], ['zoomout', 'Zoom arrière'], ['panleft', 'Pano ←'], ['panright', 'Pano →'], ['panup', 'Pano ↑'], ['pandown', 'Pano ↓'], ['kenburns', 'Ken Burns'], ['pulse', 'Pulsation'], ['fadein', 'Fondu entrant'], ['fadeout', 'Fondu sortant'], ['fadeinout', 'Fondu in/out'], ['slideleft', 'Glisser ←'], ['slideright', 'Glisser →'], ['slideup', 'Glisser ↑'], ['slidedown', 'Glisser ↓'], ['rotate', 'Rotation'], ['shake', 'Tremblement']];
const TANIMS = [['none', 'Aucune'], ['fade', 'Fondu'], ['slideleft', 'Depuis la gauche'], ['slideright', 'Depuis la droite'], ['slideup', 'Depuis le bas'], ['slidedown', 'Depuis le haut']];
const OANIMS = [['none', 'Aucune'], ['fade', 'Fondu'], ['pop', 'Pop'], ['slideleft', 'Depuis la gauche'], ['slideright', 'Depuis la droite'], ['slideup', 'Depuis le bas'], ['slidedown', 'Depuis le haut']];
const TRANS = [['none', 'Aucune'], ['fade', 'Fondu'], ['fadeblack', 'Fondu au noir'], ['dissolve', 'Dissolution'], ['slideleft', 'Glisser ←'], ['slideright', 'Glisser →'], ['wipeleft', 'Volet ←'], ['circleopen', 'Cercle'], ['pixelize', 'Pixels'], ['zoomin', 'Zoom']];
const SPEEDS = [[.5, '0,5×'], [.75, '0,75×'], [1, 'Normale'], [1.25, '1,25×'], [1.5, '1,5×'], [2, '2×']];
const LEGACY = { fade: 'fadeinout', pan: 'panright' };
const DEF = { vol: 1, mute: false, denoise: false, fi: 0, fo: 0, speed: 1, bright: 0, contrast: 1, sat: 1 };
const IN = .5, OUT = .3; // animations d'entrée / sortie (identiques à l'export)

let CFG = null, PERF = null, autoTimer = 0;
const S = { fmt: '16:9', lib: [], visual: [], audio: [], over: [], text: [], sel: null, undo: [], redo: [], scale: 40, flt: 'all', dirty: false, conv: null, only: null };
let T = 0, playing = false, last = 0, raf = 0, uid = 1, clip = null;
const pv = $('#pv'), pv2 = $('#pv2'), pi = $('#pi'), cv = $('#tcv'), scr = $('#screen'), pa = [new Audio(), new Audio()], pRep = new Audio();
const nid = () => 'c' + uid++;
const len = KS.len, spd = c => c.speed || 1;
const tc = t => { t = Math.max(0, t || 0); const m = Math.floor(t / 60), s = t - m * 60; return String(m).padStart(2, '0') + ':' + (s < 10 ? '0' : '') + s.toFixed(1); };
const url = p => 'file:///' + encodeURI(p.replace(/\\/g, '/').replace(/^\//, '')).replace(/#/g, '%23').replace(/\?/g, '%3F');
function toast(m) { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => t.hidden = true, 4000); }

const layout = tr => KS.layout(S, tr);
const total = () => KS.total(S);
function at(tr, t) {
  const l = layout(tr);
  if (tr === 'visual') {
    for (let i = l.length - 1; i >= 0; i--) if (t >= l[i].s && t < l[i].e) return (i > 0 && l[i].tin && t < l[i].s + l[i].tin / 2) ? l[i - 1] : l[i];
    return null;
  }
  return l.find(x => t >= x.s && t < x.e) || null;
}
const atLane = (tr, lane, t) => layout(tr).find(x => (x.c.lane || 0) === lane && t >= x.s && t < x.e) || null;
const cur = () => S.sel ? S[S.sel.t].find(c => c.id === S.sel.id) || null : null;
const fmtDims = () => KS.dims(S.fmt, 720);

// ---------- Historique, modifications ----------
const cap = () => JSON.stringify({ v: S.visual, a: S.audio, o: S.over, t: S.text });
function setDirty(v) { S.dirty = v; kora.setDirty(v); }
function snap() { S.undo.push(cap()); if (S.undo.length > 80) S.undo.shift(); S.redo = []; setDirty(true); }
function restore(s) { const o = JSON.parse(s); S.visual = o.v; S.audio = o.a; S.over = o.o || []; S.text = o.t || []; if (!cur()) S.sel = null; T = Math.min(T, total()); renderAll(); }
function undo() { if (!S.undo.length) return toast('Rien à annuler'); S.redo.push(cap()); restore(S.undo.pop()); setDirty(true); }
function redo() { if (!S.redo.length) return toast('Rien à rétablir'); S.undo.push(cap()); restore(S.redo.pop()); setDirty(true); }

// ---------- Miniatures et formes d'onde (calculées une seule fois) ----------
const thumbQ = []; let thumbBusy = false;
function makeThumb(it) {
  return new Promise((res, rej) => {
    const W = 240, H = 135;
    const draw = (src, w, h) => { const k = document.createElement('canvas'); k.width = W; k.height = H; const x = k.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, W, H); const s = Math.min(W / w, H / h); x.drawImage(src, (W - w * s) / 2, (H - h * s) / 2, w * s, h * s); return k.toDataURL('image/jpeg', .7); };
    if (it.type === 'image') { const im = new Image(); im.onload = () => { try { res(draw(im, im.naturalWidth, im.naturalHeight)); } catch (e) { rej(e); } im.src = ''; }; im.onerror = rej; im.src = url(it.path); }
    else { const v = document.createElement('video'); v.muted = true; v.preload = 'metadata'; v.onloadedmetadata = () => { v.currentTime = Math.min(.5, (it.duration || 1) / 2); }; v.onseeked = () => { try { res(draw(v, v.videoWidth, v.videoHeight)); } catch (e) { rej(e); } v.removeAttribute('src'); v.load(); }; v.onerror = rej; v.src = url(it.path); }
  });
}
function ensureThumb(it) { if (it.thumb || it.type === 'audio' || it._t) return; it._t = 1; thumbQ.push(it); pumpThumbs(); }
async function pumpThumbs() {
  if (thumbBusy) return; thumbBusy = true;
  while (thumbQ.length) { const it = thumbQ.shift(); try { it.thumb = await makeThumb(it); renderLib(); renderTL(); } catch (e) { /* pas de miniature */ } }
  thumbBusy = false;
}
const thumbOf = path => { const l = S.lib.find(x => x.path === path); return l && l.thumb; };
const peaks = new Map(), peakQ = []; let peakBusy = false;
function needPeaks(p) { if (peaks.has(p)) return; peaks.set(p, null); peakQ.push(p); pumpPeaks(); }
async function pumpPeaks() {
  if (peakBusy) return; peakBusy = true;
  while (peakQ.length) { const p = peakQ.shift(); try { peaks.set(p, (await kora.peaks(p)) || new Uint8Array(0)); renderTL(); } catch (e) { peaks.set(p, new Uint8Array(0)); } }
  peakBusy = false;
}
const waveCache = new Map();
function wave(c, w) {
  const pk = peaks.get(c.path); if (!pk) { needPeaks(c.path); return ''; } if (!pk.length) return '';
  const key = c.path + '|' + c.start + '|' + c.end + '|' + Math.round(w / 3); if (waveCache.has(key)) return waveCache.get(key); if (waveCache.size > 300) waveCache.clear();
  const n = Math.max(8, Math.min(500, Math.floor(w / 3))), d = c.end - c.start; let r = '';
  for (let i = 0; i < n; i++) {
    let m = 0; const j0 = Math.floor((c.start + i / n * d) * 50), j1 = Math.min(pk.length - 1, Math.floor((c.start + (i + 1) / n * d) * 50));
    for (let j = j0; j <= j1; j++) if (pk[j] > m) m = pk[j];
    const a = Math.max(.05, m / 255); r += `<rect x="${i * 3}" y="${16 - a * 15}" width="2" height="${a * 30}" rx="1"/>`;
  }
  const svg = `<svg class="w" viewBox="0 0 ${n * 3} 32" preserveAspectRatio="none" fill="rgba(255,255,255,.7)">${r}</svg>`; waveCache.set(key, svg); return svg;
}

// ---------- Ajouts ----------
async function addFiles(paths) {
  for (const p of paths) {
    const i = await kora.probe(p);
    if (i.error) { toast(i.error + ' : ' + p.split(/[\\/]/).pop()); continue; }
    const it = { id: nid(), path: p, name: p.split(/[\\/]/).pop(), ...i }; S.lib.push(it); ensureThumb(it);
  }
  renderLib();
}
function freeLane(tr, a, d, ex) { for (const l of [0, 1]) if (!S[tr].some(c => c !== ex && (c.lane || 0) === l && c.at < a + d && c.at + len(c) > a)) return l; return 0; }
function addToTL(it, o = {}) {
  snap();
  if (it.type === 'audio') {
    const c = { id: nid(), type: 'audio', path: it.path, name: it.name, hasAudio: true, src: it.duration, start: 0, end: it.duration, at: +(o.at ?? T).toFixed(2), ...DEF };
    c.lane = o.lane ?? freeLane('audio', c.at, len(c)); S.audio.push(c); S.sel = { t: 'audio', id: c.id };
  } else {
    const c = { id: nid(), path: it.path, name: it.name, type: it.type, hasAudio: it.hasAudio, src: it.duration, start: 0, end: it.type === 'image' ? 5 : it.duration, anim: 'none', fit: 'contain', ...DEF };
    o.idx == null ? S.visual.push(c) : S.visual.splice(o.idx, 0, c);
    S.sel = { t: 'visual', id: c.id }; T = layout('visual').find(x => x.c === c).s;
  }
  renderAll();
}
function addOverlay(p, o = {}) { // p : { kind: 'sticker' | 'image' | 'video', sid, path, name, src, hasAudio }
  snap();
  const rem = total() ? Math.max(.5, total() - T) : 5;
  const c = { id: nid(), type: 'over', kind: p.kind, sid: p.sid, color: p.sid ? stickerDef(p.sid).col : undefined, path: p.path, name: p.name, at: +(o.at ?? T).toFixed(2),
    dur: p.kind === 'video' ? +Math.max(.5, Math.min(p.src || 5, rem)).toFixed(2) : +Math.min(3, rem).toFixed(2), start: 0, src: p.src || 0,
    x: p.kind === 'video' ? 78 : 50, y: p.kind === 'video' ? 76 : 50, w: p.kind === 'video' ? 34 : p.kind === 'sticker' ? 24 : 36, rot: 0, op: 1, anim: p.kind === 'sticker' ? 'pop' : 'fade',
    hasAudio: !!p.hasAudio, vol: 1, mute: false };
  c.lane = o.lane ?? freeLane('over', c.at, c.dur); S.over.push(c); S.sel = { t: 'over', id: c.id }; renderAll();
}
const subSize = () => { const [w, h] = fmtDims(); return +(5.4 * Math.min(1, w / h)).toFixed(1); };
function addText() {
  snap();
  const c = { id: nid(), type: 'text', name: 'Texte', text: 'Votre texte', at: +T.toFixed(1), dur: 3, size: +(8 * Math.min(1, fmtDims()[0] / fmtDims()[1])).toFixed(1), x: 50, y: 50, color: '#ffffff', font: FONTS[0][0], bold: true, outline: true, box: false, anim: 'fade' };
  S.text.push(c); S.sel = { t: 'text', id: c.id }; renderAll();
}

// ---------- Bibliothèque ----------
function renderLib() {
  const g = $('#grid'); g.innerHTML = '';
  if (S.flt === 'sticker') {
    let cat = '';
    STICKERS.forEach(s => {
      if (s.cat !== cat) { cat = s.cat; const h = document.createElement('div'); h.className = 'cat'; h.textContent = cat; g.appendChild(h); }
      const d = document.createElement('div'); d.className = 'stk'; d.title = s.name; d.draggable = true; d.innerHTML = `<img src="${stickerUrl(s.id)}" alt="${s.name}">`;
      d.onclick = () => addOverlay({ kind: 'sticker', sid: s.id, name: s.name }); d.ondragstart = e => e.dataTransfer.setData('text/plain', 'stk:' + s.id); g.appendChild(d);
    });
    return;
  }
  const items = S.lib.filter(i => S.flt === 'all' || i.type === S.flt);
  if (!items.length) { g.innerHTML = '<div class="hint">Glisse tes fichiers ici<br>ou clique sur « Importer »</div>'; return; }
  items.forEach(it => {
    const d = document.createElement('div'); d.className = 'card'; d.draggable = true;
    const th = it.type === 'audio' ? `<div class="aico">${ico('music')}</div>` : it.thumb ? `<img src="${it.thumb}" alt="">` : `<div class="aico">${ico(it.type === 'image' ? 'image' : 'film')}</div>`;
    d.innerHTML = `<div class="thumb">${th}</div><span class="badge">${ico({ video: 'film', image: 'image', audio: 'music' }[it.type])}</span><button class="add" title="Ajouter à la timeline" aria-label="Ajouter à la timeline">+</button>${it.type !== 'image' ? '<button class="mp3" title="Convertir en MP3">MP3</button>' : ''}${it.type !== 'audio' ? '<button class="ovl" title="Incruster par-dessus la vidéo">Incruster</button>' : ''}<div class="cap"><span class="nm"></span><span class="dim">${it.type === 'image' ? 'Image' : tc(it.duration)}</span></div>`;
    d.querySelector('.nm').textContent = it.name;
    d.querySelector('.add').onclick = () => addToTL(it);
    const mb = d.querySelector('.mp3'); if (mb) mb.onclick = e => { e.stopPropagation(); startConvert({ type: 'audio', path: it.path, name: it.name, start: 0, end: it.duration, src: it.duration, hasAudio: it.hasAudio, vol: 1, at: 0 }); };
    const ob = d.querySelector('.ovl'); if (ob) ob.onclick = e => { e.stopPropagation(); addOverlay({ kind: it.type, path: it.path, name: it.name, src: it.duration, hasAudio: it.hasAudio }); };
    d.ondblclick = () => addToTL(it);
    d.ondragstart = e => e.dataTransfer.setData('text/plain', it.id);
    g.appendChild(d);
  });
}

// ---------- Timeline ----------
const LANES = [['#lO1', 'over', 1], ['#lO0', 'over', 0], ['#lV', 'visual'], ['#lA0', 'audio', 0], ['#lA1', 'audio', 1], ['#lT', 'text']];
function clipLabel(c) { return c.type === 'text' ? c.text.replace(/\n/g, ' ') : c.type === 'over' ? (c.name || 'Incrustation') : c.name + (spd(c) !== 1 ? ' · ' + spd(c) + '×' : '') + (c.pair ? ' · 2 vidéos' : ''); }
function clipEl(tr, c, s, e) {
  const d = document.createElement('div'), cw = (e - s) * S.scale, kind = c.type === 'over' ? 'over' : c.type;
  d.className = 'clip ' + kind + (S.sel && S.sel.id === c.id ? ' sel' : ''); d.dataset.id = c.id;
  d.style.left = s * S.scale + 'px'; d.style.width = Math.max(6, cw - 2) + 'px';
  const th = (c.type === 'image' || c.type === 'video') ? thumbOf(c.path) : (c.type === 'over' && c.kind !== 'sticker') ? thumbOf(c.path) : null;
  if (th) d.style.backgroundImage = `linear-gradient(rgba(0,0,0,.25),rgba(0,0,0,.25)),url("${th}")`;
  if (c.type === 'over' && c.kind === 'sticker') { d.style.backgroundImage = `url("${stickerUrl(c.sid, c.color)}")`; d.style.backgroundRepeat = 'no-repeat'; d.style.backgroundPosition = 'left center'; d.style.backgroundSize = 'auto 80%'; }
  const wm = (CFG && CFG.perf.waveforms) || 'audio', wantW = wm !== 'none' && (c.type === 'audio' || (wm === 'all' && ((c.type === 'video' && c.hasAudio && !c.sound) || (c.type === 'over' && c.kind === 'video' && c.hasAudio))));
  const wv = wantW ? wave(c.type === 'over' ? { path: c.path, start: c.start, end: c.start + c.dur } : c, cw) : '';
  d.innerHTML = wv + '<div class="lab"></div><i class="hl"></i><i class="hr"></i>' + (tr === 'visual' && c.trans && c.trans.type !== 'none' && S.visual.indexOf(c) < S.visual.length - 1 ? '<i class="tr" title="Transition"></i>' : '');
  d.querySelector('.lab').textContent = clipLabel(c);
  bindClip(d, tr, c, s, e); return d;
}
function renderTL() {
  const sc = S.scale, ends = ['audio', 'over', 'text'].map(t => Math.max(0, ...layout(t).map(x => x.e))), tot = Math.max(total(), ...ends), w = Math.max($('#scroll').clientWidth, tot * sc + 240);
  $('#content').style.width = w + 'px';
  const step = sc >= 80 ? 1 : sc >= 40 ? 2 : sc >= 20 ? 5 : 10; let r = '';
  for (let t = 0; t * sc < w; t += step) r += `<span style="left:${t * sc}px">${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}</span>`;
  $('#ruler').innerHTML = r;
  LANES.forEach(([sel, tr, lane]) => {
    const el = $(sel); el.innerHTML = ''; el.dataset.tr = tr; if (lane !== undefined) el.dataset.lane = lane;
    layout(tr).forEach(({ c, s, e }) => { if ((tr === 'over' || tr === 'audio') && (c.lane || 0) !== lane) return; el.appendChild(clipEl(tr, c, s, e)); });
  });
  updHead();
}
function select(tr, c) {
  S.sel = { t: tr, id: c.id }; $$('.clip.sel').forEach(x => x.classList.remove('sel'));
  const el = document.querySelector(`.clip[data-id="${c.id}"]`); if (el) el.classList.add('sel'); renderInsp(); showFrame();
}
function trimClip(c, mode, dx, o) {
  const sp = spd(o), R = mode === 'r', cl = (v, a, b) => Math.min(Math.max(v, a), b);
  if (c.type === 'video') {
    if (R) c.end = cl(o.end + dx * sp, o.start + .1, o.src); else c.start = cl(o.start + dx * sp, 0, o.end - .1);
  } else if (c.type === 'image') c.end = Math.max(.5, R ? o.end + dx : o.end - dx);
  else if (c.type === 'audio') {
    if (R) c.end = cl(o.end + dx, o.start + .1, o.src); else { c.start = cl(o.start + dx, 0, o.end - .1); c.at = Math.max(0, o.at + (c.start - o.start)); }
  } else if (c.type === 'over' && c.kind === 'video') {
    if (R) c.dur = cl(o.dur + dx, .2, o.src - o.start); else { const ns = cl(o.start + dx, 0, o.start + o.dur - .2); c.start = ns; c.at = Math.max(0, o.at + (ns - o.start)); c.dur = o.dur - (ns - o.start); }
  } else { // texte, sticker, image incrustée
    if (R) c.dur = Math.max(.2, o.dur + dx); else { const d2 = cl(dx, -o.at, o.dur - .2); c.at = o.at + d2; c.dur = o.dur - d2; }
  }
}
function bindClip(el, tr, c, s, e) {
  el.onmousedown = ev => {
    if (ev.button !== 0) return; ev.stopPropagation(); ev.preventDefault();
    select(tr, c);
    const r = el.getBoundingClientRect(), x = ev.clientX - r.left, mode = x < 7 ? 'l' : x > r.width - 7 ? 'r' : 'm';
    const x0 = ev.clientX, y0 = ev.clientY, o = JSON.parse(JSON.stringify(c)), idx = S[tr].indexOf(c); let moved = false, pend = 0;
    const draw = () => { pend = 0; renderTL(); showFrame(); };
    const mv = e2 => {
      if (!moved) { if (Math.abs(e2.clientX - x0) < 3 && Math.abs(e2.clientY - y0) < 3) return; snap(); moved = true; }
      const dx = (e2.clientX - x0) / S.scale;
      if (mode === 'm') {
        if (tr === 'visual') { el.style.transform = `translateX(${e2.clientX - x0}px)`; el.classList.add('drag'); }
        else { c.at = Math.max(0, +(o.at + dx).toFixed(2)); el.style.left = c.at * S.scale + 'px'; showFrame(); }
      } else { trimClip(c, mode, dx, o); if (!pend) pend = requestAnimationFrame(draw); }
    };
    const up = e2 => {
      removeEventListener('mousemove', mv); if (pend) cancelAnimationFrame(pend);
      if (!moved) { if (!(T >= s && T < e)) T = s; renderAll(); return; }
      if (mode === 'm') {
        if (tr === 'visual') {
          const tp = (e2.clientX - $('#content').getBoundingClientRect().left) / S.scale, others = S.visual.filter(x => x !== c);
          const ni = KS.layoutVisual(others).filter(l => (l.s + l.e) / 2 < tp).length;
          if (ni !== idx) { S.visual = others; S.visual.splice(ni, 0, c); }
        } else if ((tr === 'audio' || tr === 'over') && document.elementsFromPoint) {
          const ln = document.elementsFromPoint(e2.clientX, e2.clientY).find(q => q.classList && q.classList.contains('lane') && q.dataset.tr === tr); if (ln) c.lane = +ln.dataset.lane;
        }
      }
      norm(c); renderAll();
    };
    addEventListener('mousemove', mv); addEventListener('mouseup', up, { once: true });
  };
}

// ---------- Inspecteur ----------
function norm(c) {
  const f = (v, d = 0) => Math.max(0, +v || d);
  if (c.type === 'text') { c.at = f(c.at); c.dur = Math.max(.2, c.dur || .2); return; }
  if (c.type === 'over') { c.at = f(c.at); c.dur = Math.max(.2, c.dur || .2); if (c.kind === 'video') { c.start = Math.min(f(c.start), Math.max(0, c.src - .2)); c.dur = Math.min(c.dur, Math.max(.2, c.src - c.start)); } return; }
  if (c.type === 'image') { c.start = 0; c.end = Math.max(.5, c.end || .5); return; }
  c.start = Math.min(f(c.start), c.end - .1); c.end = Math.max(Math.min(c.end, c.src), c.start + .1); c.fi = f(c.fi); c.fo = f(c.fo);
  if (c.type === 'audio') c.at = f(c.at);
  if (c.pair) c.pair.start = f(c.pair.start);
}
const N = (k, l, st, x = {}) => ({ y: 'n', k, l, st, ...x }), R = (k, l, min, max, st, m = 1, u = '', x = {}) => ({ y: 'r', k, l, min, max, st, m, u, ...x });
const C = (k, l, x = {}) => ({ y: 'c', k, l, ...x }), A = (k, list, cls = '') => ({ y: 'a', k, list, cls });
const SEL = (k, l, opts, x = {}) => ({ y: 's', k, l, opts, ...x }), B = (l, fn, noSnap) => ({ y: 'b', l, fn, noSnap }), INFO = l => ({ y: 'i', l });
const colorSec = [['Couleurs', [R('bright', 'Luminosité', -.5, .5, .05, 100, ''), R('contrast', 'Contraste', .5, 2, .05, 100, ' %'), R('sat', 'Saturation', 0, 2, .05, 100, ' %'), B('Réinitialiser les couleurs', c => Object.assign(c, { bright: 0, contrast: 1, sat: 1 }))]]];
const soundSec = [['Son', [R('vol', 'Volume', 0, 2, .05, 100, ' %'), C('mute', 'Couper le son'), C('denoise', 'Réduire le bruit'), N('fi', 'Fondu entrant (s)', .1), N('fo', 'Fondu sortant (s)', .1)]]];
function sections(c) {
  const t = c.type, hasNext = S.visual.indexOf(c) < S.visual.length - 1;
  const transSec = hasNext ? [['Transition vers le clip suivant', [SEL('trans', 'Effet', TRANS, { get: c => (c.trans && c.trans.type) || 'none', set: (c, v) => { c.trans = { type: v, dur: (c.trans && c.trans.dur) || .6 }; } }),
    N('trans', 'Durée (s)', .1, { get: c => (c.trans && c.trans.dur) || .6, set: (c, v) => { c.trans = { type: (c.trans && c.trans.type) || 'none', dur: Math.min(2, Math.max(.2, v)) }; } })]]] : [];
  const out = [['Actions', [B('Exporter ce clip seul…', c => startExportClip(c), 1)]]];
  if (t === 'text') return [['Texte', [{ y: 't', k: 'text' }]], ['Temps', [N('at', 'Début (s)', .1), N('dur', 'Durée (s)', .5)]],
    ['Style', [R('size', 'Taille', 2, 30, .5, 1, ' %'), { y: 'k', k: 'color', l: 'Couleur' }, { y: 'f' }, C('bold', 'Gras'), C('outline', 'Contour noir'), C('box', 'Fond sombre')]],
    ['Position', [R('x', 'Horizontale', 0, 100, 1, 1, ' %'), R('y', 'Verticale', 0, 100, 1, 1, ' %'), INFO('Tu peux aussi glisser le texte directement dans l\'aperçu.')]], ['Animation', [A('anim', TANIMS)]]];
  if (t === 'over') return [['Position', [R('x', 'Horizontale', 0, 100, 1, 1, ' %'), R('y', 'Verticale', 0, 100, 1, 1, ' %'), INFO('Tu peux aussi glisser l\'élément dans l\'aperçu.')]],
    ['Aspect', [R('w', 'Taille', 5, 100, 1, 1, ' %'), R('rot', 'Rotation', -180, 180, 1, 1, '°'), R('op', 'Opacité', .1, 1, .05, 100, ' %'), ...(c.kind === 'sticker' ? [{ y: 'k', k: 'color', l: 'Couleur' }] : [])]],
    ['Temps', [N('at', 'Début (s)', .1), N('dur', 'Durée (s)', .2), SEL('lane', 'Calque', [[0, 'Calque 1'], [1, 'Calque 2 (au-dessus)']], { get: c => c.lane || 0 })]], ['Animation', [A('anim', OANIMS)]],
    ...(c.kind === 'video' && c.hasAudio ? [['Son', [R('vol', 'Volume', 0, 2, .05, 100, ' %'), C('mute', 'Couper le son')]]] : [])];
  if (t === 'audio') return [['Découpe', [N('start', 'Début dans le fichier (s)', .1), N('end', 'Fin (s)', .1)]], ['Position', [N('at', 'Début sur la timeline (s)', .1), SEL('lane', 'Piste', [[0, 'Audio 1'], [1, 'Audio 2']], { get: c => c.lane || 0 })]], ...soundSec];
  if (t === 'image') return [['Durée', [N('end', 'Durée (s)', .5)]], ['Cadrage', [A('fit', [['contain', 'Contenir'], ['cover', 'Remplir']])]], ['Animation', [A('anim', IANIMS, 'three')]], ...transSec, ...colorSec, ...out];
  const pairSec = c.pair
    ? [['Deux vidéos', [SEL('mode', 'Disposition', [['h', 'Côte à côte'], ['v', 'L\'une au-dessus de l\'autre']], { get: c => c.pair.mode, set: (c, v) => { c.pair.mode = v; } }), INFO('2e vidéo : ' + c.pair.name), N('ps', 'Début de la 2e vidéo (s)', .1, { get: c => c.pair.start || 0, set: (c, v) => { c.pair.start = v; } }),
      R('pv', 'Volume de la 2e vidéo', 0, 2, .05, 100, ' %', { get: c => c.pair.vol ?? 1, set: (c, v) => { c.pair.vol = v; } }), C('pm', 'Couper le son de la 2e vidéo', { get: c => !!c.pair.mute, set: (c, v) => { c.pair.mute = v; } }), B('Retirer la 2e vidéo', c => { delete c.pair; })]]]
    : [['Deux vidéos', [B('Placer une 2e vidéo à côté…', async c => { const p = await pickVideo(); if (p) c.pair = { path: p.path, name: p.name, src: p.duration, start: 0, hasAudio: p.hasAudio, vol: 1, mute: false, mode: 'h' }; })]]];
  const sndSec = c.sound
    ? [['Remplacer le son', [INFO('Nouveau son : ' + c.sound.name), N('ss', 'Début dans le fichier son (s)', .1, { get: c => c.sound.start || 0, set: (c, v) => { c.sound.start = Math.max(0, Math.min(v, c.sound.src - .1)); } }), B('Rétablir le son d\'origine', c => { delete c.sound; })]]]
    : [['Remplacer le son', [B('Remplacer le son…', async c => { const p = await pickAudioFile(); if (p) c.sound = { path: p.path, name: p.name, src: p.duration, start: 0 }; })]]];
  return [['Découpe', [N('start', 'Début (s)', .1), N('end', 'Fin (s)', .1)]], ['Vitesse', [SEL('speed', 'Vitesse de lecture', SPEEDS)]], ...transSec, ...pairSec, ...soundSec, ...sndSec,
    ['Outils', [B('Convertir cette vidéo en MP3…', c => startConvert(clipToAudio(c)), 1), B('Sous-titres automatiques…', () => openSub(), 1), B('Exporter ce clip seul…', c => startExportClip(c), 1)]], ...colorSec];
}
function renderItem(x, i) {
  const l = x.l ? `<span>${x.l}</span>` : '';
  switch (x.y) {
    case 'n': return `<label>${l}<input type="number" data-i="${i}" step="${x.st}"></label>`;
    case 'r': return `<label><span class="lr">${l}<span class="rv"></span></span><input type="range" data-i="${i}" min="${x.min}" max="${x.max}" step="${x.st}"></label>`;
    case 'c': return `<label class="chk"><input type="checkbox" data-i="${i}">${x.l}</label>`;
    case 'k': return `<label>${l}<input type="color" data-i="${i}"></label>`;
    case 't': return `<textarea data-i="${i}" rows="3"></textarea>`;
    case 'f': return `<label><span>Police</span><select data-i="${i}">${FONTS.map((f, j) => `<option value="${j}">${f[1]}</option>`).join('')}</select></label>`;
    case 's': return `<label>${l}<select data-i="${i}">${x.opts.map(o => `<option value="${o[0]}">${o[1]}</option>`).join('')}</select></label>`;
    case 'a': return `<div class="anims ${x.cls}">${x.list.map(a => `<button class="an" data-i="${i}" data-v="${a[0]}">${a[1]}</button>`).join('')}</div>`;
    case 'b': return `<button class="ghostb" data-i="${i}">${x.l}</button>`;
    case 'i': return `<div class="hint2" id="info${i}"></div>`;
  }
  return '';
}
function renderInsp() {
  const c = cur(), b = $('#ibody');
  if (!c) { b.innerHTML = '<div class="blank">Sélectionne un clip dans la timeline pour modifier ses propriétés.<br><br>Ajoute du texte avec « Texte », des stickers avec l\'onglet « Stickers », ou une image / vidéo par-dessus avec « Incruster ».</div>'; return; }
  const secs = sections(c), items = []; secs.forEach(s => s[1].forEach(x => items.push(x)));
  let n = 0;
  b.innerHTML = (c.type === 'text' ? '' : '<div><div class="lbl">Clip</div><div class="cname"></div><div class="dim">Durée ' + tc(len(c)) + '</div></div>') +
    secs.map(([t, it]) => `<div class="sec"><div class="lbl">${t}</div>${it.map(x => renderItem(x, n++)).join('')}</div>`).join('');
  const nm = b.querySelector('.cname'); if (nm) nm.textContent = c.name || '';
  const get = x => x.get ? x.get(c) : c[x.k], set = (x, v) => { x.set ? x.set(c, v) : (c[x.k] = v); };
  b.querySelectorAll('[data-i]').forEach(el => {
    const x = items[+el.dataset.i];
    if (x.y === 'i') return;
    if (x.y === 'b') { el.onclick = async () => { if (!x.noSnap) snap(); await x.fn(c); norm(c); renderAll(); }; return; }
    if (x.y === 'a') { el.classList.toggle('on', get(x) === el.dataset.v || (x.k === 'anim' && LEGACY[get(x)] === el.dataset.v)); el.onclick = () => { snap(); set(x, el.dataset.v); renderAll(); }; return; }
    const val = get(x);
    if (x.y === 'r') {
      const upd = () => { const rv = el.parentElement.querySelector('.rv'); if (rv) rv.textContent = +(get(x) * x.m).toFixed(1) + x.u; };
      el.value = val; upd(); el.onpointerdown = () => snap(); el.oninput = () => { set(x, +el.value); upd(); showFrame(); }; return;
    }
    if (x.y === 'c') { el.checked = !!val; el.onchange = () => { snap(); set(x, el.checked); renderAll(); }; return; }
    if (x.y === 'n') { el.value = (+val || 0).toFixed(1); el.onchange = () => { snap(); set(x, +el.value || 0); norm(c); renderAll(); }; return; }
    if (x.y === 'f') { el.value = Math.max(0, FONTS.findIndex(f => f[0] === c.font)); el.onchange = () => { snap(); c.font = FONTS[+el.value][0]; renderAll(); }; return; }
    if (x.y === 's') { el.value = val; el.onchange = () => { snap(); set(x, typeof val === 'number' ? +el.value : el.value); norm(c); renderAll(); }; return; }
    el.value = val; // texte, couleur
    el.oninput = () => { if (!el._s) { snap(); el._s = 1; } set(x, el.value); if (x.k === 'text') renderTL(); showFrame(); };
  });
  items.forEach((x, i) => { if (x.y === 'i') { const e = $('#info' + i); if (e) e.textContent = x.l; } });
}
async function pickVideo() {
  const ps = await kora.pick(); if (!ps.length) return null;
  const i = await kora.probe(ps[0]); if (i.error || i.type !== 'video') { toast('Choisis un fichier vidéo'); return null; }
  return { path: ps[0], name: ps[0].split(/[\\/]/).pop(), ...i };
}
async function pickAudioFile() {
  const ps = await kora.pick(); if (!ps.length) return null;
  const i = await kora.probe(ps[0]); if (i.error || !i.hasAudio) { toast('Ce fichier ne contient pas de son'); return null; }
  return { path: ps[0], name: ps[0].split(/[\\/]/).pop(), ...i };
}

// ---------- Aperçu ----------
const imgCache = new Map();
function getImg(src) { let i = imgCache.get(src); if (!i) { i = new Image(); i.onload = () => { if (!playing) showFrame(); }; i.src = src; imgCache.set(src, i); } return i; }
const imgReady = src => new Promise((res, rej) => { const i = getImg(src); if (i.complete && i.naturalWidth) res(i); else { i.addEventListener('load', () => res(i)); i.addEventListener('error', rej); } });
const ovVid = new Map();
function ovVideo(c) {
  let v = ovVid.get(c.id);
  if (!v) { v = document.createElement('video'); v.preload = 'auto'; v.src = url(c.path); v.onseeked = () => { if (!playing) showFrame(); }; ovVid.set(c.id, v); }
  return v;
}
const cs = (el, k, v) => { el._c = el._c || {}; if (el._c[k] !== v) { el._c[k] = v; el.style[k] = v; } };
const cm = (el, k, v) => { el._m = el._m || {}; if (el._m[k] !== v) { el._m[k] = v; el[k] = v; } };
const cssFilter = c => (!c.bright && (c.contrast ?? 1) === 1 && (c.sat ?? 1) === 1) ? 'none' : `brightness(${1 + (c.bright || 0)}) contrast(${c.contrast ?? 1}) saturate(${c.sat ?? 1})`;
const fadeVol = (c, t, s, e) => Math.min(1, c.fi > 0 ? (t - s) / c.fi : 1, c.fo > 0 ? (e - t) / c.fo : 1);
function fitPx(ctx, c, FH, FW) { // réduit la police si le texte dépasse la largeur de l'image
  const px0 = c.size / 100 * FH; ctx.font = `${c.bold ? '700' : '400'} ${px0}px ${c.font}`;
  const w = Math.max(...c.text.split('\n').map(l => ctx.measureText(l).width)) + px0 * 1.4;
  return px0 * Math.min(1, FW * .96 / Math.max(1, w));
}
function drawText(ctx, W, H, c, an, FH, FW) {
  ctx.save(); ctx.globalAlpha = an.a;
  const px = fitPx(ctx, c, FH || H, FW || W), lines = c.text.split('\n'), lh = px * 1.25;
  ctx.font = `${c.bold ? '700' : '400'} ${px}px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const x = c.x / 100 * W + an.dx, y = c.y / 100 * H + an.dy - (lines.length - 1) * lh / 2;
  const bw = Math.max(...lines.map(l => ctx.measureText(l).width)) + px * .8, bh = lines.length * lh + px * .3;
  if (c.box) { ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.beginPath(); ctx.roundRect(x - bw / 2, y - lh / 2 - px * .15, bw, bh, px * .25); ctx.fill(); }
  lines.forEach((l, i) => {
    const yy = y + i * lh;
    if (c.outline) { ctx.lineWidth = px * .14; ctx.lineJoin = 'round'; ctx.strokeStyle = '#000'; ctx.strokeText(l, x, yy); }
    ctx.fillStyle = c.color; ctx.fillText(l, x, yy);
  });
  ctx.restore(); return { cx: x, cy: y + (lines.length - 1) * lh / 2, w: bw, h: bh, rot: 0 };
}
function textBox(c, FH, FW) { // taille de l'image qui contient exactement le texte
  const ctx = document.createElement('canvas').getContext('2d'), px = fitPx(ctx, c, FH, FW), lines = c.text.split('\n');
  ctx.font = `${c.bold ? '700' : '400'} ${px}px ${c.font}`;
  const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + px * 1.4, h = lines.length * px * 1.25 + px * .9, ev = n => Math.max(2, Math.ceil(n / 2) * 2);
  return { w: ev(w), h: ev(h) };
}
function itemAnim(c, t, W, H) { // texte et incrustations : mêmes animations que l'export
  let dx = 0, dy = 0, a = 1, s = 1;
  if (c.anim && c.anim !== 'none') {
    const e = Math.min(1, Math.max(0, (t - c.at) / IN)), q = Math.pow(1 - e, 2);
    a = Math.min(e, Math.max(0, Math.min(1, (c.at + c.dur - t) / OUT)));
    if (c.anim === 'slideleft') dx = -.15 * W * q; else if (c.anim === 'slideright') dx = .15 * W * q;
    else if (c.anim === 'slideup') dy = .15 * H * q; else if (c.anim === 'slidedown') dy = -.15 * H * q; else if (c.anim === 'pop') s = .5 + .5 * e;
  }
  return { dx, dy, a, s };
}
function drawOver(ctx, W, H, c, t) {
  let img;
  if (c.kind === 'sticker') img = getImg(stickerUrl(c.sid, c.color)); else if (c.kind === 'image') img = getImg(url(c.path));
  else {
    const v = ovVideo(c), want = (c.start || 0) + (t - c.at);
    if (Math.abs(v.currentTime - want) > (playing ? .35 : .04)) v.currentTime = want;
    cm(v, 'volume', c.mute ? 0 : Math.min(1, c.vol ?? 1)); if (playing) { if (v.paused) v.play().catch(() => {}); } else v.pause();
    img = v.readyState >= 2 ? v : null;
  }
  const iw = img && (img.naturalWidth || img.videoWidth), ih = img && (img.naturalHeight || img.videoHeight);
  if (!iw) return null;
  const an = itemAnim(c, t, W, H), w = c.w / 100 * W * an.s, h = w * ih / iw, cx = c.x / 100 * W + an.dx, cy = c.y / 100 * H + an.dy;
  ctx.save(); ctx.globalAlpha = (c.op ?? 1) * an.a; ctx.translate(cx, cy); ctx.rotate((c.rot || 0) * Math.PI / 180); ctx.drawImage(img, -w / 2, -h / 2, w, h); ctx.restore();
  return { cx, cy, w, h, rot: (c.rot || 0) * Math.PI / 180 };
}
function setBox(el, l, t, w, h, fit) { cs(el, 'left', l + '%'); cs(el, 'top', t + '%'); cs(el, 'width', w + '%'); cs(el, 'height', h + '%'); cs(el, 'objectFit', fit); }
function syncMedia(el, want, vol) {
  if (Math.abs(el.currentTime - want) > (playing ? .35 : .04)) el.currentTime = want;
  cm(el, 'volume', vol); if (playing) { if (el.paused) el.play().catch(() => {}); } else el.pause();
}
function showFrame() {
  const v = at('visual', T), em = $('#empty');
  if (!v) {
    pv.pause(); pv2.pause(); pv.hidden = pv2.hidden = pi.hidden = true; em.hidden = false; cm(pv, 'muted', false);
    em.textContent = S.visual.length ? 'Aucune image à cette position' : 'Importe des médias puis ajoute-les à la timeline';
  } else {
    em.hidden = true; const c = v.c, d = len(c), tl = T - v.s;
    if (c.type === 'image') {
      pv.pause(); pv2.pause(); pv.hidden = pv2.hidden = true; if (pi._p !== c.path) { pi._p = c.path; pi.src = url(c.path); }
      pi.hidden = false; const a = imgAnim(c, tl / d, tl, d);
      cs(pi, 'objectFit', c.fit === 'cover' ? 'cover' : 'contain'); cs(pi, 'transform', a.tr); cs(pi, 'opacity', String(a.op)); cs(pi, 'filter', cssFilter(c));
    } else {
      pi.hidden = true; pv.hidden = false; const want = c.start + tl * spd(c);
      if (pv._p !== c.path) { pv._p = c.path; pv.src = url(c.path); pv.currentTime = want; }
      else if (Math.abs(pv.currentTime - want) > (playing ? .35 : .04)) pv.currentTime = want;
      const vv = c.mute ? 0 : Math.min(1, (c.vol ?? 1) * fadeVol(c, T, v.s, v.e));
      cm(pv, 'playbackRate', spd(c)); cm(pv, 'volume', vv); cs(pv, 'filter', cssFilter(c)); cs(pv, 'transform', 'none'); cs(pv, 'opacity', '1');
      if (playing) { if (pv.paused) pv.play().catch(() => {}); } else pv.pause();
      if (c.pair) {
        const vert = c.pair.mode === 'v'; pv2.hidden = false; setBox(pv, 0, 0, vert ? 100 : 50, vert ? 50 : 100, 'cover'); setBox(pv2, vert ? 0 : 50, vert ? 50 : 0, vert ? 100 : 50, vert ? 50 : 100, 'cover');
        if (pv2._p !== c.pair.path) { pv2._p = c.pair.path; pv2.src = url(c.pair.path); pv2.currentTime = (c.pair.start || 0) + tl; }
        syncMedia(pv2, (c.pair.start || 0) + tl, c.pair.mute ? 0 : Math.min(1, c.pair.vol ?? 1));
      } else { pv2.pause(); pv2.hidden = true; setBox(pv, 0, 0, 100, 100, 'contain'); }
      if (c.sound) {
        cm(pv, 'muted', true); const w2 = (c.sound.start || 0) + tl;
        if (pRep._p !== c.sound.path) { pRep._p = c.sound.path; pRep.src = url(c.sound.path); pRep.currentTime = w2; }
        syncMedia(pRep, w2, vv);
      } else { cm(pv, 'muted', false); pRep.pause(); }
    }
  }
  if (!(v && v.c.type === 'video' && v.c.sound)) pRep.pause();
  [0, 1].forEach(L => {
    const a = atLane('audio', L, T), el = pa[L];
    if (!a) { el.pause(); return; }
    const want = a.c.start + (T - a.s);
    if (el._p !== a.c.path) { el._p = a.c.path; el.src = url(a.c.path); el.currentTime = want; }
    syncMedia(el, want, a.c.mute ? 0 : Math.min(1, (a.c.vol ?? 1) * fadeVol(a.c, T, a.s, a.e)));
  });
  drawOverlay();
}
function drawOverlay() {
  const ctx = cv.getContext('2d'), W = cv.width, H = cv.height, active = c => T >= c.at && T < c.at + c.dur;
  const ov = S.over.filter(active).sort((a, b) => (a.lane || 0) - (b.lane || 0)), tx = S.text.filter(active);
  const ids = new Set(ov.map(c => c.id)); ovVid.forEach((v, id) => { if (!ids.has(id)) v.pause(); });
  const sel = cur(); cv.style.pointerEvents = sel && (sel.type === 'text' || sel.type === 'over') ? 'auto' : 'none'; cv.style.cursor = 'move';
  if (!ov.length && !tx.length && !cv._on) return;
  ctx.clearRect(0, 0, W, H); const boxes = [];
  ov.forEach(c => { const b = drawOver(ctx, W, H, c, T); if (b && c === sel) boxes.push(b); });
  tx.forEach(c => { const b = drawText(ctx, W, H, c, itemAnim(c, T, W, H)); if (c === sel) boxes.push(b); });
  boxes.forEach(b => { ctx.save(); ctx.translate(b.cx, b.cy); ctx.rotate(b.rot); ctx.setLineDash([8, 6]); ctx.lineWidth = 2; ctx.strokeStyle = '#22d3ee'; ctx.strokeRect(-b.w / 2, -b.h / 2, b.w, b.h); ctx.restore(); });
  cv._on = ov.length + tx.length > 0;
}
function imgAnim(c, p, t, d) {
  const an = LEGACY[c.anim] || c.anim || 'none', fd = Math.min(.6, d / 3), q = Math.pow(1 - Math.min(1, t / .6), 2); let op = 1;
  const m = { zoomin: `scale(${1 + .3 * p})`, zoomout: `scale(${1.3 - .3 * p})`, panleft: `scale(1.25) translateX(${-10 + 20 * p}%)`, panright: `scale(1.25) translateX(${10 - 20 * p}%)`,
    panup: `scale(1.25) translateY(${-10 + 20 * p}%)`, pandown: `scale(1.25) translateY(${10 - 20 * p}%)`, kenburns: `scale(${1 + .25 * p}) translate(${-8 * p}%,${-4 * p}%)`,
    pulse: `scale(${1.08 + .06 * Math.sin(p * d * 5)})`, slideleft: `translateX(${-100 * q}%)`, slideright: `translateX(${100 * q}%)`, slideup: `translateY(${100 * q}%)`, slidedown: `translateY(${-100 * q}%)`,
    rotate: `rotate(${360 * p}deg)`, shake: `scale(1.04) translate(${1.2 * Math.sin(t * 25)}%,${1.5 * Math.cos(t * 31)}%)` };
  if (an === 'fadein' || an === 'fadeinout') op = Math.min(op, t / fd); if (an === 'fadeout' || an === 'fadeinout') op = Math.min(op, (d - t) / fd);
  return { tr: m[an] || 'none', op: Math.max(0, Math.min(1, op)) };
}
function fitScreen() {
  const st = $('#stage'), [a, b] = KS.FORMATS[S.fmt], aw = Math.max(200, st.clientWidth - 32), ah = Math.max(120, st.clientHeight - 110);
  let w = aw, h = w * b / a; if (h > ah) { h = ah; w = h * a / b; }
  scr.style.width = Math.round(w) + 'px'; scr.style.height = Math.round(h) + 'px';
}
function setFormat(f, keepDirty) {
  S.fmt = f; const [w, h] = KS.dims(f, 720); cv.width = w; cv.height = h; cv._on = true; $('#fmt').value = f; fitScreen(); showFrame(); if (!keepDirty) setDirty(true);
}
function updHead() {
  const x = T * S.scale; $('#playhead').style.left = x + 'px';
  $('#tc').textContent = tc(T); $('#tt').textContent = '/ ' + tc(total());
  const sc = $('#scroll'); if (playing && (x > sc.scrollLeft + sc.clientWidth - 40 || x < sc.scrollLeft)) sc.scrollLeft = Math.max(0, x - 40);
}
function renderAll() { renderTL(); renderInsp(); showFrame(); }

// Glisser un texte / une incrustation directement dans l'aperçu
cv.onpointerdown = e => {
  const c = cur(); if (!c || (c.type !== 'text' && c.type !== 'over')) return;
  snap(); const mv = ev => { const r = cv.getBoundingClientRect(); c.x = Math.min(100, Math.max(0, +((ev.clientX - r.left) / r.width * 100).toFixed(1))); c.y = Math.min(100, Math.max(0, +((ev.clientY - r.top) / r.height * 100).toFixed(1))); showFrame(); };
  mv(e); const up = () => { removeEventListener('pointermove', mv); renderInsp(); }; addEventListener('pointermove', mv); addEventListener('pointerup', up, { once: true });
};

// ---------- Lecture ----------
function play() { if (!total()) return toast('Ajoute des clips à la timeline'); if (T >= total() - 0.05) T = 0; playing = true; last = performance.now(); $('#bPlay').innerHTML = ico('pause'); raf = requestAnimationFrame(tick); }
function pause() { playing = false; cancelAnimationFrame(raf); [pv, pv2, pRep, ...pa].forEach(e => e.pause()); ovVid.forEach(v => v.pause()); $('#bPlay').innerHTML = ico('play'); }
function tick(ts) {
  if (!playing) return; T += (ts - last) / 1000; last = ts;
  if (T >= total()) { T = total(); pause(); showFrame(); updHead(); return; }
  showFrame(); updHead(); raf = requestAnimationFrame(tick);
}
const toggle = () => playing ? pause() : play();
function seek(e) { const r = $('#content').getBoundingClientRect(); T = Math.min(Math.max(total(), 0), Math.max(0, (e.clientX - r.left) / S.scale)); showFrame(); updHead(); }
function scrub(e) { pause(); seek(e); const up = () => removeEventListener('mousemove', seek); addEventListener('mousemove', seek); addEventListener('mouseup', up, { once: true }); }
$('#ruler').onmousedown = scrub;
LANES.forEach(([s, tr, lane]) => {
  const l = $(s); l.onmousedown = e => { if (e.target === l) scrub(e); }; l.ondragover = e => e.preventDefault();
  l.ondrop = e => { if (e.dataTransfer.files.length || tr === 'text') return; e.preventDefault(); e.stopPropagation(); dropOn(tr, lane, e); };
});
function dropOn(tr, lane, e) {
  const data = e.dataTransfer.getData('text/plain'), t = Math.max(0, (e.clientX - $('#content').getBoundingClientRect().left) / S.scale);
  if (data.startsWith('stk:')) { if (tr !== 'over') return toast('Dépose les stickers sur un calque d\'incrustation'); const sd = stickerDef(data.slice(4)); return addOverlay({ kind: 'sticker', sid: sd.id, name: sd.name }, { at: +t.toFixed(2), lane }); }
  const it = S.lib.find(x => x.id === data); if (!it) return;
  if (tr === 'audio') { if (it.type !== 'audio') return toast('Dépose les audios sur une piste Audio'); return addToTL(it, { at: +t.toFixed(2), lane }); }
  if (tr === 'over') { if (it.type === 'audio') return toast('Les audios vont sur une piste Audio'); return addOverlay({ kind: it.type, path: it.path, name: it.name, src: it.duration, hasAudio: it.hasAudio }, { at: +t.toFixed(2), lane }); }
  if (it.type === 'audio') return toast('Dépose les audios sur une piste Audio');
  addToTL(it, { idx: layout('visual').filter(x => (x.s + x.e) / 2 < t).length });
}

// ---------- Actions ----------
function cutAtHead() {
  let tr = S.sel && S.sel.t !== 'text' ? S.sel.t : 'visual', e = at(tr, T);
  if (!e && tr !== 'visual') { tr = 'visual'; e = at(tr, T); } if (!e) return toast('Place la tête de lecture sur un clip');
  const c = e.c, rel = T - e.s;
  if (rel < .1 || e.e - T < .1) return toast('Place la tête de lecture à l\'intérieur du clip');
  snap(); const a = S[tr], n = { ...c, id: nid() };
  if (c.type === 'video' || c.type === 'audio') { const t = c.start + rel * spd(c); n.start = t; n.fi = 0; c.end = t; c.fo = 0; if (c.type === 'audio') n.at = T; if (c.pair) n.pair = { ...c.pair, start: (c.pair.start || 0) + rel }; }
  else if (c.type === 'image') { n.end = c.end - rel; c.end = c.start + rel; }
  else { n.at = T; n.dur = c.dur - rel; c.dur = rel; if (c.type === 'over' && c.kind === 'video') n.start = (c.start || 0) + rel; }
  if (tr === 'visual') c.trans = null;
  a.splice(a.indexOf(c) + 1, 0, n); S.sel = { t: tr, id: c.id }; renderAll();
}
function del() { const c = cur(); if (!c) return toast('Sélectionne un clip'); snap(); S[S.sel.t] = S[S.sel.t].filter(x => x !== c); S.sel = null; T = Math.min(T, total()); renderAll(); }
function placeClone(tr, c) {
  const n = JSON.parse(JSON.stringify(c)); n.id = nid(); const a = S[tr];
  if (tr === 'visual') a.push(n); else { n.at = +(c.at + len(c)).toFixed(2); if (tr !== 'text') n.lane = freeLane(tr, n.at, len(n), n); a.splice(a.indexOf(c) + 1, 0, n); }
  S.sel = { t: tr, id: n.id }; return n;
}
function dup() { const c = cur(); if (!c) return toast('Sélectionne un clip'); snap(); placeClone(S.sel.t, c); renderAll(); }
function copyClip() { const c = cur(); if (c) { clip = { t: S.sel.t, c: JSON.parse(JSON.stringify(c)) }; toast('Clip copié'); } }
function pasteClip() {
  if (!clip) return; snap(); const n = JSON.parse(JSON.stringify(clip.c)); n.id = nid(); const a = S[clip.t];
  if (clip.t === 'visual') a.push(n); else { n.at = +T.toFixed(2); if (clip.t !== 'text') n.lane = freeLane(clip.t, n.at, len(n)); a.push(n); }
  S.sel = { t: clip.t, id: n.id }; renderAll();
}
function move(d) { const c = cur(); if (!c || S.sel.t !== 'visual') return; const a = S.visual, i = a.indexOf(c), j = i + d; if (j < 0 || j >= a.length) return; snap(); [a[i], a[j]] = [a[j], a[i]]; renderAll(); }

// ---------- Sous-titres automatiques ----------
const wrapTwo = t => { if (t.length <= 34) return t; const w = t.split(' '); let l1 = ''; while (w.length && (l1 + ' ' + w[0]).trim().length <= Math.ceil(t.length / 2) + 4) l1 = (l1 + ' ' + w.shift()).trim(); return w.length ? l1 + '\n' + w.join(' ') : l1; };
function splitText(t, max = 68) { if (t.length <= max) return [t]; const w = t.split(' '), out = []; let cur = ''; w.forEach(x => { if ((cur + ' ' + x).trim().length > max) { out.push(cur); cur = x; } else cur = (cur + ' ' + x).trim(); }); if (cur) out.push(cur); return out; }
function subClips(chunks) {
  const out = [], [w, h] = fmtDims(), y = w < h ? 74 : w === h ? 86 : 88;
  chunks.forEach(ch => {
    const t = String(ch.text).replace(/\s+/g, ' ').trim(); if (!t) return;
    const end = ch.end != null ? ch.end : ch.start + 2, pieces = splitText(t), per = Math.max(.5, (end - ch.start)) / pieces.length;
    pieces.forEach((p, i) => out.push({ id: nid(), type: 'text', sub: true, name: 'Sous-titre', text: wrapTwo(p), at: +(ch.start + i * per).toFixed(2), dur: +Math.max(.5, per).toFixed(2), size: subSize(), x: 50, y, color: '#ffffff', font: FONTS[0][0], bold: true, outline: true, box: true, anim: 'none' }));
  });
  return out;
}
function parseSrt(txt) {
  const tm = s => { const m = /(\d+):(\d+):(\d+)[,.](\d+)/.exec(s); return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] + +m[4] / 1000 : null; }, out = [];
  txt.replace(/\r/g, '').split(/\n\s*\n/).forEach(b => {
    const l = b.split('\n').filter(x => x.trim()); const i = l.findIndex(x => x.includes('-->')); if (i < 0) return;
    const [a, e] = l[i].split('-->'), s = tm(a), en = tm(e); if (s == null || en == null) return;
    out.push({ text: l.slice(i + 1).join(' '), start: s, end: en });
  });
  return out;
}
function addSubs(chunks, label) {
  const cl = subClips(chunks); if (!cl.length) return toast('Aucun sous-titre trouvé');
  snap(); S.text = S.text.filter(c => !c.sub).concat(cl); renderAll(); toast(`${cl.length} sous-titres ajoutés${label ? ' (' + label + ')' : ''}. Tu peux les modifier dans la piste Texte.`);
}
function openSub() { pause(); $('#sSet').hidden = false; $('#sProg').hidden = true; $('#sub').hidden = false; }
$('#bSub').onclick = openSub; $('#sClose').onclick = () => $('#sub').hidden = true;
$('#sClear').onclick = () => { const n = S.text.filter(c => c.sub).length; if (!n) return toast('Aucun sous-titre automatique'); snap(); S.text = S.text.filter(c => !c.sub); renderAll(); toast('Sous-titres supprimés'); };
$('#sSrt').onclick = async () => { const t = await kora.openSrt(); if (t == null) return; $('#sub').hidden = true; addSubs(parseSrt(t), 'fichier .srt'); };
$('#sGo').onclick = async () => {
  if (!S.visual.some(c => c.type === 'video' && (c.hasAudio || c.sound))) return toast('Ajoute une vidéo avec du son sur la timeline');
  $('#sSet').hidden = true; $('#sProg').hidden = false; $('#sbar').style.width = '0'; $('#spt').textContent = 'Préparation…';
  const r = await kora.startSubtitles({ visual: S.visual }, $('#sModel').value, $('#sLang').value);
  $('#sub').hidden = true;
  if (!r.ok) return toast(r.error === 'Annulé' ? 'Sous-titres annulés' : 'Sous-titres impossibles : ' + r.error + (/fetch|network|ENOTFOUND|huggingface/i.test(r.error) ? ' — vérifie ta connexion Internet (téléchargement du modèle).' : ''));
  addSubs(r.chunks);
};
$('#sCancel').onclick = () => kora.cancelSubtitles();
kora.onSubtitleProgress(m => { $('#spt').textContent = m.text; $('#sbar').style.width = (m.v == null ? 100 : Math.round(m.v * 100)) + '%'; });

// ---------- Export et conversion ----------
const fileBase = n => (n || 'audio').replace(/\.[^.]+$/, '');
function clipToAudio(c) {
  if (c.sound) return { type: 'audio', path: c.sound.path, name: c.sound.name, start: c.sound.start || 0, end: (c.sound.start || 0) + len(c), src: c.sound.src, hasAudio: true, vol: c.vol, mute: c.mute, fi: c.fi, fo: c.fo, at: 0 };
  return { type: 'audio', path: c.path, name: c.name, start: c.start, end: c.end, src: c.src, speed: c.speed, hasAudio: c.hasAudio, vol: c.vol, mute: c.mute, fi: c.fi, fo: c.fo, at: 0 };
}
function estimate() {
  const t = S.conv ? len(S.conv) : S.only ? len(S.only) : total();
  if (S.conv || (!S.only && !S.visual.length)) return `Durée ${tc(t)} · taille estimée ≈ ${Math.max(.1, +$('#kbps').value * 1000 * t / 8e6).toFixed(1)} Mo`;
  const [w, h] = KS.dims(S.fmt, +$('#res').value), bpp = { high: .11, standard: .075, light: .05 }[$('#qual').value];
  return `${w}×${h} · durée ${tc(t)} · taille estimée ≈ ${Math.max(.1, ((w * h * 30 * bpp + 192000) * t / 8e6)).toFixed(0)} Mo`;
}
function openExport(mode, a) {
  pause(); S.conv = mode === 'conv' ? a : null; S.only = mode === 'clip' ? a : null;
  const audioOnly = !!S.conv || (!S.only && !S.visual.length);
  $('#mt').textContent = S.conv ? 'Convertir en MP3' : S.only ? 'Exporter ce clip' : 'Exporter';
  $('#sum').textContent = S.conv ? S.conv.name : S.only ? S.only.name : `${S.visual.length} clip(s) · ${S.over.length} incrustation(s) · ${S.audio.length} audio · ${S.text.length} texte(s) · ${S.fmt}`;
  $('#fname').value = S.conv ? fileBase(S.conv.name) : S.only ? fileBase(S.only.name) : (($('#projName').textContent || '').replace(/\.kora$/i, '').replace(/^Projet sans titre$/, '') || 'ma-video');
  $('#vOpts').hidden = audioOnly; $('#qRow').hidden = !audioOnly; $('#norm').parentElement.hidden = S.conv && !S.conv.hasAudio;
  if (CFG) { $('#qual').value = CFG.export.quality; $('#res').value = String(CFG.export.resolution); $('#kbps').value = String(CFG.export.kbps); $('#norm').checked = CFG.export.normalize; }
  $('#est').textContent = estimate(); $('#mSet').hidden = false; $('#mProg').hidden = true; $('#modal').hidden = false;
}
const startConvert = a => { if (!a.hasAudio) return toast('Ce fichier ne contient pas de son'); openExport('conv', a); };
const startExportClip = c => openExport('clip', { ...JSON.parse(JSON.stringify(c)), trans: null });
['qual', 'res', 'kbps'].forEach(id => $('#' + id).onchange = () => $('#est').textContent = estimate());
$('#bExport').onclick = () => { if (!S.visual.length && !S.audio.length) return toast('Ajoute des clips à la timeline'); openExport('project'); };
$('#mCancel').onclick = () => { $('#modal').hidden = true; S.conv = null; S.only = null; };
async function stickerPng(c) { const i = await imgReady(stickerUrl(c.sid, c.color)), k = document.createElement('canvas'); k.width = k.height = 512; k.getContext('2d').drawImage(i, 0, 0, 512, 512); return k.toDataURL('image/png'); }
async function buildPayload(short, quality, normalize) {
  const [W, H] = KS.dims(S.fmt, short), base = { fmt: S.fmt, short, quality, normalize };
  if (S.only) return { ...base, visual: [S.only], audio: [], over: [], text: [] };
  const over = []; for (const c of [...S.over].sort((a, b) => (a.lane || 0) - (b.lane || 0))) { const o = { ...c, kind: c.kind }; if (c.kind === 'sticker') o.png = await stickerPng(c); over.push(o); }
  const text = S.text.filter(c => c.text.trim()).map(c => { const m = textBox(c, H, W), k = document.createElement('canvas'); k.width = m.w; k.height = m.h; drawText(k.getContext('2d'), m.w, m.h, { ...c, x: 50, y: 50 }, { dx: 0, dy: 0, a: 1 }, H, W); return { kind: 'text', at: c.at, dur: c.dur, anim: c.anim, x: c.x, y: c.y, pw: m.w, png: k.toDataURL('image/png') }; });
  return { ...base, visual: S.visual, audio: S.audio, over, text };
}
$('#mGo').onclick = async () => {
  const name = ($('#fname').value || '').replace(/[\\/:*?"<>|]/g, '').replace(/\.(mp4|mp3|m4a|wav)$/i, '').trim() || 'ma-video';
  const conv = S.conv, audioOnly = !!conv || (!S.only && !S.visual.length);
  const out = await kora.save(audioOnly ? 'mp3' : 'mp4', name); if (!out) return;
  $('#bar').style.width = '0'; $('#pt').textContent = 'Export en cours…'; $('#mSet').hidden = true; $('#mProg').hidden = false;
  let r;
  try {
    const kbps = +$('#kbps').value;
    r = await kora.exportProject(conv ? { visual: [], audio: [conv], kbps } : { ...(await buildPayload(+$('#res').value, $('#qual').value, $('#norm').checked)), kbps }, out);
  } catch (e) { r = { ok: false, error: e.message }; }
  S.conv = null; S.only = null; $('#modal').hidden = true; toast(r.ok ? 'Export terminé : ' + out : 'Erreur : ' + r.error);
};
$('#pCancel').onclick = () => kora.cancel();
kora.onProgress(v => { $('#bar').style.width = Math.round(v * 100) + '%'; $('#pt').textContent = 'Export en cours… ' + Math.round(v * 100) + ' %'; });

// ---------- Projets et sauvegarde automatique ----------
const projectJSON = () => JSON.stringify({ v: 3, fmt: S.fmt, lib: S.lib.map(({ thumb, _t, ...r }) => r), visual: S.visual, audio: S.audio, over: S.over, text: S.text });
function migrate(o) {
  let t = 0; (o.audio = o.audio || []).forEach(c => { if (c.at == null) c.at = t; c.lane = c.lane || 0; t = c.at + len(c); });
  (o.text = o.text || []).forEach(c => { if (c.at == null) c.at = c.start || 0; });
  (o.over = o.over || []).forEach(c => { c.type = 'over'; c.lane = c.lane || 0; });
  (o.visual = o.visual || []).forEach(c => { if (c.type === 'image' && c.anim === 'fade') c.anim = 'fadeinout'; });
  return o;
}
function loadProject(o, name) {
  o = migrate(o); pause();
  S.lib = o.lib || []; S.visual = o.visual; S.audio = o.audio; S.over = o.over; S.text = o.text;
  const ids = [...S.lib, ...S.visual, ...S.audio, ...S.over, ...S.text].map(x => +String(x.id).slice(1) || 0); uid = Math.max(uid, ...ids) + 1;
  S.sel = null; S.undo = []; S.redo = []; T = 0; if (name) $('#projName').textContent = name; S.lib.forEach(ensureThumb); setFormat(o.fmt || '16:9', true); renderLib(); renderAll();
}
async function saveProj() { const r = await kora.saveProject(projectJSON()); if (r) { $('#projName').textContent = r.name; setDirty(false); toast('Projet enregistré'); } }
async function openProj() { const r = await kora.openProject(); if (!r) return; try { loadProject(JSON.parse(r.data), r.name); setDirty(false); } catch (e) { toast('Fichier de projet invalide'); } }
function startAutosave() {
  clearInterval(autoTimer); if (CFG && !CFG.project.autosave) return;
  autoTimer = setInterval(() => { if (S.dirty && (S.visual.length || S.audio.length || S.over.length || S.text.length)) kora.autoSave(projectJSON()); }, Math.max(5, (CFG && CFG.project.autosaveSec) || 20) * 1000);
}

// ---------- Commandes ----------
$('#bPlay').onclick = toggle; $('#bBack').onclick = () => { pause(); T = 0; showFrame(); updHead(); }; $('#bFwd').onclick = () => { pause(); T = total(); showFrame(); updHead(); };
$('#bImport').onclick = async () => addFiles(await kora.pick());
$('#bUndo').onclick = undo; $('#bRedo').onclick = redo; $('#bCut').onclick = cutAtHead; $('#bDel').onclick = del; $('#bDup').onclick = dup; $('#bText').onclick = addText;
$('#bLeft').onclick = () => move(-1); $('#bRight').onclick = () => move(1); $('#bSave').onclick = saveProj; $('#bOpen').onclick = openProj;
$('#bHelp').onclick = () => $('#help').hidden = false; $('#hClose').onclick = () => $('#help').hidden = true;
$('#fmt').onchange = e => setFormat(e.target.value);
$('#zoom').oninput = e => { S.scale = +e.target.value; renderTL(); };
$$('#flt button').forEach(b => b.onclick = () => { S.flt = b.dataset.f; $$('#flt button').forEach(x => x.classList.toggle('on', x === b)); renderLib(); });
addEventListener('keydown', e => {
  if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName) && e.target.type !== 'range') return;
  const k = e.key.toLowerCase(), ctl = e.ctrlKey || e.metaKey;
  if (k === ' ') { e.preventDefault(); toggle(); } else if (k === 'delete' || k === 'backspace') del(); else if (k === 'c' && !ctl) cutAtHead(); else if (k === 't' && !ctl) { e.preventDefault(); addText(); }
  else if (ctl && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); } else if (ctl && k === 'y') redo(); else if (ctl && k === 's') { e.preventDefault(); saveProj(); }
  else if (ctl && k === 'c') copyClip(); else if (ctl && k === 'v') pasteClip(); else if (k === '?') $('#help').hidden = false; else if (k === 'escape') $('#help').hidden = true;
  else if (k === 'arrowleft') { pause(); T = Math.max(0, T - 1 / 30); showFrame(); updHead(); } else if (k === 'arrowright') { pause(); T = Math.min(total(), T + 1 / 30); showFrame(); updHead(); }
});
addEventListener('resize', () => { fitScreen(); renderTL(); });
document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop', e => { e.preventDefault(); if (e.dataTransfer.files.length) addFiles([...e.dataTransfer.files].map(f => kora.pathOf(f))); });

// ---------- Réglages, disposition et menu ----------
function applySettings(v, first) {
  CFG = v.settings; PERF = v.perf; const g = CFG.general;
  document.body.classList.toggle('compact', !!g.compact); document.body.classList.toggle('noLib', !g.showLib); document.body.classList.toggle('noInsp', !g.showInsp);
  document.body.classList.toggle('showLib', !!g.showLib); document.body.classList.toggle('showInsp', !!g.showInsp);
  document.documentElement.style.setProperty('--tlh', g.tlHeight > 0 ? g.tlHeight + 'px' : '36vh');
  if (PERF && $('#sModel')) $('#sModel').value = PERF.asrModel;
  startAutosave(); if (!first) { fitScreen(); renderTL(); }
}
const patch = p => kora.patchSettings(p);
function setTlHeight(h) { h = Math.round(Math.min(Math.max(h, 170), innerHeight * .72)); document.documentElement.style.setProperty('--tlh', h + 'px'); return h; }
$('#tlSplit').onmousedown = e => {
  e.preventDefault(); let h = 0; const mv = ev => { h = setTlHeight(innerHeight - ev.clientY); fitScreen(); }, up = () => { removeEventListener('mousemove', mv); if (h) patch({ general: { tlHeight: h } }); };
  addEventListener('mousemove', mv); addEventListener('mouseup', up, { once: true });
};
function newProject() {
  if (S.dirty && !confirm('Des modifications ne sont pas enregistrées. Créer un nouveau projet quand même ?')) return;
  pause(); S.visual = []; S.audio = []; S.over = []; S.text = []; S.sel = null; S.undo = []; S.redo = []; T = 0; kora.newProject(); kora.autoClear();
  $('#projName').textContent = 'Projet sans titre'; setFormat((CFG && CFG.general.defaultFormat) || '16:9', true); setDirty(false); renderAll();
}
function selClip(types) { const c = cur(); if (!c || !types.includes(c.type)) { toast('Sélectionne d\'abord un clip dans la timeline'); return null; } return c; }
async function runCmd(cmd) {
  const g = (CFG && CFG.general) || {}, tl = () => document.getElementById('tl').offsetHeight;
  if (cmd.startsWith('fmt:')) return setFormat(cmd.slice(4));
  switch (cmd) {
    case 'new': return newProject();
    case 'open': return openProj();
    case 'save': return saveProj();
    case 'saveas': { const r = await kora.saveProject(projectJSON(), true); if (r) { $('#projName').textContent = r.name; setDirty(false); toast('Projet enregistré'); } return; }
    case 'import': return addFiles(await kora.pick());
    case 'srt': { const t = await kora.openSrt(); if (t != null) addSubs(parseSrt(t), 'fichier .srt'); return; }
    case 'export': return $('#bExport').click();
    case 'exportClip': { const c = selClip(['video', 'image']); if (c) startExportClip(c); return; }
    case 'mp3': { const c = selClip(['video']); if (c) startConvert(clipToAudio(c)); return; }
    case 'undo': return undo(); case 'redo': return redo(); case 'cut': return cutAtHead(); case 'copy': return copyClip(); case 'paste': return pasteClip(); case 'dup': return dup(); case 'del': return del();
    case 'text': return addText();
    case 'sticker': patch({ general: { showLib: true } }); document.querySelector('#flt [data-f=sticker]').click(); return;
    case 'subs': return openSub();
    case 'overlay': { const ps = await kora.pick(); for (const p of ps) { const i = await kora.probe(p); if (!i.error && i.type !== 'audio') addOverlay({ kind: i.type, path: p, name: p.split(/[\\/]/).pop(), src: i.duration, hasAudio: i.hasAudio }); } return; }
    case 'pair': { const c = selClip(['video']); if (!c) return; const p = await pickVideo(); if (p) { snap(); c.pair = { path: p.path, name: p.name, src: p.duration, start: 0, hasAudio: p.hasAudio, vol: 1, mute: false, mode: 'h' }; renderAll(); } return; }
    case 'toggleLib': return patch({ general: { showLib: !g.showLib } });
    case 'toggleInsp': return patch({ general: { showInsp: !g.showInsp } });
    case 'tlUp': return patch({ general: { tlHeight: setTlHeight(tl() + 60) } });
    case 'tlDown': return patch({ general: { tlHeight: setTlHeight(tl() - 60) } });
    case 'compact': return patch({ general: { compact: !g.compact } });
    case 'zoomIn': return patch({ general: { uiZoom: Math.min(1.5, +((g.uiZoom || 1) + .1).toFixed(2)) } });
    case 'zoomOut': return patch({ general: { uiZoom: Math.max(.7, +((g.uiZoom || 1) - .1).toFixed(2)) } });
    case 'zoomReset': return patch({ general: { uiZoom: 1 } });
    case 'resetLayout': return patch({ general: { tlHeight: 0, showLib: true, showInsp: true, compact: false, uiZoom: 1 } });
    case 'help': $('#help').hidden = false; return;
  }
}
kora.onMenu(runCmd); kora.onSettings(v => applySettings(v));
$('#bSettings').onclick = () => kora.openSettings();

(async () => {
  applySettings(await kora.getSettings(), true);
  setFormat((CFG && CFG.general.defaultFormat) || '16:9', true); renderLib(); renderAll();
  const a = await kora.autoLoad();
  if (a) { try { const o = JSON.parse(a); if ((o.visual || []).length + (o.audio || []).length + (o.over || []).length + (o.text || []).length && confirm('Un projet non enregistré a été retrouvé (sauvegarde automatique). Veux-tu le récupérer ?')) { loadProject(o, 'Projet récupéré'); setDirty(true); } else kora.autoClear(); } catch (e) { kora.autoClear(); } }
})();
