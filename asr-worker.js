// Reconnaissance vocale hors ligne (Whisper via transformers.js), dans un thread séparé
const { parentPort, workerData } = require('worker_threads');
const fs = require('fs');
(async () => {
  try {
    const { raw, model, lang, cache } = workerData;
    const { pipeline, env } = await import('@xenova/transformers');
    env.cacheDir = cache; env.allowLocalModels = false; env.useBrowserCache = false;
    const asr = await pipeline('automatic-speech-recognition', `Xenova/whisper-${model}`, { progress_callback: p => parentPort.postMessage({ type: 'progress', p }) });
    const buf = fs.readFileSync(raw), n = buf.length >> 1, pcm = new Float32Array(n);
    for (let i = 0; i < n; i++) pcm[i] = buf.readInt16LE(i * 2) / 32768;
    parentPort.postMessage({ type: 'status', text: 'Transcription en cours…' });
    const opts = { task: 'transcribe', return_timestamps: true, chunk_length_s: 30, stride_length_s: 5 };
    if (lang && lang !== 'auto') opts.language = lang;
    const res = await asr(pcm, opts);
    const chunks = (res.chunks || []).map(c => ({ text: String(c.text || '').trim(), start: c.timestamp[0], end: c.timestamp[1] })).filter(c => c.text);
    parentPort.postMessage({ type: 'done', chunks });
  } catch (e) { parentPort.postMessage({ type: 'error', message: String(e && e.message || e) }); }
})();
