const test = require('node:test');
const assert = require('node:assert');
const { DEFAULTS, merge, resolvePerf, pickProfile } = require('../settings.js');

test('un PC Core i5 4 cœurs / 8 Go reçoit le profil économique', () => {
  const hw = { cores: 4, ramGB: 8 };
  assert.strictEqual(pickProfile(hw), 'eco');
  const p = resolvePerf(DEFAULTS, hw);
  assert.strictEqual(p.threads, 2); assert.strictEqual(p.preset, 'superfast'); assert.strictEqual(p.asrThreads, 2); assert.ok(p.lowPriority);
});
test('un gros PC reçoit le profil performance', () => assert.strictEqual(pickProfile({ cores: 12, ramGB: 32 }), 'max'));
test('les réglages manuels passent avant le profil', () => {
  const s = merge(DEFAULTS, { perf: { threads: 3, preset: 'medium', asrModel: 'small' } });
  const p = resolvePerf(s, { cores: 4, ramGB: 8 });
  assert.deepStrictEqual([p.threads, p.preset, p.asrModel], [3, 'medium', 'small']);
});
test('les valeurs inconnues ou de mauvais type sont ignorées', () => {
  const s = merge(DEFAULTS, { perf: { threads: 'beaucoup', inconnu: 1 }, bidon: { a: 1 }, export: { quality: 'high' } });
  assert.strictEqual(s.perf.threads, 0); assert.ok(!('inconnu' in s.perf)); assert.strictEqual(s.export.quality, 'high');
});
