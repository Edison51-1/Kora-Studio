const $ = s => document.querySelector(s);
let cur = null;
function fill(v) {
  cur = v; const s = v.settings, p = v.perf, names = { eco: 'Économique', balanced: 'Équilibré', max: 'Performance' };
  $('#gFmt').value = s.general.defaultFormat; $('#gZoom').value = String(s.general.uiZoom); $('#gDir').value = s.general.exportDir;
  $('#gCompact').checked = s.general.compact; $('#gLib').checked = s.general.showLib; $('#gInsp').checked = s.general.showInsp;
  $('#pProfile').value = s.perf.profile; $('#pThreads').value = String(s.perf.threads); $('#pPreset').value = s.perf.preset; $('#pAsr').value = s.perf.asrModel;
  $('#pWave').value = s.perf.waveforms; $('#pLow').checked = s.perf.lowPriority;
  $('#eQual').value = s.export.quality; $('#eRes').value = String(s.export.resolution); $('#eKbps').value = String(s.export.kbps); $('#eNorm').checked = s.export.normalize;
  $('#jAuto').checked = s.project.autosave; $('#jSec').value = String(s.project.autosaveSec); $('#jQuit').checked = s.project.confirmQuit;
  $('#hw').innerHTML = `Ton ordinateur : <b>${v.hw.cores} cœurs</b> · <b>${v.hw.ramGB} Go de RAM</b><br>Profil appliqué : <b>${names[p.profile]}</b> — export sur <b>${p.threads}</b> thread(s), vitesse « ${p.preset} », sous-titres « ${p.asrModel} » sur ${p.asrThreads} thread(s).`;
}
const num = (id, d) => { const n = parseFloat($(id).value); return isNaN(n) ? d : n; };
function collect() {
  return {
    general: { defaultFormat: $('#gFmt').value, uiZoom: num('#gZoom', 1), exportDir: $('#gDir').value.trim(), compact: $('#gCompact').checked, showLib: $('#gLib').checked, showInsp: $('#gInsp').checked },
    perf: { profile: $('#pProfile').value, threads: num('#pThreads', 0), preset: $('#pPreset').value, asrModel: $('#pAsr').value, waveforms: $('#pWave').value, lowPriority: $('#pLow').checked },
    export: { quality: $('#eQual').value, resolution: num('#eRes', 720), kbps: num('#eKbps', 192), normalize: $('#eNorm').checked },
    project: { autosave: $('#jAuto').checked, autosaveSec: num('#jSec', 20), confirmQuit: $('#jQuit').checked }
  };
}
const note = t => { $('#state').textContent = t; clearTimeout(note.h); note.h = setTimeout(() => $('#state').textContent = '', 3000); };
document.querySelectorAll('nav button').forEach(b => b.onclick = () => {
  document.querySelectorAll('nav button').forEach(x => x.classList.toggle('on', x === b));
  ['g', 'p', 'e', 'j', 'm'].forEach(k => $('#p' + k).hidden = k !== b.dataset.p);
});
$('#bSaveSet').onclick = async () => { fill(await kset.save(collect())); note('Paramètres enregistrés'); };
$('#bClose').onclick = () => kset.close();
$('#gPick').onclick = async () => { const d = await kset.pickDir(); if (d) $('#gDir').value = d; };
$('#mLogs').onclick = () => kset.logs();
$('#mModels').onclick = async () => note((await kset.clearModels()) ? 'Modèles supprimés' : 'Suppression impossible');
$('#mReset').onclick = async () => { if (confirm('Remettre tous les paramètres par défaut ?')) { fill(await kset.reset()); note('Paramètres réinitialisés'); } };
addEventListener('keydown', e => { if (e.key === 'Escape') kset.close(); });
kset.get().then(fill);
