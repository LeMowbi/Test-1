/*
 * Génère le jeu d'icônes PadelConnect : un « p » blanc + une balle lime,
 * sur une tuile vert profond (court). Lisible sur fond clair comme sombre.
 *
 * Régénérer : npm i -D @resvg/resvg-js && node scripts/gen-icons.cjs
 */
const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const PCOLOR = '#FFFFFF'; // « p »
const BALL = '#C6F24A'; // balle de padel (vert lime/fluo)
const IMG = path.join(__dirname, '..', 'assets', 'images');
const BRAND = path.join(__dirname, '..', 'assets', 'brand');
fs.mkdirSync(BRAND, { recursive: true });

// Symbole centré dans un canvas 1024, mis à l'échelle par `s`.
function mark(s, p = PCOLOR, ball = BALL) {
  const tx = (512 - 548 * s).toFixed(2);
  const ty = (512 - 512 * s).toFixed(2);
  return `<g transform="translate(${tx},${ty}) scale(${s})">
    <rect x="352" y="196" width="92" height="632" rx="46" fill="${p}"/>
    <circle cx="548" cy="392" r="150" fill="none" stroke="${p}" stroke-width="92"/>
    <circle cx="548" cy="392" r="44" fill="${ball}"/>
  </g>`;
}

function doc({ bg = false, rounded = false, s = 0.82, p, ball, glow = false }) {
  let defs = '';
  let layers = '';
  if (bg) {
    defs += `<linearGradient id="bgg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0C7A69"/><stop offset="1" stop-color="#004A43"/></linearGradient>`;
    layers += `<rect x="0" y="0" width="1024" height="1024" rx="${rounded ? 220 : 0}" fill="url(#bgg)"/>`;
  }
  if (glow) {
    defs += `<radialGradient id="glow" cx="50%" cy="40%" r="46%"><stop offset="0" stop-color="${BALL}" stop-opacity="0.22"/><stop offset="1" stop-color="${BALL}" stop-opacity="0"/></radialGradient>`;
    layers += `<rect x="0" y="0" width="1024" height="1024" fill="url(#glow)"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024"><defs>${defs}</defs>${layers}${mark(s, p, ball)}</svg>`;
}

function render(svg, size, out) {
  const r = new Resvg(svg, { fitTo: { mode: 'width', value: size }, background: 'rgba(0,0,0,0)' });
  fs.writeFileSync(out, r.render().asPng());
  console.log('→', path.basename(out), `${size}px`);
}

const iconSvg = doc({ bg: true, rounded: false, s: 0.82, glow: true });
const tileSvg = doc({ bg: true, rounded: true, s: 0.82, glow: true });
fs.writeFileSync(path.join(BRAND, 'icon.svg'), iconSvg);
fs.writeFileSync(path.join(BRAND, 'mark.svg'), tileSvg);

render(iconSvg, 1024, path.join(IMG, 'icon.png'));
render(tileSvg, 256, path.join(IMG, 'favicon.png'));
render(tileSvg, 512, path.join(IMG, 'brand-mark.png')); // logo in-app (tuile lisible sur fond clair)
render(tileSvg, 1024, path.join(IMG, 'splash-icon.png'));
render(doc({ bg: false, s: 0.62 }), 1024, path.join(IMG, 'android-icon-foreground.png'));
render(doc({ bg: false, s: 0.62, p: '#FFFFFF', ball: '#FFFFFF' }), 1024, path.join(IMG, 'android-icon-monochrome.png'));
console.log('OK');
