const { fork } = require('child_process');
const os = require('os');
const path = require('path');
// Lance la reconnaissance vocale dans un processus à part. KORA_ASR_MOCK (tests) remplace le vrai modèle.
function transcribe(raw, { model, lang, cache, threads, lowPriority }, onMsg, hold) {
  return new Promise(resolve => {
    if (process.env.KORA_ASR_MOCK) {
      onMsg({ type: 'status', text: 'Transcription en cours…', v: 0.5 });
      return setTimeout(() => resolve({ ok: true, chunks: JSON.parse(process.env.KORA_ASR_MOCK) }), 30);
    }
    const child = fork(path.join(__dirname, 'asr-worker.js'), [], { env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }, stdio: ['ignore', 'ignore', 'pipe', 'ipc'] });
    hold.kill = () => { try { child.kill('SIGKILL'); } catch (e) { /* déjà arrêté */ } };
    if (lowPriority !== false) { try { os.setPriority(child.pid, 10); } catch (e) { /* ok */ } }
    let err = '';
    child.stderr.on('data', d => { err = (err + d).slice(-1500); });
    child.on('message', m => {
      if (m.type === 'done') { resolve({ ok: true, chunks: m.chunks }); hold.kill(); }
      else if (m.type === 'error') { resolve({ ok: false, error: m.message }); hold.kill(); }
      else onMsg(m);
    });
    child.on('error', e => resolve({ ok: false, error: e.message }));
    child.on('exit', code => resolve(hold.cancelled ? { ok: false, error: 'Annulé' } : { ok: false, error: 'Arrêt inattendu' + (code ? ' (code ' + code + ')' : '') + (err ? ' : ' + err.trim().split('\n').pop() : '') }));
    child.send({ raw, model, lang, cache, threads });
  });
}
module.exports = { transcribe };
