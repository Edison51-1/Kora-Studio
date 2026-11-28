const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs'), os = require('os'), path = require('path');
const { classify, hostsFor, HF, MIRROR } = require('../asr-errors.js');
const asr = require('../asr.js');

test('les erreurs réseau sont expliquées en français', () => {
  assert.strictEqual(classify({ stage: 'model', message: 'fetch failed', code: 'ENOTFOUND' }).code, 'dns');
  assert.strictEqual(classify({ stage: 'model', message: 'x', code: 'ETIMEDOUT' }).code, 'timeout');
  assert.strictEqual(classify({ stage: 'model', message: 'unable to verify the first certificate' }).code, 'cert');
  assert.strictEqual(classify({ stage: 'model', message: 'Unauthorized access to file (401)' }).code, 'http');
  assert.strictEqual(classify({ stage: 'module', message: "Cannot find module 'sharp'" }).code, 'module');
  assert.strictEqual(classify({ stage: 'run', message: 'std::bad_alloc' }).code, 'memory');
  assert.strictEqual(classify({ stage: 'audio', message: 'x' }).code, 'audio');
  assert.strictEqual(classify({ message: 'Aucune vidéo avec du son sur la timeline.' }).code, 'noaudio');
  assert.ok(classify({ message: 'bizarre' }).advice.length > 0);
});
test('serveurs : automatique = Hugging Face puis miroir', () => {
  assert.deepStrictEqual(hostsFor('auto'), [HF, MIRROR]); assert.deepStrictEqual(hostsFor('mirror'), [MIRROR]); assert.deepStrictEqual(hostsFor('hf'), [HF]);
});
test('la reconnaissance bascule sur le miroir quand le premier serveur est injoignable', async () => {
  const raw = path.join(os.tmpdir(), 'kora-asr-test.raw'), buf = Buffer.alloc(16000 * 2 * 4);
  for (let i = 0; i < 16000 * 4; i++) buf.writeInt16LE(Math.round(Math.sin(i / 20) * 9000), i * 2);
  fs.writeFileSync(raw, buf);
  process.env.KORA_ASR_MODULE = 'file://' + path.join(__dirname, 'fake-asr-module.mjs');
  const msgs = [], r = await asr.transcribe(raw, { model: 'base', lang: 'french', cache: os.tmpdir(), threads: 1, hosts: [HF, MIRROR] }, m => msgs.push(m.text || m.type), {});
  delete process.env.KORA_ASR_MODULE; fs.rmSync(raw, { force: true });
  assert.ok(r.ok, JSON.stringify(r)); assert.strictEqual(r.chunks[0].text, 'Bonjour du miroir');
  assert.ok(msgs.some(t => /hf-mirror\.com/.test(t || '')), 'le miroir est annoncé : ' + msgs.join(' | '));
});
test('si tous les serveurs échouent, l\'erreur contient chaque serveur et le code réseau', async () => {
  const raw = path.join(os.tmpdir(), 'kora-asr-test2.raw'); fs.writeFileSync(raw, Buffer.alloc(16000 * 2 * 2));
  process.env.KORA_ASR_MODULE = 'file://' + path.join(__dirname, 'fake-asr-module.mjs'); process.env.FAKE_ASR_ALL_FAIL = '1';
  const r = await asr.transcribe(raw, { model: 'base', cache: os.tmpdir(), threads: 1, hosts: [HF, MIRROR] }, () => {}, {});
  delete process.env.KORA_ASR_MODULE; delete process.env.FAKE_ASR_ALL_FAIL; fs.rmSync(raw, { force: true });
  assert.strictEqual(r.ok, false); assert.strictEqual(r.stage, 'model');
  assert.ok(/huggingface\.co/.test(r.error) && /hf-mirror\.com/.test(r.error), r.error);
  assert.strictEqual(classify({ stage: r.stage, message: r.error, code: r.code }).code, 'dns');
});
test('un moteur introuvable est signalé comme tel', async () => {
  const raw = path.join(os.tmpdir(), 'kora-asr-test3.raw'); fs.writeFileSync(raw, Buffer.alloc(32000));
  process.env.KORA_ASR_MODULE = 'file:///inexistant/module.mjs';
  const r = await asr.transcribe(raw, { model: 'base', cache: os.tmpdir(), threads: 1, hosts: [HF] }, () => {}, {});
  delete process.env.KORA_ASR_MODULE; fs.rmSync(raw, { force: true });
  assert.strictEqual(r.ok, false); assert.strictEqual(r.stage, 'module'); assert.strictEqual(classify({ stage: r.stage, message: r.error }).code, 'module');
});
