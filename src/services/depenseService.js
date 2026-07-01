import { collection, addDoc, updateDoc, doc, deleteDoc, getDocs, query, orderBy, Timestamp } from 'firebase/firestore'
import { db } from '../firebase/init'

export const CATEGORIES_DEPENSE = ['Matériaux', 'Transport', 'Carburant', 'Salaires', 'Outillage', 'Sous-traitance', 'Frais admin', 'Autre']

export const ajouterDepense = async (data) => {
  try {
    const d = {
      libelle: data.libelle || '',
      categorie: data.categorie || 'Autre',
      montant: Number(data.montant) || 0,
      projetId: data.projetId || '',
      projetNom: data.projetNom || '',
      date: data.date || new Date().toISOString().slice(0, 10),
      notes: data.notes || '',
      createdAt: Timestamp.now(),
    }
    const ref = await addDoc(collection(db, 'depenses'), d)
    return { id: ref.id, ...d }
  } catch (e) { console.error('ajouterDepense:', e); return null }
}

export const getToutesDepenses = async () => {
  try {
    const snap = await getDocs(query(collection(db, 'depenses'), orderBy('createdAt', 'desc')))
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) { console.error('getToutesDepenses:', e); return [] }
}

export const supprimerDepense = async (id) => {
  try { await deleteDoc(doc(db, 'depenses', id)); return true }
  catch (e) { console.error('supprimerDepense:', e); return false }
}

export const modifierDepense = async (id, data) => {
  try {
    await updateDoc(doc(db, 'depenses', id), { ...data, montant: Number(data.montant)||0, updatedAt: Timestamp.now() })
    return true
  } catch (e) { console.error('modifierDepense:', e); return false }
}
