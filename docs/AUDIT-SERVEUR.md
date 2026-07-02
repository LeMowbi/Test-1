# Audit — actions serveur (sans terminal)

État au 2026-07-02 : les migrations `30 → 37` sont appliquées, `notify-club` est redéployée
(confirmé par le porteur). **Il ne reste qu'une action optionnelle : le §2 (WEBHOOK_SECRET).**

---

## 1) Migration `37_audit2_hardening.sql` — ✅ à coller si pas déjà fait

Corrige deux points (audit n°2) :

- **Avis des invités** : un ami invité qui a accepté et joué peut désormais noter le club
  (avant, l'app le proposait mais le serveur refusait systématiquement).
- **Anti double-occupation** : un club ne peut plus créer/valider un tournoi par-dessus des
  créneaux déjà réservés par des joueurs.

**Étapes :**
1. Dashboard Supabase → **SQL Editor** → **New query**.
2. Ouvre `supabase/37_audit2_hardening.sql` du dépôt, copie **tout** son contenu.
3. Colle → **Run**. Idempotent (relançable sans risque). Attendu : « Success. No rows returned ».

---

## 2) (Recommandé, quand tu veux) Sécuriser le webhook push (3 min)

Tant qu'aucun secret n'est posé, **n'importe qui** connaissant l'URL de la fonction peut
déclencher des notifications. Le code de la fonction gère déjà le secret : dès qu'il est posé,
il devient **obligatoire** — rien à redéployer.

**Étapes :**
1. Choisis un secret (longue suite aléatoire, ex. générée par un gestionnaire de mots de passe).
2. Dashboard → **Edge Functions** → **notify-club** → **Settings** (ou « Secrets ») → ajoute :
   **Nom** `WEBHOOK_SECRET`, **Valeur** = ton secret → **Save**.
3. Dashboard → **Database → Webhooks** → pour **chaque** webhook qui appelle `notify-club`
   (`reservations`, `reservation_participants`, `competitions`, `friend_requests`) :
   **Edit** → **HTTP Headers** → ajoute **`x-webhook-secret`** = **le même secret** → **Save**.
4. Vérifie : une action qui envoie un push (ex. réservation de test) → la notification arrive
   toujours. Si plus rien n'arrive, un webhook n'a pas le bon en-tête.

> Astuce : garde le secret en lieu sûr (le même sur la fonction ET sur tous les webhooks).

---

## Historique (déjà fait, confirmé le 2026-07-01/02)

- ✅ Migrations `30` → `36` appliquées (dont `34_level_integrity` anti-triche niveau et
  `36_audit_hardening` : niveau borné [1,7] à l'inscription + anti-collision de noms).
- ✅ Edge Function `notify-club` redéployée (push des demandes d'ami renvoyées après refus).
- ✅ Webhook `friend_requests` branché (INSERT + UPDATE).
