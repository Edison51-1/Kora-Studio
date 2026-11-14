// Exécute le plan d'export étape par étape (une seule étape à la fois : peu de RAM)
const { spawn } = require('child_process');
const os = require('os');
const fs = require('fs');

function runStep(ffmpeg, step, onFrac, hold) {
  return new Promise(resolve => {
    const pr = spawn(ffmpeg, step.args, { stdio: ['ignore', 'pipe', 'pipe'] });
    hold.proc = pr;
    try { os.setPriority(pr.pid, 10); } catch (e) { /* priorité basse : l'ordinateur reste fluide */ }
    let buf = '', err = '';
    pr.stdout.on('data', d => {
      buf += d; const lines = buf.split('\n'); buf = lines.pop();
      for (const l of lines) { const m = /^out_time_us=(\d+)/.exec(l); if (m && step.dur) onFrac(Math.min(1, +m[1] / 1e6 / step.dur)); }
    });
    pr.stderr.on('data', d => { err = (err + d).slice(-2000); });
    pr.on('error', e => resolve({ code: -1, err: e.message }));
    pr.on('close', code => { hold.proc = null; resolve({ code, err }); });
  });
}

async function runPlan(plan, ffmpeg, onProgress, hold) {
  if (plan.list) fs.writeFileSync(plan.list.path, plan.list.content);
  const totalW = plan.steps.reduce((s, x) => s + x.w, 0) || 1; let done = 0;
  for (const st of plan.steps) {
    if (hold.cancelled) return { ok: false, error: 'Export annulé' };
    const r = await runStep(ffmpeg, st, f => onProgress((done + f * st.w) / totalW), hold);
    if (hold.cancelled) return { ok: false, error: 'Export annulé' };
    if (r.code !== 0) return { ok: false, error: r.err.trim().split('\n').slice(-4).join(' ') || 'Erreur FFmpeg (code ' + r.code + ')' };
    done += st.w; onProgress(done / totalW);
  }
  return { ok: true };
}
module.exports = { runPlan };
