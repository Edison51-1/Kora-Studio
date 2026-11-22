// Reconnaissance vocale hors ligne (Whisper via transformers.js) dans un processus séparé :
// mémoire libérée à la fin, priorité basse, nombre de threads limité, découpage par fenêtres de ~28 s.
const fs = require('fs');
const send = m => process.send && process.send(m);
const SR = 16000;
const HALLU = /amara\.org|sous-titr(?:age|es?) (?:réalisé|par)|thanks for watching|merci d'avoir regardé/i;

async function run({ raw, model, lang, cache, threads }) {
  try { // limite les threads d'ONNX Runtime
    const ort = require('onnxruntime-node'), orig = ort.InferenceSession.create.bind(ort.InferenceSession);
    ort.InferenceSession.create = (a, b) => orig(a, { ...(b || {}), intraOpNumThreads: Math.max(1, threads || 2), interOpNumThreads: 1 });
  } catch (e) { /* réglage facultatif */ }
  const { pipeline, env } = await import(process.env.KORA_ASR_MODULE || '@xenova/transformers');
  env.cacheDir = cache; env.allowLocalModels = false; env.useBrowserCache = false;
  send({ type: 'status', text: 'Chargement du modèle…', v: null });
  const asr = await pipeline('automatic-speech-recognition', `Xenova/whisper-${model}`, { progress_callback: p => send({ type: 'progress', p }) });
  const buf = fs.readFileSync(raw), n = buf.length >> 1;
  const energy = (a, b) => { let s = 0; for (let i = a; i < b; i += 4) s += Math.abs(buf.readInt16LE(i * 2)); return s; };
  const wins = []; let pos = 0;
  while (pos < n) { // fenêtres de ~28 s coupées au moment le plus silencieux
    let end = Math.min(n, pos + 28 * SR);
    if (end < n) { let best = end, be = Infinity; for (let c = end - 3 * SR; c < end; c += SR / 10) { const e = energy(c, c + SR / 10); if (e < be) { be = e; best = c; } } end = Math.max(pos + 5 * SR, best); }
    wins.push([pos, end]); pos = end;
  }
  const out = []; let done = 0;
  for (const [a, b] of wins) {
    const len = b - a, step = 97; let peak = 0, sum = 0, cnt = 0;
    for (let i = a; i < b; i += step) { const v = Math.abs(buf.readInt16LE(i * 2)) / 32768; sum += v * v; cnt++; if (v > peak) peak = v; }
    const rms = Math.sqrt(sum / Math.max(1, cnt));
    if (rms >= 0.004 && peak >= 0.02) { // fenêtres silencieuses ignorées : gain de temps
      const pcm = new Float32Array(len); for (let i = 0; i < len; i++) pcm[i] = buf.readInt16LE((a + i) * 2) / 32768;
      const opts = { task: 'transcribe', return_timestamps: true }; if (lang && lang !== 'auto') opts.language = lang;
      const res = await asr(pcm, opts);
      (res.chunks || []).forEach(c => { const t = String(c.text || '').trim(); if (t && !HALLU.test(t)) out.push({ text: t, start: a / SR + (c.timestamp[0] || 0), end: c.timestamp[1] != null ? a / SR + c.timestamp[1] : null }); });
    }
    done++; send({ type: 'status', text: `Transcription en cours… ${done}/${wins.length}`, v: done / wins.length });
  }
  send({ type: 'done', chunks: out });
}
process.on('message', async cfg => {
  try { await run(cfg); } catch (e) { send({ type: 'error', message: String((e && e.message) || e) }); }
  setTimeout(() => process.exit(0), 50);
});
