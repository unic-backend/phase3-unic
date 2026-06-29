import { signInAnonymously } from 'firebase/auth'
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, onSnapshot, Timestamp, arrayUnion } from 'firebase/firestore'
import { auth, db } from '../firebase/init'

// Limite de messages par discussion (protection contre les coûts/abus,
// surtout important ici car le lien est public et générique — voir prospect-chat.js)
export const MAX_MESSAGES = 30

// Démarre (ou reprend) une session anonyme + son document prospect associé.
// Appelé au chargement de la page /discussion.
export async function demarrerSession() {
  if (!auth.currentUser) {
    await signInAnonymously(auth)
  }
  const uid = auth.currentUser.uid
  const ref = doc(db, 'prospects', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, {
      uid,
      messages: [],
      statut: 'en_cours',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
  }
  return uid
}

// Écoute la conversation en temps réel (utile si le prospect rouvre le lien plus tard)
export function ecouterConversation(uid, callback) {
  return onSnapshot(doc(db, 'prospects', uid), (snap) => {
    callback(snap.exists() ? snap.data() : null)
  })
}

// Envoie un message du prospect, obtient la réponse de l'IA, et sauvegarde les deux.
export async function envoyerMessageProspect(uid, texte) {
  const ref = doc(db, 'prospects', uid)
  const snap = await getDoc(ref)
  const data = snap.exists() ? snap.data() : { messages: [] }

  if ((data.messages || []).length >= MAX_MESSAGES) {
    throw new Error('Limite de messages atteinte pour cette discussion. Contactez UniC Plaquiste directement sur WhatsApp pour continuer.')
  }

  const messageUtilisateur = { role: 'user', content: texte, timestamp: Timestamp.now() }
  await updateDoc(ref, {
    messages: arrayUnion(messageUtilisateur),
    updatedAt: Timestamp.now(),
  })

  const idToken = await auth.currentUser.getIdToken()
  const historique = [...(data.messages || []), messageUtilisateur].map((m) => ({ role: m.role, content: m.content }))

  const res = await fetch('/.netlify/functions/prospect-chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ messages: historique }),
  })

  const result = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(result.error || `Erreur assistant (${res.status})`)
  }

  const messageAssistant = { role: 'assistant', content: result.reponse || '', timestamp: Timestamp.now() }
  await updateDoc(ref, {
    messages: arrayUnion(messageAssistant),
    updatedAt: Timestamp.now(),
  })

  return messageAssistant
}

// Tous les prospects (admin uniquement — voir firestore.rules)
export const getTousProspects = async () => {
  try {
    const snap = await getDocs(collection(db, 'prospects'))
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    return list.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0))
  } catch (e) {
    console.error('getTousProspects:', e)
    return []
  }
}
