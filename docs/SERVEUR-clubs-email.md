# Mise en service — Clubs serveur + Inscription par e-mail

Deux nouveautés, livrées ensemble. Suis cette page dans l'ordre.

## 1) SQL à exécuter (Supabase → SQL Editor → Run)

Dans cet ordre. Tout est idempotent (relançable sans risque).

1. `supabase/07_clubs.sql` — table des clubs serveur + bouton « Approuver ».
2. `supabase/08_signup.sql` — création automatique du profil à l'inscription par e-mail.

> Les fichiers `05_support.sql` et `06_participants.sql` ont déjà été exécutés.

## 2) Réglages du tableau de bord Supabase (une seule fois)

**Authentication → Providers → Email**
- Active **« Confirm email »** (ON). C'est ce qui envoie le lien de confirmation.

**Authentication → URL Configuration → Redirect URLs** — ajoute :
- `padelco://auth-callback`
- `padelco://`

(Le lien reçu par mail rouvre l'app sur cette adresse, qui connecte le joueur automatiquement.)

## 3) Ce que ça change pour toi

### Inscrire un nouveau club, sans informatique
1. Le gérant fait **Profil → « Tu gères un club ? »** et envoie sa demande.
2. Tu la vois dans **Espace opérateur → Demandes reçues**.
3. Tu appuies sur **Approuver** → confirmation → **le club est créé** (visible par tous
   les joueurs **sans nouvelle version de l'app**) et **le gérant obtient l'accès à son
   Espace Club** à sa prochaine ouverture. Aucune commande SQL, aucun rebuild.

### Inscription des joueurs
- Ils s'inscrivent avec **e-mail + mot de passe + téléphone** (le téléphone reste
  obligatoire pour que les clubs puissent les joindre — **sans SMS**).
- Ils reçoivent un **e-mail de confirmation** ; le lien rouvre l'app et les connecte.
- Les comptes créés **avant** (par téléphone) — dont ton compte opérateur — fonctionnent
  toujours : dans la fenêtre « Se connecter », un lien **« Se connecter par téléphone »**.

## 4) Les 9 clubs de base

Ils restent **intégrés dans l'app** (rapides, hors-ligne). La table serveur ne contient
que les **nouveaux** clubs approuvés. L'app fusionne les deux listes automatiquement.
