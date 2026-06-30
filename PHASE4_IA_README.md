# PHASE 4 — Assistant IA & Base de Connaissances (fondation UniC AI OS)

## Ce qui a été ajouté (rien d'existant n'a été modifié en profondeur)

### Nouveaux fichiers
- `src/admin/AdminBaseConnaissances.jsx` — page admin "Assistant IA" : poser une question + gérer la base de connaissances
- `src/services/iaService.js` — logique : CRUD connaissances + appel à l'assistant
- `functions/ia-chat.js` — fonction serveur Netlify (v2) : seul endroit qui contient/utilise la clé Claude
- `firestore.rules` — nouvelle collection `base_connaissances` (lecture/écriture admin uniquement, additif)

### Fichiers modifiés (changements ciblés)
- `src/App.jsx` — ajout de la route `/admin/connaissances`
- `src/admin/AdminLayout.jsx` — ajout de l'entrée "Assistant IA" dans le menu desktop (sidebar)
- `src/context/AuthContext.jsx` — correction d'un bug latent : la liste des emails admin était dupliquée en dur ici en plus de `src/config/admins.js`. Maintenant elle importe `isAdminEmail()` au lieu de sa propre copie.
- `package.json` — ajout de la dépendance `jose` (vérification de tokens, légère, sans clé secrète à gérer)
- `.env.example` — documentation de `CLAUDE_API_KEY` (à mettre dans Netlify, jamais dans le code)

### Fichier neutralisé (pas supprimé, juste désactivé)
- `functions/sendNewQuoteEmail.js` → renommé `functions/_legacy_sendNewQuoteEmail.js.disabled`
  Ce fichier utilisait la syntaxe Firebase Functions (pas Netlify) et des dépendances absentes du projet (`firebase-functions`, `nodemailer`). Il n'a donc jamais pu fonctionner. Comme `netlify.toml` pointe vers ce même dossier `functions/`, il fallait le neutraliser pour ne pas risquer de gêner le déploiement de `ia-chat.js`. Pour le restaurer un jour : renomme-le en `.js` et ajoute les dépendances manquantes à `package.json`.

## ⚠️ ÉTAPE OBLIGATOIRE avant que l'Assistant IA fonctionne

1. Aller sur **Netlify > ton site > Project configuration > Environment variables**
2. Ajouter une variable : `CLAUDE_API_KEY` = ta clé API Anthropic (console.anthropic.com)
3. Republier le déploiement (un nouveau push GitHub suffit, Netlify rebuild automatiquement)

Sans cette variable, la page "Assistant IA" s'affichera normalement mais toute question renverra une erreur claire ("Assistant IA non configuré côté serveur") — pas de plantage silencieux.

## Comment ça fonctionne (résumé technique)

1. L'admin tape une question sur `/admin/connaissances`
2. Le navigateur cherche les connaissances pertinentes dans `base_connaissances` (recherche simple par mots-clés, côté client — suffisant pour une petite base)
3. Le navigateur envoie la question + le contexte trouvé à `/.netlify/functions/ia-chat`, avec son token Firebase en preuve d'identité
4. La fonction Netlify **vérifie ce token** (sans clé secrète Firebase requise — juste les clés publiques Google) et **refuse tout compte non-admin**
5. Si admin confirmé, elle appelle l'API Claude avec la clé secrète (jamais visible côté navigateur) et renvoie la réponse

## Sécurité

- La clé `CLAUDE_API_KEY` n'existe que côté serveur (variable Netlify) — invisible dans le code, le navigateur, ou GitHub.
- Toute requête vers `ia-chat.js` sans token admin valide est rejetée (401) avant même de toucher l'API Claude.
- Aucune règle Firestore existante n'a été modifiée — seulement une nouvelle collection ajoutée.

## Prochaine phase recommandée (vision WhatsApp → Devis IA)

Cette fondation (base de connaissances + fonction IA sécurisée) sera réutilisée telle quelle pour la Phase suivante : le formulaire public que les clients ouvrent depuis WhatsApp. La seule vraie nouveauté à ce moment-là sera la gestion des utilisateurs anonymes (Firebase Auth anonyme) et les collections `prospects` / `devis_brouillons`, mais le moteur IA et la sécurité resteront les mêmes.
