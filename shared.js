// Fonctions communes à l'interface et au moteur d'export (durées, mise en page de la timeline, formats)
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(); else root.KS = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const FORMATS = { '16:9': [16, 9], '9:16': [9, 16], '1:1': [1, 1], '4:5': [4, 5] };
  const even = n => Math.max(2, Math.round(n / 2) * 2);
  // short = petit côté de la vidéo (480, 720, 1080)
  function dims(fmt, short) {
    const [a, b] = FORMATS[fmt] || FORMATS['16:9'];
    return a >= b ? [even(short * a / b), even(short)] : [even(short), even(short * b / a)];
  }
  const spd = c => c.speed || 1;
  function len(c) {
    if (c.type === 'text' || c.type === 'over') return c.dur;
    if (c.type === 'video') return (c.end - c.start) / spd(c);
    return c.end - c.start;
  }
  // durée réelle de la transition entre le clip a et le clip suivant b
  function td(a, b) {
    if (!a || !b || !a.trans || !a.trans.type || a.trans.type === 'none') return 0;
    return Math.max(0, +Math.min(a.trans.dur || 0.6, len(a) / 2 - 0.05, len(b) / 2 - 0.05).toFixed(3));
  }
  function layoutVisual(v) {
    const out = [];
    v.forEach((c, i) => {
      const prev = out[i - 1], t = prev ? td(v[i - 1], c) : 0, s = prev ? prev.e - t : 0;
      out.push({ c, s, e: s + len(c), tin: t, tout: 0 });
      if (prev) prev.tout = t;
    });
    return out;
  }
  function layout(S, tr) {
    if (tr === 'visual') return layoutVisual(S.visual);
    return (S[tr] || []).map(c => ({ c, s: c.at, e: c.at + len(c) }));
  }
  function total(S) {
    const v = layoutVisual(S.visual || []);
    if (v.length) return v[v.length - 1].e;
    return Math.max(0, ...(S.audio || []).map(c => c.at + len(c)));
  }
  return { FORMATS, dims, len, td, layoutVisual, layout, total };
});
