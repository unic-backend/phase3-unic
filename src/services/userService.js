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

// Statistiques réelles d'inscription : nombre total de comptes CLIENTS
// (comptes admin exclus) + nombre créés ce mois-ci, pour répondre à
// "combien de personnes sont inscrites sur l'app ?"
export async function getStatistiquesInscriptions() {
  try {
    const snap = await getDocs(collection(db, 'users'))
    const maintenant = new Date()
    const debutMois = new Date(maintenant.getFullYear(), maintenant.getMonth(), 1)

    let total = 0
    let ceMois = 0

    snap.docs.forEach(d => {
      const data = d.data()
      if (data.isAdmin) return // on ne compte que les vrais clients
      total += 1

      const createdAt = data.createdAt?.toDate
        ? data.createdAt.toDate()
        : (data.createdAt ? new Date(data.createdAt) : null)
      if (createdAt && createdAt >= debutMois) ceMois += 1
    })

    return { total, ceMois }
  } catch (error) {
    console.error('Erreur getStatistiquesInscriptions:', error)
    return { total: 0, ceMois: 0 }
  }
}
