# 📋 FICHE DE PASSATION — Projet UniC Plaquiste (App Espace Client)

> **À LIRE EN PREMIER (pour la nouvelle session Claude) :**
> Ce document résume un projet en cours. Le code complet est dans le ZIP `phase3-unic-plaquiste.zip` que l'utilisateur (Ousmane) va te fournir. Lis ce ZIP avant d'agir. Ne recrée PAS de fausses données. Vérifie toujours le code réel avant de répondre, ne devine pas.

---

## 👤 CLIENT
- **Ousmane**, propriétaire de **UniC Plaquiste** (Dakar, Sénégal) — plâtrerie, BA13, faux plafonds, peinture, décoration.
- Communique **en français**, débutant en informatique, envoie des **captures d'écran**.
- Préfère : explications **simples, pas à pas, numérotées**. Corrige directement si le résultat ne convient pas.
- ⚠️ Ne JAMAIS lui demander son mot de passe.

## 🏢 INFOS ENTREPRISE
- Tél / WhatsApp / Wave / Orange Money : **+221 77 708 50 92**
- Email : Unicplaquiste@gmail.com
- Tarif : **15 000 FCFA/m²** (inclut matériaux, pose, fournitures, finition peinture, main-d'œuvre)
- **PAS de TVA** (on ne l'utilise pas — tout est en `totalTTC`, jamais `totalHT`)
- Couleurs : Bleu `#1A3FA0`, Jaune `#F2C200`, Bleu foncé `#0D1B4B`
- Logo : `src/assets/logo.webp`

## 🛠️ STACK TECHNIQUE
- **React + Vite + Tailwind CSS**
- **Firebase** (Auth email/password + Firestore) — projet `unic-plaquiste`
- Hébergé sur **Netlify** (déploiement manuel par glisser-déposer du dossier `dist`)
- Toujours utiliser `styles.css` (PAS `index.css`)
- `_redirects` présent dans `public/` (routes SPA Netlify) — NE PAS supprimer

## 🌐 EN LIGNE (LIVE)
- App : **https://app.unicplaquiste.com** (custom domain Netlify, HTTPS actif, Netlify DNS)
- Site Netlify : **peaceful-praline-db90db**
- Site vitrine existant : **www.unicplaquiste.com** (fichier index.html séparé, Netlify) — NE PAS y toucher sans demande

## 🔑 FIREBASE
Config dans `src/firebase/init.js` (clés déjà en place, projet `unic-plaquiste`).
- Auth email/password : ACTIVÉ
- Collections Firestore utilisées : `users`, `quotes` (devis), `invoices` (factures)

## 👮 ADMINS
Liste centralisée dans `src/config/admins.js` :
- admin@unicplaquiste.com
- unicplaquiste@gmail.com
- odiop2020@gmail.com

Un bouton "🔐 Espace Admin" apparaît dans le menu client UNIQUEMENT pour ces emails.
Accès admin : `/admin/dashboard`.

## 💳 PAIEMENT
Config dans `src/config/paiement.js`. Boutons simples (pas d'API) :
- Wave + Orange Money : **77 708 50 92**, bouton copier + envoi preuve WhatsApp.

---

## ✅ CE QUI EST FAIT
1. Site public (accueil, services, tarifs 15 000 FCFA/m², galerie, FAQ, contact)
2. Auth Firebase réelle (signup/login/logout) — redirection via `onAuthStateChanged` + `useEffect` sur `user`
3. Espace Client : dashboard, devis, projets, chat, factures, profil
4. Espace Admin : dashboard, devis (approuver/rejeter RÉEL), factures, clients, projets, messages
5. **Devis branchés sur Firebase** : 1 demande = 1 seul devis (jamais découpé), toujours statut "En attente", SEUL l'admin approuve/rejette
6. **Factures branchées sur Firebase** (service `invoiceService.js`)
7. **TOUTES les fausses données (mockData) supprimées de l'affichage** — tableaux vides par défaut, se remplissent avec de vraies données
8. **Responsive mobile** : tableaux → cartes, sidebar réduite sur mobile, `overflow-x-hidden` global, titres adaptés
9. Galerie : emojis flous remplacés par icône SVG nette ; système prêt pour vraies photos (dossier `public/photos/` + guide)
10. Custom domain + HTTPS OK

## 🔧 FICHIERS CLÉS
- `src/config/admins.js` — liste admins
- `src/config/paiement.js` — numéros Wave/OM
- `src/services/quoteService.js` — creerDevis, getDevisClient, getTousDevis, changerStatutDevis
- `src/services/invoiceService.js` — creerFacture, getFacturesClient, getToutesFactures, marquerFacturePayee
- `src/services/userService.js` — profils
- `src/context/AuthContext.jsx` — auth (a un timeout de sécurité 3s anti-blocage)
- `src/components/ProtectedRoute.jsx` (utilise `user`, PAS `isAuthenticated`) / `AdminRoute.jsx`
- `src/data/mockData.js` — EXISTE ENCORE mais N'EST PLUS IMPORTÉ nulle part (ne pas le réutiliser pour l'affichage)

## ⏳ CE QUI RESTE À FAIRE (priorités)
1. **🔒 SÉCURISER LES RÈGLES FIRESTORE (URGENT avant ouverture publique)** — actuellement probablement en mode test/ouvert. Règles à écrire : un client lit/écrit seulement SES données ; les devis : client crée + lit les siens, seul admin modifie le statut.
2. **Écran admin "Créer une facture"** pour un client (le service `creerFacture` existe déjà, il manque le formulaire/bouton dans l'admin).
3. **Étape 2 (lien site vitrine)** : ajouter dans le `index.html` de www.unicplaquiste.com, section "Espace Client" (actuellement vide), un bouton vers `https://app.unicplaquiste.com/login`. Ousmane édite ce index.html lui-même et le redéploie sur Netlify.
4. (Optionnel) Système de **projets** réels (création admin + suivi %).
5. (Optionnel) Vraies **photos** de chantier dans la galerie.

## ⚙️ COMMANDES DE BUILD/DÉPLOIEMENT
```bash
rm -rf phase3-unic
unzip phase3-unic-plaquiste.zip
cd phase3-unic
npm install
npm install terser --save-dev   # IMPORTANT : terser requis pour le build, sinon erreur
npm run build
# puis glisser le dossier "dist" sur Netlify (site peaceful-praline-db90db)
```

## 🧠 RÈGLES DE TRAVAIL (IMPORTANT POUR LA NOUVELLE SESSION)
- **Vérifier le code réel** (lire les fichiers du ZIP) AVANT de corriger. Ne pas deviner.
- Vérifier l'équilibrage des balises et la cohérence imports/exports avant d'envoyer un ZIP.
- **Jamais de fausses données** affichées au client.
- **Jamais** l'app ne décide à la place d'Ousmane (approbation/rejet = admin uniquement).
- Répondre en français, étapes numérotées, simples.
- Après chaque modif, renvoyer le ZIP `phase3-unic-plaquiste.zip` complet.
- Le réseau est coupé côté Claude : impossible de faire `npm install`/build dans l'environnement. Valider par lecture de code.

---
**État au moment de la passation : app en ligne et fonctionnelle, données réelles, responsive mobile OK. Prochaine priorité = sécuriser Firestore.**
