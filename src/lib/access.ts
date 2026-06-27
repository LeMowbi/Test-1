// ─── Contrôle d'accès CENTRALISÉ aux espaces sensibles ──────────────────────────
//
// PROTOTYPE (aujourd'hui) : tout est local, mono-appareil — la navigation ne change
// pas. Ce module est le SEUL point d'entrée des décisions d'accès : les écrans ne
// décident jamais eux-mêmes. Ainsi, passer à l'app finale sera un BRANCHEMENT ici
// (remplacer le corps de ces fonctions par des appels serveur), pas une réécriture.
//
// CIBLE VALIDÉE pour l'app finale (Supabase) :
//   (a) Espace opérateur : l'écran reste in-app mais n'est RENDU que si le serveur
//       confirme `role === 'operator'` sur le compte de Moustapha (session Supabase
//       Auth vérifiée côté serveur — jamais un simple flag local).
//   (b) Espaces Club : un compte PAR CLUB (téléphone + OTP) ; les droits de gestion
//       par club sont vérifiés côté serveur (Supabase Auth + Row Level Security) —
//       plus de code à 4 chiffres partagé dans l'app.
//
// DÉCISION PORTEUR (juin 2026) : lier l'Espace opérateur « uniquement à mon compte »
// est DIFFÉRÉ au serveur (§B). Deux pistes envisagées ont été volontairement écartées
// pour le prototype (gardées ici pour la version serveur) :
//   - code secret opérateur saisi une fois (claim) liant le compte courant à l'opérateur ;
//   - reconnaissance par numéro de téléphone du compte.
// Aucune n'est une vraie sécurité sans vérification serveur ; en attendant, l'Espace
// opérateur est simplement DISCRET (révélé par un appui long sur l'avatar du Profil) et
// n'apparaît pas dans la navigation normale.

/** L'utilisateur peut-il voir l'Espace opérateur ? */
export function canAccessOperator(): boolean {
  // TODO(app finale) : return session?.user.role === 'operator' (vérifié serveur).
  return true; // prototype : décidé d'attendre le serveur pour le lier au seul compte opérateur
}

/** L'utilisateur peut-il gérer CE club ? */
export function canAccessClub(clubId: string, unlockedClubIds: string[]): boolean {
  // PROTOTYPE : code à 4 chiffres saisi une fois, mémorisé sur l'appareil (CodeGate).
  // TODO(app finale) : return session?.user.clubIds.includes(clubId) — droits par
  // club délivrés par le serveur (RLS), suppression du système de codes.
  return unlockedClubIds.includes(clubId);
}
