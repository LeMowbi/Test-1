/*
 * Génère le jeu d'icônes PadelCo à partir d'un symbole vectoriel
 * (un « P » doré + une balle émeraude). Le symbole ne dépend pas du nom.
 *
 * Pour régénérer : npm i -D @resvg/resvg-js && node scripts/gen-icons.cjs
 */
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const GOLD = '#C9A24B';
const EMER = '#1FB57A';
const IMG = path.join(__dirname, '..', 'assets', 'images');
const BRAND = path.join(__dirname, '..', 'assets', 'brand');
fs.mkdirSync(BRAND, { recursive: true });

// Symbole centré dans un canvas 1024, mis à l'échelle par `s`.
function mark(s, gold = GOLD, emer = EMER) {
  const tx = (512 - 548 * s).toFixed(2);
  const ty = (512 - 512 * s).toFixed(2);
  return `<g transform="translate(${tx},${ty}) scale(${s})">
    <rect x="352" y="196" width="92" height="632" rx="46" fill="${gold}"/>
    <circle cx="548" cy="392" r="150" fill="none" stroke="${gold}" stroke-width="92"/>
    <circle cx="548" cy="392" r="44" fill="${emer}"/>
  </g>`;
}

function doc({ bg = false, rounded = false, s = 0.82, gold, emer, glow = false }) {
  let defs = '';
  let layers = '';
  if (bg) {
    defs += `<linearGradient id="bgg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#15171C"/><stop offset="1" stop-color="#0B0C0F"/></linearGradient>`;
    layers += `<rect x="0" y="0" width="1024" height="1024" rx="${rounded ? 220 : 0}" fill="url(#bgg)"/>`;
  }
  if (glow) {
    defs += `<radialGradient id="glow" cx="50%" cy="40%" r="46%"><stop offset="0" stop-color="${gold || GOLD}" stop-opacity="0.20"/><stop offset="1" stop-color="${gold || GOLD}" stop-opacity="0"/></radialGradient>`;
    layers += `<rect x="0" y="0" width="1024" height="1024" fill="url(#glow)"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><defs>${defs}</defs>${layers}${mark(s, gold, emer)}</svg>`;
}

function render(svg, size, out) {
  const r = new Resvg(svg, { fitTo: { mode: 'width', value: size }, background: 'rgba(0,0,0,0)' });
  fs.writeFileSync(out, r.render().asPng());
  console.log('→', path.basename(out), `${size}px`);
}

// Sources vectorielles (vérité de référence, éditables)
const iconSvg = doc({ bg: true, rounded: false, s: 0.82, glow: true });
const markSvg = doc({ bg: false, s: 0.92 });
fs.writeFileSync(path.join(BRAND, 'icon.svg'), iconSvg);
fs.writeFileSync(path.join(BRAND, 'mark.svg'), markSvg);

// Assets finaux
render(iconSvg, 1024, path.join(IMG, 'icon.png'));
render(doc({ bg: true, rounded: true, s: 0.82, glow: true }), 256, path.join(IMG, 'favicon.png'));
render(doc({ bg: false, s: 0.78 }), 1024, path.join(IMG, 'splash-icon.png'));
render(doc({ bg: false, s: 0.62 }), 1024, path.join(IMG, 'android-icon-foreground.png'));
render(doc({ bg: false, s: 0.62, gold: '#FFFFFF', emer: '#FFFFFF' }), 1024, path.join(IMG, 'android-icon-monochrome.png'));
render(markSvg, 512, path.join(IMG, 'brand-mark.png'));

// Aperçus (non commités)
render(doc({ bg: true, rounded: true, s: 0.82, glow: true }), 600, '/tmp/preview-icon.png');
console.log('OK');
