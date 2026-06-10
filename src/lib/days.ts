// Jours sélectionnables. IMPORTANT : on sépare l'AFFICHAGE (label, qui change selon « aujourd'hui »)
// de l'IDENTITÉ stable du jour (key = AAAA-MM-JJ). Toute la logique (disponibilités, anti
// double-réservation, blocage compétition) se base sur `key` — jamais sur le libellé — pour
// rester correcte d'un jour à l'autre.

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export type DayOption = { label: string; value: number; key: string };

export function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function nextDays(n: number): DayOption[] {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    d.setHours(0, 0, 0, 0);
    const label = i === 0 ? "Aujourd'hui" : i === 1 ? 'Demain' : `${DAYS[d.getDay()]} ${d.getDate()}`;
    return { label, value: d.getTime(), key: dayKey(d) };
  });
}

// Horodatage réel d'un créneau « HH:MM » pour un jour donné (minuit du jour).
export function slotTimestamp(dayValue: number, slot: string): number {
  const [h, m] = slot.split(':').map(Number);
  return dayValue + h * 3600000 + m * 60000;
}

const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

// Clé de mois stable (AAAA-MM) à partir d'un horodatage — base du suivi de facturation.
export function monthKeyOf(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// Libellé lisible d'une clé de mois (ex. « juin 2026 »).
export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}
