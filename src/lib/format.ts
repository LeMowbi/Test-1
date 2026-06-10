// Petites fonctions de formatage.

export function fcfa(n: number): string {
  return `${n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA`;
}

// Prix par joueur (terrain à 4), arrondi à la centaine — sessions de 1h30.
export function perPlayer(sessionPrice: number): string {
  return fcfa(Math.round(sessionPrice / 4 / 100) * 100);
}

// Libellé du niveau de jeu (1.0 → 7.0).
export function levelLabel(n: number): string {
  if (n < 2.5) return 'Débutant';
  if (n < 4) return 'Intermédiaire';
  if (n < 5.5) return 'Avancé';
  return 'Confirmé';
}

export function initials(name: string): string {
  return name
    .replace(/\(.*?\)/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}
