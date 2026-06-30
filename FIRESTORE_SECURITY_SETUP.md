# 🔐 SETUP SÉCURITÉ FIRESTORE

## ⚠️ CRITICAL AVANT D'OUVRIR L'APP AU PUBLIC !

Le fichier `firestore.rules` a été créé et contient les règles de sécurité. Tu dois les déployer maintenant.

---

## 📋 ÉTAPES À FAIRE (via console Firebase)

### **Méthode 1️⃣ : Via la Console Firebase (Plus simple, recommandé)**

1. **Ouvre** : https://console.firebase.google.com
2. Sélectionne le projet `unic-plaquiste`
3. Va dans **Firestore Database** → **Règles** (onglet en haut)
4. **COPIE** tout le contenu du fichier `firestore.rules` (de ce projet)
5. **COLLE** dans l'éditeur de la console Firebase
6. Clique **Publier**

✅ **Les règles sont maintenant en vigueur !**

---

### **Méthode 2️⃣ : Via Firebase CLI (Plus avancé)**

Si tu veux utiliser le CLI :

```bash
# Installe Firebase CLI (une seule fois)
npm install -g firebase-tools

# Depuis le dossier du projet
firebase login

# Déploie les règles
firebase deploy --only firestore:rules
```

---

## 🔍 VÉRIFIER QUE ÇA MARCHE

Après le déploiement, les règles suivantes sont maintenant en place :

✅ **Clients** :
- Créer un devis → ✅ OK
- Lire leurs propres devis → ✅ OK
- Lire leur profil → ✅ OK
- Modifier le statut d'un devis → ❌ REFUSÉ (admin uniquement)

✅ **Admin** :
- Lire TOUS les devis → ✅ OK
- Modifier le statut → ✅ OK
- Créer des factures → ✅ OK
- Modifier des factures → ✅ OK

❌ **Public (non connecté)** :
- Accès refusé à tout

---

## 📝 QUE FONT CES RÈGLES ?

### **Collection `users` (profils)**
```
- Un client lit/écrit UNIQUEMENT son profil
- Admin peut lire/écrire tous les profils
- Personne ne peut supprimer
```

### **Collection `quotes` (devis)**
```
- Client crée un devis (avec son ID)
- Client lit ses propres devis
- Admin lit TOUS les devis
- SEUL l'admin peut modifier le statut (approuver/rejeter)
- Jamais de suppression
```

### **Collection `invoices` (factures)**
```
- Client lit ses propres factures
- Admin lit toutes les factures
- SEUL l'admin crée et modifie les factures
- Jamais de suppression
```

### **Collection `messages` (chat)**
```
- Client/Admin lit ses propres messages
- L'auteur crée le message
- Jamais modifier ou supprimer les messages
```

---

## ⚠️ IMPORTANT

**NE JAMAIS** laisser Firestore en mode "Test" (lecture/écriture totale) en production.

Avant cette sécurisation : 🚨 N'IMPORTE QUI pouvait :
- Lire TOUS les devis d'AUTRES clients
- Modifier les statuts sans permission
- Créer des factures
- Supprimer des données

Après cette sécurisation : ✅
- Chaque client ne voit QUE ses données
- Seul admin décide des devis/factures
- Données protégées par authentification Firebase

---

## 🚀 PROCHAINES ÉTAPES

Une fois les règles déployées :

1. ✅ Tester l'app avec un compte client → doit voir SES données uniquement
2. ✅ Tester l'app avec un compte admin → doit pouvoir modifier les devis
3. ✅ Tester sans connexion → doit être bloqué
4. ✅ Ouvrir l'app au public en confiance ! 🎉
