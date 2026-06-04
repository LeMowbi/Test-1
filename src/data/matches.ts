// Matchs ouverts — données de DÉMONSTRATION (joueurs fictifs).

export type Visibility = 'public' | 'amis';

export type Match = {
  id: string;
  clubId: string;
  clubName: string;
  date: string;
  time: string;
  levelValue: number; // niveau de jeu 1.0 → 7.0 (échelle type Playtomic)
  type: 'Cherche partenaire' | 'Cherche adversaire' | 'Cherche coéquipier';
  spotsLeft: number;
  visibility: Visibility;
  host: string;
  createdByMe?: boolean;
};

export const MATCH_TYPES: Match['type'][] = [
  'Cherche partenaire',
  'Cherche adversaire',
  'Cherche coéquipier',
];

// Étiquette lisible pour un niveau chiffré.
export function levelLabel(n: number): string {
  if (n < 2.5) return 'Débutant';
  if (n < 4) return 'Intermédiaire';
  if (n < 5.5) return 'Avancé';
  return 'Confirmé';
}

export const seedMatches: Match[] = [
  { id: 'm1', clubId: 'padelta', clubName: 'Padelta', date: "Aujourd'hui", time: '19:00', levelValue: 3.5, type: 'Cherche partenaire', spotsLeft: 1, visibility: 'public', host: 'Karim' },
  { id: 'm2', clubId: 'padel-zone-4', clubName: 'Padel Zone 4', date: 'Demain', time: '18:00', levelValue: 2.0, type: 'Cherche adversaire', spotsLeft: 2, visibility: 'public', host: 'Fatou' },
  { id: 'm3', clubId: 'district-club', clubName: 'District Club', date: 'Samedi', time: '10:00', levelValue: 5.0, type: 'Cherche coéquipier', spotsLeft: 1, visibility: 'amis', host: 'Moustapha' },
  { id: 'm4', clubId: 'abidjan-padel', clubName: 'Abidjan Padel', date: 'Samedi', time: '17:00', levelValue: 3.0, type: 'Cherche partenaire', spotsLeft: 1, visibility: 'public', host: 'Ines' },
];
