// Stickers et flèches vectoriels (dessinés pour KORA Studio) : la couleur est modifiable
const star = (r1, r2, n, rot = -90) => Array.from({ length: n * 2 }, (_, i) => { const r = i % 2 ? r2 : r1, a = (rot + i * 180 / n) * Math.PI / 180; return (50 + r * Math.cos(a)).toFixed(1) + ',' + (50 + r * Math.sin(a)).toFixed(1); }).join(' ');
const ARROW = c => `<path d="M8 38h52V20l32 30-32 30V62H8z" fill="${c}"/>`;
const rot = (a, c) => `<g transform="rotate(${a} 50 50)">${ARROW(c)}</g>`;
const ring = c => `fill="none" stroke="${c}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"`;
const STICKERS = [
  { id: 'ar-r', cat: 'Flèches', name: 'Flèche droite', col: '#ff3b30', svg: c => ARROW(c) },
  { id: 'ar-l', cat: 'Flèches', name: 'Flèche gauche', col: '#ff3b30', svg: c => rot(180, c) },
  { id: 'ar-u', cat: 'Flèches', name: 'Flèche haut', col: '#ff3b30', svg: c => rot(-90, c) },
  { id: 'ar-d', cat: 'Flèches', name: 'Flèche bas', col: '#ff3b30', svg: c => rot(90, c) },
  { id: 'ar-ur', cat: 'Flèches', name: 'Flèche haut-droite', col: '#ff3b30', svg: c => rot(-45, c) },
  { id: 'ar-dr', cat: 'Flèches', name: 'Flèche bas-droite', col: '#ff3b30', svg: c => rot(45, c) },
  { id: 'ar-dl', cat: 'Flèches', name: 'Flèche bas-gauche', col: '#ff3b30', svg: c => rot(135, c) },
  { id: 'ar-ul', cat: 'Flèches', name: 'Flèche haut-gauche', col: '#ff3b30', svg: c => rot(-135, c) },
  { id: 'ar-curve', cat: 'Flèches', name: 'Flèche courbe', col: '#ff3b30', svg: c => `<path d="M14 84C12 36 50 20 74 36" ${ring(c)}/><path d="M60 14l32 22-34 12z" fill="${c}"/>` },
  { id: 'ar-double', cat: 'Flèches', name: 'Double flèche', col: '#ff3b30', svg: c => `<path d="M6 50l26-24v15h36V26l26 24-26 24V59H32v15z" fill="${c}"/>` },
  { id: 'chev', cat: 'Flèches', name: 'Chevrons', col: '#ffd60a', svg: c => `<path d="M16 20l30 30-30 30M52 20l30 30-30 30" ${ring(c).replace('9', '12')}/>` },
  { id: 'circle', cat: 'Formes', name: 'Cercle', col: '#ffd60a', svg: c => `<circle cx="50" cy="50" r="40" ${ring(c)}/>` },
  { id: 'frame', cat: 'Formes', name: 'Cadre', col: '#ffd60a', svg: c => `<rect x="10" y="18" width="80" height="64" rx="10" ${ring(c)}/>` },
  { id: 'cross', cat: 'Formes', name: 'Croix', col: '#ff3b30', svg: c => `<path d="M20 20l60 60M80 20L20 80" ${ring(c).replace('9', '13')}/>` },
  { id: 'check', cat: 'Formes', name: 'Validé', col: '#30d158', svg: c => `<path d="M16 54l24 24 44-52" ${ring(c).replace('9', '13')}/>` },
  { id: 'star', cat: 'Formes', name: 'Étoile', col: '#ffd60a', svg: c => `<polygon points="${star(46, 20, 5)}" fill="${c}"/>` },
  { id: 'heart', cat: 'Formes', name: 'Cœur', col: '#ff2d55', svg: c => `<path d="M50 88C14 62 8 40 18 26c10-14 28-8 32 4 4-12 22-18 32-4 10 14 4 36-32 62z" fill="${c}"/>` },
  { id: 'target', cat: 'Gaming', name: 'Viseur', col: '#ff3b30', svg: c => `<circle cx="50" cy="50" r="32" ${ring(c)}/><path d="M50 6v24M50 70v24M6 50h24M70 50h24" ${ring(c)}/><circle cx="50" cy="50" r="4" fill="${c}"/>` },
  { id: 'bolt', cat: 'Gaming', name: 'Éclair', col: '#ffd60a', svg: c => `<path d="M58 4L20 56h26L38 96l44-58H56z" fill="${c}"/>` },
  { id: 'flame', cat: 'Gaming', name: 'Flamme', col: '#ff9500', svg: c => `<path d="M50 4C58 26 82 36 82 62a32 32 0 0 1-64 0c0-14 10-22 16-32 4 10 8 12 12 12-2-12 0-28 4-38z" fill="${c}"/>` },
  { id: 'burst', cat: 'Badges', name: 'Explosion WOW', col: '#ff9500', svg: c => `<polygon points="${star(48, 34, 12)}" fill="${c}"/><text x="50" y="58" font-family="Arial Black,Impact,sans-serif" font-size="24" font-weight="900" fill="#fff" text-anchor="middle">WOW</text>` },
  { id: 'exclaim', cat: 'Badges', name: 'Attention', col: '#ff3b30', svg: c => `<circle cx="50" cy="50" r="44" fill="${c}"/><rect x="43" y="20" width="14" height="38" rx="7" fill="#fff"/><circle cx="50" cy="75" r="8" fill="#fff"/>` },
  { id: 'question', cat: 'Badges', name: 'Question', col: '#0a84ff', svg: c => `<circle cx="50" cy="50" r="44" fill="${c}"/><path d="M34 38a16 16 0 1 1 24 13c-6 4-8 7-8 13" fill="none" stroke="#fff" stroke-width="10" stroke-linecap="round"/><circle cx="50" cy="80" r="7" fill="#fff"/>` },
  { id: 'bubble', cat: 'Badges', name: 'Bulle', col: '#ffffff', svg: c => `<path d="M12 14h76a8 8 0 0 1 8 8v40a8 8 0 0 1-8 8H46L26 90V70H12a8 8 0 0 1-8-8V22a8 8 0 0 1 8-8z" fill="${c}" stroke="#111" stroke-width="3"/>` },
  { id: 'new', cat: 'Badges', name: 'NEW', col: '#30d158', svg: c => `<rect x="4" y="26" width="92" height="48" rx="12" fill="${c}"/><text x="50" y="60" font-family="Arial Black,Impact,sans-serif" font-size="26" font-weight="900" fill="#fff" text-anchor="middle">NEW</text>` },
  { id: 'live', cat: 'Badges', name: 'LIVE', col: '#ff3b30', svg: c => `<rect x="4" y="26" width="92" height="48" rx="12" fill="${c}"/><circle cx="24" cy="50" r="7" fill="#fff"/><text x="62" y="60" font-family="Arial Black,Impact,sans-serif" font-size="24" font-weight="900" fill="#fff" text-anchor="middle">LIVE</text>` }
];
const stickerDef = id => STICKERS.find(s => s.id === id);
const stickerSvg = (id, color) => { const d = stickerDef(id); return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="512" height="512">${d.svg(color || d.col)}</svg>`; };
const stickerUrl = (id, color) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(stickerSvg(id, color));
