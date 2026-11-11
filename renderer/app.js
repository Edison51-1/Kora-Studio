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
  copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>'
};
const ico = n => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICO[n]}</svg>`;
$$('i[data-i]').forEach(e => e.innerHTML = ico(e.dataset.i));

const S = { lib: [], visual: [], audio: [], sel: null, undo: [], redo: [], scale: 40, flt: 'all' };
let T = 0, playing = false, last = 0, raf = 0, uid = 1;
const pv = $('#pv'), pi = $('#pi'), pa = new Audio();
const nid = () => 'c' + uid++;
const len = c => c.end - c.start;
const tc = t => { t = Math.max(0, t || 0); const m = Math.floor(t / 60), s = t - m * 60; return String(m).padStart(2, '0') + ':' + (s < 10 ? '0' : '') + s.toFixed(1); };
const url = p => 'file:///' + encodeURI(p.replace(/\\/g, '/').replace(/^\//, '')).replace(/#/g, '%23').replace(/\?/g, '%3F');
function toast(m) { const t = $('#toast'); t.textContent = m; t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => t.hidden = true, 3500); }

const layout = tr => { let t = 0; return S[tr].map(c => { const s = t; t += len(c); return { c, s, e: t }; }); };
const total = () => Math.max(0, ...['visual', 'audio'].map(tr => { const l = layout(tr); return l.length ? l[l.length - 1].e : 0; }));
const at = (tr, t) => layout(tr).find(x => t >= x.s && t < x.e) || null;
const cur = () => S.sel ? S[S.sel.t].find(c => c.id === S.sel.id) || null : null;

const cap = () => JSON.stringify({ v: S.visual, a: S.audio });
function snap() { S.undo.push(cap()); if (S.undo.length > 80) S.undo.shift(); S.redo = []; }
function restore(s) { const o = JSON.parse(s); S.visual = o.v; S.audio = o.a; if (!cur()) S.sel = null; T = Math.min(T, total()); renderAll(); }
function undo() { if (!S.undo.length) return toast('Rien à annuler'); S.redo.push(cap()); restore(S.undo.pop()); }
function redo() { if (!S.redo.length) return toast('Rien à rétablir'); S.undo.push(cap()); restore(S.redo.pop()); }

async function addFiles(paths) {
  for (const p of paths) {
    const i = await kora.probe(p);
    if (i.error) { toast(i.error + ' : ' + p.split(/[\\/]/).pop()); continue; }
    S.lib.push({ id: nid(), path: p, name: p.split(/[\\/]/).pop(), ...i });
  }
  renderLib();
}
function addToTL(it, idx) {
  snap();
  const tr = it.type === 'audio' ? 'audio' : 'visual';
  const c = { id: nid(), path: it.path, name: it.name, type: it.type, hasAudio: it.hasAudio, src: it.duration, start: 0, end: it.type === 'image' ? 5 : it.duration, anim: 'none', vol: 1 };
  idx == null ? S[tr].push(c) : S[tr].splice(idx, 0, c);
  S.sel = { t: tr, id: c.id }; T = layout(tr).find(x => x.c === c).s; renderAll();
}

function renderLib() {
  const g = $('#grid'); g.innerHTML = '';
  const items = S.lib.filter(i => S.flt === 'all' || i.type === S.flt);
  if (!items.length) { g.innerHTML = '<div class="hint">Glisse tes fichiers ici<br>ou clique sur « Importer »</div>'; return; }
  items.forEach(it => {
    const u = url(it.path), d = document.createElement('div'); d.className = 'card'; d.draggable = true;
    const th = it.type === 'image' ? `<img src="${u}" alt="">` : it.type === 'video' ? `<video src="${u}#t=0.5" preload="metadata" muted></video>` : `<div class="aico">${ico('music')}</div>`;
    d.innerHTML = `<div class="thumb">${th}</div><span class="badge">${ico({ video: 'film', image: 'image', audio: 'music' }[it.type])}</span><button class="add" aria-label="Ajouter à la timeline">+</button><div class="cap"><span class="nm"></span><span class="dim">${it.type === 'image' ? 'Image' : tc(it.duration)}</span></div>`;
    d.querySelector('.nm').textContent = it.name;
    d.querySelector('.add').onclick = () => addToTL(it);
    d.ondblclick = () => addToTL(it);
    d.ondragstart = e => e.dataTransfer.setData('text/plain', it.id);
    g.appendChild(d);
  });
}
function wave(id, w) {
  let h = 7; for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const n = Math.max(6, Math.min(400, Math.floor(w / 4))); let r = '';
  for (let i = 0; i < n; i++) { h = (h * 1664525 + 1013904223) >>> 0; const a = .2 + .8 * ((h >>> 8) % 100) / 100; r += `<rect x="${i * 4}" y="${16 - a * 14}" width="2" height="${a * 28}" rx="1"/>`; }
  return `<svg class="w" viewBox="0 0 ${n * 4} 32" preserveAspectRatio="none" fill="rgba(255,255,255,.6)">${r}</svg>`;
}
function renderTL() {
  const sc = S.scale, tot = total(), w = Math.max($('#scroll').clientWidth, tot * sc + 240);
  $('#content').style.width = w + 'px';
  const step = sc >= 80 ? 1 : sc >= 40 ? 2 : sc >= 20 ? 5 : 10; let r = '';
  for (let t = 0; t * sc < w; t += step) r += `<span style="left:${t * sc}px">${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}</span>`;
  $('#ruler').innerHTML = r;
  [['visual', '#lV'], ['audio', '#lA']].forEach(([tr, sel]) => {
    const lane = $(sel); lane.innerHTML = '';
    layout(tr).forEach(({ c, s, e }) => {
      const d = document.createElement('div'), cw = (e - s) * sc;
      d.className = 'clip ' + c.type + (S.sel && S.sel.id === c.id ? ' sel' : '');
      d.style.left = s * sc + 'px'; d.style.width = Math.max(4, cw - 2) + 'px';
      if (c.type === 'image') d.style.backgroundImage = `linear-gradient(rgba(0,0,0,.25),rgba(0,0,0,.25)),url("${url(c.path)}")`;
      d.innerHTML = (c.type === 'audio' ? wave(c.id, cw) : '') + '<div class="lab"></div>';
      d.querySelector('.lab').textContent = c.name;
      d.onmousedown = e => e.stopPropagation();
      d.onclick = () => { S.sel = { t: tr, id: c.id }; if (!(T >= s && T < e)) T = s; renderAll(); };
      lane.appendChild(d);
    });
  });
  updHead();
}
const ANIMS = [['none', 'Aucune'], ['zoomin', 'Zoom avant'], ['zoomout', 'Zoom arrière'], ['fade', 'Fondu'], ['pan', 'Glisser']];
function renderInsp() {
  const c = cur(), b = $('#ibody');
  if (!c) { b.innerHTML = '<div class="blank">Sélectionne un clip dans la timeline pour modifier ses propriétés.</div>'; return; }
  const img = c.type === 'image', vol = c.type === 'audio' || (c.type === 'video' && c.hasAudio);
  b.innerHTML = `<div><div class="lbl">Clip</div><div class="cname"></div><div class="dim">Durée ${tc(len(c))}</div></div>
  <div><div class="lbl">Découpe</div>${img ? '<label>Durée (s)<input type="number" id="pE" min="0.5" step="0.5"></label>' : '<div class="two"><label>Début (s)<input type="number" id="pS" min="0" step="0.1"></label><label>Fin (s)<input type="number" id="pE" min="0.1" step="0.1"></label></div>'}</div>
  ${img ? `<div><div class="lbl">Animation</div><div class="anims">${ANIMS.map(a => `<button class="an ${c.anim === a[0] ? 'on' : ''}" data-a="${a[0]}">${a[1]}</button>`).join('')}</div></div>` : ''}
  ${vol ? '<div><div class="lbl">Audio</div><label><span id="vt"></span><input type="range" id="pV" min="0" max="1.5" step="0.05"></label></div>' : ''}`;
  b.querySelector('.cname').textContent = c.name;
  $('#pE').value = c.end.toFixed(1); if ($('#pS')) $('#pS').value = c.start.toFixed(1);
  if ($('#pS')) $('#pS').onchange = e => { snap(); c.start = Math.min(Math.max(0, +e.target.value || 0), c.end - 0.1); renderAll(); };
  $('#pE').onchange = e => { snap(); let v = +e.target.value || c.end; if (!img) v = Math.min(v, c.src); c.end = Math.max(v, c.start + 0.1); renderAll(); };
  b.querySelectorAll('.an').forEach(x => x.onclick = () => { snap(); c.anim = x.dataset.a; renderAll(); });
  const r = $('#pV');
  if (r) {
    const upd = () => $('#vt').textContent = 'Volume : ' + Math.round(c.vol * 100) + ' %';
    r.value = c.vol; upd(); r.onpointerdown = () => snap();
    r.oninput = e => { c.vol = +e.target.value; upd(); showFrame(); };
  }
}

function showFrame() {
  const v = at('visual', T), em = $('#empty');
  if (!v) {
    pv.pause(); pv.hidden = pi.hidden = true; em.hidden = false;
    em.textContent = S.visual.length ? 'Aucune image à cette position' : 'Importe des médias puis ajoute-les à la timeline';
  } else {
    em.hidden = true; const c = v.c, p = (T - v.s) / len(c);
    if (c.type === 'image') {
      pv.pause(); pv.hidden = true; if (pi._p !== c.path) { pi._p = c.path; pi.src = url(c.path); }
      pi.hidden = false; let tr = 'none', op = 1;
      if (c.anim === 'zoomin') tr = `scale(${1 + .3 * p})`; else if (c.anim === 'zoomout') tr = `scale(${1.3 - .3 * p})`;
      else if (c.anim === 'pan') tr = `scale(1.25) translateX(${(.5 - p) * 16}%)`;
      else if (c.anim === 'fade') { const fd = Math.min(.6, len(c) / 3); op = Math.min(1, (T - v.s) / fd, (v.e - T) / fd); }
      pi.style.transform = tr; pi.style.opacity = op;
    } else {
      pi.hidden = true; pv.hidden = false; const want = c.start + (T - v.s);
      if (pv._p !== c.path) { pv._p = c.path; pv.src = url(c.path); pv.currentTime = want; }
      else if (Math.abs(pv.currentTime - want) > (playing ? .35 : .04)) pv.currentTime = want;
      pv.volume = Math.min(1, c.vol ?? 1);
      if (playing) { if (pv.paused) pv.play().catch(() => {}); } else pv.pause();
    }
  }
  const a = at('audio', T);
  if (!a) pa.pause(); else {
    const want = a.c.start + (T - a.s);
    if (pa._p !== a.c.path) { pa._p = a.c.path; pa.src = url(a.c.path); pa.currentTime = want; }
    else if (Math.abs(pa.currentTime - want) > (playing ? .35 : .04)) pa.currentTime = want;
    pa.volume = Math.min(1, a.c.vol ?? 1);
    if (playing) { if (pa.paused) pa.play().catch(() => {}); } else pa.pause();
  }
}
function updHead() {
  const x = T * S.scale; $('#playhead').style.left = x + 'px';
  $('#tc').textContent = tc(T); $('#tt').textContent = '/ ' + tc(total());
  const sc = $('#scroll'); if (playing && (x > sc.scrollLeft + sc.clientWidth - 40 || x < sc.scrollLeft)) sc.scrollLeft = Math.max(0, x - 40);
}
function renderAll() { renderLib(); renderTL(); renderInsp(); showFrame(); }

function play() { if (!total()) return toast('Ajoute des clips à la timeline'); if (T >= total() - 0.05) T = 0; playing = true; last = performance.now(); $('#bPlay').innerHTML = ico('pause'); raf = requestAnimationFrame(tick); }
function pause() { playing = false; cancelAnimationFrame(raf); pv.pause(); pa.pause(); $('#bPlay').innerHTML = ico('play'); }
function tick(ts) {
  if (!playing) return; T += (ts - last) / 1000; last = ts;
  if (T >= total()) { T = total(); pause(); showFrame(); updHead(); return; }
  showFrame(); updHead(); raf = requestAnimationFrame(tick);
}
const toggle = () => playing ? pause() : play();

function seek(e) { const r = $('#content').getBoundingClientRect(); T = Math.min(total(), Math.max(0, (e.clientX - r.left) / S.scale)); showFrame(); updHead(); }
function scrub(e) { pause(); seek(e); const up = () => removeEventListener('mousemove', seek); addEventListener('mousemove', seek); addEventListener('mouseup', up, { once: true }); }
$('#ruler').onmousedown = scrub;
['#lV', '#lA'].forEach(s => { const l = $(s); l.onmousedown = e => { if (e.target === l) scrub(e); }; l.ondragover = e => e.preventDefault(); l.ondrop = e => { if (e.dataTransfer.files.length) return; e.preventDefault(); e.stopPropagation(); dropOn(s === '#lV' ? 'visual' : 'audio', e); }; });
function dropOn(tr, e) {
  const it = S.lib.find(x => x.id === e.dataTransfer.getData('text/plain')); if (!it) return;
  if ((it.type === 'audio' ? 'audio' : 'visual') !== tr) return toast(tr === 'audio' ? 'Dépose les audios sur la piste Audio' : 'Dépose les vidéos et images sur la piste Vidéo');
  const t = (e.clientX - $('#content').getBoundingClientRect().left) / S.scale;
  addToTL(it, layout(tr).filter(x => (x.s + x.e) / 2 < t).length);
}

function cutAtHead() {
  const tr = S.sel ? S.sel.t : 'visual', e = at(tr, T); if (!e) return toast('Place la tête de lecture sur un clip');
  const c = e.c, t = c.start + (T - e.s);
  if (t < c.start + .1 || t > c.end - .1) return toast('Place la tête de lecture à l\'intérieur du clip');
  snap(); const a = S[tr]; a.splice(a.indexOf(c) + 1, 0, { ...c, id: nid(), start: t }); c.end = t; S.sel = { t: tr, id: c.id }; renderAll();
}
function del() { const c = cur(); if (!c) return toast('Sélectionne un clip'); snap(); S[S.sel.t] = S[S.sel.t].filter(x => x !== c); S.sel = null; T = Math.min(T, total()); renderAll(); }
function dup() { const c = cur(); if (!c) return toast('Sélectionne un clip'); snap(); const a = S[S.sel.t]; a.splice(a.indexOf(c) + 1, 0, { ...c, id: nid() }); renderAll(); }
function move(d) { const c = cur(); if (!c) return; const a = S[S.sel.t], i = a.indexOf(c), j = i + d; if (j < 0 || j >= a.length) return; snap(); [a[i], a[j]] = [a[j], a[i]]; renderAll(); }

$('#bPlay').onclick = toggle; $('#bBack').onclick = () => { pause(); T = 0; showFrame(); updHead(); }; $('#bFwd').onclick = () => { pause(); T = total(); showFrame(); updHead(); };
$('#bImport').onclick = async () => addFiles(await kora.pick());
$('#bUndo').onclick = undo; $('#bRedo').onclick = redo; $('#bCut').onclick = cutAtHead; $('#bDel').onclick = del; $('#bDup').onclick = dup;
$('#bLeft').onclick = () => move(-1); $('#bRight').onclick = () => move(1);
$('#zoom').oninput = e => { S.scale = +e.target.value; renderTL(); };
$$('#flt button').forEach(b => b.onclick = () => { S.flt = b.dataset.f; $$('#flt button').forEach(x => x.classList.toggle('on', x === b)); renderLib(); });
addEventListener('keydown', e => {
  if (/INPUT|SELECT/.test(e.target.tagName) && e.target.type !== 'range') return;
  const k = e.key.toLowerCase();
  if (k === ' ') { e.preventDefault(); toggle(); } else if (k === 'delete' || k === 'backspace') del(); else if (k === 'c' && !e.ctrlKey) cutAtHead();
  else if (e.ctrlKey && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); } else if (e.ctrlKey && k === 'y') redo();
});
addEventListener('resize', renderTL);
document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop', e => { e.preventDefault(); if (e.dataTransfer.files.length) addFiles([...e.dataTransfer.files].map(f => kora.pathOf(f))); });

// Export
$('#bExport').onclick = () => {
  if (!S.visual.length && !S.audio.length) return toast('Ajoute des clips à la timeline');
  pause(); $('#sum').textContent = `${S.visual.length} clip(s) vidéo/image · ${S.audio.length} audio · durée ${tc(total())}`;
  $('#resRow').hidden = !S.visual.length; $('#mSet').hidden = false; $('#mProg').hidden = true; $('#modal').hidden = false;
};
$('#mCancel').onclick = () => $('#modal').hidden = true;
$('#mGo').onclick = async () => {
  const out = await kora.save(S.visual.length ? 'mp4' : 'mp3'); if (!out) return;
  $('#bar').style.width = '0'; $('#pt').textContent = 'Export en cours…'; $('#mSet').hidden = true; $('#mProg').hidden = false;
  const r = await kora.exportProject({ visual: S.visual, audio: S.audio, height: +$('#res').value }, out);
  $('#modal').hidden = true; toast(r.ok ? 'Export terminé : ' + out : 'Erreur : ' + r.error);
};
$('#pCancel').onclick = () => kora.cancel();
kora.onProgress(v => { $('#bar').style.width = Math.round(v * 100) + '%'; $('#pt').textContent = 'Export en cours… ' + Math.round(v * 100) + ' %'; });
renderAll();
