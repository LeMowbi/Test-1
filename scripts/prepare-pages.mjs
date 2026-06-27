// Prépare le dossier `dist` (export web Expo) pour GitHub Pages :
//   - `.nojekyll` : indispensable pour que GitHub serve les dossiers commençant par « _ »
//     (ex. _expo/static/...) — sans lui, le bundle JS renvoie 404.
//   - `404.html` = copie d'`index.html` : repli SPA, pour que les liens profonds
//     (/club/xxx, /reserver/...) chargent l'app au lieu d'une page 404 de GitHub.
// Lancé automatiquement par `npm run deploy` (via le script `predeploy`).

import { copyFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const dist = resolve('dist');
const index = resolve(dist, 'index.html');

if (!existsSync(index)) {
  console.error('✗ dist/index.html introuvable — lance d’abord l’export web (npm run deploy le fait pour toi).');
  process.exit(1);
}

writeFileSync(resolve(dist, '.nojekyll'), '');
copyFileSync(index, resolve(dist, '404.html'));
console.log('✓ dist prêt pour GitHub Pages (.nojekyll + 404.html = repli SPA).');
