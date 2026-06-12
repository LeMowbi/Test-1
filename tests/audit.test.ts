// Audit v4.5.1 — décompte hebdo, commission, garde-fous de réservation et
// inscription tournoi. weekKeyOf est la VRAIE source (src/lib/days.ts) ; les
// regroupements/garde-fous reproduisent fidèlement operateur.tsx / AppContext.
//   node --experimental-strip-types tests/audit.test.ts

import { weekKeyOf } from '../src/lib/days.ts';

let failed = 0;
const check = (cond: boolean, msg: string) => {
  console.log(`${cond ? '✓' : '✗ ÉCHEC'} ${msg}`);
  if (!cond) failed++;
};

type Resa = { id: string; clubId: string; startsAt: number; price: number; played: boolean };
const COMMISSION_RATE = 0.1;

// Miroir du décompte opérateur : parties JOUÉES de la semaine, groupées par club,
// volume = somme des prix réels, commission = Math.round(volume × 10 %).
function weeklyRows(reservations: Resa[], week: string) {
  const groups = new Map<string, { count: number; revenue: number }>();
  for (const r of reservations.filter((x) => weekKeyOf(x.startsAt) === week && x.played)) {
    const g = groups.get(r.clubId) ?? { count: 0, revenue: 0 };
    g.count += 1;
    g.revenue += r.price;
    groups.set(r.clubId, g);
  }
  return [...groups.entries()].map(([clubId, g]) => ({ clubId, ...g, commission: Math.round(g.revenue * COMMISSION_RATE) }));
}

// Semaine du lundi 8 juin 2026. Bornes : dimanche 14 23:59 dedans, lundi 15 00:00 dehors.
const WEEK = '2026-06-08';
const ts = (d: number, h: number, m = 0) => new Date(2026, 5, d, h, m).getTime();
const resas: Resa[] = [
  { id: 'r1', clubId: 'padelta', startsAt: ts(9, 18, 0), price: 30000, played: true }, // mardi prime
  { id: 'r2', clubId: 'padelta', startsAt: ts(10, 10, 30), price: 10000, played: true }, // mercredi creuse
  { id: 'r3', clubId: 'district-club', startsAt: ts(14, 23, 59), price: 14000, played: true }, // dimanche 23:59 → DANS la semaine
  { id: 'r4', clubId: 'padelta', startsAt: ts(15, 0, 0), price: 30000, played: true }, // lundi suivant 00:00 → HORS semaine
  { id: 'r5', clubId: 'padelta', startsAt: ts(11, 18, 0), price: 30000, played: false }, // à venir : jamais facturée
];

const rows = weeklyRows(resas, WEEK);
const padelta = rows.find((r) => r.clubId === 'padelta')!;
const district = rows.find((r) => r.clubId === 'district-club')!;
check(padelta.count === 2 && padelta.revenue === 40000, 'Padelta : 2 jouées, volume 40 000 (prix mixtes 30k + 10k)');
check(padelta.commission === 4000, 'Commission Padelta : 4 000 (10 % du volume réel)');
check(district.count === 1 && district.commission === 1400, 'District : dimanche 23:59 compté dans la semaine, commission 1 400');
check(!rows.some((r) => r.clubId === 'padelta' && r.count > 2), 'Lundi 00:00 suivant exclu ; résa à venir exclue');
check(weeklyRows(resas.filter((r) => r.id !== 'r1'), WEEK).find((r) => r.clubId === 'padelta')!.revenue === 10000, 'Résa annulée (retirée du store) → exclue du volume');
check(Math.round(12345 * COMMISSION_RATE) === 1235, 'Arrondi commission : 12 345 → 1 235 (Math.round, au plus proche)');

// Garde-fou : annulation interdite à MOINS de 5h du début (miroir de reservations.tsx).
const FIVE_H = 5 * 3600000;
const canCancel = (startsAt: number, now: number) => startsAt - now > FIVE_H;
const now0 = ts(12, 12, 0);
check(canCancel(now0 + FIVE_H + 60000, now0) === true, 'Annulation à 5h01 du début : AUTORISÉE');
check(canCancel(now0 + FIVE_H - 60000, now0) === false, 'Annulation à 4h59 du début : REFUSÉE');
check(canCancel(now0 + FIVE_H, now0) === false, 'Annulation à 5h00 pile : REFUSÉE (strictement plus de 5h requis)');

// Garde-fou : anti double-réservation du même terrain (miroir d'addReservation).
type Slot = { clubId: string; dateKey: string; time: string; court: string };
const taken = (list: Slot[], r: Slot) =>
  list.some((x) => x.clubId === r.clubId && x.dateKey === r.dateKey && x.time === r.time && x.court === r.court);
const existing: Slot[] = [{ clubId: 'padelta', dateKey: '2026-06-13', time: '18:00', court: 'Terrain 1' }];
check(taken(existing, { clubId: 'padelta', dateKey: '2026-06-13', time: '18:00', court: 'Terrain 1' }), 'Même terrain, même créneau → refusé');
check(!taken(existing, { clubId: 'padelta', dateKey: '2026-06-13', time: '18:00', court: 'Terrain 2' }), 'Autre terrain, même créneau → accepté');
check(!taken(existing, { clubId: 'padelta', dateKey: '2026-06-14', time: '18:00', court: 'Terrain 1' }), 'Même terrain, autre jour → accepté');

// Garde-fou : blocage hors app refusé sur un créneau déjà réservé ou déjà bloqué (même clé).
check(taken(existing, existing[0]), 'Blocage par-dessus une résa app → refusé (même clé de créneau)');

// Garde-fou : tournoi plein (miroir de teamCount/full).
const teamCount = (slots: number, registered: number, isReg: boolean) => Math.min(slots, registered + (isReg ? 1 : 0));
const isFull = (slots: number, registered: number, isReg: boolean) =>
  Math.max(0, slots - teamCount(slots, registered, isReg)) === 0 && !isReg;
check(isFull(8, 8, false) === true, 'Tournoi 8/8 (non inscrit) → Complet, inscription impossible');
check(isFull(16, 16, false) === true, 'Tournoi 16/16 → Complet');
check(isFull(8, 7, false) === false, 'Tournoi 7/8 → inscription encore possible');
check(teamCount(8, 9, true) === 8, 'Compteur d’équipes plafonné à la capacité (jamais 9/8)');

console.log(failed === 0 ? '\nTOUS LES TESTS AUDIT PASSENT.' : `\n${failed} test(s) audit en échec.`);
if (failed > 0) process.exitCode = 1;
