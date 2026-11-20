const { Worker } = require('worker_threads');
const path = require('path');
// Lance la reconnaissance vocale. KORA_ASR_MOCK (tests) remplace le vrai modèle par un résultat fixe.
function transcribe(raw, { model, lang, cache }, onMsg, hold) {
  return new Promise(resolve => {
    if (process.env.KORA_ASR_MOCK) {
      onMsg({ type: 'status', text: 'Transcription en cours…' });
      return setTimeout(() => resolve({ ok: true, chunks: JSON.parse(process.env.KORA_ASR_MOCK) }), 30);
    }
    const w = new Worker(path.join(__dirname, 'asr-worker.js'), { workerData: { raw, model, lang, cache } });
    hold.worker = w;
    w.on('message', m => { if (m.type === 'done') resolve({ ok: true, chunks: m.chunks }); else if (m.type === 'error') resolve({ ok: false, error: m.message }); else onMsg(m); });
    w.on('error', e => resolve({ ok: false, error: e.message }));
    w.on('exit', code => { if (hold.cancelled) resolve({ ok: false, error: 'Annulé' }); else if (code) resolve({ ok: false, error: 'Arrêt inattendu (code ' + code + ')' }); });
  });
}
module.exports = { transcribe };
