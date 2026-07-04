import { addDoc, collection, getDocs, query, Timestamp, where } from 'firebase/firestore'
import { db } from '../firebase/init'
import { isAdminEmail } from '../config/admins'
import { getTousDevis } from './quoteService'
import { getToutesFactures } from './invoiceService'
import { getTousProspects } from './prospectService'

const DIGEST_TYPE = 'daily-admin-digest'

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function plural(count, singular, pluralText = `${singular}s`) {
  return `${count} ${count > 1 ? pluralText : singular}`
}

function firstUsefulLink(counts) {
  if (counts.prospects > 0) return '/admin/prospects'
  if (counts.devis > 0) return '/admin/devis'
  if (counts.factures > 0) return '/admin/factures'
  if (counts.messages > 0) return '/admin/messages'
  return '/admin/dashboard'
}

async function dejaCreeAujourdhui(dateKey) {
  const q = query(
    collection(db, 'notifications'),
    where('forAdmins', '==', true),
    where('type', '==', DIGEST_TYPE),
    where('digestDate', '==', dateKey)
  )
  const snap = await getDocs(q)
  return !snap.empty
}

async function compterMessagesNonLus() {
  const snap = await getDocs(collection(db, 'messages'))
  return snap.docs.filter((d) => {
    const m = d.data()
    return m.senderRole === 'client' && m.read === false
  }).length
}

export async function creerRappelAdminQuotidien(userEmail) {
  if (!isAdminEmail(userEmail)) return null

  try {
    const dateKey = todayKey()
    if (await dejaCreeAujourdhui(dateKey)) return null

    const [prospects, devis, factures, messagesNonLus] = await Promise.all([
      getTousProspects(),
      getTousDevis(),
      getToutesFactures(),
      compterMessagesNonLus(),
    ])

    const counts = {
      prospects: prospects.filter((p) => ['nouveau', 'contacte', 'visite_planifiee', 'devis_en_cours'].includes(p.statut || 'nouveau')).length,
      devis: devis.filter((d) => d.status === 'En attente').length,
      factures: factures.filter((f) => ['En attente', 'En verification', 'En vérification'].includes(f.status)).length,
      messages: messagesNonLus,
    }

    const total = counts.prospects + counts.devis + counts.factures + counts.messages
    if (total === 0) return null

    const morceaux = []
    if (counts.prospects) morceaux.push(plural(counts.prospects, 'prospect'))
    if (counts.devis) morceaux.push(plural(counts.devis, 'devis a regarder', 'devis a regarder'))
    if (counts.factures) morceaux.push(plural(counts.factures, 'facture a verifier', 'factures a verifier'))
    if (counts.messages) morceaux.push(plural(counts.messages, 'message client non lu', 'messages clients non lus'))

    const notification = {
      userId: null,
      forAdmins: true,
      type: DIGEST_TYPE,
      digestDate: dateKey,
      counts,
      title: 'Point du jour',
      message: morceaux.join(' - '),
      link: firstUsefulLink(counts),
      read: false,
      createdAt: Timestamp.now(),
    }

    const ref = await addDoc(collection(db, 'notifications'), notification)
    return { id: ref.id, ...notification }
  } catch (e) {
    console.error('creerRappelAdminQuotidien:', e)
    return null
  }
}
