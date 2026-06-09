# Construire la vraie version de PadelConnect (ensemble)

> Comment on passe de la **maquette** (données sur le téléphone) à une **vraie application reliée
> et sécurisée**. Modèle de travail : **Claude écrit le code, toi tu es le propriétaire-opérateur**
> (tu crées les comptes, tu détiens les clés, je te guide clic par clic).
> Tu n'as **pas besoin de savoir coder**. Tu as besoin de créer quelques comptes et de suivre mes étapes.

---

## 1. L'architecture cible, en clair

```
   App joueur (iPhone/Android)  ─┐
                                 ├─►  CERVEAU CENTRAL
   Espace Club (gérants)        ─┘   (serveur + base de données)
                                          │
                                          └─►  Comptes (SMS), créneaux en temps réel, notifications
```

- **Application** : on garde la base actuelle (Expo / React Native — un seul code pour iPhone, Android
  et le web).
- **Cerveau central** : **Supabase** (recommandé) — base de données + comptes + temps réel, simple et
  gratuit pour démarrer. *(Firebase est une alternative équivalente.)*
- **Connexion** : par **numéro de téléphone + code SMS**.
- **Notifications** : via Expo (rappels de match, confirmations).
- **Pas de paiement dans l'app** (choix assumé) : on **réserve** seulement. Ta **commission** se règle
  **hors app** — tu envoies au club l'**historique** (déjà fait par l'« Espace opérateur ») et il te
  paie par **Wave**. → Aucune donnée bancaire, aucune vérification d'entreprise, aucun risque financier.

---

## 2. Les comptes que TOI tu dois créer (et pourquoi)

Ces comptes exigent **ton identité, ta carte bancaire et parfois ton entreprise** : je ne peux pas les
créer à ta place, mais je te guide pas à pas. **Les mots de passe et clés restent chez toi.**

| Compte | À quoi ça sert | Coût | Pourquoi c'est toi |
|---|---|---|---|
| **Supabase** | Le cerveau central (base + comptes + temps réel) | Gratuit pour démarrer, puis quelques $/mois | Lié à ton e-mail ; tu détiens les clés du projet |
| **Fournisseur SMS** (ex. via Supabase / Twilio) | Envoyer les codes de connexion | Quelques centimes par SMS | Facturé sur ta carte |
| **Google Play Console** | Publier sur Android | **25 $** une fois | Vérification d'identité Google |
| **Apple Developer** | Publier sur iPhone | **~99 $/an** | Vérification d'identité Apple |
| **Nom de domaine** (optionnel) | Adresse web pro | Quelques $/an | À ton nom |

> **Pas de compte de paiement à créer** : l'app n'encaisse rien. Ta commission se règle par **Wave**,
> hors app, via l'historique transmis au club — donc **pas d'agrégateur, pas de KYC**.

> Conseil : commence par **Supabase + SMS** (gratuit / quasi-gratuit). Les comptes stores viennent
> **plus tard**, quand l'app est prête à être publiée.

---

## 3. Le découpage en lots (on avance étape par étape)

Chaque lot est une session (ou quelques-unes). On ne passe au suivant que quand le précédent marche.

| Lot | Résultat concret | Toi | Claude |
|---|---|---|---|
| **1. Comptes & connexion SMS** | Se connecter avec son numéro + code reçu | Créer Supabase + activer SMS, me donner accès guidé | Brancher l'écran de connexion au vrai compte |
| **2. Base de données partagée** | Clubs, créneaux, réservations vus par **tout le monde** | Vérifier sur 2 téléphones | Créer la base + relier les écrans |
| **3. Dispo en temps réel** | Un terrain réservé devient **indisponible** pour les autres | Tester à deux | Régler la logique anti-double-réservation côté serveur |
| **4. Espace Club multi-utilisateurs** | Le club gère **ses vraies** réservations reçues | Donner les accès au club | Sécuriser l'accès club |
| **5. Notifications** | Rappels de match / confirmations | Autoriser les notifs sur ton tél. | Brancher les notifications |
| **6. Relecture de sécurité** | Vérifier la protection des données avant l'ouverture | Mandater un expert (une fois) | Préparer le code à la relecture, corriger |
| **7. Publication stores** | App téléchargeable sur Play Store / App Store | Créer les comptes stores, suivre mes étapes | Préparer et soumettre les versions |

> Important : c'est **itératif**. Entre chaque lot, on teste sur de vrais téléphones et on corrige.
> **Pas de lot « paiement »** : l'app ne gère pas d'argent (commission par Wave, hors app).

---

## 4. Sécurité — ce qu'on met en place

- **Connexion vérifiée** (code SMS) : pas de faux comptes au nom de quelqu'un d'autre.
- **Règles d'accès** : chaque personne ne voit/modifie que ce qu'elle a le droit (un club ne voit
  que ses réservations, un joueur que les siennes).
- **Clés secrètes chez toi** : les mots de passe et clés ne sont jamais publiés dans le code.
- **Relecture par un expert (une fois)** : avant l'ouverture au public, un spécialiste vérifie la
  protection des données personnelles (noms, numéros, réservations).

> *Et si un jour tu voulais un paiement intégré ?* Ce serait un **module séparé et plus lourd**
> (agrégateur, vérification d'entreprise/KYC, sécurité financière). **Ce n'est pas prévu aujourd'hui** —
> et c'est très bien ainsi : ça garde le projet simple et sûr.

---

## 5. Après le lancement : maintenance & sécurité

Une fois l'app en ligne, quelques tâches **récurrentes** (légères, mais réelles) :

- **Mises à jour ~1-2 fois/an** : suivre les nouvelles versions d'iPhone/Android et des outils, sinon
  l'app peut buguer ou être retirée des stores. → **Je m'en occupe** quand tu ouvres une session.
- **Sauvegardes de la base** : les services gérés (Supabase/Firebase) les font ; à **activer/vérifier**.
- **Surveillance** : avec un service géré, les pannes sont rares et largement auto-réparées. Garde un
  **œil** dessus et **quelqu'un de joignable** en cas de pépin (je ne suis pas « de garde » 24/7).
- **Support & modération** : répondre aux utilisateurs, gérer faux comptes / no-shows / litiges de
  résultats (toi au début, avec des règles simples).
- **Juridique (une fois)** : CGU + politique de confidentialité + conformité **ARTCI**, validées par un
  juriste.

---

## 6. Si tu préfères déléguer à un prestataire

Tu peux aussi confier la construction à un freelance/une agence. Dans ce cas, voici quoi lui donner
et quoi lui demander.

**À fournir :**
- Le lien de la démo + l'accès au code (ce dépôt) : tout le design et les écrans existent déjà.
- Ce document (architecture + lots) comme cahier des charges de départ.

**Périmètre demandé :** back-end Supabase/Firebase, connexion SMS, base partagée, dispo temps réel,
Espace Club multi-utilisateurs, notifications, publication stores. *(Pas de paiement : l'app ne gère
pas d'argent.)*

**Les questions à poser pour comparer les devis :**
- Quel **prix total** et quel **échéancier** (par lot) ?
- Quel **délai** jusqu'à une version testable, puis publiée ?
- Qui **détient le code et les comptes** à la fin ? *(Réponse attendue : toi.)*
- Quelle **maintenance** après livraison, et à quel prix ?
- Peut-on **commencer petit** (lots 1-3) avant de s'engager sur la suite ?

---

## 7. Par où commencer, concrètement

1. Avoir **au moins 1 club pilote** d'accord (sinon, reste sur la démo — voir `GUIDE-LANCEMENT.md`).
2. Me dire : « on lance la vraie version ».
3. On démarre par le **Lot 1** : je te guide pour créer **Supabase**, activer le **SMS**, et je
   branche la connexion. On teste sur ton téléphone. Puis on enchaîne les lots.
