// Construit la commande FFmpeg à partir du projet (vidéo/images, audio, textes)
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

function buildArgs(p, out) {
  const H = p.height || 720, W = Math.round(H * 16 / 9 / 2) * 2;
  const vis = p.visual || [], aud = p.audio || [], txt = p.text || [], a = ['-y'], f = [];
  const FIT = `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${FPS},format=yuv420p`;
  let total = 0, k = 0;
  vis.forEach((c, i) => {
    const d = dur(c); total += d;
    if (c.type === 'video') {
      const sp = c.speed || 1;
      a.push('-ss', String(c.start), '-t', String(+(c.end - c.start).toFixed(3)), '-i', c.path);
      f.push(`[${k}:v]setpts=(PTS-STARTPTS)/${sp},${FIT}${eqf(c)}[v${i}]`);
      if (c.sound && c.sound.path) {
        k++; a.push('-ss', String(c.sound.start || 0), '-t', String(d), '-i', c.sound.path);
        f.push(`[${k}:a]${AF},apad,atrim=0:${d},asetpts=PTS-STARTPTS,${afx(c, d)}[a${i}]`);
      } else f.push(c.hasAudio
        ? `[${k}:a]${AF}${sp !== 1 ? `,atempo=${sp}` : ''},${afx(c, d)}[a${i}]`
        : `anullsrc=r=44100:cl=stereo:d=${d}[a${i}]`);
    } else {
      imageChain(c, d, W, H, i, k, a, f);
      f.push(`anullsrc=r=44100:cl=stereo:d=${d}[a${i}]`);
    }
    k++;
  });
  let audTotal = 0;
  aud.forEach((c, j) => {
    const d = dur(c); audTotal += d;
    a.push('-ss', String(c.start), '-t', String(d), '-i', c.path);
    f.push(`[${k}:a]${AF},${afx(c, d)}[b${j}]`);
    k++;
  });
  if (aud.length) {
    let src = '[b0]';
    if (aud.length > 1) { f.push(`${aud.map((_, j) => `[b${j}]`).join('')}concat=n=${aud.length}:v=0:a=1[bgc]`); src = '[bgc]'; }
    f.push(`${src}anull[bg]`);
  }
  if (vis.length) {
    f.push(`${vis.map((_, i) => `[v${i}][a${i}]`).join('')}concat=n=${vis.length}:v=1:a=1[vc][ac]`);
    let last = 'vc';
    txt.forEach((c, j) => {
      const st = +c.start.toFixed(3), et = +Math.min(total, c.start + c.dur).toFixed(3);
      if (st >= total || !c.pngPath) return;
      a.push('-loop', '1', '-framerate', String(FPS), '-t', String(+total.toFixed(3)), '-i', c.pngPath);
      const an = c.anim || 'none', p5 = `pow(1-min(1,max(0,(t-${st})/0.5)),2)`;
      let ch = `[${k}:v]format=rgba`;
      if (an !== 'none') ch += `,fade=t=in:st=${st}:d=0.5:alpha=1,fade=t=out:st=${Math.max(st, et - 0.3).toFixed(3)}:d=0.3:alpha=1`;
      f.push(`${ch}[tx${j}]`);
      const x = an === 'slideleft' ? `-${(0.15 * W).toFixed(1)}*${p5}` : an === 'slideright' ? `${(0.15 * W).toFixed(1)}*${p5}` : '0';
      const y = an === 'slideup' ? `${(0.15 * H).toFixed(1)}*${p5}` : an === 'slidedown' ? `-${(0.15 * H).toFixed(1)}*${p5}` : '0';
      f.push(`[${last}][tx${j}]overlay=x='${x}':y='${y}':enable='between(t,${st},${et})':format=auto[o${j}]`);
      last = `o${j}`; k++;
    });
    if (aud.length) f.push('[ac][bg]amix=inputs=2:duration=first:normalize=0[ao]');
    a.push('-filter_complex', f.join(';'), '-map', `[${last}]`, '-map', aud.length ? '[ao]' : '[ac]',
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart');
  } else {
    total = audTotal;
    a.push('-filter_complex', f.join(';'), '-map', '[bg]');
    if (/\.mp3$/i.test(out)) a.push('-c:a', 'libmp3lame', '-b:a', '192k');
    else if (/\.m4a$/i.test(out)) a.push('-c:a', 'aac', '-b:a', '192k');
  }
  a.push(out);
  return { args: a, total };
}
module.exports = { buildArgs };
