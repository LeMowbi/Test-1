// Amis — données de DÉMONSTRATION. Le compte de l'utilisateur vit dans le store (AppContext).

export type Friend = { id: string; name: string; level: string };

export const seedFriends: Friend[] = [
  { id: 'f1', name: 'Karim', level: 'Intermédiaire' },
  { id: 'f2', name: 'Fatou', level: 'Débutant' },
  { id: 'f3', name: 'David', level: 'Avancé' },
  { id: 'f4', name: 'Ines', level: 'Intermédiaire' },
];
