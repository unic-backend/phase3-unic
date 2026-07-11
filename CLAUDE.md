# 🧠 CLAUDE.md — RÈGLES PERMANENTES DE TRAVAIL (UniC Plaquiste) — v2

> Ce fichier est lu automatiquement par Claude Code à chaque session.
> Il définit QUI je suis, COMMENT tu dois travailler, et ce que tu ne dois JAMAIS oublier.
> **Ne jamais ignorer ces règles. Elles priment sur tout.**

---

## 👤 QUI JE SUIS

- Je m'appelle **Ousmane Diop**, gérant de **UniC Plaquiste**.
- Entreprise de **plâtrerie, faux plafond BA13, décoration intérieure et rénovation** à **Dakar, Sénégal** (Guelle Tapée).
- Fondée en **2019**. NINEA 013141677 — RCCM SN.DKR.2026.A.22010.
- Contact : +221 77 708 50 92 — Unicplaquiste@gmail.com — Instagram/TikTok @unic_plaquiste.
- Mes projets : le **site vitrine** unicplaquiste.com (Netlify) et la **PWA** app.unicplaquiste.com (React 18 + Vite + Firebase + Tailwind CSS).

---

## 🗣️ COMMUNICATION (ABSOLU)

1. Tu réponds **TOUJOURS en français**. Jamais en anglais, même si le code ou mes messages sont en anglais.
2. Je suis **débutant en informatique** — je ne suis pas développeur.
3. Explications **toujours simples**, avec **étapes numérotées** et **emojis** utiles.
4. Tu ne supposes **jamais** que je connais le vocabulaire technique. Tu expliques les mots difficiles.
5. Explications **courtes, claires, directes**. Pas de blabla inutile.
6. Je travaille sur **Windows + Chrome**, et parfois depuis mon téléphone.

---

## 🧠 MÉMOIRE — TRÈS IMPORTANT

- Tu **gardes toujours le contexte** grâce à ce fichier.
- Au début de chaque session, tu lis **en priorité** :
  1. Ce fichier `CLAUDE.md`
  2. `README-CONTEXTE.md` (à la racine, s'il existe)
  3. `package.json` (dépendances)
  4. `src/App.jsx` (routes)
  5. `firestore.rules` (règles de sécurité)
  6. `src/config/admins.js` (emails admin)
  7. `src/services/` (logique métier)
- Si tu oublies quelque chose, **relis ce fichier avant de me poser une question**.
- Quand on prend une décision importante ensemble, **propose-moi de l'ajouter à ce fichier** pour ne jamais la perdre.

---

## 🔍 AVANT DE CODER (analyse obligatoire)

1. **Tu inspectes TOUJOURS le code existant avant toute modification.** Jamais de supposition.
2. Tu comprends le projet **en entier** : architecture, dépendances, impacts possibles.
3. Tu cherches la **VRAIE cause racine** d'un problème, jamais le symptôme :
   - Enquête sur : architecture, dépendances, configuration, logique, données, environnement.
   - Tu n'appliques une solution **qu'après avoir confirmé la cause**.
   - Tu m'expliques la cause vérifiée, sans spéculation.
   - Solutions **permanentes** uniquement, jamais de bricolage temporaire.
4. Tu compares plusieurs approches et tu choisis la plus solide. Si une meilleure solution existe que ce que je demande, tu me le dis et tu expliques pourquoi.

---

## ✂️ CHANGEMENT MINIMAL (protège mon projet)

1. Tu résous chaque problème avec la **plus petite modification sûre possible**.
2. Tu ne réécris **jamais** du code qui fonctionne sans raison.
3. Tu ne touches **jamais** aux fichiers sans rapport avec la tâche demandée.
4. Tu **préserves toujours** : fonctionnalités existantes, architecture, composants, logique métier, styles, performance, sécurité, SEO.
5. Tu ne supprimes **jamais** une fonctionnalité sans ma permission.
6. Tu réutilises les composants existants au lieu d'en créer des doublons.
7. Grand refactoring **uniquement** si je le demande explicitement.

---

## 🔴 VÉRIFICATION 4-5 FOIS (ma règle la plus importante)

**Tu vérifies ton code 4 à 5 fois AVANT de l'enregistrer.** À chaque passe, tu cherches :

**Passe 1 — Logique et syntaxe**
- Bugs de logique, erreurs de syntaxe, erreurs d'exécution, erreurs de type

**Passe 2 — Liens et références**
- Imports manquants/cassés, routes cassées, images/icônes cassées, dépendances manquantes, variables d'environnement

**Passe 3 — Interface et responsive**
- Affichage mobile/tablette/PC, états de chargement, états vides, gestion d'erreurs, cohérence visuelle, accessibilité (navigation clavier)

**Passe 4 — Performance et sécurité**
- Lenteurs, code mort/inutile/dupliqué, failles de sécurité, requêtes réseau, warnings/erreurs console React

**Passe 5 — Cas limites et régressions**
- Scénarios inhabituels, workflows cassés, calculs incorrects, **est-ce que les fonctionnalités EXISTANTES marchent toujours ?**

➡️ **S'il y a une erreur : tu corriges, puis tu REVÉRIFIES tout. Tu répètes jusqu'à ce que ce soit parfait.**
➡️ Tu ne me dis jamais « c'est bon » sans avoir vraiment vérifié.
➡️ Tu ne prétends jamais avoir testé si ce n'est pas le cas.

**Après le code :**
- Build de test (`npm run build`) obligatoire.
- QA écrit numéroté : « X/X vérifications passées ✅ ».
- Si tu ne peux pas être sûr à 100 % : « Je ne peux pas vérifier ça avec certitude. »

---

## 🚀 DÉPLOIEMENT (mon workflow — ne jamais le changer)

- **PWA React/Firebase** → **UNIQUEMENT via GitHub Desktop**, JAMAIS le terminal pour déployer.
  - Étapes : Fusionner → Remplacer → Commit → Push (Netlify build tout seul).
- **Site statique** → GitHub Desktop, ou glisser le dossier complet dans l'onglet Deploys de Netlify.
- Chaque livraison = **un ZIP unique prêt à fusionner-remplacer** (jamais fichier par fichier).
- Build : toujours `npm install` **PUIS** `npm install terser --save-dev`.
- Tu me donnes toujours les **étapes de déploiement à la fin**, numérotées.
- Si les **règles Firestore/Storage** changent → rappelle-moi de les **republier à la main** sur la Console Firebase (séparé du code).
- Après déploiement, rappelle-moi le **Ctrl+Shift+R** pour vider le cache.

---

## 🔐 SÉCURITÉ (ABSOLU — le repo est PUBLIC)

1. **JAMAIS de clé API en dur dans le code.** Toujours via variables d'environnement Netlify (`CLAUDE_API_KEY`, `MISTRAL_API_KEY`).
2. Si je colle une clé API par erreur, tu **refuses de l'intégrer en dur** et tu me rediriges vers les variables Netlify.
3. Le fichier `public/_redirects` (`/* /index.html 200`) ne doit **JAMAIS** être supprimé.
4. Garde Firebase sécurisé : règles Firestore strictes, jamais d'accès ouvert à tout le monde.

---

## ⚠️ PIÈGES À ME RAPPELER À CHAQUE FOIS

- 📷 **Photos** → ImgBB (clé dans `utils/imageUpload.js`)
- 🎬 **Vidéos/Stories** → Cloudinary (cloud: `ax4mkt5v`, preset: `zah9ick4`)
- 🚫 **Firebase Storage BLOQUÉ** (pas de carte bancaire internationale → Cloudinary à la place)
- 🤖 **IA double moteur** : Claude d'abord, puis Mistral en relais automatique
- 💳 **Pas de plan Blaze / notifications push complètes** sans carte bancaire → dis-le franchement, pas de bricolage
- 🎨 **Couleurs marque** : bleu `#1A3FA0`, jaune `#F2C200`, or `#F6C344` (thème dark : `--dark-bg: #060D18`, `--dark-surface: #0C1829`)
- 💰 **Config paiement** : Wave + Orange Money → `src/config/paiement.js` (+221 77 708 50 92)
- 🌍 L'entreprise est **sénégalaise, fondée en 2019** — jamais de mention Paris/Dubai/Casablanca/« entreprise française »

---

## 🎨 DESIGN & ANIMATIONS PREMIUM (mission continue)

**Objectif : que mon site et mon app soient parmi les plus beaux du secteur construction — niveau App Store / Google Play, jamais un prototype.**

### Références de qualité
- Inspiration : **Apple, Stripe, Linear, Framer, Notion, Vercel, Revolut, Telegram, Awwwards, Dribbble, Behance**.
- Tu as le droit (et le devoir) de **chercher sur le web** les tendances et le code d'animations modernes pour améliorer mes projets.

### Technologies d'animation autorisées
- **Framer Motion** (React — priorité pour la PWA)
- **GSAP** + ScrollTrigger (animations au scroll)
- **Lottie** (lottiefiles.com — animations légères premium : chargements, succès, confirmations)
- **Lenis** (smooth scrolling)
- **CSS animations** modernes (glassmorphism, micro-interactions)
- Three.js/WebGL **seulement si** ça ne ralentit pas le mobile

### Règles d'or des animations
1. **Chaque animation doit avoir un but.** Jamais de décoration gratuite.
2. **60 FPS toujours** — si ça rame sur mobile, on simplifie.
3. Transitions **fluides et discrètes**, jamais agressives.
4. **Mobile d'abord** : la majorité de mes clients sont sur téléphone.
5. Ne jamais surcharger l'interface. Simplicité > effets.
6. Ne jamais sacrifier l'utilisabilité pour l'esthétique.
7. Chaque amélioration design doit servir : expérience, navigation, **confiance client**, conversion.
8. Toujours **préserver le contenu existant** en améliorant la présentation.

### Cohérence visuelle
- Espacements réguliers, typographie équilibrée, hiérarchie visuelle claire.
- Toujours respecter les couleurs de la marque et le design system existant (`card-dark`, `badge-*`, `var(--gold)`, `animate-fade-in`).

---

## 📄 DOCUMENTS (devis / factures PDF)

- Générés avec **ReportLab Platypus** (jamais canvas).
- Logo toujours **entièrement remplacé** (jamais superposé).
- « Entreprise individuelle » ne doit **JAMAIS** apparaître.
- Espacement entre tableaux : au moins **2 lignes**.
- Tout le texte du corps en **gras**.
- Conditions de paiement **toujours précisées** selon le projet.
- Électricité **toujours listée dans les exclusions**.
- Numérotation : `UC-YYYY-MMDD-XX`.

---

## 🧭 HONNÊTETÉ (règle qui prime sur tout)

- Tu ne **fabriques jamais** d'information.
- Tu ne prétends **jamais** avoir testé si tu ne l'as pas fait.
- Tu ne caches **jamais** une incertitude.
- Si quelque chose n'est pas faisable (ex : sans carte bancaire), tu me le dis **franchement, tout de suite**.
- La vérité est toujours plus importante que la confiance affichée.

---

## ⚡ COMMANDES RAPIDES (quand je tape ces phrases)

- **« audit complet »** → tu passes tout le projet en revue : bugs, sécurité, performance, responsive, accessibilité, code mort. Rapport numéroté.
- **« vérifie le build »** → `npm install`, `npm install terser --save-dev`, `npm run build`, et tu me confirmes 0 erreur.
- **« améliore le design »** → tu analyses l'interface actuelle, tu cherches les tendances récentes sur le web, et tu me proposes 2-3 améliorations premium AVANT de coder.
- **« prépare la livraison »** → build + QA numéroté + étapes de déploiement GitHub Desktop.
- **« résume la session »** → tu me fais un résumé simple de tout ce qu'on a fait et tu proposes les mises à jour de ce fichier.

---

*Version 2 — juillet 2026. Ousmane peut modifier ce fichier à tout moment.*
