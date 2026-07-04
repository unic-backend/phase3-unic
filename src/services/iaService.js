import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, Timestamp } from 'firebase/firestore'
import { db, auth } from '../firebase/init'

// ==================== Base de connaissances ====================

async function getContextePortfolio() {
  try {
    const snap = await getDocs(collection(db, 'portfolio'))
    const projets = snap.docs.map(d => d.data()).slice(0, 5)
    return projets.map(p => `[Projet réalisé] ${p.titre} (${p.type || ''}) — ${p.localisation || ''}, ${p.surfaceM2 ? p.surfaceM2 + ' m²' : ''}, ${p.cout ? Math.round(p.cout).toLocaleString('fr-FR') + ' FCFA' : ''}, ${p.dureeJours ? p.dureeJours + ' jours' : ''}${p.notes ? ' — ' + p.notes : ''}`)
  } catch { return [] }
}

export const ajouterConnaissance = async ({ titre, categorie, contenu, motsCles }) => {
  const entree = {
    titre: titre || '',
    categorie: categorie || 'Général',
    contenu: contenu || '',
    motsCles: (motsCles || []).map((m) => m.trim().toLowerCase()).filter(Boolean),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  }
  const docRef = await addDoc(collection(db, 'base_connaissances'), entree)
  return { id: docRef.id, ...entree }
}

export const getConnaissances = async () => {
  try {
    const snap = await getDocs(collection(db, 'base_connaissances'))
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    return list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
  } catch (e) {
    console.error('getConnaissances:', e)
    return []
  }
}

export const modifierConnaissance = async (id, data) => {
  try {
    await updateDoc(doc(db, 'base_connaissances', id), {
      ...data,
      motsCles: (data.motsCles || []).map((m) => m.trim().toLowerCase()).filter(Boolean),
      updatedAt: Timestamp.now(),
    })
    return true
  } catch (e) {
    console.error('modifierConnaissance:', e)
    return false
  }
}

export const supprimerConnaissance = async (id) => {
  try {
    await deleteDoc(doc(db, 'base_connaissances', id))
    return true
  } catch (e) {
    console.error('supprimerConnaissance:', e)
    return false
  }
}

const trouverPertinentes = (toutes, question) => {
  const mots = question.toLowerCase().split(/\s+/).filter((m) => m.length > 2)
  if (mots.length === 0) return []
  return toutes
    .filter((c) => {
      const texte = `${c.titre} ${c.contenu} ${(c.motsCles || []).join(' ')}`.toLowerCase()
      return mots.some((m) => texte.includes(m))
    })
    .slice(0, 5)
}

// ==================== Assistant IA ====================

/**
 * Pose une question à l'assistant IA.
 * @param {string} question — La question actuelle
 * @param {Array}  [historique] — L'historique de conversation (messages précédents)
 *                                pour que l'IA garde le contexte et s'adapte au client.
 */
export const demanderAssistant = async (question, historique = [], options = {}) => {
  const utilisateur = auth.currentUser
  if (!utilisateur) throw new Error('Connectez-vous pour utiliser l\'assistant.')

  const toutes = await getConnaissances()
  const pertinentes = trouverPertinentes(toutes, question)
  const portfolio = await getContextePortfolio()
  const contexte = [...pertinentes.map((c) => `[${c.categorie}] ${c.titre} : ${c.contenu}`), ...portfolio]

  const idToken = await utilisateur.getIdToken()

  // Envoyer l'historique de conversation pour que l'IA se souvienne du contexte
  const historiqueFiltre = historique
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({ role: m.role, content: m.content }))

  const res = await fetch('/.netlify/functions/ia-chat', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({ question, contexte, historique: historiqueFiltre, isAdmin: !!options.isAdmin }),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    throw new Error(data.error || `Erreur assistant (${res.status})`)
  }

  return data.reponse || ''
}
