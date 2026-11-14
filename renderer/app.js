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
  open: '<path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"/>'
};
const ico = n => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICO[n]}</svg>`;
$$('i[data-i]').forEach(e => e.innerHTML = ico(e.dataset.i));

const FONTS = [['Arial, Helvetica, sans-serif', 'Sans-serif'], ['Georgia, "Times New Roman", serif', 'Serif'], ['"Courier New", monospace', 'Monospace'], ['Impact, "Arial Black", sans-serif', 'Impact'], ['"Comic Sans MS", cursive', 'Manuscrite']];
const IANIMS = [['none', 'Aucune'], ['zoomin', 'Zoom avant'], ['zoomout', 'Zoom arrière'], ['panleft', 'Pano ←'], ['panright', 'Pano →'], ['panup', 'Pano ↑'], ['pandown', 'Pano ↓'], ['kenburns', 'Ken Burns'], ['pulse', 'Pulsation'], ['fadein', 'Fondu entrant'], ['fadeout', 'Fondu sortant'], ['fadeinout', 'Fondu in/out'], ['slideleft', 'Glisser ←'], ['slideright', 'Glisser →'], ['slideup', 'Glisser ↑'], ['slidedown', 'Glisser ↓'], ['rotate', 'Rotation'], ['shake', 'Tremblement']];
const TANIMS = [['none', 'Aucune'], ['fade', 'Fondu'], ['slideleft', 'Depuis la gauche'], ['slideright', 'Depuis la droite'], ['slideup', 'Depuis le bas'], ['slidedown', 'Depuis le haut']];
const LEGACY = { fade: 'fadeinout', pan: 'panright' };
const DEF = { vol: 1, mute: false, fi: 0, fo: 0, speed: 1, bright: 0, contrast: 1, sat: 1 };

const S = { lib: [], visual: [], audio: [], text: [], sel: null, undo: [], redo: [], scale: 40, flt: 'all' };
let T = 0, playing = false, last = 0, raf = 0, uid = 1;
const pv = $('#pv'), pi = $('#pi'), pa = new Audio(), pr = new Audio(), cv = $('#tcv');
const nid = () => 'c' + uid++;
// Miniatures : une petite image par média, créée une seule fois (au lieu de garder des vidéos/photos en grand)
const thumbQ = []; let thumbBusy = false;
function makeThumb(it) {
  return new Promise((res, rej) => {
    const W = 240, H = 135;
    const draw = (src, w, h) => { const k = document.createElement('canvas'); k.width = W; k.height = H; const x = k.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, W, H); const s = Math.min(W / w, H / h); x.drawImage(src, (W - w * s) / 2, (H - h * s) / 2, w * s, h * s); return k.toDataURL('image/jpeg', .7); };
    if (it.type === 'image') { const im = new Image(); im.onload = () => { try { res(draw(im, im.naturalWidth, im.naturalHeight)); } catch (e) { rej(e); } im.src = ''; }; im.onerror = rej; im.src = url(it.path); }
    else { const v = document.createElement('video'); v.muted = true; v.preload = 'auto'; v.onloadeddata = () => { v.currentTime = Math.min(.5, (it.duration || 1) / 2); }; v.onseeked = () => { try { res(draw(v, v.videoWidth, v.videoHeight)); } catch (e) { rej(e); } v.removeAttribute('src'); v.load(); }; v.onerror = rej; v.src = url(it.path); }
  });
}
function ensureThumb(it) { if (it.thumb || it.type === 'audio' || it._t) return; it._t = 1; thumbQ.push(it); pumpThumbs(); }
async function pumpThumbs() {
  if (thumbBusy) return; thumbBusy = true;
  while (thumbQ.length) { const it = thumbQ.shift(); try { it.thumb = await makeThumb(it); renderLib(); renderTL(); } catch (e) { /* pas de miniature */ } }
  thumbBusy = false;
}
const thumbOf = path => { const l = S.lib.find(x => x.path === path); return l && l.thumb; };
const spd = c => c.speed || 1;
const len = c => c.type === 'text' ? c.dur : (c.end - c.start) / spd(c);
const tc = t => { t = Math.max(0, t || 0); const m = Math.floor(t / 60), s = t - m * 60; return String(m).padStart(2, '0') + ':' + (s < 10 ? '0' : '') + s.toFixed(1); };
const url = p => 'file:///' + encodeURI(p.replace(/\\/g, '/').replace(/^\//, '')).replace(/#/g, '%23').replace(/\?/g, '%3F');
function toast(m) { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => t.hidden = true, 3500); }

const layout = tr => {
  if (tr === 'text') return S.text.map(c => ({ c, s: c.start, e: c.start + c.dur }));
  let t = 0; return S[tr].map(c => { const s = t; t += len(c); return { c, s, e: t }; });
};
const total = () => Math.max(0, ...['visual', 'audio'].map(tr => { const l = layout(tr); return l.length ? l[l.length - 1].e : 0; }));
const at = (tr, t) => layout(tr).find(x => t >= x.s && t < x.e) || null;
const cur = () => S.sel ? S[S.sel.t].find(c => c.id === S.sel.id) || null : null;

const cap = () => JSON.stringify({ v: S.visual, a: S.audio, t: S.text });
function snap() { S.undo.push(cap()); if (S.undo.length > 80) S.undo.shift(); S.redo = []; }
function restore(s) { const o = JSON.parse(s); S.visual = o.v; S.audio = o.a; S.text = o.t || []; if (!cur()) S.sel = null; T = Math.min(T, total()); renderAll(); }
function undo() { if (!S.undo.length) return toast('Rien à annuler'); S.redo.push(cap()); restore(S.undo.pop()); }
function redo() { if (!S.redo.length) return toast('Rien à rétablir'); S.undo.push(cap()); restore(S.redo.pop()); }

async function addFiles(paths) {
  for (const p of paths) {
    const i = await kora.probe(p);
    if (i.error) { toast(i.error + ' : ' + p.split(/[\\/]/).pop()); continue; }
    const it = { id: nid(), path: p, name: p.split(/[\\/]/).pop(), ...i }; S.lib.push(it); ensureThumb(it);
  }
  renderLib();
}
function addToTL(it, idx) {
  snap();
  const tr = it.type === 'audio' ? 'audio' : 'visual';
  const c = { id: nid(), path: it.path, name: it.name, type: it.type, hasAudio: it.hasAudio, src: it.duration, start: 0, end: it.type === 'image' ? 5 : it.duration, anim: 'none', fit: 'contain', ...DEF };
  idx == null ? S[tr].push(c) : S[tr].splice(idx, 0, c);
  S.sel = { t: tr, id: c.id }; T = layout(tr).find(x => x.c === c).s; renderAll();
}
function addText() {
  snap();
  const c = { id: nid(), type: 'text', name: 'Texte', text: 'Votre texte', start: +T.toFixed(1), dur: 3, size: 8, x: 50, y: 85, color: '#ffffff', font: FONTS[0][0], bold: true, outline: true, box: false, anim: 'fade' };
  S.text.push(c); S.sel = { t: 'text', id: c.id }; renderAll();
}

function renderLib() {
  const g = $('#grid'); g.innerHTML = '';
  const items = S.lib.filter(i => S.flt === 'all' || i.type === S.flt);
  if (!items.length) { g.innerHTML = '<div class="hint">Glisse tes fichiers ici<br>ou clique sur « Importer »</div>'; return; }
  items.forEach(it => {
    const d = document.createElement('div'); d.className = 'card'; d.draggable = true;
    const th = it.type === 'audio' ? `<div class="aico">${ico('music')}</div>` : it.thumb ? `<img src="${it.thumb}" alt="">` : `<div class="aico">${ico(it.type === 'image' ? 'image' : 'film')}</div>`;
    d.innerHTML = `<div class="thumb">${th}</div><span class="badge">${ico({ video: 'film', image: 'image', audio: 'music' }[it.type])}</span><button class="add" aria-label="Ajouter à la timeline">+</button><div class="cap"><span class="nm"></span><span class="dim">${it.type === 'image' ? 'Image' : tc(it.duration)}</span></div>`;
    d.querySelector('.nm').textContent = it.name;
    d.querySelector('.add').onclick = () => addToTL(it);
    d.ondblclick = () => addToTL(it);
    d.ondragstart = e => e.dataTransfer.setData('text/plain', it.id);
    g.appendChild(d);
  });
}
const waveCache = new Map();
function wave(id, w) {
  const key = id + ':' + Math.round(w / 4); if (waveCache.has(key)) return waveCache.get(key); if (waveCache.size > 300) waveCache.clear();
  let h = 7; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const n = Math.max(6, Math.min(400, Math.floor(w / 4))); let r = '';
  for (let i = 0; i < n; i++) { h = (h * 1664525 + 1013904223) >>> 0; const a = .2 + .8 * ((h >>> 8) % 100) / 100; r += `<rect x="${i * 4}" y="${16 - a * 14}" width="2" height="${a * 28}" rx="1"/>`; }
  const svg = `<svg class="w" viewBox="0 0 ${n * 4} 32" preserveAspectRatio="none" fill="rgba(255,255,255,.6)">${r}</svg>`; waveCache.set(key, svg); return svg;
}
function renderTL() {
  const sc = S.scale, ends = layout('text').map(x => x.e), tot = Math.max(total(), ...ends, 0), w = Math.max($('#scroll').clientWidth, tot * sc + 240);
  $('#content').style.width = w + 'px';
  const step = sc >= 80 ? 1 : sc >= 40 ? 2 : sc >= 20 ? 5 : 10; let r = '';
  for (let t = 0; t * sc < w; t += step) r += `<span style="left:${t * sc}px">${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}</span>`;
  $('#ruler').innerHTML = r;
  [['visual', '#lV'], ['audio', '#lA'], ['text', '#lT']].forEach(([tr, sel]) => {
    const lane = $(sel); lane.innerHTML = '';
    layout(tr).forEach(({ c, s, e }) => {
      const d = document.createElement('div'), cw = (e - s) * sc;
      d.className = 'clip ' + c.type + (S.sel && S.sel.id === c.id ? ' sel' : '');
      d.style.left = s * sc + 'px'; d.style.width = Math.max(4, cw - 2) + 'px';
      const th = c.type === 'image' && thumbOf(c.path); if (th) d.style.backgroundImage = `linear-gradient(rgba(0,0,0,.25),rgba(0,0,0,.25)),url("${th}")`;
      d.innerHTML = (c.type === 'audio' ? wave(c.id, cw) : '') + '<div class="lab"></div>';
      d.querySelector('.lab').textContent = c.type === 'text' ? c.text.replace(/\n/g, ' ') : c.name + (spd(c) !== 1 ? ' · ' + spd(c) + '×' : '');
      d.onmousedown = e => {
        e.stopPropagation();
        if (tr !== 'text') return;
        S.sel = { t: 'text', id: c.id }; $$('.clip.sel').forEach(x => x.classList.remove('sel')); d.classList.add('sel'); renderInsp(); showFrame();
        const x0 = e.clientX, s0 = c.start; let moved = false;
        const mv = ev => { const ns = Math.max(0, +(s0 + (ev.clientX - x0) / S.scale).toFixed(1)); if (ns !== c.start) { if (!moved) { snap(); moved = true; } c.start = ns; d.style.left = ns * S.scale + 'px'; showFrame(); } };
        const up = () => { removeEventListener('mousemove', mv); if (moved) renderAll(); };
        addEventListener('mousemove', mv); addEventListener('mouseup', up, { once: true });
      };
      d.onclick = () => { if (tr === 'text') return; S.sel = { t: tr, id: c.id }; if (!(T >= s && T < e)) T = s; renderAll(); };
      lane.appendChild(d);
    });
  });
  updHead();
}

// ---------- Inspecteur ----------
const N = (k, l, st) => ({ y: 'n', k, l, st }), R = (k, l, min, max, st, m = 1, u = '') => ({ y: 'r', k, l, min, max, st, m, u });
const C = (k, l) => ({ y: 'c', k, l }), A = (k, list, cls = '') => ({ y: 'a', k, list, cls });
const SEL = (k, l, opts) => ({ y: 's', k, l, opts });
const COLOR = [['Couleurs', [R('bright', 'Luminosité', -.5, .5, .05, 100, ''), R('contrast', 'Contraste', .5, 2, .05, 100, ' %'), R('sat', 'Saturation', 0, 2, .05, 100, ' %'), { y: 'b', l: 'Réinitialiser les couleurs' }]]];
const AUDIO = [['Son', [R('vol', 'Volume', 0, 2, .05, 100, ' %'), C('mute', 'Couper le son'), N('fi', 'Fondu entrant (s)', .1), N('fo', 'Fondu sortant (s)', .1)]]];
const SPEEDS = [[.5, '0,5×'], [.75, '0,75×'], [1, 'Normale'], [1.25, '1,25×'], [1.5, '1,5×'], [2, '2×']];
const SPEC = {
  text: [['Texte', [{ y: 't', k: 'text' }]], ['Temps', [N('start', 'Début (s)', .1), N('dur', 'Durée (s)', .5)]],
    ['Style', [R('size', 'Taille', 2, 30, .5, 1, ' %'), { y: 'k', k: 'color', l: 'Couleur' }, { y: 'f' }, C('bold', 'Gras'), C('outline', 'Contour noir'), C('box', 'Fond sombre')]],
    ['Position', [R('x', 'Horizontale', 0, 100, 1, 1, ' %'), R('y', 'Verticale', 0, 100, 1, 1, ' %'), { y: 'i', l: 'Astuce : tu peux aussi glisser le texte directement dans l\'aperçu.' }]],
    ['Animation', [A('anim', TANIMS)]]],
  video: [['Découpe', [N('start', 'Début (s)', .1), N('end', 'Fin (s)', .1)]], ['Vitesse', [SEL('speed', 'Vitesse de lecture', SPEEDS)]], ...AUDIO, ['Remplacer le son', [{ y: 'snd' }]], ...COLOR],
  audio: [['Découpe', [N('start', 'Début (s)', .1), N('end', 'Fin (s)', .1)]], ...AUDIO],
  image: [['Durée', [N('end', 'Durée (s)', .5)]], ['Cadrage', [A('fit', [['contain', 'Contenir'], ['cover', 'Remplir']])]], ['Animation', [A('anim', IANIMS, 'three')]], ...COLOR]
};
function norm(c) {
  if (c.type === 'text') { c.start = Math.max(0, c.start || 0); c.dur = Math.max(.5, c.dur || .5); return; }
  if (c.type === 'image') { c.start = 0; c.end = Math.max(.5, c.end || .5); return; }
  c.start = Math.min(Math.max(0, c.start || 0), c.end - .1); c.end = Math.max(Math.min(c.end, c.src), c.start + .1);
  c.fi = Math.max(0, c.fi || 0); c.fo = Math.max(0, c.fo || 0);
}
function item(x) {
  const l = x.l ? `<span>${x.l}</span>` : '';
  switch (x.y) {
    case 'n': return `<label>${l}<input type="number" data-k="${x.k}" min="0" step="${x.st}"></label>`;
    case 'r': return `<label><span class="lr">${l}<span class="rv"></span></span><input type="range" data-k="${x.k}" min="${x.min}" max="${x.max}" step="${x.st}"></label>`;
    case 'c': return `<label class="chk"><input type="checkbox" data-k="${x.k}">${x.l}</label>`;
    case 'k': return `<label>${l}<input type="color" data-k="${x.k}"></label>`;
    case 't': return `<textarea data-k="${x.k}" rows="3"></textarea>`;
    case 'f': return `<label><span>Police</span><select data-k="font">${FONTS.map((f, i) => `<option value="${i}">${f[1]}</option>`).join('')}</select></label>`;
    case 's': return `<label>${l}<select data-k="${x.k}">${x.opts.map(o => `<option value="${o[0]}">${o[1]}</option>`).join('')}</select></label>`;
    case 'a': return `<div class="anims ${x.cls}">${x.list.map(a => `<button class="an" data-k="${x.k}" data-v="${a[0]}">${a[1]}</button>`).join('')}</div>`;
    case 'b': return `<button class="ghostb" data-act="resetcol">${x.l}</button>`;
    case 'snd': return '<div id="sndBox" class="sec"></div>';
    case 'i': return `<div class="hint2">${x.l}</div>`;
  }
  return '';
}
function renderInsp() {
  const c = cur(), b = $('#ibody');
  if (!c) { b.innerHTML = '<div class="blank">Sélectionne un clip dans la timeline pour modifier ses propriétés.<br><br>Pour ajouter du texte, clique sur « Texte » (ou touche T).</div>'; return; }
  const kind = c.type;
  b.innerHTML = (kind === 'text' ? '' : '<div><div class="lbl">Clip</div><div class="cname"></div><div class="dim">Durée ' + tc(len(c)) + '</div></div>') +
    SPEC[kind].map(([t, items]) => `<div class="sec"><div class="lbl">${t}</div>${items.map(item).join('')}</div>`).join('');
  const nm = b.querySelector('.cname'); if (nm) nm.textContent = c.name;
  b.querySelectorAll('[data-k]').forEach(el => {
    const k = el.dataset.k, isNum = typeof c[k] === 'number';
    const x = [...SPEC[kind].flatMap(s => s[1])].find(i => i.k === k && i.y === 'r');
    const upd = () => { const rv = el.parentElement.querySelector('.rv'); if (rv && x) rv.textContent = +(c[k] * x.m).toFixed(1) + x.u; };
    if (el.tagName === 'BUTTON') { el.classList.toggle('on', c[k] === el.dataset.v || (k === 'anim' && LEGACY[c[k]] === el.dataset.v)); el.onclick = () => { snap(); c[k] = el.dataset.v; renderAll(); }; return; }
    if (el.type === 'range') { el.value = c[k]; upd(); el.onpointerdown = () => snap(); el.oninput = () => { c[k] = +el.value; upd(); showFrame(); }; return; }
    if (el.type === 'checkbox') { el.checked = !!c[k]; el.onchange = () => { snap(); c[k] = el.checked; renderAll(); }; return; }
    if (el.type === 'number') { el.value = (+c[k] || 0).toFixed(1); el.onchange = () => { snap(); c[k] = +el.value || 0; norm(c); renderAll(); }; return; }
    if (k === 'font') { el.value = Math.max(0, FONTS.findIndex(f => f[0] === c.font)); el.onchange = () => { snap(); c.font = FONTS[+el.value][0]; renderAll(); }; return; }
    if (el.tagName === 'SELECT') { el.value = c[k]; el.onchange = () => { snap(); c[k] = isNum ? +el.value : el.value; renderAll(); }; return; }
    el.value = c[k]; // texte, couleur
    el.oninput = () => { if (!el._s) { snap(); el._s = 1; } c[k] = el.value; if (k === 'text') renderTL(); showFrame(); };
  });
  const box = b.querySelector('#sndBox');
  if (box) {
    box.innerHTML = c.sound
      ? '<div class="dim">Nouveau son : <b class="sn"></b></div><label><span>Début dans le fichier son (s)</span><input type="number" id="sS" min="0" step="0.1"></label><button class="ghostb" id="sRm">Rétablir le son d\'origine</button>'
      : '<button class="ghostb" id="sAdd">Remplacer le son…</button><div class="hint2">Remplace le son de cette vidéo par un fichier audio de ton choix.</div>';
    if (c.sound) {
      box.querySelector('.sn').textContent = c.sound.name; $('#sS').value = (c.sound.start || 0).toFixed(1);
      $('#sS').onchange = e => { snap(); c.sound.start = Math.max(0, Math.min(+e.target.value || 0, c.sound.src - .1)); renderAll(); };
      $('#sRm').onclick = () => { snap(); delete c.sound; renderAll(); };
    } else $('#sAdd').onclick = async () => {
      const ps = await kora.pick(); if (!ps.length) return;
      const i = await kora.probe(ps[0]); if (i.error || !i.hasAudio) return toast('Ce fichier ne contient pas de son');
      snap(); c.sound = { path: ps[0], name: ps[0].split(/[\\/]/).pop(), src: i.duration, start: 0 }; renderAll();
    };
  }
  const rb = b.querySelector('[data-act=resetcol]'); if (rb) rb.onclick = () => { snap(); Object.assign(c, { bright: 0, contrast: 1, sat: 1 }); renderAll(); };
}

// ---------- Aperçu ----------
function drawText(ctx, W, H, c, an) {
  ctx.save(); ctx.globalAlpha = an.a;
  const px = c.size / 100 * H, lines = c.text.split('\n'), lh = px * 1.25;
  ctx.font = `${c.bold ? '700' : '400'} ${px}px ${c.font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const x = c.x / 100 * W + an.dx, y = c.y / 100 * H + an.dy - (lines.length - 1) * lh / 2;
  if (c.box) {
    const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + px * .8, h = lines.length * lh + px * .3;
    ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.beginPath(); ctx.roundRect(x - w / 2, y - lh / 2 - px * .15, w, h, px * .25); ctx.fill();
  }
  lines.forEach((l, i) => {
    const yy = y + i * lh;
    if (c.outline) { ctx.lineWidth = px * .14; ctx.lineJoin = 'round'; ctx.strokeStyle = '#000'; ctx.strokeText(l, x, yy); }
    ctx.fillStyle = c.color; ctx.fillText(l, x, yy);
  });
  ctx.restore();
}
function textAnim(c, t, W, H) {
  let dx = 0, dy = 0, a = 1;
  if (c.anim && c.anim !== 'none') {
    const p = Math.min(1, Math.max(0, (t - c.start) / .5)), q = Math.pow(1 - p, 2);
    a = Math.min(p, Math.max(0, Math.min(1, (c.start + c.dur - t) / .3)));
    if (c.anim === 'slideleft') dx = -.15 * W * q; else if (c.anim === 'slideright') dx = .15 * W * q;
    else if (c.anim === 'slideup') dy = .15 * H * q; else if (c.anim === 'slidedown') dy = -.15 * H * q;
  }
  return { dx, dy, a };
}
function imgAnim(c, p, t, d) {
  const an = LEGACY[c.anim] || c.anim || 'none', fd = Math.min(.6, d / 3), q = Math.pow(1 - Math.min(1, t / .6), 2); let tr = '', op = 1;
  const m = { zoomin: `scale(${1 + .3 * p})`, zoomout: `scale(${1.3 - .3 * p})`, panleft: `scale(1.25) translateX(${-10 + 20 * p}%)`, panright: `scale(1.25) translateX(${10 - 20 * p}%)`,
    panup: `scale(1.25) translateY(${-10 + 20 * p}%)`, pandown: `scale(1.25) translateY(${10 - 20 * p}%)`, kenburns: `scale(${1 + .25 * p}) translate(${-8 * p}%,${-4 * p}%)`,
    pulse: `scale(${1.08 + .06 * Math.sin(p * d * 5)})`, slideleft: `translateX(${-100 * q}%)`, slideright: `translateX(${100 * q}%)`, slideup: `translateY(${100 * q}%)`, slidedown: `translateY(${-100 * q}%)`,
    rotate: `rotate(${360 * p}deg)`, shake: `scale(1.04) translate(${1.2 * Math.sin(t * 25)}%,${1.5 * Math.cos(t * 31)}%)` };
  tr = m[an] || 'none';
  if (an === 'fadein' || an === 'fadeinout') op = Math.min(op, t / fd);
  if (an === 'fadeout' || an === 'fadeinout') op = Math.min(op, (d - t) / fd);
  return { tr, op: Math.max(0, Math.min(1, op)) };
}
const cssFilter = c => (!c.bright && (c.contrast ?? 1) === 1 && (c.sat ?? 1) === 1) ? 'none' : `brightness(${1 + (c.bright || 0)}) contrast(${c.contrast ?? 1}) saturate(${c.sat ?? 1})`;
const cs = (el, k, v) => { el._c = el._c || {}; if (el._c[k] !== v) { el._c[k] = v; el.style[k] = v; } };
const cm = (el, k, v) => { el._m = el._m || {}; if (el._m[k] !== v) { el._m[k] = v; el[k] = v; } };
const fadeVol = (c, t, s, e) => Math.min(1, c.fi > 0 ? (t - s) / c.fi : 1, c.fo > 0 ? (e - t) / c.fo : 1);

function showFrame() {
  const v = at('visual', T), em = $('#empty');
  if (!v) {
    pv.pause(); pv.hidden = pi.hidden = true; em.hidden = false;
    em.textContent = S.visual.length ? 'Aucune image à cette position' : 'Importe des médias puis ajoute-les à la timeline';
  } else {
    em.hidden = true; const c = v.c, d = len(c), tl = T - v.s;
    if (c.type === 'image') {
      pv.pause(); pv.hidden = true; if (pi._p !== c.path) { pi._p = c.path; pi.src = url(c.path); }
      pi.hidden = false; const a = imgAnim(c, tl / d, tl, d);
      cs(pi, 'objectFit', c.fit === 'cover' ? 'cover' : 'contain'); cs(pi, 'transform', a.tr); cs(pi, 'opacity', String(a.op)); cs(pi, 'filter', cssFilter(c));
    } else {
      pi.hidden = true; pv.hidden = false; const want = c.start + tl * spd(c);
      if (pv._p !== c.path) { pv._p = c.path; pv.src = url(c.path); pv.currentTime = want; }
      else if (Math.abs(pv.currentTime - want) > (playing ? .35 : .04)) pv.currentTime = want;
      const vv = c.mute ? 0 : Math.min(1, (c.vol ?? 1) * fadeVol(c, T, v.s, v.e)); cm(pv, 'playbackRate', spd(c)); cm(pv, 'volume', vv); cs(pv, 'filter', cssFilter(c));
      if (playing) { if (pv.paused) pv.play().catch(() => {}); } else pv.pause();
      if (c.sound) {
        cm(pv, 'muted', true); const w2 = (c.sound.start || 0) + tl;
        if (pr._p !== c.sound.path) { pr._p = c.sound.path; pr.src = url(c.sound.path); pr.currentTime = w2; }
        else if (Math.abs(pr.currentTime - w2) > (playing ? .35 : .04)) pr.currentTime = w2;
        cm(pr, 'volume', vv); if (playing) { if (pr.paused) pr.play().catch(() => {}); } else pr.pause();
      } else cm(pv, 'muted', false);
    }
  }
  if (!(v && v.c.type === 'video' && v.c.sound)) { pr.pause(); cm(pv, 'muted', false); }
  const a = at('audio', T);
  if (!a) pa.pause(); else {
    const want = a.c.start + (T - a.s);
    if (pa._p !== a.c.path) { pa._p = a.c.path; pa.src = url(a.c.path); pa.currentTime = want; }
    else if (Math.abs(pa.currentTime - want) > (playing ? .35 : .04)) pa.currentTime = want;
    cm(pa, 'volume', a.c.mute ? 0 : Math.min(1, (a.c.vol ?? 1) * fadeVol(a.c, T, a.s, a.e)));
    if (playing) { if (pa.paused) pa.play().catch(() => {}); } else pa.pause();
  }
  const act = S.text.filter(c => T >= c.start && T < c.start + c.dur);
  if (act.length || cv._on) { const ctx = cv.getContext('2d'); ctx.clearRect(0, 0, cv.width, cv.height); act.forEach(c => drawText(ctx, cv.width, cv.height, c, textAnim(c, T, cv.width, cv.height))); cv._on = act.length > 0; }
  const sc = cur(); cv.style.pointerEvents = sc && sc.type === 'text' ? 'auto' : 'none'; cv.style.cursor = 'move';
}
function updHead() {
  const x = T * S.scale; $('#playhead').style.left = x + 'px';
  $('#tc').textContent = tc(T); $('#tt').textContent = '/ ' + tc(total());
  const sc = $('#scroll'); if (playing && (x > sc.scrollLeft + sc.clientWidth - 40 || x < sc.scrollLeft)) sc.scrollLeft = Math.max(0, x - 40);
}
function renderAll() { renderTL(); renderInsp(); showFrame(); }

// Glisser le texte sélectionné directement dans l'aperçu
cv.onpointerdown = e => {
  const c = cur(); if (!c || c.type !== 'text') return;
  snap(); const mv = ev => { const r = cv.getBoundingClientRect(); c.x = Math.min(100, Math.max(0, +((ev.clientX - r.left) / r.width * 100).toFixed(1))); c.y = Math.min(100, Math.max(0, +((ev.clientY - r.top) / r.height * 100).toFixed(1))); showFrame(); };
  mv(e); const up = () => { removeEventListener('pointermove', mv); renderInsp(); }; addEventListener('pointermove', mv); addEventListener('pointerup', up, { once: true });
};

function play() { if (!total()) return toast('Ajoute des clips à la timeline'); if (T >= total() - 0.05) T = 0; playing = true; last = performance.now(); $('#bPlay').innerHTML = ico('pause'); raf = requestAnimationFrame(tick); }
function pause() { playing = false; cancelAnimationFrame(raf); pv.pause(); pa.pause(); pr.pause(); $('#bPlay').innerHTML = ico('play'); }
function tick(ts) {
  if (!playing) return; T += (ts - last) / 1000; last = ts;
  if (T >= total()) { T = total(); pause(); showFrame(); updHead(); return; }
  showFrame(); updHead(); raf = requestAnimationFrame(tick);
}
const toggle = () => playing ? pause() : play();

function seek(e) { const r = $('#content').getBoundingClientRect(); T = Math.min(total(), Math.max(0, (e.clientX - r.left) / S.scale)); showFrame(); updHead(); }
function scrub(e) { pause(); seek(e); const up = () => removeEventListener('mousemove', seek); addEventListener('mousemove', seek); addEventListener('mouseup', up, { once: true }); }
$('#ruler').onmousedown = scrub;
[['#lV', 'visual'], ['#lA', 'audio'], ['#lT', 'text']].forEach(([s, tr]) => {
  const l = $(s); l.onmousedown = e => { if (e.target === l) scrub(e); }; l.ondragover = e => e.preventDefault();
  l.ondrop = e => { if (e.dataTransfer.files.length || tr === 'text') return; e.preventDefault(); e.stopPropagation(); dropOn(tr, e); };
});
function dropOn(tr, e) {
  const it = S.lib.find(x => x.id === e.dataTransfer.getData('text/plain')); if (!it) return;
  if ((it.type === 'audio' ? 'audio' : 'visual') !== tr) return toast(tr === 'audio' ? 'Dépose les audios sur la piste Audio' : 'Dépose les vidéos et images sur la piste Vidéo');
  const t = (e.clientX - $('#content').getBoundingClientRect().left) / S.scale;
  addToTL(it, layout(tr).filter(x => (x.s + x.e) / 2 < t).length);
}

function cutAtHead() {
  const tr = S.sel && S.sel.t !== 'text' ? S.sel.t : 'visual', e = at(tr, T); if (!e) return toast('Place la tête de lecture sur un clip');
  const c = e.c, t = c.start + (T - e.s) * spd(c);
  if (t < c.start + .1 || t > c.end - .1) return toast('Place la tête de lecture à l\'intérieur du clip');
  snap(); const a = S[tr]; a.splice(a.indexOf(c) + 1, 0, { ...c, id: nid(), start: t, fi: 0 }); c.end = t; c.fo = 0; S.sel = { t: tr, id: c.id }; renderAll();
}
function del() { const c = cur(); if (!c) return toast('Sélectionne un clip'); snap(); S[S.sel.t] = S[S.sel.t].filter(x => x !== c); S.sel = null; T = Math.min(T, total()); renderAll(); }
function dup() { const c = cur(); if (!c) return toast('Sélectionne un clip'); snap(); const a = S[S.sel.t], n = { ...c, id: nid() }; if (c.type === 'text') n.start = +(c.start + c.dur).toFixed(1); a.splice(a.indexOf(c) + 1, 0, n); renderAll(); }
function move(d) { const c = cur(); if (!c || c.type === 'text') return; const a = S[S.sel.t], i = a.indexOf(c), j = i + d; if (j < 0 || j >= a.length) return; snap(); [a[i], a[j]] = [a[j], a[i]]; renderAll(); }

// Projets
async function saveProj() {
  const r = await kora.saveProject(JSON.stringify({ v: 2, lib: S.lib.map(({ thumb, _t, ...r }) => r), visual: S.visual, audio: S.audio, text: S.text }));
  if (r) { $('.proj').textContent = r.name; toast('Projet enregistré'); }
}
async function openProj() {
  const r = await kora.openProject(); if (!r) return;
  try {
    const o = JSON.parse(r.data); pause();
    S.lib = o.lib || []; S.visual = o.visual || []; S.audio = o.audio || []; S.text = o.text || [];
    const ids = [...S.lib, ...S.visual, ...S.audio, ...S.text].map(x => +String(x.id).slice(1) || 0); uid = Math.max(uid, ...ids) + 1;
    S.sel = null; S.undo = []; S.redo = []; T = 0; $('.proj').textContent = r.name; S.lib.forEach(ensureThumb); renderLib(); renderAll();
  } catch (e) { toast('Fichier de projet invalide'); }
}

$('#bPlay').onclick = toggle; $('#bBack').onclick = () => { pause(); T = 0; showFrame(); updHead(); }; $('#bFwd').onclick = () => { pause(); T = total(); showFrame(); updHead(); };
$('#bImport').onclick = async () => addFiles(await kora.pick());
$('#bUndo').onclick = undo; $('#bRedo').onclick = redo; $('#bCut').onclick = cutAtHead; $('#bDel').onclick = del; $('#bDup').onclick = dup; $('#bText').onclick = addText;
$('#bLeft').onclick = () => move(-1); $('#bRight').onclick = () => move(1); $('#bSave').onclick = saveProj; $('#bOpen').onclick = openProj;
$('#zoom').oninput = e => { S.scale = +e.target.value; renderTL(); };
$$('#flt button').forEach(b => b.onclick = () => { S.flt = b.dataset.f; $$('#flt button').forEach(x => x.classList.toggle('on', x === b)); renderLib(); });
addEventListener('keydown', e => {
  if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName) && e.target.type !== 'range') return;
  const k = e.key.toLowerCase();
  if (k === ' ') { e.preventDefault(); toggle(); } else if (k === 'delete' || k === 'backspace') del(); else if (k === 'c' && !e.ctrlKey) cutAtHead(); else if (k === 't' && !e.ctrlKey) { e.preventDefault(); addText(); }
  else if (e.ctrlKey && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); } else if (e.ctrlKey && k === 'y') redo(); else if (e.ctrlKey && k === 's') { e.preventDefault(); saveProj(); }
});
addEventListener('resize', renderTL);
document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop', e => { e.preventDefault(); if (e.dataTransfer.files.length) addFiles([...e.dataTransfer.files].map(f => kora.pathOf(f))); });

// Export
function textPngs(H) {
  const W = Math.round(H * 16 / 9 / 2) * 2;
  return S.text.filter(c => c.text.trim()).map(c => { const k = document.createElement('canvas'); k.width = W; k.height = H; drawText(k.getContext('2d'), W, H, c, { dx: 0, dy: 0, a: 1 }); return { start: c.start, dur: c.dur, anim: c.anim, png: k.toDataURL('image/png') }; });
}
$('#bExport').onclick = () => {
  if (!S.visual.length && !S.audio.length) return toast('Ajoute des clips à la timeline');
  pause(); $('#fname').value = $('#fname').value || 'ma-video'; $('#sum').textContent = `${S.visual.length} clip(s) vidéo/image · ${S.audio.length} audio · ${S.text.length} texte(s) · durée ${tc(total())}`;
  $('#fname').value = ($('.proj').textContent || '').replace(/\.kora$/i, '').replace(/^Projet sans titre$/, '') || $('#fname').value; $('#resRow').hidden = !S.visual.length; $('#mSet').hidden = false; $('#mProg').hidden = true; $('#modal').hidden = false;
};
$('#mCancel').onclick = () => $('#modal').hidden = true;
$('#mGo').onclick = async () => {
  const name = ($('#fname').value || '').replace(/[\\/:*?"<>|]/g, '').replace(/\.(mp4|mp3|m4a|wav)$/i, '').trim() || 'ma-video';
  const out = await kora.save(S.visual.length ? 'mp4' : 'mp3', name); if (!out) return;
  $('#bar').style.width = '0'; $('#pt').textContent = 'Export en cours…'; $('#mSet').hidden = true; $('#mProg').hidden = false;
  const H = +$('#res').value, r = await kora.exportProject({ visual: S.visual, audio: S.audio, text: S.visual.length ? textPngs(H) : [], height: H }, out);
  $('#modal').hidden = true; toast(r.ok ? 'Export terminé : ' + out : 'Erreur : ' + r.error);
};
$('#pCancel').onclick = () => kora.cancel();
kora.onProgress(v => { $('#bar').style.width = Math.round(v * 100) + '%'; $('#pt').textContent = 'Export en cours… ' + Math.round(v * 100) + ' %'; });
renderLib();
renderAll();
