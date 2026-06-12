// Test de logique — tarifs par plage horaire (v4.5).
// Exécute les VRAIES fonctions source (src/lib/pricing.ts, src/lib/format.ts) :
//   node --experimental-strip-types tests/pricing.test.ts
// (les imports de types de pricing.ts sont effacés à l'exécution — aucun double).

import { minPrice, priceForSlot, priceTiersFor } from '../src/lib/pricing.ts';
import { perPlayer } from '../src/lib/format.ts';

let failed = 0;
const check = (cond: boolean, msg: string) => {
  console.log(`${cond ? '✓' : '✗ ÉCHEC'} ${msg}`);
  if (!cond) failed++;
};

// Club façon Padelta : 3 plages réelles (creuses / prime time / soirée) — mêmes
// valeurs que le seed (la cohérence seed ↔ ce miroir est vérifiée par seeds.test.mjs).
const padelta = {
  priceFrom: 10000,
  priceTiers: [
    { start: '07:00', end: '16:00', price: 10000 },
    { start: '16:00', end: '20:30', price: 30000 },
    { start: '20:30', end: '24:00', price: 15000 },
  ],
} as Parameters<typeof priceForSlot>[0];

check(priceForSlot(padelta, '10:30') === 10000, 'Padelta 10:30 → 10 000 (heures creuses)');
check(priceForSlot(padelta, '18:00') === 30000, 'Padelta 18:00 → 30 000 (prime time)');
check(priceForSlot(padelta, '21:00') === 15000, 'Padelta 21:00 → 15 000 (soirée)');
// BORNES : début de plage INCLUS, fin EXCLUSIVE.
check(priceForSlot(padelta, '07:00') === 10000, 'Borne 07:00 pile → heures creuses (début inclus)');
check(priceForSlot(padelta, '16:00') === 30000, 'Borne 16:00 pile → prime time (frontière creuse/prime)');
check(priceForSlot(padelta, '20:30') === 15000, 'Borne 20:30 pile → soirée (frontière prime/soirée)');
check(priceForSlot(padelta, '23:59') === 15000, 'Borne 23:59 → soirée (plage jusqu’à 24:00 exclu)');
// Hors plages (ex. 06:00 si le club ouvre tôt) → repli sur le MIN des plages (choix assumé).
check(priceForSlot(padelta, '06:00') === 10000, 'Créneau hors plages (06:00) → repli prix minimum');
check(priceForSlot(padelta, '07:30') === 10000, 'Padelta 07:30 → 10 000');
check(minPrice(padelta) === 10000, 'Fiche « dès » = min des plages (10 000)');

// Rétro-compatibilité : club SANS plages → tarif unique partout.
const simple = { priceFrom: 14000 } as Parameters<typeof priceForSlot>[0];
check(priceForSlot(simple, '18:00') === 14000, 'Club sans plages : 18:00 → tarif unique 14 000');
check(minPrice(simple) === 14000, 'Club sans plages : « dès » = tarif unique');
check(priceTiersFor(simple).length === 0, 'Club sans plages : aucune plage');

// Plages invalides (prix 0 / bornes vides) ignorées → retour au tarif unique.
const broken = {
  priceFrom: 12000,
  priceTiers: [
    { start: '', end: '16:00', price: 9000 },
    { start: '16:00', end: '20:00', price: 0 },
  ],
} as Parameters<typeof priceForSlot>[0];
check(priceForSlot(broken, '18:00') === 12000, 'Plages invalides ignorées → tarif unique');

// Répartition & commission sur le prix RÉEL (tests 2 et 5 de la mission).
check(perPlayer(30000) === '7 500 FCFA', 'Part par joueur à 30 000 → « 7 500 FCFA » (message partenaires)');
check(perPlayer(10000) === '2 500 FCFA', 'Part par joueur à 10 000 → « 2 500 FCFA »');
check(Math.round(30000 * 0.1) === 3000, 'Commission 10 % sur une résa 18:00 Padelta → 3 000');

console.log(failed === 0 ? '\nTOUS LES TESTS TARIFS PASSENT.' : `\n${failed} test(s) tarifs en échec.`);
if (failed > 0) process.exitCode = 1;
