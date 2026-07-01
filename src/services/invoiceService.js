import { collection, addDoc, updateDoc, doc, getDoc, deleteDoc, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '../firebase/init'
import { notifierClient, notifierAdmins } from './notificationService'

// Créer une facture (admin)
export const creerFacture = async (clientId, clientEmail, data) => {
  const facture = {
    clientId: clientId || 'inconnu',
    clientEmail: clientEmail || '',
    invoiceNumber: data.invoiceNumber || `FAC-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`,
    amount: Number(data.amount) || 0,
    status: data.status || 'En attente',
    issueDate: data.issueDate || new Date().toISOString().slice(0, 10),
    dueDate: data.dueDate || '',
    createdAt: Timestamp.now()
  }
  const docRef = await addDoc(collection(db, 'invoices'), facture)

  notifierClient(clientId, {
    title: 'Nouvelle facture',
    message: `Facture ${facture.invoiceNumber} de ${facture.amount.toLocaleString('fr-FR')} FCFA à régler.`,
    link: '/client/factures'
  })

  return { id: docRef.id, ...facture }
}

// Factures d'un client
export const getFacturesClient = async (clientId) => {
  try {
    const q = query(collection(db, 'invoices'), where('clientId', '==', clientId))
    const snap = await getDocs(q)
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    return list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
  } catch (e) {
    console.error('getFacturesClient:', e)
    return []
  }
}

// Toutes les factures (admin)
export const getToutesFactures = async () => {
  try {
    const snap = await getDocs(collection(db, 'invoices'))
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    return list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
  } catch (e) {
    console.error('getToutesFactures:', e)
    return []
  }
}

// Marquer payée (admin)
export const marquerFacturePayee = async (factureId) => {
  try {
    await updateDoc(doc(db, 'invoices', factureId), { status: 'Payée' })

    const snap = await getDoc(doc(db, 'invoices', factureId))
    if (snap.exists()) {
      const f = snap.data()
      notifierClient(f.clientId, {
        title: 'Paiement confirmé',
        message: `Votre facture ${f.invoiceNumber} est marquée payée. Merci !`,
        link: '/client/factures'
      })
    }

    return true
  } catch (e) {
    console.error('marquerFacturePayee:', e)
    return false
  }
}

// Le client signale qu'il a payé -> statut "En vérification" (admin confirmera)
export const signalerPaiement = async (factureId) => {
  try {
    await updateDoc(doc(db, 'invoices', factureId), { status: 'En vérification' })

    const snap = await getDoc(doc(db, 'invoices', factureId))
    if (snap.exists()) {
      const f = snap.data()
      notifierAdmins({
        title: 'Paiement signalé',
        message: `${f.clientEmail || 'Un client'} a signalé le paiement de ${f.invoiceNumber}. À vérifier.`,
        link: '/admin/factures'
      })
    }

    return true
  } catch (e) {
    console.error('signalerPaiement:', e)
    return false
  }
}

// Supprimer une facture (admin uniquement). Les règles Firestore bloquent
// la suppression d'une facture déjà 'Payée' (preuve comptable à conserver).
export const supprimerFacture = async (factureId) => {
  try {
    await deleteDoc(doc(db, 'invoices', factureId))
    return true
  } catch (e) {
    console.error('supprimerFacture:', e)
    return false
  }
}
