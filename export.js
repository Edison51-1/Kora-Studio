// Construit la commande FFmpeg à partir du projet (timeline visuelle + pistes audio)
const FPS = 30;
const AF = 'aresample=44100,aformat=sample_fmts=fltp:channel_layouts=stereo';
const dur = c => Math.max(0.1, +(c.end - c.start).toFixed(3));

function buildArgs(p, out) {
  const H = p.height || 720, W = Math.round(H * 16 / 9 / 2) * 2;
  const FIT = `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${FPS},format=yuv420p`;
  const vol = c => `volume=${c.vol ?? 1}`;
  const vis = p.visual || [], aud = p.audio || [], a = ['-y'], f = [];
  let total = 0, k = 0;
  vis.forEach((c, i) => {
    const d = dur(c); total += d;
    if (c.type === 'video') {
      a.push('-ss', String(c.start), '-t', String(d), '-i', c.path);
      f.push(`[${k}:v]${FIT}[v${i}]`);
      f.push(c.hasAudio ? `[${k}:a]${AF},${vol(c)}[a${i}]` : `anullsrc=r=44100:cl=stereo:d=${d}[a${i}]`);
    } else {
      const fr = Math.round(d * FPS), an = c.anim || 'none', fd = Math.min(0.6, d / 3);
      let vf;
      if (an === 'zoomin' || an === 'zoomout' || an === 'pan') {
        a.push('-i', c.path);
        const z = an === 'zoomin' ? `1+0.3*on/${fr}` : an === 'zoomout' ? `1.3-0.3*on/${fr}` : '1.25';
        const x = an === 'pan' ? `(iw-iw/zoom)*on/${fr}` : 'iw/2-iw/zoom/2';
        const y = an === 'pan' ? '(ih-ih/zoom)/2' : 'ih/2-ih/zoom/2';
        vf = `scale=${W * 2}:${H * 2}:force_original_aspect_ratio=increase,crop=${W * 2}:${H * 2},zoompan=z='${z}':x='${x}':y='${y}':d=${fr}:s=${W}x${H}:fps=${FPS},setsar=1,format=yuv420p`;
      } else {
        a.push('-loop', '1', '-framerate', String(FPS), '-t', String(d), '-i', c.path);
        vf = FIT + (an === 'fade' ? `,fade=t=in:st=0:d=${fd},fade=t=out:st=${(d - fd).toFixed(3)}:d=${fd}` : '');
      }
      f.push(`[${k}:v]${vf}[v${i}]`);
      f.push(`anullsrc=r=44100:cl=stereo:d=${d}[a${i}]`);
    }
    k++;
  });
  let audTotal = 0;
  aud.forEach((c, j) => {
    const d = dur(c); audTotal += d;
    a.push('-ss', String(c.start), '-t', String(d), '-i', c.path);
    f.push(`[${k}:a]${AF},${vol(c)}[b${j}]`);
    k++;
  });
  if (aud.length) {
    let src = '[b0]';
    if (aud.length > 1) { f.push(`${aud.map((_, j) => `[b${j}]`).join('')}concat=n=${aud.length}:v=0:a=1[bgc]`); src = '[bgc]'; }
    f.push(`${src}anull[bg]`);
  }
  if (vis.length) {
    f.push(`${vis.map((_, i) => `[v${i}][a${i}]`).join('')}concat=n=${vis.length}:v=1:a=1[vc][ac]`);
    if (aud.length) f.push('[ac][bg]amix=inputs=2:duration=first:normalize=0[ao]');
    a.push('-filter_complex', f.join(';'), '-map', '[vc]', '-map', aud.length ? '[ao]' : '[ac]',
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
