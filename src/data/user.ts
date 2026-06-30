// Type d'un ami. Le compte de l'utilisateur et sa liste d'amis vivent dans le store (AppContext) ;
// un compte démarre sans ami (aucune donnée de démonstration).

export type Friend = { id: string; name: string; phone?: string; level?: number };
