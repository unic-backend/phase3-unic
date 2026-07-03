import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getAnalytics } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: "AIzaSyCfgMA9uzhvAOhSBedETfAZqpxqh8OfbRA",
  authDomain: "unic-plaquiste.firebaseapp.com",
  projectId: "unic-plaquiste",
  storageBucket: "unic-plaquiste.firebasestorage.app",
  messagingSenderId: "308052390634",
  appId: "1:308052390634:web:1f4a5134705cf1173c1d93",
  measurementId: "G-CZ17XNSJQN"
}

// Initialiser Firebase
console.log(firebaseConfig)
const app = initializeApp(firebaseConfig)


// Services Firebase
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Analytics (optionnel, ne doit jamais bloquer l'app)
let analytics = null
try {
  if (typeof window !== 'undefined') {
    analytics = getAnalytics(app)
  }
} catch (e) {
  console.warn('Analytics non disponible:', e?.message)
}

export { app, analytics }
