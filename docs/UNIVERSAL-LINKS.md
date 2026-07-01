# Universal Links & site padelconnectci.com

Objectif : un lien `https://padelconnectci.com/invite/CODE` **ouvre directement l'app** si elle est
installée (le code de parrainage se pré-remplit tout seul), sinon la page renvoie vers l'App Store.

Domaine : **padelconnectci.com** (acheté sur Cloudflare). Identifiant d'app :
**`R77YWZ9487.ci.padelco.app`**.

## Côté app — DÉJÀ FAIT ✅
- `app.json` → `associatedDomains: ["applinks:padelconnectci.com"]`.
- Route entrante `/invite/[code]` → met le code de côté et pré-remplit l'inscription.
- Lien de parrainage = `padelconnectci.com/invite/CODE` (repli App Store si pas d'app).

## Côté hébergement — À FAIRE (toi, sur Cloudflare Pages)

Le dossier **`site/`** du dépôt contient tout, prêt à déployer :
```
site/
  .well-known/apple-app-site-association   ← fichier Apple (déclare que le domaine ouvre l'app)
  _headers                                 ← force le bon type MIME du fichier Apple
  _redirects                               ← /invite/* → App Store (visiteurs sans l'app)
  index.html                               ← page d'accueil du site
  privacy.html                             ← politique de confidentialité (pour l'App Store)
```

### Déployer (2 façons)
- **A — Glisser-déposer (le plus simple)** : Cloudflare → **Workers & Pages** → *Create* → *Pages* →
  *Upload assets* → glisse le **contenu du dossier `site/`** → *Deploy*. Puis **Custom domains** →
  ajoute `padelconnectci.com`.
- **B — Connecter le dépôt GitHub** : Cloudflare Pages → *Connect to Git* → dépôt `PadelConnect` →
  *Build output directory* = `site` → Deploy. (Se met à jour tout seul à chaque push.)

### Vérifier
- `https://padelconnectci.com/.well-known/apple-app-site-association` s'ouvre et renvoie du JSON.
- `https://padelconnectci.com/invite/TEST` (dans un navigateur, sans l'app) redirige vers l'App Store.

## Dernière étape — un nouveau build
Les Universal Links exigent l'entitlement `associatedDomains` → il faut un **nouveau build EAS**
(#29) APRÈS que le fichier Apple est en ligne. Test final sur iPhone : ouvrir un lien
`padelconnectci.com/invite/CODE` depuis Notes/WhatsApp → l'app s'ouvre, code pré-rempli.

> Ordre conseillé : (1) déployer `site/` sur Cloudflare Pages + domaine → (2) je lance le build #29.
