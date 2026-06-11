// Avis sur les clubs — UNE SEULE source de vérité : la liste des avis (générés pour la
// démo + ceux de l'utilisateur). La moyenne, le compteur et la répartition par étoiles
// se RECALCULENT depuis cette liste — aucun chiffre figé à côté.

import type { Club } from './clubs';

export type Review = {
  id: string;
  clubId: string;
  author: string;
  rating: number; // 1..5
  text: string;
  date: string;
};

// Prénoms et commentaires de DÉMONSTRATION (avis fictifs, à remplacer par de vrais avis).
const AUTHORS = ['Karim', 'Aïcha', 'Fatou', 'David', 'Marina', 'Yann', 'Aminata', 'Serge', 'Nadia', 'Idriss', 'Awa', 'Moussa'];
const COMMENTS_GOOD = [
  'Terrains impeccables, on reviendra.',
  'Très bon accueil, réservation simple.',
  'Belle ambiance après le travail.',
  'Éclairage nickel pour jouer le soir.',
  'Parfait pour progresser entre amis.',
  '',
];
const COMMENTS_MID = [
  'Bien, mais un peu d’attente à l’accueil.',
  'Correct — vestiaires à rafraîchir.',
  'Bon club, parking un peu juste.',
  '',
];
const AGES = ['il y a 3 j', 'il y a 1 sem.', 'il y a 2 sem.', 'il y a 3 sem.', 'il y a 1 mois', 'il y a 2 mois'];

// 5 à 8 avis stables par club de base (déterministes via l'id du club).
// Les clubs inscrits via l'app n'en ont pas → ils affichent « Nouveau ».
export function generatedReviews(club: Club): Review[] {
  const seed = club.id.split('').reduce((s, ch) => s + ch.charCodeAt(0), 0);
  const isCustom = !AUTHORS.length || club.reviewsCount === 0; // clubs inscrits : reviewsCount = 0
  if (isCustom) return [];
  const count = 5 + (seed % 4); // 5..8
  const out: Review[] = [];
  for (let i = 0; i < count; i++) {
    // Notes plausibles : surtout des 4-5, quelques 3.
    const r = [5, 4, 5, 4, 3, 5, 4, 5][(seed + i) % 8];
    const pool = r >= 4 ? COMMENTS_GOOD : COMMENTS_MID;
    out.push({
      id: `g-${club.id}-${i}`,
      clubId: club.id,
      author: AUTHORS[(seed + i * 3) % AUTHORS.length],
      rating: r,
      text: pool[(seed + i) % pool.length],
      date: AGES[(seed + i) % AGES.length],
    });
  }
  return out;
}

// Liste complète des avis d'un club : ceux de l'utilisateur en tête + les avis générés.
export function reviewsFor(club: Club, userReviews: Review[]): Review[] {
  return [...userReviews.filter((r) => r.clubId === club.id), ...generatedReviews(club)];
}

// Moyenne + compteur, recalculés EXACTEMENT depuis la liste (cohérents avec la répartition).
export function ratingFor(club: Club, userReviews: Review[]): { rating: number; count: number } {
  const list = reviewsFor(club, userReviews);
  if (list.length === 0) return { rating: 0, count: 0 };
  const avg = list.reduce((s, r) => s + r.rating, 0) / list.length;
  return { rating: Math.round(avg * 10) / 10, count: list.length };
}
