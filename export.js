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

const BASE = ['-hide_banner', '-nostdin', '-loglevel', 'error', '-progress', 'pipe:1', '-nostats', '-y'];
const venc = crf => ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', String(crf), '-pix_fmt', 'yuv420p'];
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

// Construit les entrées et filtres d'un clip complet → étiquettes [v0] et [a0] de durée d
function clipGraph(c, d, W, H, add, f) {
  const sp = c.speed || 1, E = eqf(c);
  const silence = () => `anullsrc=r=44100:cl=stereo:d=${d}`;
  if (c.type !== 'video') { imageChain(c, d, W, H, add, f); f.push(`${silence()}[a0]`); return; }
  const k0 = add('-ss', String(c.start), '-t', String(+(c.end - c.start).toFixed(3)), '-i', c.path);
  const tail = `tpad=stop_mode=clone:stop_duration=2,trim=duration=${d},setpts=PTS-STARTPTS`;
  let la; // audio principal (gauche)
  if (c.sound && c.sound.path) { const ks = add('-ss', String(c.sound.start || 0), '-t', String(d), '-i', c.sound.path); la = `[${ks}:a]${aprep(c)},apad,atrim=0:${d},asetpts=PTS-STARTPTS,${volf(c)}`; }
  else if (c.hasAudio) la = `[${k0}:a]${aprep(c)}${sp !== 1 ? `,atempo=${sp}` : ''},apad,atrim=0:${d},asetpts=PTS-STARTPTS,${volf(c)}`;
  else la = silence();
  if (!c.pair) {
    f.push(`[${k0}:v]setpts=(PTS-STARTPTS)/${sp},${fitContain(W, H)},setsar=1,fps=${FPS},format=yuv420p${E},${tail}[v0]`);
    f.push(`${la},${fades(c, d) || 'anull'}[a0]`);
    return;
  }
  // deux vidéos côte à côte (mode 'h') ou l'une au-dessus de l'autre (mode 'v')
  const p2 = c.pair, vert = p2.mode === 'v';
  const pw = vert ? W : Math.floor(W / 4) * 2, ph = vert ? Math.floor(H / 4) * 2 : H;
  const half = `${fitCover(pw, ph)},setsar=1,fps=${FPS},format=yuv420p`;
  const k1 = add('-ss', String(p2.start || 0), '-t', String(d), '-i', p2.path);
  f.push(`[${k0}:v]setpts=(PTS-STARTPTS)/${sp},${half}${E},${tail}[pl]`);
  f.push(`[${k1}:v]setpts=PTS-STARTPTS,${half},${tail}[pr]`);
  f.push(`[pl][pr]${vert ? 'vstack' : 'hstack'}=inputs=2,${fitContain(W, H)},setsar=1,format=yuv420p[v0]`);
  const ra = p2.hasAudio && !p2.mute ? `[${k1}:a]${AF},apad,atrim=0:${d},asetpts=PTS-STARTPTS,volume=${p2.vol ?? 1}` : silence();
  f.push(`${la}[la]`.replace(/\[la\]$/, '[la]'), `${ra}[ra]`);
  f.push(`[la][ra]amix=inputs=2:duration=longest:normalize=0,${fades(c, d) || 'anull'}[a0]`);
}

function segmentStep(c, i, ctx) {
  const { W, H, tmp, tin, tout, crf } = ctx, d = dur(c);
  const ins = [], f = [], add = (...x) => { ins.push(x); return ins.length - 1; };
  clipGraph(c, d, W, H, add, f);
  const parts = [];
  if (tin > 0) parts.push({ k: 'h', s: 0, e: tin });
  parts.push({ k: 'b', s: tin, e: +(d - tout).toFixed(3) });
  if (tout > 0) parts.push({ k: 't', s: +(d - tout).toFixed(3), e: d });
  const maps = [], files = {};
  if (parts.length === 1) {
    files.b = path.join(tmp, `b${i}.mkv`);
    maps.push(['[v0]', '[a0]', d, files.b]);
  } else {
    const n = parts.length, lab = pre => parts.map((_, j) => `[${pre}${j}]`).join('');
    f.push(`[v0]split=${n}${lab('vs')}`, `[a0]asplit=${n}${lab('as')}`);
    parts.forEach((p, j) => {
      f.push(`[vs${j}]trim=${p.s}:${p.e},setpts=PTS-STARTPTS[vo${j}]`, `[as${j}]atrim=${p.s}:${p.e},asetpts=PTS-STARTPTS[ao${j}]`);
      files[p.k] = path.join(tmp, `${p.k}${i}.mkv`);
      maps.push([`[vo${j}]`, `[ao${j}]`, +(p.e - p.s).toFixed(3), files[p.k]]);
    });
  }
  const args = [...BASE, ...ins.flat(), '-filter_complex', f.join(';')];
  maps.forEach(([v, a, t, file]) => args.push('-map', v, '-map', a, ...venc(crf), '-r', String(FPS), ...PCM, '-t', String(t), '-f', 'matroska', file));
  return { args, dur: d, w: d, files };
}

function transStep(tFile, hFile, td, type, tmp, i, crf) {
  const file = path.join(tmp, `x${i}.mkv`);
  const f = `[0:v][1:v]xfade=transition=${type}:duration=${td}:offset=0,format=yuv420p[v];[0:a][1:a]acrossfade=d=${td}[a]`;
  return { args: [...BASE, '-i', tFile, '-i', hFile, '-filter_complex', f, '-map', '[v]', '-map', '[a]', ...venc(crf), '-r', String(FPS), ...PCM, '-f', 'matroska', file], dur: td, w: td, file };
}

// animation d'entrée/sortie commune au texte et aux incrustations
function animBits(an, at, d, W, H) {
  const bits = { fade: '', x: '0', y: '0', pop: false };
  if (!an || an === 'none') return bits;
  bits.fade = `,fade=t=in:st=0:d=${IN}:alpha=1,fade=t=out:st=${Math.max(0, d - OUT).toFixed(3)}:d=${OUT}:alpha=1`;
  const p = `pow(1-min(1,max(0,(t-${at})/${IN})),2)`, dx = (0.15 * W).toFixed(1), dy = (0.15 * H).toFixed(1);
  if (an === 'slideleft') bits.x = `-${dx}*${p}`; else if (an === 'slideright') bits.x = `${dx}*${p}`;
  else if (an === 'slideup') bits.y = `${dy}*${p}`; else if (an === 'slidedown') bits.y = `-${dy}*${p}`;
  else if (an === 'pop') bits.pop = true;
  return bits;
}

function buildPlan(p, out, tmp) {
  const crf = QUAL[p.quality] || 22, [W, H] = KS.dims(p.fmt || '16:9', p.short || p.height || 720);
  const vis = p.visual || [], aud = p.audio || [], steps = [];
  const aClip = (c, k) => { const d = dur(c), sp = c.speed || 1; return `[${k}:a]${aprep(c)}${sp !== 1 ? `,atempo=${sp}` : ''},${afx(c, d)},adelay=${Math.round((c.at || 0) * 1000)}:all=1`; };
  if (!vis.length) { // audio seul (MP3, M4A, WAV)
    const a = [...BASE], f = []; let k = 0, tot = 0;
    aud.forEach((c, j) => { a.push('-ss', String(c.start), '-t', String(+(c.end - c.start).toFixed(3)), '-i', c.path); f.push(`${aClip(c, k++)}[b${j}]`); tot = Math.max(tot, (c.at || 0) + dur(c)); });
    f.push(aud.length > 1 ? `${aud.map((_, j) => `[b${j}]`).join('')}amix=inputs=${aud.length}:duration=longest:normalize=0[bg]` : '[b0]anull[bg]');
    a.push('-filter_complex', f.join(';'), '-map', '[bg]');
    if (/\.mp3$/i.test(out)) a.push('-vn', '-c:a', 'libmp3lame', '-b:a', `${p.kbps || 192}k`); else if (/\.m4a$/i.test(out)) a.push('-c:a', 'aac', '-b:a', '192k');
    a.push(out); steps.push({ args: a, dur: tot, w: tot });
    return { steps, list: null, total: tot };
  }
  const items = [...(p.over || []), ...(p.text || [])].filter(x => x.pngPath || x.path);
  const reencode = items.length > 0, segCrf = reencode ? Math.min(16, crf) : crf;
  const lay = KS.layoutVisual(vis), total = lay[lay.length - 1].e, order = [];
  const tFiles = [], hFiles = [];
  lay.forEach((l, i) => {
    const s = segmentStep(l.c, i, { W, H, tmp, tin: l.tin, tout: l.tout, crf: segCrf });
    steps.push(s); tFiles[i] = s.files.t; hFiles[i] = s.files.h;
  });
  lay.forEach((l, i) => {
    order.push(steps[i].files.b);
    if (l.tout > 0) {
      const type = vis[i].trans.type, x = transStep(tFiles[i], hFiles[i + 1], l.tout, type, tmp, i, segCrf);
      steps.push(x); order.push(x.file);
    }
  });
  const list = { path: path.join(tmp, 'list.txt'), content: order.map(f => `file '${fwd(f).replace(/'/g, "'\\''")}'`).join('\n') };
  const a = [...BASE, '-f', 'concat', '-safe', '0', '-i', fwd(list.path)], f = [];
  let k = 1, main = '[0:v]', hasVis = false;
  const add = (...x) => { a.push(...x); return k++; };
  const mix = ['[0:a]'];
  items.forEach((it, j) => {
    const at = +(it.at || 0).toFixed(3), et = +Math.min(total, at + it.dur).toFixed(3), d = +(et - at).toFixed(3);
    if (d <= 0.05 || at >= total) return;
    hasVis = true;
    const an = animBits(it.anim, at, d, W, H); let ch, x = an.x, y = an.y;
    if (it.kind === 'text') {
      const ki = add('-loop', '1', '-framerate', String(FPS), '-t', String(d), '-i', it.pngPath);
      ch = `[${ki}:v]format=rgba${an.fade}`;
    } else {
      const tw = Math.max(2, Math.round(W * (it.w || 30) / 100 / 2) * 2), rad = ((it.rot || 0) * Math.PI / 180).toFixed(4);
      let ki; const isVid = it.kind === 'video';
      if (isVid) ki = add('-ss', String(it.start || 0), '-t', String(d), '-i', it.path); else ki = add('-loop', '1', '-framerate', String(FPS), '-t', String(d), '-i', it.pngPath || it.path);
      ch = `[${ki}:v]${isVid ? 'setpts=PTS-STARTPTS,' : ''}format=rgba,` + (an.pop ? `scale=w='max(2,trunc(${tw}*(0.5+0.5*min(1,t/${IN}))/2)*2)':h=-2:eval=frame` : `scale=${tw}:-2`);
      if (it.rot) ch += `,rotate=a=${rad}:c=none:ow='rotw(${rad})':oh='roth(${rad})'`;
      if ((it.op ?? 1) < 1) ch += `,colorchannelmixer=aa=${it.op}`;
      ch += an.pop ? `,fade=t=in:st=0:d=${IN}:alpha=1,fade=t=out:st=${Math.max(0, d - OUT).toFixed(3)}:d=${OUT}:alpha=1` : an.fade;
      x = `${(W * (it.x ?? 50) / 100).toFixed(1)}-w/2${an.x !== '0' ? '+' + an.x : ''}`; y = `${(H * (it.y ?? 50) / 100).toFixed(1)}-h/2${an.y !== '0' ? '+' + an.y : ''}`;
      if (isVid && it.hasAudio && !it.mute) { f.push(`[${ki}:a]${AF},volume=${it.vol ?? 1},apad,atrim=0:${d},adelay=${Math.round(at * 1000)}:all=1[oa${j}]`); mix.push(`[oa${j}]`); }
    }
    f.push(`${ch},setpts=PTS+${at}/TB[ov${j}]`);
    f.push(`${main}[ov${j}]overlay=x='${x}':y='${y}':enable='between(t,${at},${et})':eof_action=pass:format=auto[o${j}]`);
    main = `[o${j}]`;
  });
  aud.forEach((c, j) => {
    const ki = add('-ss', String(c.start), '-t', String(+(c.end - c.start).toFixed(3)), '-i', c.path);
    f.push(`${aClip(c, ki)}[ba${j}]`); mix.push(`[ba${j}]`);
  });
  let ao = null;
  if (mix.length > 1) { f.push(`${mix.join('')}amix=inputs=${mix.length}:duration=first:normalize=0[am]`); ao = '[am]'; }
  if (p.normalize) { f.push(`${ao || '[0:a]'}loudnorm=I=-16:TP=-1.5:LRA=11[an]`); ao = '[an]'; }
  if (f.length) a.push('-filter_complex', f.join(';'));
  if (hasVis) a.push('-map', main, ...venc(crf)); else a.push('-map', '0:v', '-c:v', 'copy');
  a.push('-map', ao || '0:a', ...AENC, '-movflags', '+faststart', out);
  steps.push({ args: a, dur: total, w: hasVis ? total : Math.max(0.2, total * 0.1) });
  return { steps, list, total };
}

// Son du montage (pistes vidéo uniquement) en PCM 16 kHz mono, pour la reconnaissance vocale
function buildSpeechPlan(p, out) {
  const vis = p.visual || [], lay = KS.layoutVisual(vis), a = [...BASE], f = []; let k = 0; const mix = [];
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
