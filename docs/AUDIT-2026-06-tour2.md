# Audit complet PadelConnect — Tour 2 (passage « vraie application »)

Second tour d'audit, après la migration des réservations sur le serveur, l'ajout du
parrainage et des rappels. **4 agents en parallèle** : vérification serveur adversariale,
régression (réservations async), prêt‑pour‑le‑lancement, et fidélité au modèle de design.

Suite du `AUDIT-2026-06.md` (tour 1). **Statut : ✅ corrigé · 📝 noté/différé.**

---

## Ce qui a été livré entre les deux tours
- **Réservations = source de vérité serveur** (l'incohérence n°1 du tour 1 est résolue) :
  RLS joueur/club/opérateur, contrainte unique anti double‑réservation, vue d'occupation
  cross‑joueur sans fuite d'identité, miroir local pour la fluidité/hors‑ligne.
- **Parrainage** réel : code unique par joueur + table `referrals` + fonction `claim_referral`.
- **Sécurité par rôle** fermée côté serveur (trigger INSERT + UPDATE).

---

## Corrigé au tour 2 ✅

### Serveur & sécurité
- 🟠 **Policy UPDATE club trop large** — un compte club pouvait réécrire prix/terrain/user_id
  d'une réservation. Remplacée par la fonction `set_club_confirmed` (SECURITY DEFINER) qui ne
  modifie QUE `club_confirmed` après contrôle du rôle. `supabase/03_reservations.sql`.
- 🔴 **Vue d'occupation exposée à `anon`** — `revoke from anon`, accès réservé aux connectés.
- 🟠 **Compteur de parrainage sur‑comptait** (comptait aussi le parrain de l'utilisateur) —
  filtré sur `referrer_id`. `src/lib/referrals.ts`.
- 🟡 **Code de parrainage 8 → 12 caractères** (collision négligeable). `claim_referral`
  renvoie désormais le vrai succès (faux si déjà parrainé).

### Régression (réservations devenues asynchrones / serveur)
- 🟠 **Accueil d'un compte club/opérateur** affichait la réservation d'un AUTRE joueur comme
  « ton prochain match » (la RLS leur renvoie tout le périmètre). Introduit un sélecteur
  unique **`myReservations`** (= mes résas) utilisé par l'accueil, les avis vérifiés et les
  rappels. `src/store/AppContext.tsx`, `src/app/index.tsx`, `src/app/club/[id].tsx`.
- 🟡 **Annulation / confirmation** affichaient « fait » même en cas d'échec réseau →
  renvoient un booléen, message d'erreur réel sinon. `src/app/reservations.tsx`,
  `src/components/club-admin/SectionReservations.tsx`.
- 🟡 **Disponibilité figée** (pas de temps réel) → rafraîchissement de l'occupation au retour
  au premier plan (`AppState`) et après un conflit de réservation.
- 🟡 **`BookingSheet`** : ajout de `occupancy` aux dépendances du calcul des terrains libres.
- 🟡 **Déconnexion / démo / reset** ne coupaient pas la session serveur ni le périmètre
  personnel → nettoyage complet (anti‑fuite entre comptes sur un appareil partagé).

### Prêt pour le lancement
- 🔴 **BLOQUANT App Store** : la page « Confidentialité » disait « données uniquement sur
  l'appareil, aucun serveur » — **faux**. Réécrite **dans l'app** (`src/app/legal.tsx`) ET
  sur la **page publique** (`gh-pages/privacy.html`, l'URL à coller dans App Store Connect).
- 🟡 Copie « rappels = démo » corrigée ; README mis à jour (statut « serveur connecté »).

### Fidélité au modèle (design)
- Couleurs par rôle remises d'équerre : **coral→vert** (« à confirmer », « à facturer »),
  **violet→or** (étoiles d'avis, « heure phare »), **vert→violet** (CTA « Créer un tournoi »),
  tuiles KPI homogènes (vert), chiffre vitrine 40px, boutons boost 7j/30j toujours visibles,
  icône « booster » verte, cellule « bloqué » en beige.

---

## Différé / noté 📝

### Rappels de match (notifications locales) — différé d'un build
Le module natif `expo-notifications` déclenche chez EAS une **provision de notifications
push Apple**. Le profil de provisionnement de l'App ID `ci.padelco.app` n'a pas encore la
capacité **Push Notifications** → échec de signature (2 builds). Décision : retirer le module
natif pour livrer le reste **maintenant**. L'interrupteur « Rappels » reste une préférence ;
la planification revient dans un build dédié une fois la capacité Push activée côté Apple
(opération ponctuelle de ~2 min). API du fichier `src/lib/notifications.ts` conservée à
l'identique pour un rebranchement en un seul fichier.

### Détails design mineurs non appliqués
- Bouton « Marquer payé » grisé non‑réversible (handoff) : on a gardé le bouton « Annuler »
  réversible, jugé meilleure UX.
- Alias couleur hérité `blue`/`blueSoft` (= vert visuellement) : laissé tel quel (neutre).
- Quelques items écran joueur à faible confiance (tag « Vainqueur » violet→or) non touchés.

### Reste « à venir » (phase serveur suivante)
- **#23** : notifications **sociales** (confirmation club, place libérée), **signalements**,
  **score de fiabilité** — nécessitent de nouvelles tables serveur.

---

## Action requise de ta part
1. ✅ **SQL exécuté** (`03_reservations.sql` + `04_referrals.sql`).
2. **App Store Connect** : coller l'URL de confidentialité
   `https://lemowbi.github.io/PadelConnect/privacy.html`.
3. (Optionnel) renseigner `OPERATOR_WHATSAPP` dans `src/lib/operator.ts`.
4. (Quand tu voudras les rappels) activer la capacité **Push Notifications** côté Apple — je
   te guide.

**Build iOS n°13** : compilé et envoyé sur **TestFlight** (en traitement chez Apple).
Vérifications `tsc` + `eslint` + bundle natif : toutes vertes.
