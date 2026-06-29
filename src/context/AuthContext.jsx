import { createContext, useState, useEffect } from 'react'
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged 
} from 'firebase/auth'
import { auth, db } from '../firebase/init'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { isAdminEmail } from '../config/admins'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Écouter les changements d'authentification SANS DÉLAI
  useEffect(() => {
    // Sécurité: ne jamais rester bloqué sur "Chargement..." plus de 3s
    const safety = setTimeout(() => setLoading(false), 3000)

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      clearTimeout(safety)

      // Sessions anonymes (page publique /discussion) : ce ne sont pas des
      // utilisateurs "client" ou "admin" de l'app. On les ignore ici pour ne
      // pas planter sur firebaseUser.email (null pour un compte anonyme) —
      // la page Discussion lit auth.currentUser directement, sans passer par ici.
      if (firebaseUser && !firebaseUser.isAnonymous) {
        // 1) Connecter IMMÉDIATEMENT avec les infos Firebase Auth (pas d'attente)
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email,
          emailLower: (firebaseUser.email || '').toLowerCase(),
          nom: firebaseUser.displayName || 'Utilisateur',
          telephone: ''
        })
        setLoading(false)

        // 2) Charger le profil Firestore EN ARRIÈRE-PLAN (sans bloquer)
        getDoc(doc(db, 'users', firebaseUser.uid))
          .then((docSnap) => {
            if (docSnap.exists()) {
              const profile = docSnap.data()
              setUser((prev) => ({
                ...prev,
                id: firebaseUser.uid,
                email: firebaseUser.email,
                emailLower: (firebaseUser.email || '').toLowerCase(),
                nom: profile.nom || 'Utilisateur',
                telephone: profile.telephone || '',
                isAdmin: profile.isAdmin || false,
                ...profile
              }))
            }
          })
          .catch((err) => console.error('Profil Firestore:', err))

        return
      } else {
        setUser(null)
      }

      // TOUJOURS marquer comme chargé
      setLoading(false)
    })

    return () => {
      clearTimeout(safety)
      unsubscribe()
    }
  }, [])

  const signup = async (nom, email, telephone, password) => {
    try {
      const emailLower = email.toLowerCase().trim()
      console.log('Signup start:', emailLower)
      
      // Créer compte Firebase
      const result = await createUserWithEmailAndPassword(auth, emailLower, password)
      console.log('Account created:', result.user.uid)

      // Vérifier si c'est un admin (liste centrale, voir src/config/admins.js)
      const isAdminUser = isAdminEmail(emailLower)

      // Sauvegarder profil EN ARRIÈRE-PLAN (ne pas attendre)
      setDoc(doc(db, 'users', result.user.uid), {
        nom,
        email: emailLower,
        telephone,
        isAdmin: isAdminUser,
        createdAt: new Date()
      }, { merge: true }).catch(err => console.error('Firestore error:', err))

      // onAuthStateChanged va mettre à jour l'utilisateur automatiquement
      return { success: true }
    } catch (error) {
      console.error('Signup error:', error)
      return { success: false, error: error.message }
    }
  }

  const login = async (email, password) => {
    try {
      const emailLower = email.toLowerCase().trim()
      console.log('Login start:', emailLower)
      
      const result = await signInWithEmailAndPassword(auth, emailLower, password)
      console.log('Login successful:', result.user.uid)

      // onAuthStateChanged va mettre à jour l'utilisateur automatiquement
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: error.message }
    }
  }

  const logout = async () => {
    try {
      console.log('Logout')
      await signOut(auth)
      setUser(null)
      return { success: true }
    } catch (error) {
      console.error('Logout error:', error)
      return { success: false, error: error.message }
    }
  }

  // Mettre à jour le profil utilisateur (Profil.jsx)
  const updateProfile = async (data) => {
    try {
      if (!user) return { success: false, error: 'Non connecté' }
      // Mise à jour locale immédiate
      setUser((prev) => ({ ...prev, ...data }))
      // Sauvegarde Firestore en arrière-plan
      setDoc(doc(db, 'users', user.id), { ...data, updatedAt: new Date() }, { merge: true })
        .catch((err) => console.error('updateProfile Firestore:', err))
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, signup, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthContext
