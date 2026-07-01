// Compétitions — données de DÉMONSTRATION. Créées par un CLUB ou par un JOUEUR.

import { dateKeyLabel } from '@/lib/days';

export type Competition = {
  id: string;
  title: string;
  organizerType: 'club' | 'joueur';
  organizer: string;
  organizerId?: string; // id serveur de l'organisateur (tournois serveur) — sert au « c'est moi »
  organizerPhone?: string; // numéro de l'organisateur (pour régler les frais d'inscription)
  clubId?: string;
  clubName?: string;
  date: string; // libellé d'affichage (jour de DÉBUT)
  dateKey: string; // identité stable du jour de début (AAAA-MM-JJ) — base du blocage des terrains
  // Tournoi sur PLUSIEURS jours (ex. americano sur un week-end) : jour de fin optionnel.
  // Absent ou égal au jour de début → événement d'une seule journée.
  endDate?: string;
  endDateKey?: string;
  format: string;
  level: string;
  reward: string; // récompense / dotation
  fee: string; // frais d'inscription
  slots: number; // nombre d'ÉQUIPES (capacité)
  registered: number;
  official?: boolean;
  createdByMe?: boolean;
  // Tournoi serveur (synchronisé) vs seed/local : pilote l'écriture (RPC) côté store.
  server?: boolean;
  // Terrains et créneaux PRÉCIS réservés au tournoi (bloqués). Vides = ancien comportement
  // (tout le club bloqué ce jour-là) — gardé pour les seeds de démonstration.
  courtNames?: string[];
  timeSlots?: string[];
  // Roster RÉEL des équipes inscrites (tournois serveur) — « Prénom & Partenaire ». Remplace
  // les noms de démonstration : le nombre d'inscrits et les noms affichés sont vrais.
  teamNames?: string[];
  commission?: number; // frais fixe PadelConnect figé à la création (tournois joueurs)
  // Modération : un tournoi créé par un JOUEUR reste « pending » jusqu'à validation du
  // club hôte (« rejected » s'il est refusé). Club / seeds → visibles directement.
  status?: 'pending' | 'approved' | 'rejected';
};

// Tournoi visible publiquement (listes, accueil, fiche club) : ni « en attente », ni « refusé ».
export function isTournamentPublic(c: Competition): boolean {
  return c.status !== 'pending' && c.status !== 'rejected';
}

// Libellé de date : « du X au Y » si le tournoi s'étale sur plusieurs jours, sinon le jour seul.
// Dérivé de dateKey/endDateKey (date ABSOLUE) — jamais du libellé relatif figé à la création
// (sinon « Demain 30 » resterait affiché une fois le jour passé).
export function compDateLabel(c: Competition): string {
  const start = dateKeyLabel(c.dateKey);
  return c.endDateKey && c.endDateKey !== c.dateKey ? `${start} → ${dateKeyLabel(c.endDateKey)}` : start;
}

// Aucun tournoi de démonstration : les tournois affichés sont RÉELS (créés par les clubs/joueurs
// et synchronisés côté serveur). On n'expose donc jamais d'inscrits ni d'équipes inventés.
export const seedCompetitions: Competition[] = [];

// Nombre d'équipes inscrites (jamais au-dessus de la capacité). Tournoi SERVEUR : le compteur
// serveur est déjà exact (ma propre inscription incluse) → on le prend tel quel. Seeds de démo :
// mon inscription LOCALE s'ajoute au nombre figé de la démo.
export function teamCount(comp: Competition, isRegistered: boolean): number {
  if (comp.server) return Math.min(comp.slots, comp.registered);
  return Math.min(comp.slots, comp.registered + (isRegistered ? 1 : 0));
}

// Équipes à afficher : le roster RÉEL pour un tournoi serveur (plus aucun nom fictif), sinon
// les équipes de démonstration pour les seeds. `myTeam` est mis en tête pour le mettre en avant.
export function teamsToShow(comp: Competition, myTeam?: string): string[] {
  if (comp.server) {
    const list = comp.teamNames ?? [];
    if (!myTeam) return list;
    return [myTeam, ...list.filter((t) => t !== myTeam)]; // ma team en tête, sans doublon
  }
  return demoTeams(comp, myTeam);
}

// Le tournoi a-t-il des frais d'inscription (≠ gratuit) ? Sert à proposer de contacter
// l'organisateur pour le règlement.
export function hasEntryFee(fee: string | undefined): boolean {
  const v = (fee ?? '').trim().toLowerCase();
  return v.length > 0 && v !== 'gratuit';
}

// Équipes de DÉMONSTRATION d'un tournoi (noms stables par tournoi). Si l'utilisateur
// est inscrit, son équipe est en tête de liste.
const TEAM_POOL = [
  'Awa & Yann',
  'Aïcha & David',
  'Fatou & Karim',
  'Marina & Ali',
  'Nadia & Serge',
  'Aminata & Paul',
  'Chantal & Idriss',
  'Léa & Moussa',
  'Sarah & Franck',
  'Mariam & Hervé',
  'Clara & Bakary',
  'Eva & Junior',
];
export function demoTeams(comp: Competition, myTeam?: string): string[] {
  const seed = comp.id.split('').reduce((s, ch) => s + ch.charCodeAt(0), 0);
  const total = teamCount(comp, !!myTeam);
  const others = total - (myTeam ? 1 : 0);
  // Noms UNIQUES garantis (le pool fait 12 noms, un tournoi peut avoir 24 équipes) :
  // indispensable pour les clés React et la sélection du vainqueur par nom.
  const list: string[] = [];
  const used = new Map<string, number>();
  for (let i = 0; i < others; i++) {
    const base = TEAM_POOL[(seed + i) % TEAM_POOL.length];
    const n = (used.get(base) ?? 0) + 1;
    used.set(base, n);
    list.push(n === 1 ? base : `${base} (${n})`);
  }
  return myTeam ? [myTeam, ...list] : list;
}

// Frais / récompense saisis librement par l'organisateur : on formate les nombres
// avec séparateurs de milliers (« 10000 FCFA » → « 10 000 FCFA ») et un champ vide
// devient « Gratuit » — même règle partout (cartes, fiches, partage).
export function formatFee(s: string | undefined): string {
  const v = (s ?? '').trim();
  if (!v) return 'Gratuit';
  return v.replace(/\d{4,}/g, (n) => n.replace(/\B(?=(\d{3})+(?!\d))/g, ' '));
}

export const COMP_FORMATS = ['Poules + tableau final', 'Americano (rotation)', 'Mini-tournoi', 'Élimination directe'];
