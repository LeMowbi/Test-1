# Notifications push réelles (#38/#41) — guide de mise en route

Le **code de l'app est prêt** : à la connexion, l'appareil enregistre son *jeton de push Expo*
dans `profiles.expo_push_token` (cf. `src/lib/push.ts`). Il reste à activer **l'envoi** côté
serveur. Tout passe par l'**API Push d'Expo**, donc pas besoin de manipuler les certificats
Apple à la main — Expo route vers Apple (APNs) et Google (FCM).

## 1. Base de données (déjà fait si tu as lancé les SQL)

Exécuter **`supabase/16_push_token.sql`** (ajoute la colonne `expo_push_token`).

## 2. Identifiants push (RIEN à faire — automatique)

**Aucune manipulation, aucun terminal.** La clé APNs (iOS) est **créée et gérée automatiquement
par EAS au moment du build** (l'assistant lance les builds). Les builds #27+ l'ont déjà en place.
(Android/FCM : à configurer plus tard, le jour d'une sortie Play Store.)

## 3. Déployer la fonction d'envoi (SANS terminal — Dashboard)

La fonction est dans `supabase/functions/notify-club/`. On la déploie depuis le **Dashboard**,
pas en ligne de commande :

1. Dashboard Supabase → **Edge Functions** → clique **notify-club**.
2. Bouton **Edit** (éditeur de code).
3. **Tout sélectionner / supprimer**, puis **coller** le contenu à jour de
   `supabase/functions/notify-club/index.ts` (l'assistant peut te le fournir prêt à coller).
4. **Deploy**.

(Les variables `SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` sont injectées automatiquement
par Supabase dans la fonction — rien à configurer.)

## 4. Brancher les déclencheurs (Database Webhooks)

Dashboard Supabase → **Database → Webhooks** → *Create a new hook* :

- **Réservation → club** ET **Confirmation → joueur** ET **Annulation → club** : table
  `reservations`, événements **INSERT _et_ UPDATE** (coche les deux) → appelle la fonction
  `notify-club`.
  - INSERT = nouvelle réservation → notifie le **gérant** du club.
  - UPDATE = le gérant confirme (case `club_confirmed`) → notifie le **joueur** (« Réservation
    confirmée ✅ »).
  - UPDATE = le joueur annule (`status → cancelled`, depuis `booked`) → notifie le **gérant**
    du club (« Réservation annulée »).
  - ⚠️ Si tu avais déjà créé le hook `reservations` en INSERT seul, **édite-le** pour cocher
    aussi **UPDATE** (sinon les notifs de confirmation et d'annulation ne partiront pas).
- **Invitation → invité** ET **Invitation acceptée → auteur** (notifs sociales) : table
  `reservation_participants`, événements **INSERT _et_ UPDATE** (coche les deux) → même
  fonction `notify-club`.
  - INSERT (un ami est rattaché à une résa partagée) → notifie l'**invité** (« Invitation à
    jouer 🎾 »).
  - UPDATE `→ accepted` → notifie l'**auteur** de la réservation (« Invitation acceptée ✅ »).
  - ⚠️ Si tu avais créé ce hook en UPDATE seul, **édite-le** pour cocher aussi **INSERT**
    (sinon l'invité ne reçoit jamais rien).
- **Tournois** : table `competitions`, événements **INSERT _et_ UPDATE** (coche les deux) →
  même fonction `notify-club`.
  - INSERT d'un tournoi **joueur** (en attente) → notifie le **gérant** du club hôte (« à
    valider »).
  - UPDATE `pending → published` (le club valide) → notifie l'**organisateur** (« Tournoi
    validé ✅ ») **et l'opérateur** (« frais à encaisser », montant Wave) — on ne facture donc
    que les tournois réellement confirmés.
  - UPDATE `pending → rejected` (le club refuse) → notifie l'**organisateur** (« Tournoi non
    retenu »).
- **Demandes d'ami** (notif sociale) : table `friend_requests`, événements **INSERT _et_
  UPDATE** (coche les deux) → même fonction `notify-club`.
  - INSERT d'une demande (`pending`) → notifie le **destinataire** (« Nouvelle demande d'ami »).
  - UPDATE `→ pending` (demande **renvoyée** après un refus — le serveur fait un UPDATE, pas un
    INSERT) → re-notifie le **destinataire** (« Nouvelle demande d'ami »). C'est pour CE cas
    aussi qu'il faut cocher UPDATE, pas seulement pour l'acceptation.
  - UPDATE `→ accepted` (la personne accepte) → notifie l'**expéditeur** (« Demande acceptée »).
- **Cours avec un coach** : table `lessons`, événements **INSERT _et_ UPDATE** (coche les
  deux) → même fonction `notify-club`.
  - INSERT d'une demande (`pending`) → notifie le **coach** (« Nouvelle demande de cours 🎾 »).
  - UPDATE `→ accepted` (le coach accepte, le terrain est réservé) → notifie l'**élève**
    (« Cours accepté ✅ »).
  - UPDATE `→ declined` (le coach refuse) → notifie l'**élève** (« Cours non disponible »).

La fonction lit la table + le type d'événement et envoie au bon destinataire (gérant du club,
joueur, auteur de la réservation, opérateur, organisateur du tournoi, ami invité, coach ou élève).

## 4 bis. (Recommandé) Sécuriser le webhook

La fonction `notify-club` peut désormais exiger un secret pour refuser les appels non légitimes
(quelqu'un pourrait sinon déclencher des push en appelant l'URL) :
1. Dashboard → **Edge Functions → notify-club → Settings → Secrets/Env** : ajoute
   `WEBHOOK_SECRET` = une longue valeur aléatoire.
2. Pour CHAQUE Database Webhook qui appelle `notify-club` : ajoute un **HTTP header**
   `x-webhook-secret` avec la MÊME valeur.

Tant que `WEBHOOK_SECRET` n'est pas défini, la fonction marche comme avant (compat). Une fois
défini, tout appel sans le bon en-tête reçoit **401**.

## 5. Tester

1. Installe un **build EAS** sur un vrai téléphone (les push ne marchent pas dans le
   simulateur ni dans Expo Go).
2. Connecte-toi avec un compte **gérant** d'un club, accepte la permission notifications.
3. Avec un autre compte joueur, réserve un créneau dans ce club → le gérant reçoit le push.

## Notes

- Si un compte n'a pas accepté les notifications, `expo_push_token` reste vide et la fonction
  l'ignore simplement (aucune erreur).
- Les **rappels de match** (avant le créneau) restent des notifications *locales* (déjà en
  place, sans serveur) — ce guide concerne uniquement les push *à distance*.
