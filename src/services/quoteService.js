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
    clientNom: data.clientNom || '',
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

// ── Signature électronique client ────────────────────────────────────────────

// Génère un token unique, stocke-le sur le devis, et retourne le lien à envoyer.
// Appelé par l'admin depuis AdminDevis.jsx après approbation du devis.
export const genererLienSignature = async (devisId) => {
  try {
    // Token de 32 caractères hexadécimaux (assez pour être non-devinable)
    const token = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0')).join('')
    await updateDoc(doc(db, 'quotes', devisId), {
      signatureToken: token,
      signatureTokenDate: Timestamp.now(),
      status: 'En attente de signature',
      updatedAt: Timestamp.now(),
    })
    return token
  } catch (error) {
    console.error('genererLienSignature:', error)
    return null
  }
}

// Récupère un devis par son token (pas besoin d'être connecté — page publique /signer/:token)
export const getDevisParToken = async (token) => {
  try {
    const q = query(collection(db, 'quotes'), where('signatureToken', '==', token))
    const snap = await getDocs(q)
    if (snap.empty) return null
    const d = snap.docs[0]
    return { id: d.id, ...d.data() }
  } catch (error) {
    console.error('getDevisParToken:', error)
    return null
  }
}

// Enregistre la signature du client sur le devis (page publique, vérification par token)
export const signerDevisClient = async (devisId, token, signatureBase64) => {
  try {
    await updateDoc(doc(db, 'quotes', devisId), {
      signatureClient: signatureBase64,
      signatureClientDate: Timestamp.now(),
      signatureToken: token, // gardé tel quel pour maintenir les droits Firestore
      status: 'Signé',
      updatedAt: Timestamp.now(),
    })
    return true
  } catch (error) {
    console.error('signerDevisClient:', error)
    return false
  }
}
// utile pour corriger un devis créé sans ces infos, ou après amélioration IA.
export const modifierInfosDevis = async (devisId, { clientNom, description }) => {
  try {
    const maj = { updatedAt: Timestamp.now() }
    if (clientNom !== undefined) maj.clientNom = clientNom
    if (description !== undefined) maj.description = description
    await updateDoc(doc(db, 'quotes', devisId), maj)
    return true
  } catch (error) {
    console.error('modifierInfosDevis:', error)
    return false
  }
}

// Modifier manuellement le montant d'un devis (admin) — typiquement avant
// approbation, ou pour fixer un prix "sur devis" (ex: cloisons) qui n'en avait pas.
export const modifierMontantDevis = async (devisId, nouveauMontant) => {
  try {
    await updateDoc(doc(db, 'quotes', devisId), {
      totalTTC: Number(nouveauMontant) || 0,
      surDevis: false, // un montant a été fixé manuellement, ce n'est plus "sans prix"
      updatedAt: Timestamp.now()
    })
    return true
  } catch (error) {
    console.error('modifierMontantDevis:', error)
    return false
  }
}

// Enregistrer le détail ligne par ligne (matériaux + forfait main-d'oeuvre) d'un
// devis — utilisé pour générer un PDF fidèle au modèle officiel UniC Plaquiste.
// Recalcule automatiquement le montant total à partir de ces lignes.
export const enregistrerDetailDevis = async (devisId, { lignesMateriaux, lignesMainOeuvre, exclusions, modalitesPaiement }) => {
  try {
    const lignes = (lignesMateriaux || []).map((l) => ({
      designation: l.designation || '',
      prixUnitaire: Number(l.prixUnitaire) || 0,
      quantite: Number(l.quantite) || 0,
      prixTotal: (Number(l.prixUnitaire) || 0) * (Number(l.quantite) || 0),
    }))
    const totalMateriaux = lignes.reduce((sum, l) => sum + l.prixTotal, 0)

    const mainOeuvre = (lignesMainOeuvre || [])
      .filter((l) => l.designation?.trim())
      .map((l) => ({ designation: l.designation, montant: Number(l.montant) || 0 }))
    const totalMainOeuvre = mainOeuvre.reduce((sum, l) => sum + l.montant, 0)

    await updateDoc(doc(db, 'quotes', devisId), {
      lignesMateriaux: lignes,
      lignesMainOeuvre: mainOeuvre,
      forfaitMainOeuvre: null, // ancien format (1 seule ligne), remplacé par lignesMainOeuvre
      exclusions: exclusions || '',
      modalitesPaiement: modalitesPaiement || '',
      totalTTC: totalMateriaux + totalMainOeuvre,
      surDevis: false,
      updatedAt: Timestamp.now(),
    })
    return true
  } catch (error) {
    console.error('enregistrerDetailDevis:', error)
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
