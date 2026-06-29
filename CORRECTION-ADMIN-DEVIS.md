# 🔧 CORRECTION — Admin ne voyait pas les devis

## Cause du bug (trouvée dans firestore.rules)
La fonction isAdmin() contenait DEUX erreurs qui faisaient échouer
silencieusement toutes les lectures admin (d'où le tableau vide) :

1. `request.auth.email`  ❌  → n'existe pas dans les règles Firestore.
   Le bon chemin est `request.auth.token.email`.

2. `try { ... } catch(e) { ... }`  ❌  → interdit dans les règles Firestore.
   Remplacé par `exists(...)` avant `get(...)`.

Comme isAdmin() plantait, l'admin était refusé → getDocs(quotes) rejeté →
le catch renvoyait [] → "Aucune demande de devis".

## Ce qui est corrigé
- `request.auth.token.email.lower()` (bon chemin)
- `exists()` puis `get()` (plus de try/catch)
- Double sécurité admin : email dans la liste OU profil users.isAdmin == true

## ⚠️ ÉTAPE OBLIGATOIRE — Redéployer les règles
Le code de l'app n'a PAS besoin de rebuild pour ce bug.
Il faut publier les NOUVELLES règles dans Firebase :

1. Ouvre https://console.firebase.google.com → projet **unic-plaquiste**
2. **Firestore Database** → onglet **Règles**
3. Efface tout, COLLE le contenu du fichier `firestore.rules` (ce projet)
4. Clique **Publier**

## Test après publication
1. Connecte-toi en **admin** (unicplaquiste@gmail.com)
2. Va dans Espace Admin → Gérer Devis
3. Tu dois voir les devis créés par les clients ✅
4. Approuve un devis → reconnecte-toi en client → statut mis à jour ✅

Si jamais ça reste vide : ouvre la console du navigateur (F12),
regarde le log "getTousDevis". Si erreur "permission-denied",
c'est que les règles ne sont pas encore publiées.
