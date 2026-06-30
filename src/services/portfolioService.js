import { collection, addDoc, updateDoc, doc, deleteDoc, getDocs, query, orderBy, Timestamp } from 'firebase/firestore'
import { db } from '../firebase/init'

export const ajouterPortfolio = async (data) => {
  try {
    const p = {
      titre: data.titre || '',
      type: data.type || '',
      localisation: data.localisation || '',
      surfaceM2: Number(data.surfaceM2) || 0,
      cout: Number(data.cout) || 0,
      dureeJours: Number(data.dureeJours) || 0,
      annee: Number(data.annee) || new Date().getFullYear(),
      photos: data.photos || [],
      notes: data.notes || '',
      createdAt: Timestamp.now(),
    }
    const ref = await addDoc(collection(db, 'portfolio'), p)
    return { id: ref.id, ...p }
  } catch (e) { console.error('ajouterPortfolio:', e); return null }
}

export const getTousPortfolio = async () => {
  try {
    const snap = await getDocs(query(collection(db, 'portfolio'), orderBy('createdAt', 'desc')))
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) { console.error('getTousPortfolio:', e); return [] }
}

export const supprimerPortfolio = async (id) => {
  try { await deleteDoc(doc(db, 'portfolio', id)); return true }
  catch (e) { console.error('supprimerPortfolio:', e); return false }
}

export const modifierPortfolio = async (id, data) => {
  try {
    await updateDoc(doc(db, 'portfolio', id), { ...data, surfaceM2: Number(data.surfaceM2)||0, cout: Number(data.cout)||0, updatedAt: Timestamp.now() })
    return true
  } catch (e) { console.error('modifierPortfolio:', e); return false }
}
