import { collection, addDoc, updateDoc, doc, deleteDoc, getDocs, query, orderBy, Timestamp } from 'firebase/firestore'
import { db } from '../firebase/init'

export const TYPES_OPPORTUNITE = ['Appel d\'offres public','Marché privé','Sous-traitance','Contrat direct','Autre']
export const STATUTS_OPPORTUNITE = ['À étudier','En cours de préparation','Soumis','Gagné','Perdu','Annulé']
export const SOURCES_OPPORTUNITE = ['DCMP Sénégal','ARMP','Recommandation','Réseau professionnel','Prospection directe','Autre']

export const ajouterOpportunite = async (data) => {
  try {
    const o = {
      titre: data.titre || '',
      type: data.type || TYPES_OPPORTUNITE[0],
      source: data.source || '',
      lien: data.lien || '',
      localisation: data.localisation || '',
      montantEstime: Number(data.montantEstime) || 0,
      deadline: data.deadline || '',
      statut: data.statut || 'À étudier',
      notes: data.notes || '',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }
    const ref = await addDoc(collection(db, 'opportunites'), o)
    return { id: ref.id, ...o }
  } catch (e) { console.error('ajouterOpportunite:', e); return null }
}

export const getToutesOpportunites = async () => {
  try {
    const snap = await getDocs(query(collection(db, 'opportunites'), orderBy('createdAt', 'desc')))
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) { console.error('getToutesOpportunites:', e); return [] }
}

export const modifierStatutOpportunite = async (id, statut) => {
  try {
    await updateDoc(doc(db, 'opportunites', id), { statut, updatedAt: Timestamp.now() })
    return true
  } catch (e) { console.error('modifierStatutOpportunite:', e); return false }
}

export const supprimerOpportunite = async (id) => {
  try { await deleteDoc(doc(db, 'opportunites', id)); return true }
  catch (e) { console.error('supprimerOpportunite:', e); return false }
}
