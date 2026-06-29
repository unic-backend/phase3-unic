import { collection, addDoc, updateDoc, doc, getDoc, deleteDoc, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore'
import { db } from '../firebase/init'
import { notifierClient, notifierAdmins } from './notificationService'
import { calculerPrixUnitaire, calculerMontant, estSurDevis } from '../utils/pricing'

// Génère un numéro de devis lisible: UC-2026-0625-AB
function genererNumero() {
  const d = new Date()
  const annee = d.getFullYear()
  const mois = String(d.getMonth() + 1).padStart(2, '0')
  const jour = String(d.getDate()).padStart(2, '0')
  const suffixe = Math.random().toString(36).substring(2, 4).toUpperCase()
  return `UC-${annee}-${mois}${jour}-${suffixe}`
}

// Créer UN SEUL devis (jamais découpé), toujours "En attente"
export const creerDevis = async (clientId, clientEmail, data) => {
  const surface = Number(data.surface) || 0
  const avecPeinture = !!data.avecPeinture
  const surDevis = estSurDevis(data.type)
  const pricePerM2 = calculerPrixUnitaire(data.type, avecPeinture) || 0
  const totalTTC = calculerMontant(data.type, surface, avecPeinture)

  const devis = {
    clientId: clientId || 'inconnu',
    clientEmail: clientEmail || '',
    quoteNumber: genererNumero(),
    title: data.title || `Devis ${data.type || ''}`.trim(),
    description: data.description || '',
    type: data.type || '',
    surface,
    avecPeinture,
    surDevis,
    pricePerM2,
    totalTTC,
    localisation: data.localisation || 'Dakar',
    urgence: data.urgence || '',
    budget: data.budget || '',
    status: 'En attente',
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  }

  const docRef = await addDoc(collection(db, 'quotes'), devis)

  // Notifier les admins qu'une nouvelle demande est arrivée (ne bloque pas si ça échoue)
  notifierAdmins({
    title: 'Nouvelle demande de devis',
    message: `${clientEmail || 'Un client'} a demandé un devis (${devis.surface} m²)`,
    link: '/admin/devis'
  })

  return { id: docRef.id, ...devis }
}

// Récupérer les devis d'un client
export const getDevisClient = async (clientId) => {
  try {
    const q = query(collection(db, 'quotes'), where('clientId', '==', clientId))
    const snap = await getDocs(q)
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    return list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
  } catch (error) {
    console.error('❌ getDevisClient ERROR:', error.message)
    console.error('Détails:', error)
    return []
  }
}

// Récupérer TOUS les devis (admin) — AVEC LOGGING DÉTAILLÉ
export const getTousDevis = async () => {
  try {
    console.log('📋 getTousDevis: Tentative de lecture de toute la collection quotes...')
    
    // Tentative 1 : getDocs simple
    const snap = await getDocs(collection(db, 'quotes'))
    
    console.log(`✅ getTousDevis: ${snap.docs.length} devis trouvés`)
    
    const list = snap.docs.map(d => {
      console.log(`  - ${d.id}: ${d.data().quoteNumber} (client: ${d.data().clientEmail}, status: ${d.data().status})`)
      return { id: d.id, ...d.data() }
    })
    
    return list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
  } catch (error) {
    console.error('❌ getTousDevis ERROR:', error.message)
    console.error('Code d\'erreur:', error.code)
    console.error('Détails complets:', error)
    return []
  }
}

// Changer le statut (admin uniquement)
export const changerStatutDevis = async (devisId, statut) => {
  try {
    await updateDoc(doc(db, 'quotes', devisId), {
      status: statut,
      updatedAt: Timestamp.now()
    })

    // Notifier le client concerné (on relit le devis pour avoir son clientId/numéro)
    const snap = await getDoc(doc(db, 'quotes', devisId))
    if (snap.exists()) {
      const devis = snap.data()
      if (statut === 'Approuvé' || statut === 'Rejeté') {
        notifierClient(devis.clientId, {
          title: statut === 'Approuvé' ? 'Devis approuvé !' : 'Devis rejeté',
          message: `Votre devis ${devis.quoteNumber} a été ${statut.toLowerCase()}.`,
          link: '/client/devis'
        })
      }
    }

    return true
  } catch (error) {
    console.error('changerStatutDevis:', error)
    return false
  }
}

// Supprimer un devis rejeté (le client concerné ou l'admin). Les règles Firestore
// n'autorisent la suppression QUE si le statut est 'Rejeté' (sécurité côté serveur).
export const supprimerDevis = async (devisId) => {
  try {
    await deleteDoc(doc(db, 'quotes', devisId))
    return true
  } catch (error) {
    console.error('supprimerDevis:', error)
    return false
  }
}
