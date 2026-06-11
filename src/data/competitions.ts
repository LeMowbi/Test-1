// Compétitions — données de DÉMONSTRATION. Créées par un CLUB ou par un JOUEUR.

import { dayKey, nextDays } from '@/lib/days';

export type Competition = {
  id: string;
  title: string;
  organizerType: 'club' | 'joueur';
  organizer: string;
  clubId?: string;
  clubName?: string;
  date: string; // libellé d'affichage
  dateKey: string; // identité stable du jour (AAAA-MM-JJ) — base du blocage des terrains
  format: string;
  level: string;
  reward: string; // récompense / dotation
  fee: string; // frais d'inscription
  slots: number;
  registered: number;
  official?: boolean;
  createdByMe?: boolean;
};

// Jours réels (relatifs au lancement) pour que l'affichage ET le blocage des terrains
// pointent toujours sur le bon jour calendaire.
const D = nextDays(8);

// Jours PASSÉS (pour les tournois terminés de démo) — dateKey stable.
const yesterday = dayKey(new Date(Date.now() - 86400000));
const lastWeek = dayKey(new Date(Date.now() - 7 * 86400000));

// IDs des tournois de démo « terminés » — réutilisés par loadDemo (inscription/clôture).
export const DEMO_FINISHED_COMP = 'c-fin'; // terminé hier, à clôturer par le club
export const DEMO_CLOSED_COMP = 'c-clos'; // déjà clôturé la semaine dernière

export const seedCompetitions: Competition[] = [
  {
    id: 'c1',
    title: 'Tournoi du week-end — Double mixte',
    organizerType: 'club',
    organizer: 'Padelta',
    clubId: 'padelta',
    clubName: 'Padelta',
    date: D[1].label,
    dateKey: D[1].key,
    format: 'Poules + tableau final',
    level: 'Intermédiaire',
    reward: 'Bon d’achat 100 000 FCFA + lots partenaires',
    fee: '10 000 FCFA / équipe',
    slots: 16,
    registered: 11,
    official: true,
  },
  {
    id: 'c2',
    title: 'Americano du dimanche',
    organizerType: 'club',
    organizer: 'Padel Zone 4',
    clubId: 'padel-zone-4',
    clubName: 'Padel Zone 4',
    date: D[6].label,
    dateKey: D[6].key,
    format: 'Americano (rotation)',
    level: 'Tous niveaux',
    reward: 'Trophée + équipement padel',
    fee: '5 000 FCFA / joueur',
    slots: 24,
    registered: 18,
    official: true,
  },
  {
    id: 'c3',
    title: 'Défi entre amis — Riviera',
    organizerType: 'joueur',
    organizer: 'Moustapha',
    date: D[4].label,
    dateKey: D[4].key,
    format: 'Mini-tournoi 4 équipes',
    level: 'Débutant / Intermédiaire',
    reward: 'Cagnotte 30 000 FCFA',
    fee: 'Gratuit',
    slots: 8,
    registered: 5,
  },
  {
    id: DEMO_FINISHED_COMP,
    title: 'Tournoi officiel — Padelta',
    organizerType: 'club',
    organizer: 'Padelta',
    clubId: 'padelta',
    clubName: 'Padelta',
    date: 'Hier',
    dateKey: yesterday,
    format: 'Poules + tableau final',
    level: 'Intermédiaire',
    reward: 'Bon d’achat 50 000 FCFA',
    fee: '10 000 FCFA / équipe',
    slots: 8,
    registered: 7,
    official: true,
  },
  {
    id: DEMO_CLOSED_COMP,
    title: 'Americano officiel — Padel Zone 4',
    organizerType: 'club',
    organizer: 'Padel Zone 4',
    clubId: 'padel-zone-4',
    clubName: 'Padel Zone 4',
    date: 'Sem. dernière',
    dateKey: lastWeek,
    format: 'Americano (rotation)',
    level: 'Tous niveaux',
    reward: 'Trophée + équipement',
    fee: '5 000 FCFA / joueur',
    slots: 8,
    registered: 8,
    official: true,
  },
];

export const COMP_FORMATS = [
  'Poules + tableau final',
  'Americano (rotation)',
  'Mini-tournoi',
  'Élimination directe',
];
