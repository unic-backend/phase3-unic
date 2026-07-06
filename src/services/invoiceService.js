import { collection, addDoc, updateDoc, doc, getDoc, deleteDoc, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '../firebase/init'
import { notifierClient, notifierAdmins } from './notificationService'

// Créer une facture (admin)
export const creerFacture = async (clientId, clientEmail, data) => {
  const facture = {
    clientId: clientId || 'inconnu',
    clientEmail: clientEmail || '',
    clientNom: data.clientNom || '',
    invoiceNumber: data.invoiceNumber || `FAC-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`,
    amount: Number(data.amount) || 0,
    designation: data.designation || '',
    modalitesPaiement: data.modalitesPaiement || '',
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
// ==================== Signature électronique facture ====================
// Même système que les devis : lien token → page publique → signature client.

// Génère un lien de signature pour une facture (admin)
export const genererLienSignatureFacture = async (factureId) => {
  try {
    const token = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0')).join('')
    await updateDoc(doc(db, 'invoices', factureId), {
      signatureToken: token,
      signatureTokenDate: Timestamp.now(),
      status: 'En attente de signature',
      updatedAt: Timestamp.now(),
    })
    return token
  } catch (e) {
    console.error('genererLienSignatureFacture:', e)
    return null
  }
}

// Récupère une facture par son token (page publique /signer-facture/:token)
export const getFactureParToken = async (token) => {
  try {
    const q = query(collection(db, 'invoices'), where('signatureToken', '==', token))
    const snap = await getDocs(q)
    if (snap.empty) return null
    const d = snap.docs[0]
    return { id: d.id, ...d.data() }
  } catch (e) {
    console.error('getFactureParToken:', e)
    return null
  }
}

// Enregistre la signature du client sur la facture (page publique, vérification par token)
export const signerFactureClient = async (factureId, token, signatureBase64) => {
  try {
    await updateDoc(doc(db, 'invoices', factureId), {
      signatureClient: signatureBase64,
      signatureClientDate: Timestamp.now(),
      signatureToken: token, // gardé tel quel pour maintenir les droits Firestore
      status: 'Signée',
      updatedAt: Timestamp.now(),
    })
    return true
  } catch (e) {
    console.error('signerFactureClient:', e)
    return false
  }
}

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

// Enregistrer le détail ligne par ligne (matériaux) d'une facture — même principe
// que pour les devis. Le montant total de la facture est recalculé automatiquement.
export const enregistrerDetailFacture = async (factureId, { lignesMateriaux }) => {
  try {
    const lignes = (lignesMateriaux || [])
      .filter((l) => l.designation?.trim())
      .map((l) => ({
        designation: l.designation,
        prixUnitaire: Number(l.prixUnitaire) || 0,
        quantite: Number(l.quantite) || 0,
        prixTotal: (Number(l.prixUnitaire) || 0) * (Number(l.quantite) || 0),
      }))
    const total = lignes.reduce((sum, l) => sum + l.prixTotal, 0)
    await updateDoc(doc(db, 'invoices', factureId), {
      lignesMateriaux: lignes,
      amount: total,
    })
    return true
  } catch (e) {
    console.error('enregistrerDetailFacture:', e)
    return false
  }
}
