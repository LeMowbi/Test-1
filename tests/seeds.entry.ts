// Vérification des DONNÉES SEEDS réelles (bundlé par tests/seeds.test.mjs avec
// l'alias @/ résolu) : ids uniques, références croisées valides, plages tarifaires
// continues, équipes de démo uniques. Source réelle — aucun double.
// NB : les seeds de joueurs/amis de démo ont été retirés (comptes réels uniquement) ;
// ce test ne couvre donc plus que les données encore embarquées (clubs, tournois, coachs).

import { clubs } from '@/data/clubs';
import { seedCompetitions, teamsToShow, formatFee } from '@/data/competitions';
import { coaches } from '@/data/coaches';
import { minPrice, priceTiersFor } from '@/lib/pricing';

let failed = 0;
const check = (cond: boolean, msg: string) => {
  console.log(`${cond ? '✓' : '✗ ÉCHEC'} ${msg}`);
  if (!cond) failed++;
};
const uniqueIds = (items: { id: string }[]) => new Set(items.map((i) => i.id)).size === items.length;

// 1. Ids uniques partout.
check(uniqueIds(clubs), `Clubs : ${clubs.length} ids uniques`);
check(uniqueIds(seedCompetitions), `Tournois seeds : ${seedCompetitions.length} ids uniques`);
check(uniqueIds(coaches), `Coachs : ${coaches.length} ids uniques`);

// 2. Références croisées : tous les clubId pointent vers un club existant.
const clubIds = new Set(clubs.map((c) => c.id));
check(
  seedCompetitions.every((c) => !c.clubId || clubIds.has(c.clubId)),
  'Tournois seeds → clubId existants',
);
check(
  coaches.every((c) => !c.clubId || clubIds.has(c.clubId)),
  'Coachs → clubId existants',
);

// 3. Tarifs : priceFrom > 0 partout ; plages de Padelta triées, sans trou ni
//    chevauchement, couvrant 07:00 → 24:00 ; « dès » = min des plages.
check(
  clubs.every((c) => c.priceFrom > 0),
  'priceFrom > 0 pour tous les clubs',
);
const padelta = clubs.find((c) => c.id === 'padelta')!;
const tiers = priceTiersFor(padelta);
check(tiers.length === 3, 'Padelta : 3 plages valides');
const sorted = [...tiers].sort((a, b) => (a.start < b.start ? -1 : 1));
let continuous = sorted[0].start === '07:00' && sorted[sorted.length - 1].end === '24:00';
for (let i = 1; i < sorted.length; i++) if (sorted[i].start !== sorted[i - 1].end) continuous = false;
check(continuous, 'Padelta : plages continues 07:00 → 24:00 (sans trou ni chevauchement)');
check(minPrice(padelta) === padelta.priceFrom, 'Padelta : priceFrom aligné sur le min des plages');
check(
  clubs.filter((c) => c.id !== 'padelta').every((c) => priceTiersFor(c).length === 0),
  'Autres clubs seeds : tarif unique (aucune plage)',
);

// 4. Aucun tournoi de démo exposé (données réelles uniquement).
check(seedCompetitions.length === 0, 'Aucun tournoi de démonstration embarqué (données réelles serveur)');

// 5. teamsToShow : aucun nom fictif — un tournoi LOCAL (hors serveur) ne montre que MON
// équipe (si inscrit), jamais d'adversaires inventés ; un tournoi SERVEUR montre son roster réel.
const localComp = { id: 'synthetic-local', slots: 8, registered: 0 } as unknown as Parameters<typeof teamsToShow>[0];
check(teamsToShow(localComp).length === 0, 'teamsToShow (local, non inscrit) : aucune équipe fictive');
check(
  teamsToShow(localComp, 'Moi & Partenaire').length === 1,
  'teamsToShow (local, inscrit) : seulement MON équipe, pas d’adversaire inventé',
);
const serverComp = {
  id: 'synthetic-server',
  slots: 8,
  registered: 2,
  server: true,
  teamNames: ['Awa & Yann', 'Moi & Partenaire'],
} as unknown as Parameters<typeof teamsToShow>[0];
check(teamsToShow(serverComp, 'Moi & Partenaire')[0] === 'Moi & Partenaire', 'teamsToShow (serveur) : mon équipe en tête du roster réel');

// 6. formatFee : vide → « Gratuit », espace les milliers, et est idempotent (fonction pure).
check(
  formatFee('') === 'Gratuit' && /^5\s000$/u.test(formatFee('5000')) && formatFee(formatFee('5000')) === formatFee('5000'),
  'formatFee : Gratuit + espacement des milliers + idempotent',
);

console.log(failed === 0 ? '\nTOUTES LES DONNÉES SEEDS SONT COHÉRENTES.' : `\n${failed} incohérence(s) seeds.`);
if (failed > 0) process.exitCode = 1;
