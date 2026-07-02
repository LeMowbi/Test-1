// Type d’un avis club. Les avis sont RÉELS et vérifiés côté serveur (cf. lib/reviewsServer.ts et
// la fiche club) : aucun avis de démonstration n’est fabriqué côté app.

export type Review = {
  id: string;
  clubId: string;
  author: string;
  rating: number; // 1..5
  text: string;
  date: string;
};
