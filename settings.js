// Paramètres de l'application et profils de performance (fonctions pures, testées)
const DEFAULTS = {
  general: { defaultFormat: '16:9', exportDir: '', uiZoom: 1, compact: false, showLib: true, showInsp: true, tlHeight: 0 },
  perf: { profile: 'auto', threads: 0, preset: '', waveforms: 'audio', asrModel: '', asrThreads: 0, lowPriority: true },
  export: { quality: 'standard', resolution: 720, normalize: false, kbps: 192 },
  project: { autosave: true, autosaveSec: 20, confirmQuit: true }
};
const clone = o => JSON.parse(JSON.stringify(o));
function merge(base, patch) {
  const out = clone(base);
  for (const g of Object.keys(patch || {})) {
    if (!(g in out) || typeof patch[g] !== 'object' || patch[g] === null) continue;
    for (const k of Object.keys(patch[g])) if (k in out[g] && typeof patch[g][k] === typeof out[g][k]) out[g][k] = patch[g][k];
  }
  return out;
}
const PROFILES = {
  eco: c => ({ threads: Math.max(1, Math.floor(c / 2)), filterThreads: 1, preset: 'superfast', asrModel: 'base', asrThreads: Math.max(1, Math.floor(c / 2)) }),
  balanced: c => ({ threads: Math.max(2, c - 1), filterThreads: 2, preset: 'veryfast', asrModel: 'base', asrThreads: Math.max(2, c - 1) }),
  max: c => ({ threads: c, filterThreads: 2, preset: 'faster', asrModel: 'small', asrThreads: c })
};
function pickProfile(hw) { return hw.cores >= 8 && hw.ramGB >= 12 ? 'max' : hw.cores >= 6 && hw.ramGB >= 10 ? 'balanced' : 'eco'; }
function resolvePerf(s, hw) {
  const cores = Math.max(1, hw.cores | 0), profile = s.perf.profile === 'auto' ? pickProfile(hw) : s.perf.profile;
  const p = PROFILES[profile](cores);
  if (s.perf.threads > 0) { p.threads = Math.min(cores, s.perf.threads); }
  if (s.perf.asrThreads > 0) p.asrThreads = Math.min(cores, s.perf.asrThreads);
  if (s.perf.preset) p.preset = s.perf.preset;
  if (s.perf.asrModel) p.asrModel = s.perf.asrModel;
  return { ...p, profile, lowPriority: s.perf.lowPriority !== false, waveforms: s.perf.waveforms };
}
module.exports = { DEFAULTS, merge, resolvePerf, pickProfile, PROFILES };
