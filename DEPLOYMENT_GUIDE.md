# 🚀 GUIDE DE DÉPLOIEMENT PHASE 3

## ✅ FIREBASE PROJECT CRÉÉ!

**Project ID:** `unic-plaquiste`
**Region:** Africa (South)
**Status:** Production Ready ✅

---

## 📋 CHECKLIST AVANT DÉPLOIEMENT

### **1️⃣ Firebase Console Setup**

- [ ] Firestore Database activée
- [ ] Cloud Storage activée
- [ ] Authentication (Email/Password) activée
- [ ] Cloud Functions déployées
- [ ] Règles de sécurité configurées

### **2️⃣ Firestore Collections Créées**

- [ ] `users` collection
- [ ] `quotes` collection
- [ ] `projects` collection
- [ ] `messages` collection
- [ ] `invoices` collection
- [ ] `notifications` collection

### **3️⃣ Firestore Rules**

Copier dans Firebase Console > Firestore > Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    match /quotes/{quoteId} {
      allow read, write: if request.auth != null && 
        resource.data.clientId == request.auth.uid;
    }
    
    match /messages/{messageId} {
      allow read, write: if request.auth != null;
    }
    
    match /{document=**} {
      allow read, write: if request.auth != null && 
        request.auth.token.admin == true;
    }
  }
}
```

### **4️⃣ Storage Rules**

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.resource.size < 5242880;
    }
  }
}
```

---

## 🚀 DÉPLOIEMENT SUR NETLIFY

### **Étape 1: Push sur GitHub**

```bash
git add .
git commit -m "Phase 3: Production Firebase Setup"
git push origin main
```

### **Étape 2: Connect Netlify**

1. Aller à: https://app.netlify.com
2. "New site from Git"
3. Connecter GitHub
4. Sélectionner repo
5. Build command: `npm run build`
6. Publish directory: `dist`

### **Étape 3: Environment Variables**

Dans Netlify > Site settings > Environment:

```
VITE_FIREBASE_API_KEY=AIzaSyCfgMA9uzhvAOhSBedETfAZqpxqh8OfbRA
VITE_FIREBASE_AUTH_DOMAIN=unic-plaquiste.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=unic-plaquiste
VITE_FIREBASE_STORAGE_BUCKET=unic-plaquiste.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=308052390634
VITE_FIREBASE_APP_ID=1:308052390634:web:1f4a5134705cf1173c1d93
VITE_FIREBASE_MEASUREMENT_ID=G-CZ17XNSJQN
```

### **Étape 4: Deploy**

```bash
npm run build
```

Netlify déploie automatiquement!

---

## 🌐 CUSTOM DOMAIN

### **Pointer unicplaquiste.com vers Netlify**

**Option 1: Netlify DNS (SIMPLE)**

1. Netlify > Domain settings
2. "Add custom domain"
3. Entrer: `unicplaquiste.com`
4. Suivre instructions Netlify

**Option 2: Registrar DNS**

Dans ton registrar (GoDaddy, OVH, etc.):

```
CNAME record:
Name: unicplaquiste.com
Value: your-site.netlify.app
```

---

## 🔒 HTTPS

**Automatique!** Netlify active HTTPS gratuitement pour tous les sites.

Vérifier: https://unicplaquiste.com

---

## 📊 MONITORING PRODUCTION

### **Google Analytics**

Vérifier dans Firebase Console:
- Google Analytics activée ✅
- Events logging

### **Error Tracking (Sentry)**

**Optionnel - Setup rapide:**

1. Créer compte: https://sentry.io
2. Créer project React
3. Copier DSN
4. Ajouter `.env.production`:
   ```
   VITE_SENTRY_DSN=your_dsn_here
   ```

---

## 🧪 TESTER EN PRODUCTION

### **Tests rapides:**

1. **Login:** Aller à https://unicplaquiste.com/login
2. **Signup:** Créer compte test
3. **Dashboard Client:** /client/dashboard
4. **Admin:** /admin/dashboard (si admin)
5. **Chat:** /client/chat (temps réel)
6. **Factures:** /client/factures

### **Performance Check:**

```bash
npm run build
# Lighthouse: https://pagespeed.web.dev
```

---

## 📧 EMAIL NOTIFICATIONS (Cloud Functions)

### **Setup Cloud Functions**

**Étape 1: Installer Firebase CLI**

```bash
npm install -g firebase-tools
firebase login
```

**Étape 2: Initialize Functions**

```bash
firebase init functions
```

**Étape 3: Ajouter functions**

Copier templates dans `functions/`

**Étape 4: Deploy**

```bash
firebase deploy --only functions
```

---

## 🎯 RÉSUMÉ DÉPLOIEMENT

| Étape | Status | Action |
|-------|--------|--------|
| Firebase Setup | ✅ | Déjà créé! |
| Code Phase 3 | ✅ | Download ZIP |
| GitHub Push | ⏳ | `git push` |
| Netlify Connect | ⏳ | Auto-deploy |
| Env Variables | ⏳ | Add to Netlify |
| Custom Domain | ⏳ | Point DNS |
| Cloud Functions | ⏳ | Deploy |
| Go Live! | ⏳ | 🚀 |

---

## 🚀 GO LIVE CHECKLIST

- [ ] GitHub repo créé + poussé
- [ ] Netlify site créé + déployé
- [ ] Environment variables configurées
- [ ] Custom domain pointé
- [ ] HTTPS fonctionnant
- [ ] Login/Signup fonctionnant
- [ ] Admin dashboard accessible
- [ ] Chat temps réel testée
- [ ] Google Analytics activée
- [ ] Erreurs monitoring (Sentry)

---

## 💪 BRAVO!

**Tu as créé une plateforme production-ready!**

Prochaines étapes:
- 📱 Mobile app (React Native)
- 💳 Intégration paiement
- 📊 Rapports PDF
- 🚀 Marketing

---

**READY TO GO LIVE!** 🎉

Questions? Besoin d'aide?

