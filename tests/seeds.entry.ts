// Vérification des DONNÉES SEEDS réelles (bundlé par tests/seeds.test.mjs avec
// l'alias @/ résolu) : ids uniques, références croisées valides, niveaux bornés,
// plages tarifaires continues, équipes de démo uniques. Source réelle — aucun double.

import { clubs } from '@/data/clubs';
import { seedCompetitions, demoTeams, formatFee, teamCount } from '@/data/competitions';
import { coaches } from '@/data/coaches';
import { seedPlayers } from '@/data/players';
import { seedFriends } from '@/data/user';
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
check(uniqueIds(seedPlayers), `Joueurs (mini-fiches) : ${seedPlayers.length} ids uniques`);
check(uniqueIds(seedFriends), `Amis seeds : ${seedFriends.length} ids uniques`);

// 2. Références croisées : tous les clubId pointent vers un club existant.
const clubIds = new Set(clubs.map((c) => c.id));
check(
  seedCompetitions.every((c) => !c.clubId || clubIds.has(c.clubId)),
  'Tournois seeds → clubId existants'
);
check(coaches.every((c) => !c.clubId || clubIds.has(c.clubId)), 'Coachs → clubId existants');
check(
  seedPlayers.every((p) => !p.favoriteClubId || clubIds.has(p.favoriteClubId)),
  'Joueurs (mini-fiches) → club favori existant'
);

// 3. Toucher un ami doit ouvrir sa VRAIE fiche : chaque ami seed se résout dans
//    seedPlayers (même id, nom, niveau) — sinon la mini-fiche serait incomplète.
check(
  seedFriends.every((f) => {
    const p = seedPlayers.find((x) => x.id === f.id);
    return !!p && p.name === f.name && p.level === f.level;
  }),
  'Amis seeds résolus dans les joueurs (mini-fiches : id, nom, niveau)'
);

// 4. Niveaux bornés [1.0, 7.0].
check(seedPlayers.every((p) => p.level >= 1 && p.level <= 7), 'Niveaux joueurs ∈ [1.0, 7.0]');
check(seedFriends.every((f) => f.level === undefined || (f.level >= 1 && f.level <= 7)), 'Niveaux amis ∈ [1.0, 7.0]');
check(seedPlayers.some((p) => p.level === 1.0), 'Un seed à 1.0 existe (test du plancher)');

// 5. Tarifs : priceFrom > 0 partout ; plages de Padelta triées, sans trou ni
//    chevauchement, couvrant 07:00 → 24:00 ; « dès » = min des plages.
check(clubs.every((c) => c.priceFrom > 0), 'priceFrom > 0 pour tous les clubs');
const padelta = clubs.find((c) => c.id === 'padelta')!;
const tiers = priceTiersFor(padelta);
check(tiers.length === 3, 'Padelta : 3 plages valides');
const sorted = [...tiers].sort((a, b) => (a.start < b.start ? -1 : 1));
let continuous = sorted[0].start === '07:00' && sorted[sorted.length - 1].end === '24:00';
for (let i = 1; i < sorted.length; i++) if (sorted[i].start !== sorted[i - 1].end) continuous = false;
check(continuous, 'Padelta : plages continues 07:00 → 24:00 (sans trou ni chevauchement)');
check(minPrice(padelta) === padelta.priceFrom, 'Padelta : priceFrom aligné sur le min des plages');
check(clubs.filter((c) => c.id !== 'padelta').every((c) => priceTiersFor(c).length === 0), 'Autres clubs seeds : tarif unique (aucune plage)');

// 6. Tournois : inscrits ≤ places ; équipes de démo UNIQUES même tournoi plein (24).
check(seedCompetitions.every((c) => c.registered <= c.slots), 'Tournois seeds : registered ≤ slots');
const big = seedCompetitions.find((c) => c.slots === 24)!;
const fullComp = { ...big, registered: 24 };
const teams = demoTeams(fullComp);
check(teams.length === teamCount(fullComp, false), `demoTeams : ${teams.length} équipes générées (tournoi plein)`);
check(new Set(teams).size === teams.length, 'demoTeams : noms d’équipes TOUS uniques (pool 12 < 24 équipes)');

// 7. Formats FCFA des seeds stables sous formatFee (déjà espacés → inchangés).
check(
  seedCompetitions.every((c) => formatFee(c.fee) === c.fee && (!c.reward.trim() || formatFee(c.reward) === c.reward)),
  'Frais/récompenses seeds déjà au format final (formatFee idempotent)'
);

console.log(failed === 0 ? '\nTOUTES LES DONNÉES SEEDS SONT COHÉRENTES.' : `\n${failed} incohérence(s) seeds.`);
if (failed > 0) process.exitCode = 1;
