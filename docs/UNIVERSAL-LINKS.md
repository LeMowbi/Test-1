# Universal Links & site padelconnectci.com

Objectif : un lien `https://padelconnectci.com/invite/CODE` **ouvre directement l'app** si elle est
installée (le code de parrainage se pré-remplit tout seul), sinon la page renvoie vers l'App Store.

Domaine : **padelconnectci.com** (acheté sur Cloudflare). Identifiant d'app :
**`R77YWZ9487.ci.padelco.app`**.

## ✅ ACTIFS depuis le build #34 — rien à faire

Tout est en place et vérifié :
- Capacité **« Associated Domains »** activée sur l'App ID `ci.padelco.app` (portail Apple).
- Profil de provisioning **régénéré** avec cette capacité (builds ≥ #33).
- `app.json` contient `"associatedDomains": ["applinks:padelconnectci.com"]` —
  **ne jamais retirer cette ligne**, sinon les liens cesseraient d'ouvrir l'app.
- Site **déployé** sur Cloudflare Pages : AASA servi en JSON, `/invite/*` et `/club/*`
  redirigent vers l'App Store pour les visiteurs sans l'app.

> Historique (résolu) : les builds #29/#30 avaient échoué car le profil de provisioning de
> l'époque n'incluait pas Associated Domains et EAS ne le régénérait pas seul. Réglé en
> activant la capacité dans le portail Apple Developer puis en supprimant l'ancien profil sur
> expo.dev — EAS en a régénéré un valide au build suivant (penser à `EXPO_APPLE_TEAM_ID`).

## Côté app — routes ouvertes par les liens
- `/invite/[code]` → met le code de parrainage de côté et pré-remplit l'inscription.
- `/club/[id]` → un lien `padelconnectci.com/club/ID` (bouton Partager d'une fiche club)
  ouvre directement la fiche du club dans l'app.

## Côté hébergement — DÉPLOYÉ (Cloudflare Pages)

Le dossier **`site/`** du dépôt contient tout :
```
site/
  .well-known/apple-app-site-association   ← fichier Apple (déclare que le domaine ouvre l'app)
  _headers                                 ← force le bon type MIME du fichier Apple
  _redirects                               ← /invite/* et /club/* → App Store (sans l'app)
  index.html                               ← page d'accueil du site
  privacy.html                             ← politique de confidentialité (pour l'App Store)
```

⚠️ Si le déploiement a été fait par **glisser-déposer** (pas connecté à GitHub), toute
modification du dossier `site/` dans le dépôt doit être **re-déployée à la main** :
Cloudflare → Workers & Pages → le projet → *Create new deployment* → re-glisser le contenu
de `site/`. (S'il est connecté à GitHub avec *Build output directory* = `site`, c'est
automatique à chaque push.)

### Vérifier (n'importe quand)
- `https://padelconnectci.com/.well-known/apple-app-site-association` renvoie du JSON.
- `https://padelconnectci.com/invite/TEST` (navigateur, sans l'app) redirige vers l'App Store.
- Sur iPhone avec l'app : un lien `padelconnectci.com/invite/CODE` collé dans Notes/WhatsApp
  ouvre l'app, code pré-rempli.
