import { db } from '../firebase/init'
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore'

export async function saveUserProfile(userId, profileData) {
  try {
    await setDoc(doc(db, 'users', userId), {
      ...profileData,
      updatedAt: new Date()
    }, { merge: true })
    return { success: true }
  } catch (error) {
    console.error('Erreur saveUserProfile:', error)
    return { success: false, error: error.message }
  }
}

export async function getUserProfile(userId) {
  try {
    const docSnap = await getDoc(doc(db, 'users', userId))
    if (docSnap.exists()) {
      return docSnap.data()
    }
    return {}
  } catch (error) {
    console.error('Erreur getUserProfile:', error)
    return {}
  }
}

export async function getUsersForSelect() {
  try {
    const snap = await getDocs(collection(db, 'users'))
    const list = snap.docs.map(d => ({
      id: d.id,
      nom: d.data().nom || 'Utilisateur',
      email: d.data().email || ''
    }))
    return list.sort((a, b) => a.nom.localeCompare(b.nom))
  } catch (error) {
    console.error('Erreur getUsersForSelect:', error)
    return []
  }
}
