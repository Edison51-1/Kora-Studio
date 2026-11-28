const { fork } = require('child_process');
const os = require('os');
const path = require('path');
// Lance la reconnaissance vocale dans un processus à part.
// KORA_ASR_MOCK (tests) remplace le vrai modèle ; KORA_ASR_MOCK_ERROR simule une erreur.
function transcribe(raw, { model, lang, cache, threads, lowPriority, hosts }, onMsg, hold, idleMs = 180000) {
  return new Promise(resolve => {
    if (process.env.KORA_ASR_MOCK_ERROR) {
      onMsg({ type: 'stage', stage: 'model', text: 'Chargement du modèle…' });
      return setTimeout(() => resolve({ ok: false, ...JSON.parse(process.env.KORA_ASR_MOCK_ERROR) }), 300);
    }
    if (process.env.KORA_ASR_MOCK) {
      onMsg({ type: 'stage', stage: 'run', text: 'Transcription en cours…' });
      return setTimeout(() => resolve({ ok: true, chunks: JSON.parse(process.env.KORA_ASR_MOCK) }), 30);
    }
    const child = fork(path.join(__dirname, 'asr-worker.js'), [], { env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }, stdio: ['ignore', 'ignore', 'pipe', 'ipc'] });
    let finished = false, last = Date.now();
    const finish = r => { if (finished) return; finished = true; clearInterval(watch); resolve(r); };
    hold.kill = () => { try { child.kill('SIGKILL'); } catch (e) { /* déjà arrêté */ } };
    if (lowPriority !== false) { try { os.setPriority(child.pid, 10); } catch (e) { /* ok */ } }
    const watch = setInterval(() => { if (Date.now() - last > idleMs) { finish({ ok: false, stage: 'model', error: 'Aucune réponse du serveur ou du moteur depuis ' + Math.round(idleMs / 60000) + ' minutes', code: 'timeout' }); hold.kill(); } }, 5000);
    let err = '';
    child.stderr.on('data', d => { err = (err + d).slice(-1500); });
    child.on('message', m => {
      last = Date.now();
      if (m.type === 'done') { finish({ ok: true, chunks: m.chunks }); hold.kill(); }
      else if (m.type === 'error') { finish({ ok: false, stage: m.stage, error: m.message, code: m.code, stack: m.stack }); hold.kill(); }
      else onMsg(m);
    });
    child.on('error', e => finish({ ok: false, stage: 'module', error: e.message }));
    child.on('exit', code => finish(hold.cancelled ? { ok: false, error: 'Annulé' } : { ok: false, stage: 'module', error: 'Le processus de reconnaissance s\'est arrêté' + (code ? ' (code ' + code + ')' : '') + (err ? ' : ' + err.trim().split('\n').pop() : '') }));
    child.send({ raw, model, lang, cache, threads, hosts });
  });
}
module.exports = { transcribe };
