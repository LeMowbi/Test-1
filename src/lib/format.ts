// Petites fonctions de formatage.

export function fcfa(n: number): string {
  return `${n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} FCFA`;
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
