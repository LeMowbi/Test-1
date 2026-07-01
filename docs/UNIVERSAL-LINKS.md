# Universal Links — ouvrir l'app depuis un lien web (iOS)

Objectif : quand quelqu'un tape ton lien de parrainage (ou un lien de club), l'**app s'ouvre
directement** si elle est installée, au lieu de passer par le navigateur / l'App Store.

Cela nécessite un **domaine que tu contrôles** en HTTPS (ex. `padelconnect.com` ou
`app.padelconnect.com`). Dis-moi le domaine choisi → je finalise la config de l'app et on rebuild.

## Ce qui est déjà prêt
- Ton identifiant d'app : **`R77YWZ9487.ci.padelco.app`** (Team ID + bundle).
- Le fichier Apple **`docs/apple-app-site-association`** (déclare que ce domaine ouvre ton app).

## Étapes (une fois le domaine choisi)

### 1. Héberger le fichier Apple (toi / ton hébergeur)
Déposer le fichier `apple-app-site-association` (SANS extension) à l'adresse EXACTE :
```
https://padelconnect.com/.well-known/apple-app-site-association
```
Contraintes Apple (importantes) :
- Servi en **HTTPS** valide, **sans redirection**.
- **Content-Type: `application/json`**.
- Pas d'extension de fichier `.json`.

### 2. Déclarer le domaine dans l'app (moi)
J'ajoute dans `app.json` (iOS) :
```json
"associatedDomains": ["applinks:padelconnect.com"]
```
et je fais pointer le lien de parrainage vers `https://padelconnect.com/invite/CODE` (au lieu du lien
App Store actuel), tout en gardant l'App Store en repli si l'app n'est pas installée.

### 3. Rebuild + test (moi + toi)
- Nouveau build EAS (les Universal Links exigent l'entitlement → build requis).
- Test sur un iPhone : ouvrir le lien depuis Notes/WhatsApp → l'app s'ouvre sur le bon écran.

## Repli tant qu'il n'y a pas de domaine
Le parrainage continue de marcher avec le lien **App Store** actuel (l'ami installe puis saisit le
code). Les Universal Links ne font qu'améliorer ce parcours.
