/**
 * reviewService — avis et témoignages clients.
 *
 * Cycle de vie :
 *  1. Un client dont un projet est "Livré" laisse un avis (note + commentaire).
 *  2. L'avis est créé avec statut "en_attente" (invisible au public).
 *  3. L'admin valide (→ "valide") ou rejette (→ "rejete").
 *  4. Les avis "valide" s'affichent sur le site public (HomePage).
 *
 * Un client ne peut laisser qu'un seul avis par projet.
 */
import { db } from '../firebase/init'
import {
  collection, addDoc, getDocs, doc, updateDoc, deleteDoc,
  query, where, orderBy, Timestamp,
} from 'firebase/firestore'

// Crée un avis (client). Statut initial : en attente de modération.
export const creerAvis = async (clientId, { clientNom, projetId, projetNom, note, commentaire }) => {
  try {
    const docRef = await addDoc(collection(db, 'avis'), {
      clientId,
      clientNom: clientNom || 'Client',
      projetId: projetId || '',
      projetNom: projetNom || '',
      note: Math.max(1, Math.min(5, Number(note) || 5)),
      commentaire: (commentaire || '').slice(0, 500),
      statut: 'en_attente',
      createdAt: Timestamp.now(),
    })
    return docRef.id
  } catch (e) {
    console.error('creerAvis:', e)
    return null
  }
}

// Avis déjà laissés par un client (pour éviter les doublons par projet).
export const getAvisClient = async (clientId) => {
  try {
    const q = query(collection(db, 'avis'), where('clientId', '==', clientId))
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() }))
  } catch (e) {
    console.error('getAvisClient:', e)
    return []
  }
}

// Avis VALIDES pour l'affichage public (site vitrine).
export const getAvisPublics = async () => {
  try {
    const q = query(collection(db, 'avis'), where('statut', '==', 'valide'))
    const snap = await getDocs(q)
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
  } catch (e) {
    console.error('getAvisPublics:', e)
    return []
  }
}

// Tous les avis (admin) : pour la modération.
export const getTousAvis = async () => {
  try {
    const snap = await getDocs(collection(db, 'avis'))
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
  } catch (e) {
    console.error('getTousAvis:', e)
    return []
  }
}

// Modérer un avis (admin) : 'valide' | 'rejete' | 'en_attente'
export const modererAvis = async (avisId, statut) => {
  try {
    await updateDoc(doc(db, 'avis', avisId), { statut, moderatedAt: Timestamp.now() })
    return true
  } catch (e) {
    console.error('modererAvis:', e)
    return false
  }
}

// Supprimer un avis (admin)
export const supprimerAvis = async (avisId) => {
  try {
    await deleteDoc(doc(db, 'avis', avisId))
    return true
  } catch (e) {
    console.error('supprimerAvis:', e)
    return false
  }
}
