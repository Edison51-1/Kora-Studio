// Tests du moteur d'export : lancent le vrai FFmpeg sur des médias synthétiques
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs'), os = require('os'), path = require('path');
const { execFileSync } = require('child_process');
const FFMPEG = require('ffmpeg-static'), FFPROBE = require('ffprobe-static').path;
const { buildPlan, buildSpeechPlan } = require('../export.js');
const { runPlan } = require('../runner.js');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kora-test-'));
const P = n => path.join(dir, n);
const ff = (...a) => execFileSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', ...a]);
const probe = f => JSON.parse(execFileSync(FFPROBE, ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', f]));
const dur = f => parseFloat(probe(f).format.duration);
const run = async (project, out) => {
  const tmp = fs.mkdtempSync(path.join(dir, 't-'));
  const plan = buildPlan(project, out, tmp);
  const r = await runPlan(plan, FFMPEG, () => {}, { cancelled: false, proc: null });
  fs.rmSync(tmp, { recursive: true, force: true });
  assert.ok(r.ok, r.error); return plan;
};
const vid = (path, extra = {}) => ({ type: 'video', path, start: 0, end: 4, src: 6, hasAudio: true, vol: 1, ...extra });

test.before(() => {
  ff('-f', 'lavfi', '-i', 'testsrc2=d=6:s=640x360:r=30', '-f', 'lavfi', '-i', 'sine=frequency=440:d=6', '-shortest', '-c:v', 'libx264', '-preset', 'ultrafast', P('a.mp4'));
  ff('-f', 'lavfi', '-i', 'smptebars=d=6:s=640x360:r=30', '-f', 'lavfi', '-i', 'sine=frequency=880:d=6', '-shortest', '-c:v', 'libx264', '-preset', 'ultrafast', P('b.mp4'));
  ff('-f', 'lavfi', '-i', 'testsrc=d=1:s=640x360:r=1', '-frames:v', '1', P('img.png'));
  ff('-f', 'lavfi', '-i', 'color=c=red@0.6:s=256x256,format=rgba', '-frames:v', '1', P('sticker.png'));
  ff('-f', 'lavfi', '-i', 'color=c=white@0.5:s=640x360,format=rgba', '-frames:v', '1', P('text.png'));
  ff('-f', 'lavfi', '-i', 'sine=frequency=300:d=10', P('m.mp3'));
});
test.after(() => fs.rmSync(dir, { recursive: true, force: true }));

test('montage simple : vidéo + image + vidéo', async () => {
  const out = P('o1.mp4');
  await run({ short: 360, visual: [vid(P('a.mp4')), { type: 'image', path: P('img.png'), start: 0, end: 2, anim: 'zoomin' }, vid(P('b.mp4'), { start: 1, end: 3, speed: 2 })] }, out);
  assert.ok(Math.abs(dur(out) - 7) < 0.15, 'durée ' + dur(out));
});

test('transition : la durée totale diminue de la durée du fondu', async () => {
  const out = P('o2.mp4');
  await run({ short: 360, visual: [vid(P('a.mp4'), { trans: { type: 'fade', dur: 1 } }), vid(P('b.mp4'), { trans: { type: 'slideleft', dur: 0.8 } }), vid(P('a.mp4'))] }, out);
  assert.ok(Math.abs(dur(out) - (12 - 1 - 0.8)) < 0.2, 'durée ' + dur(out));
});

test('deux vidéos côte à côte en format vertical 9:16', async () => {
  const out = P('o3.mp4');
  await run({ short: 360, fmt: '9:16', visual: [vid(P('a.mp4'), { pair: { path: P('b.mp4'), start: 0, hasAudio: true, vol: 0.5, mode: 'h' } })] }, out);
  const v = probe(out).streams.find(s => s.codec_type === 'video');
  assert.deepStrictEqual([v.width, v.height], [360, 640]);
  assert.ok(Math.abs(dur(out) - 4) < 0.15);
});

test('incrustations, texte, pistes audio libres et normalisation', async () => {
  const out = P('o4.mp4');
  await run({
    short: 360, fmt: '1:1', normalize: true,
    visual: [vid(P('a.mp4'))],
    over: [
      { kind: 'sticker', type: 'over', pngPath: P('sticker.png'), at: 0.5, dur: 2, x: 70, y: 30, w: 25, rot: 20, op: 0.8, anim: 'pop' },
      { kind: 'image', type: 'over', path: P('img.png'), at: 1, dur: 2, x: 30, y: 70, w: 30, anim: 'slideup' },
      { kind: 'video', type: 'over', path: P('b.mp4'), start: 1, at: 1.5, dur: 2, x: 75, y: 75, w: 35, hasAudio: true, vol: 0.5, anim: 'fade' }],
    text: [{ kind: 'text', pngPath: P('text.png'), at: 2, dur: 1.5, anim: 'slideleft' }],
    audio: [{ type: 'audio', path: P('m.mp3'), start: 0, end: 3, at: 1, vol: 0.4, fo: 1 }, { type: 'audio', path: P('m.mp3'), start: 2, end: 4, at: 2.5, vol: 0.4 }]
  }, out);
  const v = probe(out).streams.find(s => s.codec_type === 'video');
  assert.deepStrictEqual([v.width, v.height], [360, 360]);
  assert.ok(Math.abs(dur(out) - 4) < 0.15);
});

test('MP3 : piste audio positionnée librement', async () => {
  const out = P('o5.mp3');
  await run({ kbps: 128, visual: [], audio: [{ type: 'audio', path: P('a.mp4'), start: 1, end: 5, speed: 2, at: 0 }, { type: 'audio', path: P('m.mp3'), start: 0, end: 3, at: 4 }] }, out);
  assert.ok(Math.abs(dur(out) - 7) < 0.2, 'durée ' + dur(out));
});

test('son pour la reconnaissance vocale (PCM 16 kHz)', async () => {
  const out = P('speech.raw'), plan = buildSpeechPlan({ visual: [vid(P('a.mp4'), { trans: { type: 'fade', dur: 1 } }), vid(P('b.mp4'))] }, out);
  const r = await runPlan(plan, FFMPEG, () => {}, { cancelled: false, proc: null });
  assert.ok(r.ok, r.error);
  assert.ok(Math.abs(fs.statSync(out).size / 32000 - 7) < 0.2);
});
