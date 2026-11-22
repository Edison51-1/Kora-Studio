// Plan d'export en étapes : un fichier temporaire par clip, transitions, puis assemblage final
const path = require('path');
const KS = require('./shared.js');
const FPS = 30;
const AF = 'aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo';
const LEGACY = { fade: 'fadeinout', pan: 'panright' };
const QUAL = { high: 18, standard: 22, light: 27 };
const IN = 0.5, OUT = 0.3; // durées des animations d'entrée / sortie (texte et incrustations)
const dur = c => Math.max(0.1, +KS.len(c).toFixed(3));
const Q = 'pow(1-min(1,t/0.6),2)';

const eqf = c => {
  const b = c.bright || 0, ct = c.contrast ?? 1, s = c.sat ?? 1;
  return b || ct !== 1 || s !== 1 ? `,eq=brightness=${b}:contrast=${ct}:saturation=${s}` : '';
};
const aprep = c => `${AF}${c.denoise ? ',afftdn=nf=-30' : ''}`;
const volf = c => `volume=${c.mute ? 0 : (c.vol ?? 1)}`;
const fades = (c, d) => [c.fi > 0 ? `afade=t=in:st=0:d=${c.fi}` : '', c.fo > 0 ? `afade=t=out:st=${Math.max(0, d - c.fo).toFixed(3)}:d=${c.fo}` : ''].filter(Boolean).join(',');
const afx = (c, d) => [volf(c), fades(c, d)].filter(Boolean).join(',');
const ZP = {
  zoomin: fr => [`1+0.3*on/${fr}`, 'iw/2-iw/zoom/2', 'ih/2-ih/zoom/2'],
  zoomout: fr => [`1.3-0.3*on/${fr}`, 'iw/2-iw/zoom/2', 'ih/2-ih/zoom/2'],
  panleft: fr => ['1.25', `(iw-iw/zoom)*(1-on/${fr})`, 'ih/2-ih/zoom/2'],
  panright: fr => ['1.25', `(iw-iw/zoom)*on/${fr}`, 'ih/2-ih/zoom/2'],
  panup: fr => ['1.25', 'iw/2-iw/zoom/2', `(ih-ih/zoom)*(1-on/${fr})`],
  pandown: fr => ['1.25', 'iw/2-iw/zoom/2', `(ih-ih/zoom)*on/${fr}`],
  kenburns: fr => [`1+0.25*on/${fr}`, `(iw-iw/zoom)*on/${fr}*0.8`, `(ih-ih/zoom)*on/${fr}*0.5`],
  pulse: () => ['1.08+0.06*sin(on/6)', 'iw/2-iw/zoom/2', 'ih/2-ih/zoom/2']
};
const SLIDE = { slideleft: [`-W*${Q}`, '0'], slideright: [`W*${Q}`, '0'], slideup: ['0', `H*${Q}`], slidedown: ['0', `-H*${Q}`] };

const base = p => ['-hide_banner', '-nostdin', '-loglevel', 'error', '-progress', 'pipe:1', '-nostats', '-y', '-filter_threads', String((p.perf && p.perf.filterThreads) || 1), '-filter_complex_threads', String((p.perf && p.perf.filterThreads) || 1)];
const venc = (crf, p) => ['-c:v', 'libx264', '-preset', (p.perf && p.perf.preset) || 'veryfast', '-crf', String(crf), '-pix_fmt', 'yuv420p', ...((p.perf && p.perf.threads) ? ['-threads', String(p.perf.threads)] : [])];
const AENC = ['-c:a', 'aac', '-b:a', '192k', '-ar', '44100', '-ac', '2'];
const PCM = ['-c:a', 'pcm_s16le', '-ar', '44100', '-ac', '2']; // son exact dans les fichiers temporaires
const fwd = p => p.replace(/\\/g, '/');
const fitContain = (w, h) => `scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2`;
const fitCover = (w, h) => `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}`;

function imageChain(c, d, W, H, add, f) {
  const fr = Math.round(d * FPS), an = LEGACY[c.anim] || c.anim || 'none', fd = Math.min(0.6, d / 3);
  const fit = c.fit === 'cover' ? fitCover : fitContain, E = eqf(c), out = '[v0]';
  if (ZP[an]) {
    const [z, x, y] = ZP[an](fr), k = add('-i', c.path);
    f.push(`[${k}:v]${fit(W * 2, H * 2)},setsar=1,zoompan=z='${z}':x='${x}':y='${y}':d=${fr}:s=${W}x${H}:fps=${FPS},setsar=1${E},format=yuv420p${out}`);
    return;
  }
  const k = add('-loop', '1', '-framerate', String(FPS), '-t', String(d), '-i', c.path);
  const base = `[${k}:v]${fit(W, H)},setsar=1,fps=${FPS}`;
  if (SLIDE[an]) {
    const [x, y] = SLIDE[an].map(s => s.replace(/W/g, W).replace(/H/g, H));
    f.push(`color=c=black:s=${W}x${H}:r=${FPS}:d=${d}[bgi]`, `${base}${E},format=yuv420p[imi]`, `[bgi][imi]overlay=x='${x}':y='${y}':shortest=1,format=yuv420p${out}`);
  } else if (an === 'rotate') f.push(`${base},rotate=a='2*PI*t/${d}':c=black:ow=${W}:oh=${H}${E},format=yuv420p${out}`);
  else if (an === 'shake') f.push(`${base},crop=w=iw-40:h=ih-40:x='20+16*sin(t*25)':y='20+16*cos(t*31)',scale=${W}:${H},setsar=1${E},format=yuv420p${out}`);
  else {
    let fx = '';
    if (an === 'fadein' || an === 'fadeinout') fx += `,fade=t=in:st=0:d=${fd}`;
    if (an === 'fadeout' || an === 'fadeinout') fx += `,fade=t=out:st=${(d - fd).toFixed(3)}:d=${fd}`;
    f.push(`${base}${E}${fx},format=yuv420p${out}`);
  }
}

// Fondus de volume valables pour un morceau commençant à p0 dans un clip de durée D
function fadeVol(c, p0, D) {
  const terms = [];
  if (c.fi > 0) terms.push(`(t+${p0})/${c.fi}`);
  if (c.fo > 0) terms.push(`(${D}-${p0}-t)/${c.fo}`);
  if (!terms.length) return '';
  return `volume='max(0,${terms.reduce((a, b) => `min(${a},${b})`, '1')})':eval=frame`;
}
const intersect = (items, a, b) => items.filter(it => it.at < b - 0.03 && it.at + it.dur > a + 0.03);

// Incrustations (textes, stickers, images, vidéos) posées sur un morceau [t0, t0+pd) de la timeline.
// Les images fixes sont lues en UNE seule image (pas de boucle) : très peu de mémoire.
function composeOverlays(items, t0, pd, W, H, add, f, main) {
  const aud = []; let u = 0;
  items.forEach((it, j) => {
    const at = it.at, et = it.at + it.dur, d = it.dur, an = it.anim || 'none', loc = x => +(x - t0).toFixed(3), atL = loc(at);
    const tw = it.kind === 'text' ? Math.max(2, it.pw) : Math.max(2, Math.round(W * (it.w || 30) / 100 / 2) * 2);
    const rad = ((it.rot || 0) * Math.PI / 180).toFixed(4);
    const place = (a, b, offX, offY) => {
      const x = `${(W * (it.x ?? 50) / 100).toFixed(1)}-w/2${offX}`, y = `${(H * (it.y ?? 50) / 100).toFixed(1)}-h/2${offY}`;
      return `overlay=x='${x}':y='${y}':enable='between(t,${loc(a)},${loc(b)})':format=auto`;
    };
    const geo = (popFi) => (popFi ? `scale=w='max(2,trunc(${tw}*(0.5+0.5*min(1,t/${popFi}))/2)*2)':h=-2:eval=frame` : `scale=${tw}:-2`)
      + (it.rot ? `,rotate=a=${rad}:c=none:ow='rotw(${rad})':oh='roth(${rad})'` : '') + ((it.op ?? 1) < 1 ? `,colorchannelmixer=aa=${it.op}` : '');
    const slide = fi => { const p = `pow(1-min(1,max(0,(t-${atL})/${fi})),2)`, dx = (0.15 * W).toFixed(1), dy = (0.15 * H).toFixed(1); return { slideleft: [`-${dx}*${p}`, ''], slideright: [`+${dx}*${p}`, ''], slideup: ['', `+${dy}*${p}`], slidedown: ['', `-${dy}*${p}`] }[an] || ['', '']; };
    const emit = (chain, a, b, ox, oy) => { const l1 = `ov${j}_${u++}`, l2 = `o${j}_${u++}`; f.push(`${chain}[${l1}]`, `${main}[${l1}]${place(a, b, ox, oy)}[${l2}]`); main = `[${l2}]`; };
    if (it.kind === 'video') {
      const off0 = Math.max(0, t0 - at), a = Math.max(at, t0), b = Math.min(et, t0 + pd), dd = +(b - a).toFixed(3);
      if (dd < 0.03) return;
      const k = add('-ss', String(+((it.start || 0) + off0).toFixed(3)), '-t', String(dd), '-i', it.path);
      let ch = `[${k}:v]setpts=PTS-STARTPTS+${off0.toFixed(3)}/TB,format=rgba,${geo(an === 'pop' ? IN : 0)}`;
      if (an !== 'none') ch += `,fade=t=in:st=0:d=${IN}:alpha=1,fade=t=out:st=${Math.max(0, d - OUT).toFixed(3)}:d=${OUT}:alpha=1`;
      ch += `,setpts=PTS+${(loc(a) - off0).toFixed(3)}/TB`;
      const [ox, oy] = slide(IN); emit(ch, a, b, ox, oy);
      if (it.hasAudio && !it.mute) { f.push(`[${k}:a]${AF},volume=${it.vol ?? 1},apad,atrim=0:${dd},adelay=${Math.round(loc(a) * 1000)}:all=1[oa${j}]`); aud.push(`[oa${j}]`); }
      return;
    }
    const src = it.pngPath || it.path, fi = Math.min(IN, d * 0.6), fo = Math.min(OUT, d * 0.4);
    const segs = an === 'none' ? [['mid', at, et]] : [['intro', at, at + fi], ['mid', at + fi, et - fo], ['outro', et - fo, et]];
    segs.forEach(([mode, s, e]) => {
      const a = Math.max(s, t0), b = Math.min(e, t0 + pd); if (b - a < 0.03) return;
      if (mode === 'mid') { const k = add('-i', src); emit(`[${k}:v]format=rgba,${geo(0)},setpts=PTS-STARTPTS+${loc(a)}/TB`, a, b, '', ''); return; }
      const sd = mode === 'intro' ? fi : fo, k = add('-loop', '1', '-framerate', String(FPS), '-t', String(+sd.toFixed(3)), '-i', src), off = a - s;
      let ch = `[${k}:v]format=rgba,${geo(mode === 'intro' && an === 'pop' ? fi : 0)},${mode === 'intro' ? `fade=t=in:st=0:d=${fi.toFixed(3)}:alpha=1` : `fade=t=out:st=0:d=${fo.toFixed(3)}:alpha=1`}`;
      ch += off > 0.001 ? `,trim=start=${off.toFixed(3)},setpts=PTS-STARTPTS+${loc(a)}/TB` : `,setpts=PTS+${loc(a)}/TB`;
      const [ox, oy] = mode === 'intro' ? slide(fi) : ['', '']; emit(ch, a, b, ox, oy);
    });
  });
  return { main, aud };
}

// Un morceau (tête, corps ou queue) d'un clip vidéo : seule la partie utile est décodée
function videoPiece(c, key, i, n, p0, p1, ctx) {
  const { W, H, tmp, crf, items, S0, P } = ctx, d = +(p1 - p0).toFixed(3), D = dur(c), sp = c.speed || 1, E = eqf(c);
  const ins = [], f = [], add = (...x) => { ins.push(x); return ins.length - 1; };
  const tail = `tpad=stop_mode=clone:stop_duration=2,trim=duration=${d},setpts=PTS-STARTPTS`, silence = `anullsrc=r=44100:cl=stereo:d=${d}`;
  const k0 = add('-ss', String(+(c.start + p0 * sp).toFixed(3)), '-t', String(+(d * sp).toFixed(3)), '-i', c.path);
  let la;
  if (c.sound && c.sound.path) { const ks = add('-ss', String(+((c.sound.start || 0) + p0).toFixed(3)), '-t', String(d), '-i', c.sound.path); la = `[${ks}:a]${aprep(c)},apad,atrim=0:${d},asetpts=PTS-STARTPTS,${volf(c)}`; }
  else if (c.hasAudio) la = `[${k0}:a]${aprep(c)}${sp !== 1 ? `,atempo=${sp}` : ''},apad,atrim=0:${d},asetpts=PTS-STARTPTS,${volf(c)}`;
  else la = silence;
  const fv = fadeVol(c, p0, D);
  if (!c.pair) {
    f.push(`[${k0}:v]setpts=(PTS-STARTPTS)/${sp},${fitContain(W, H)},setsar=1,fps=${FPS},format=yuv420p${E},${tail}[v0]`, `${la}${fv ? ',' + fv : ''}[a0]`);
  } else {
    const p2 = c.pair, vert = p2.mode === 'v', pw = vert ? W : Math.floor(W / 4) * 2, ph = vert ? Math.floor(H / 4) * 2 : H;
    const half = `${fitCover(pw, ph)},setsar=1,fps=${FPS},format=yuv420p`;
    const k1 = add('-ss', String(+((p2.start || 0) + p0).toFixed(3)), '-t', String(d), '-i', p2.path);
    f.push(`[${k0}:v]setpts=(PTS-STARTPTS)/${sp},${half}${E},${tail}[pl]`, `[${k1}:v]setpts=PTS-STARTPTS,${half},${tail}[pr]`,
      `[pl][pr]${vert ? 'vstack' : 'hstack'}=inputs=2,${fitContain(W, H)},setsar=1,format=yuv420p[v0]`,
      `${la}[la]`, `${p2.hasAudio && !p2.mute ? `[${k1}:a]${AF},apad,atrim=0:${d},asetpts=PTS-STARTPTS,volume=${p2.vol ?? 1}` : silence}[ra]`,
      `[la][ra]amix=inputs=2:duration=longest:normalize=0${fv ? ',' + fv : ''}[a0]`);
  }
  let vOut = '[v0]', aOut = '[a0]';
  const its = intersect(items, ctx.S0 + p0, ctx.S0 + p1);
  if (its.length) {
    const r = composeOverlays(its, ctx.S0 + p0, d, W, H, add, f, '[v0]'); vOut = r.main;
    if (r.aud.length) { f.push(`[a0]${r.aud.join('')}amix=inputs=${1 + r.aud.length}:duration=first:normalize=0[af]`); aOut = '[af]'; }
  }
  const file = path.join(tmp, `${key}${i}_${n}.mkv`);
  const args = [...base(P), ...ins.flat(), '-filter_complex', f.join(';'), '-map', vOut, '-map', aOut, ...venc(crf, P), '-r', String(FPS), ...PCM, '-t', String(d), '-f', 'matroska', file];
  return { args, dur: d, w: d, file };
}

// Clip image : un seul calcul d'animation, puis découpe en tête / corps / queue
function imageStep(c, i, ctx, l) {
  const { W, H, tmp, crf, items, S0, P } = ctx, d = dur(c), tin = l.tin, tout = l.tout;
  const ins = [], f = [], add = (...x) => { ins.push(x); return ins.length - 1; };
  imageChain(c, d, W, H, add, f); f.push(`anullsrc=r=44100:cl=stereo:d=${d}[a0]`);
  let vOut = '[v0]', aOut = '[a0]';
  const its = intersect(items, S0, S0 + d);
  if (its.length) { const r = composeOverlays(its, S0, d, W, H, add, f, '[v0]'); vOut = r.main; if (r.aud.length) { f.push(`[a0]${r.aud.join('')}amix=inputs=${1 + r.aud.length}:duration=first:normalize=0[af]`); aOut = '[af]'; } }
  const parts = [];
  if (tin > 0) parts.push({ k: 'h', s: 0, e: tin });
  parts.push({ k: 'b', s: tin, e: +(d - tout).toFixed(3) });
  if (tout > 0) parts.push({ k: 't', s: +(d - tout).toFixed(3), e: d });
  const maps = [], files = {};
  if (parts.length === 1) { files.b = path.join(tmp, `b${i}_0.mkv`); maps.push([vOut, aOut, d, files.b]); }
  else {
    const n = parts.length, lab = pre => parts.map((_, j) => `[${pre}${j}]`).join('');
    f.push(`${vOut}split=${n}${lab('vs')}`, `${aOut}asplit=${n}${lab('as')}`);
    parts.forEach((p, j) => {
      f.push(`[vs${j}]trim=${p.s}:${p.e},setpts=PTS-STARTPTS[vo${j}]`, `[as${j}]atrim=${p.s}:${p.e},asetpts=PTS-STARTPTS[ao${j}]`);
      files[p.k] = path.join(tmp, `${p.k}${i}_0.mkv`); maps.push([`[vo${j}]`, `[ao${j}]`, +(p.e - p.s).toFixed(3), files[p.k]]);
    });
  }
  const args = [...base(P), ...ins.flat(), '-filter_complex', f.join(';')];
  maps.forEach(([v, a, t, file]) => args.push('-map', v, '-map', a, ...venc(crf, P), '-r', String(FPS), ...PCM, '-t', String(t), '-f', 'matroska', file));
  return { steps: [{ args, dur: d, w: d }], h: files.h, t: files.t, bodies: [files.b] };
}

function clipPieces(c, i, l, ctx) {
  if (c.type !== 'video') return imageStep(c, i, ctx, l);
  const d = dur(c), b0 = l.tin, b1 = +(d - l.tout).toFixed(3), res = { steps: [], bodies: [] };
  // découpe en fenêtres : au plus ~10 entrées FFmpeg et 20 s par étape (la mémoire reste faible)
  const weight = (a, b) => intersect(ctx.items, ctx.S0 + a, ctx.S0 + b).reduce((s, it) => s + (it.kind !== 'video' && it.anim && it.anim !== 'none' ? 3 : 1), 0);
  const body = []; let p = b0;
  while (p < b1 - 0.001) {
    let e = Math.min(b1, p + 20);
    if (weight(p, e) > 10) { let lo = p + 1; e = Math.min(b1, lo); while (e < Math.min(b1, p + 20) && weight(p, Math.min(b1, e + 1)) <= 10) e = Math.min(b1, e + 1); e = Math.max(e, Math.min(b1, p + 1)); }
    body.push([+p.toFixed(3), +e.toFixed(3)]); p = e;
  }
  if (body.length > 1 && body[body.length - 1][1] - body[body.length - 1][0] < 0.5) { const last = body.pop(); body[body.length - 1][1] = last[1]; }
  if (l.tin > 0) { const s = videoPiece(c, 'h', i, 0, 0, l.tin, ctx); res.steps.push(s); res.h = s.file; }
  body.forEach(([p0, p1], n) => { const s = videoPiece(c, 'b', i, n, p0, p1, ctx); res.steps.push(s); res.bodies.push(s.file); });
  if (l.tout > 0) { const s = videoPiece(c, 't', i, 0, b1, d, ctx); res.steps.push(s); res.t = s.file; }
  return res;
}

function transStep(tFile, hFile, td, type, tmp, i, crf, P) {
  const file = path.join(tmp, `x${i}.mkv`);
  const f = `[0:v][1:v]xfade=transition=${type}:duration=${td}:offset=0,format=yuv420p[v];[0:a][1:a]acrossfade=d=${td}[a]`;
  return { args: [...base(P), '-i', tFile, '-i', hFile, '-filter_complex', f, '-map', '[v]', '-map', '[a]', ...venc(crf, P), '-r', String(FPS), ...PCM, '-f', 'matroska', file], dur: td, w: td, file };
}

function buildPlan(p, out, tmp) {
  const P = p, crf = QUAL[p.quality] || 22, [W, H] = KS.dims(p.fmt || '16:9', p.short || p.height || 720);
  const vis = p.visual || [], aud = p.audio || [], steps = [];
  const aClip = (c, k) => { const d = dur(c), sp = c.speed || 1; return `[${k}:a]${aprep(c)}${sp !== 1 ? `,atempo=${sp}` : ''},${afx(c, d)},adelay=${Math.round((c.at || 0) * 1000)}:all=1`; };
  if (!vis.length) { // audio seul (MP3, M4A, WAV)
    const a = [...base(p)], f = []; let k = 0, tot = 0;
    aud.forEach((c, j) => { a.push('-ss', String(c.start), '-t', String(+(c.end - c.start).toFixed(3)), '-i', c.path); f.push(`${aClip(c, k++)}[b${j}]`); tot = Math.max(tot, (c.at || 0) + dur(c)); });
    f.push(aud.length > 1 ? `${aud.map((_, j) => `[b${j}]`).join('')}amix=inputs=${aud.length}:duration=longest:normalize=0[bg]` : '[b0]anull[bg]');
    a.push('-filter_complex', f.join(';'), '-map', '[bg]');
    if (/\.mp3$/i.test(out)) a.push('-vn', '-c:a', 'libmp3lame', '-b:a', `${p.kbps || 192}k`); else if (/\.m4a$/i.test(out)) a.push('-c:a', 'aac', '-b:a', '192k');
    a.push(out); steps.push({ args: a, dur: tot, w: tot });
    return { steps, list: null, total: tot };
  }
  const items = [...(p.over || []), ...(p.text || [])].filter(x => x.pngPath || x.path);
  const lay = KS.layoutVisual(vis), total = lay[lay.length - 1].e, order = [], parts = [];
  lay.forEach((l, i) => {
    const r = clipPieces(l.c, i, l, { W, H, tmp, crf, items, S0: l.s, P });
    steps.push(...r.steps); parts[i] = r;
  });
  lay.forEach((l, i) => {
    order.push(...parts[i].bodies);
    if (l.tout > 0) { const x = transStep(parts[i].t, parts[i + 1].h, l.tout, vis[i].trans.type, tmp, i, crf, P); steps.push(x); order.push(x.file); }
  });
  const list = { path: path.join(tmp, 'list.txt'), content: order.map(f => `file '${fwd(f).replace(/'/g, "'\\''")}'`).join('\n') };
  const a = [...base(p), '-f', 'concat', '-safe', '0', '-i', fwd(list.path)], f = [];
  let k = 1; const add = (...x) => { a.push(...x); return k++; };
  const mix = ['[0:a]'];
  aud.forEach((c, j) => { const ki = add('-ss', String(c.start), '-t', String(+(c.end - c.start).toFixed(3)), '-i', c.path); f.push(`${aClip(c, ki)}[ba${j}]`); mix.push(`[ba${j}]`); });
  let ao = null;
  if (mix.length > 1) { f.push(`${mix.join('')}amix=inputs=${mix.length}:duration=first:normalize=0[am]`); ao = '[am]'; }
  if (p.normalize) { f.push(`${ao || '[0:a]'}loudnorm=I=-16:TP=-1.5:LRA=11[an]`); ao = '[an]'; }
  if (f.length) a.push('-filter_complex', f.join(';'));
  a.push('-map', '0:v', '-c:v', 'copy', '-map', ao || '0:a', ...AENC, '-movflags', '+faststart', out);
  steps.push({ args: a, dur: total, w: Math.max(0.2, total * 0.1) });
  return { steps, list, total };
}

// Son du montage (pistes vidéo uniquement) en PCM 16 kHz mono, pour la reconnaissance vocale
function buildSpeechPlan(p, out) {
  const vis = p.visual || [], lay = KS.layoutVisual(vis), a = [...base(p)], f = []; let k = 0; const mix = [];
  lay.forEach(({ c, s }, i) => {
    const d = dur(c), sp = c.speed || 1, ms = Math.round(s * 1000);
    if (c.type !== 'video') return;
    if (c.sound && c.sound.path) { a.push('-ss', String(c.sound.start || 0), '-t', String(d), '-i', c.sound.path); f.push(`[${k++}:a]${AF},adelay=${ms}:all=1[s${i}]`); }
    else if (c.hasAudio) { a.push('-ss', String(c.start), '-t', String(+(c.end - c.start).toFixed(3)), '-i', c.path); f.push(`[${k++}:a]${AF}${sp !== 1 ? `,atempo=${sp}` : ''},adelay=${ms}:all=1[s${i}]`); }
    else return;
    mix.push(`[s${i}]`);
  });
  if (!mix.length) return null;
  f.push(`${mix.join('')}amix=inputs=${mix.length}:duration=longest:normalize=0,aresample=16000,aformat=sample_fmts=s16:channel_layouts=mono[o]`);
  a.push('-filter_complex', f.join(';'), '-map', '[o]', '-f', 's16le', out);
  const total = KS.total({ visual: vis });
  return { steps: [{ args: a, dur: total, w: total }], list: null, total };
}
module.exports = { buildPlan, buildSpeechPlan, QUAL };
