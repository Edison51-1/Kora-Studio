// Plan d'export en étapes : 1 fichier temporaire par clip, puis assemblage (léger en RAM)
const path = require('path');
const FPS = 30;
const AF = 'aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo';
const LEGACY = { fade: 'fadeinout', pan: 'panright' };
const dur = c => Math.max(0.1, +((c.end - c.start) / (c.speed || 1)).toFixed(3));
const Q = "pow(1-min(1,t/0.6),2)";

const eqf = c => {
  const b = c.bright || 0, ct = c.contrast ?? 1, s = c.sat ?? 1;
  return b || ct !== 1 || s !== 1 ? `,eq=brightness=${b}:contrast=${ct}:saturation=${s}` : '';
};
const afx = (c, d) => {
  const a = [`volume=${c.mute ? 0 : (c.vol ?? 1)}`];
  if (c.fi > 0) a.push(`afade=t=in:st=0:d=${c.fi}`);
  if (c.fo > 0) a.push(`afade=t=out:st=${Math.max(0, d - c.fo).toFixed(3)}:d=${c.fo}`);
  return a.join(',');
};
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

function imageChain(c, d, W, H, i, k, args, f) {
  const fr = Math.round(d * FPS), an = LEGACY[c.anim] || c.anim || 'none', fd = Math.min(0.6, d / 3);
  const cover = c.fit === 'cover', E = eqf(c), src = `[${k}:v]`, out = `[v${i}]`;
  const fit = (w, h) => cover
    ? `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}`
    : `scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2`;
  if (ZP[an]) {
    const [z, x, y] = ZP[an](fr);
    args.push('-i', c.path);
    f.push(`${src}${fit(W * 2, H * 2)},setsar=1,zoompan=z='${z}':x='${x}':y='${y}':d=${fr}:s=${W}x${H}:fps=${FPS},setsar=1${E},format=yuv420p${out}`);
    return;
  }
  args.push('-loop', '1', '-framerate', String(FPS), '-t', String(d), '-i', c.path);
  const base = `${src}${fit(W, H)},setsar=1,fps=${FPS}`;
  if (SLIDE[an]) {
    const [x, y] = SLIDE[an].map(s => s.replace(/W/g, W).replace(/H/g, H));
    f.push(`color=c=black:s=${W}x${H}:r=${FPS}:d=${d}[bg${i}]`);
    f.push(`${base}${E},format=yuv420p[im${i}]`);
    f.push(`[bg${i}][im${i}]overlay=x='${x}':y='${y}':shortest=1,format=yuv420p${out}`);
  } else if (an === 'rotate') {
    f.push(`${base},rotate=a='2*PI*t/${d}':c=black:ow=${W}:oh=${H}${E},format=yuv420p${out}`);
  } else if (an === 'shake') {
    f.push(`${base},crop=w=iw-40:h=ih-40:x='20+16*sin(t*25)':y='20+16*cos(t*31)',scale=${W}:${H},setsar=1${E},format=yuv420p${out}`);
  } else {
    let fx = '';
    if (an === 'fadein' || an === 'fadeinout') fx += `,fade=t=in:st=0:d=${fd}`;
    if (an === 'fadeout' || an === 'fadeinout') fx += `,fade=t=out:st=${(d - fd).toFixed(3)}:d=${fd}`;
    f.push(`${base}${E}${fx},format=yuv420p${out}`);
  }
}


const BASE = ['-hide_banner', '-nostdin', '-loglevel', 'error', '-progress', 'pipe:1', '-nostats', '-y'];
const VENC = crf => ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', String(crf), '-pix_fmt', 'yuv420p'];
const AENC = ['-c:a', 'aac', '-b:a', '192k', '-ar', '44100', '-ac', '2'];
const PCM = ['-c:a', 'pcm_s16le', '-ar', '44100', '-ac', '2']; // son exact dans les fichiers temporaires (pas de décalage)
const fwd = p => p.replace(/\\/g, '/');

function segment(c, W, H, tmp, i) {
  const d = dur(c), a = [...BASE], f = [];
  const FIT = `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${FPS},format=yuv420p`;
  if (c.type === 'video') {
    const sp = c.speed || 1;
    a.push('-ss', String(c.start), '-t', String(+(c.end - c.start).toFixed(3)), '-i', c.path);
    f.push(`[0:v]setpts=(PTS-STARTPTS)/${sp},${FIT}${eqf(c)},tpad=stop_mode=clone:stop_duration=2,trim=duration=${d},setpts=PTS-STARTPTS[v0]`);
    if (c.sound && c.sound.path) {
      a.push('-ss', String(c.sound.start || 0), '-t', String(d), '-i', c.sound.path);
      f.push(`[1:a]${AF},apad,atrim=0:${d},asetpts=PTS-STARTPTS,${afx(c, d)}[a0]`);
    } else if (c.hasAudio) f.push(`[0:a]${AF}${sp !== 1 ? `,atempo=${sp}` : ''},apad,atrim=0:${d},asetpts=PTS-STARTPTS,${afx(c, d)}[a0]`);
    else f.push(`anullsrc=r=44100:cl=stereo:d=${d}[a0]`);
  } else {
    imageChain(c, d, W, H, 0, 0, a, f);
    f.push(`anullsrc=r=44100:cl=stereo:d=${d}[a0]`);
  }
  const file = path.join(tmp, `s${i}.mkv`);
  a.push('-filter_complex', f.join(';'), '-map', '[v0]', '-map', '[a0]', ...VENC(18), '-r', String(FPS), ...PCM,
    '-t', String(d), '-f', 'matroska', file);
  return { args: a, dur: d, w: d, file };
}

function buildPlan(p, out, tmp) {
  const H = p.height || 720, W = Math.round(H * 16 / 9 / 2) * 2;
  const vis = p.visual || [], aud = p.audio || [], txt = p.text || [], steps = [];
  const audioInputs = (a, f, k) => {
    aud.forEach((c, j) => {
      const d = dur(c), sp = c.speed || 1;
      a.push('-ss', String(c.start), '-t', String(+(c.end - c.start).toFixed(3)), '-i', c.path);
      f.push(`[${k + j}:a]${AF}${sp !== 1 ? `,atempo=${sp}` : ''},${afx(c, d)}[b${j}]`);
    });
    let src = '[b0]';
    if (aud.length > 1) { f.push(`${aud.map((_, j) => `[b${j}]`).join('')}concat=n=${aud.length}:v=0:a=1[bgc]`); src = '[bgc]'; }
    return src;
  };
  if (!vis.length) {
    const a = [...BASE], f = [], src = audioInputs(a, f, 0), t = aud.reduce((s, c) => s + dur(c), 0);
    f.push(`${src}anull[bg]`);
    a.push('-filter_complex', f.join(';'), '-map', '[bg]');
    if (/\.mp3$/i.test(out)) a.push('-vn', '-c:a', 'libmp3lame', '-b:a', `${p.kbps || 192}k`); else if (/\.m4a$/i.test(out)) a.push('-c:a', 'aac', '-b:a', '192k');
    a.push(out); steps.push({ args: a, dur: t, w: t });
    return { steps, list: null, total: t };
  }
  let total = 0;
  vis.forEach((c, i) => { const s = segment(c, W, H, tmp, i); steps.push(s); total += s.dur; });
  const list = { path: path.join(tmp, 'list.txt'), content: steps.map(s => `file '${fwd(s.file).replace(/'/g, "'\\''")}'`).join('\n') };
  const a = [...BASE, '-f', 'concat', '-safe', '0', '-i', fwd(list.path)], f = [];
  let k = 1, main = '[0:v]', hasText = false;
  let ao = null;
  if (aud.length) { const src = audioInputs(a, f, k); k += aud.length; f.push(`[0:a]${src}amix=inputs=2:duration=first:normalize=0[ao]`); ao = '[ao]'; }
  txt.forEach((c, j) => {
    const st = +c.start.toFixed(3), et = +Math.min(total, c.start + c.dur).toFixed(3), d = +(et - st).toFixed(3);
    if (d <= 0.05 || !c.pngPath) return;
    hasText = true;
    a.push('-loop', '1', '-framerate', String(FPS), '-t', String(d), '-i', c.pngPath);
    const an = c.anim || 'none', p5 = `pow(1-min(1,max(0,(t-${st})/0.5)),2)`;
    let ch = `[${k}:v]format=rgba`;
    if (an !== 'none') ch += `,fade=t=in:st=0:d=0.5:alpha=1,fade=t=out:st=${Math.max(0, d - 0.3).toFixed(3)}:d=0.3:alpha=1`;
    f.push(`${ch},setpts=PTS+${st}/TB[tx${j}]`);
    const x = an === 'slideleft' ? `-${(0.15 * W).toFixed(1)}*${p5}` : an === 'slideright' ? `${(0.15 * W).toFixed(1)}*${p5}` : '0';
    const y = an === 'slideup' ? `${(0.15 * H).toFixed(1)}*${p5}` : an === 'slidedown' ? `-${(0.15 * H).toFixed(1)}*${p5}` : '0';
    f.push(`${main}[tx${j}]overlay=x='${x}':y='${y}':enable='between(t,${st},${et})':eof_action=pass:format=auto[o${j}]`);
    main = `[o${j}]`; k++;
  });
  if (f.length) a.push('-filter_complex', f.join(';'));
  if (hasText) a.push('-map', main, ...VENC(20)); else a.push('-map', '0:v', '-c:v', 'copy');
  a.push('-map', ao || '0:a', ...AENC, '-movflags', '+faststart', out);
  steps.push({ args: a, dur: total, w: hasText ? total : Math.max(0.2, total * 0.1) });
  return { steps, list, total };
}
module.exports = { buildPlan };
