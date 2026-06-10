// Matchs ouverts — un match = un terrain réservé avec des places ouvertes.

export type Visibility = 'public' | 'amis';
export type Looking = 'partenaire' | 'adversaire' | 'les deux';

export type Match = {
  id: string;
  clubId: string;
  clubName: string;
  date: string;
  time: string;
  startsAt: number;
  levelValue: number; // niveau de jeu 1.0 → 7.0
  looking: Looking; // ce que cherche l'hôte
  total: number; // joueurs au total (4 = double)
  spotsLeft: number; // places encore libres
  visibility: Visibility;
  host: string;
  createdByMe?: boolean;
};

export const LOOKING_OPTIONS: { id: Looking; label: string; icon: string }[] = [
  { id: 'partenaire', label: 'Un partenaire', icon: 'person-add' },
  { id: 'adversaire', label: 'Des adversaires', icon: 'flame' },
  { id: 'les deux', label: 'Les deux', icon: 'swap-horizontal' },
];

export function lookingLabel(l: Looking): string {
  if (l === 'partenaire') return 'Cherche un partenaire';
  if (l === 'adversaire') return 'Cherche des adversaires';
  return 'Cherche partenaire & adversaires';
}

export function lookingIcon(l: Looking): string {
  if (l === 'adversaire') return 'flame';
  if (l === 'les deux') return 'swap-horizontal';
  return 'person-add';
}

// Matchs encore à venir — les matchs dont l'heure est passée ne s'affichent plus.
export function upcomingMatches(list: Match[], now = Date.now()): Match[] {
  return list.filter((m) => m.startsAt > now);
}

export function levelLabel(n: number): string {
  if (n < 2.5) return 'Débutant';
  if (n < 4) return 'Intermédiaire';
  if (n < 5.5) return 'Avancé';
  return 'Confirmé';
}

const H = 3600000;

export const seedMatches: Match[] = [
  { id: 'm1', clubId: 'padelta', clubName: 'Padelta', date: "Aujourd'hui", time: '19:30', startsAt: Date.now() + 5 * H, levelValue: 3.5, looking: 'partenaire', total: 4, spotsLeft: 1, visibility: 'public', host: 'Karim' },
  { id: 'm2', clubId: 'padel-zone-4', clubName: 'Padel Zone 4', date: 'Demain', time: '18:00', startsAt: Date.now() + 24 * H, levelValue: 2.0, looking: 'adversaire', total: 4, spotsLeft: 2, visibility: 'public', host: 'Fatou' },
  { id: 'm3', clubId: 'district-club', clubName: 'District Club', date: 'Samedi', time: '10:30', startsAt: Date.now() + 48 * H, levelValue: 5.0, looking: 'les deux', total: 4, spotsLeft: 1, visibility: 'amis', host: 'David' },
  { id: 'm4', clubId: 'abidjan-padel', clubName: 'Abidjan Padel', date: 'Samedi', time: '16:30', startsAt: Date.now() + 50 * H, levelValue: 3.0, looking: 'partenaire', total: 4, spotsLeft: 1, visibility: 'public', host: 'Ines' },
];
