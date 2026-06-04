// Matchs ouverts — données de DÉMONSTRATION (joueurs fictifs).

export type Visibility = 'public' | 'amis';

export type Match = {
  id: string;
  clubId: string;
  clubName: string;
  date: string; // libellé lisible
  time: string;
  level: string;
  type: 'Cherche partenaire' | 'Cherche adversaire' | 'Cherche coéquipier';
  spotsLeft: number;
  visibility: Visibility;
  host: string;
  createdByMe?: boolean;
};

export const seedMatches: Match[] = [
  {
    id: 'm1',
    clubId: 'padelta',
    clubName: 'Padelta',
    date: "Aujourd'hui",
    time: '19:00',
    level: 'Intermédiaire',
    type: 'Cherche partenaire',
    spotsLeft: 1,
    visibility: 'public',
    host: 'Karim',
  },
  {
    id: 'm2',
    clubId: 'padel-zone-4',
    clubName: 'Padel Zone 4',
    date: 'Demain',
    time: '18:00',
    level: 'Débutant',
    type: 'Cherche adversaire',
    spotsLeft: 2,
    visibility: 'public',
    host: 'Fatou',
  },
  {
    id: 'm3',
    clubId: 'district-club',
    clubName: 'District Club',
    date: 'Samedi',
    time: '10:00',
    level: 'Avancé',
    type: 'Cherche coéquipier',
    spotsLeft: 1,
    visibility: 'amis',
    host: 'Moustapha',
  },
  {
    id: 'm4',
    clubId: 'abidjan-padel',
    clubName: 'Abidjan Padel',
    date: 'Samedi',
    time: '17:00',
    level: 'Intermédiaire',
    type: 'Cherche partenaire',
    spotsLeft: 1,
    visibility: 'public',
    host: 'Ines',
  },
];

export const MATCH_TYPES: Match['type'][] = [
  'Cherche partenaire',
  'Cherche adversaire',
  'Cherche coéquipier',
];

export const LEVELS = ['Débutant', 'Intermédiaire', 'Avancé', 'Confirmé'];
