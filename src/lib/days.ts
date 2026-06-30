// Jours sélectionnables. IMPORTANT : on sépare l'AFFICHAGE (label, qui change selon « aujourd'hui »)
// de l'IDENTITÉ stable du jour (key = AAAA-MM-JJ). Toute la logique (disponibilités, anti
// double-réservation, blocage compétition) se base sur `key` — jamais sur le libellé — pour
// rester correcte d'un jour à l'autre.

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

// Durées en millisecondes — nommées pour la lisibilité (plus de « 86400000 » en dur).
export const MINUTE_MS = 60_000;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;

export type DayOption = { label: string; value: number; key: string };

export function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// `from` permet d'injecter une date de référence (tests déterministes) ; par défaut,
// maintenant. Génère n jours consécutifs SANS trou — les deux premiers portent un
// libellé amical AVEC le numéro du jour (« Aujourd'hui 12 », « Demain 13 ») pour rester
// sans ambiguïté le soir, les suivants leur nom de jour.
export function nextDays(n: number, from: Date = new Date()): DayOption[] {
  const now = from;
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    d.setHours(0, 0, 0, 0);
    const label = i === 0 ? `Aujourd'hui ${d.getDate()}` : i === 1 ? `Demain ${d.getDate()}` : `${DAYS[d.getDay()]} ${d.getDate()}`;
    return { label, value: d.getTime(), key: dayKey(d) };
  });
}

// Horodatage CANONIQUE d'un créneau, à partir de la clé du jour (AAAA-MM-JJ) + « HH:MM ».
// Abidjan = UTC+0 : on interprète (jour + heure) comme une heure UTC FIXE, indépendante du
// fuseau réglé sur le téléphone. Ainsi startsAt, les rappels, le passage en « jouée » et la
// facturation hebdomadaire tombent juste même si l'horloge de l'appareil est à un autre fuseau.
export function slotTimestamp(dateKey: string, slot: string): number {
  const [y, m, d] = dateKey.split('-').map(Number);
  const [h, min] = slot.split(':').map(Number);
  return Date.UTC(y, m - 1, d, h, min);
}

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const DAYS_SHORT = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

// Libellé ABSOLU d'un jour à partir de sa clé AAAA-MM-JJ : « Lun 8 juin ».
// (Jamais relatif — pour les documents de facturation.)
export function dateKeyLabel(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${DAYS_SHORT[date.getDay()]} ${d} ${MONTHS[m - 1]}`;
}

// ——— Semaine calendaire (lundi → dimanche) — base de la facturation hebdomadaire ———

// Clé stable d'une semaine = la date de son LUNDI (AAAA-MM-JJ).
export function weekKeyOf(ts: number): string {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  const dow = (d.getDay() + 6) % 7; // lundi = 0
  d.setDate(d.getDate() - dow);
  return dayKey(d);
}

function weekStart(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Libellé lisible : « du 8 au 14 juin » (ou « du 29 juin au 5 juil. » à cheval).
export function weekLabel(key: string): string {
  const start = weekStart(key);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  if (start.getMonth() === end.getMonth()) return `du ${start.getDate()} au ${end.getDate()} ${MONTHS[end.getMonth()]}`;
  return `du ${start.getDate()} ${MONTHS[start.getMonth()]} au ${end.getDate()} ${MONTHS[end.getMonth()]}`;
}

// Semaine précédente / suivante.
export function addWeeks(key: string, n: number): string {
  const d = weekStart(key);
  d.setDate(d.getDate() + 7 * n);
  return dayKey(d);
}
