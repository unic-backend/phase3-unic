import { collection, addDoc, query, where, onSnapshot, getDocs, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore'
import { db } from '../firebase/init'
import { notifierClient, notifierAdmins } from './notificationService'

// Envoyer un message (client OU admin)
export const envoyerMessage = async ({ clientId, clientEmail, senderId, senderRole, text }) => {
  if (!text?.trim()) return
  if (!clientId || !senderId) {
    throw new Error('Utilisateur non identifié, reconnectez-vous.')
  }

  // Pas de try/catch ici: si addDoc échoue (ex: permission Firestore refusée),
  // l'erreur doit remonter jusqu'à l'écran pour que l'utilisateur la voie
  // (avant, l'erreur disparaissait silencieusement et le message semblait "envoyé" à tort).
  await addDoc(collection(db, 'messages'), {
    clientId,
    clientEmail: clientEmail || '',
    senderId,
    senderRole,           // 'client' ou 'admin'
    text: text.trim(),
    read: false,
    createdAt: Timestamp.now()
  })

  // Notifier l'autre partie
  if (senderRole === 'client') {
    notifierAdmins({
      title: 'Nouveau message',
      message: `${clientEmail || 'Un client'} : "${text.trim().slice(0, 60)}"`,
      link: '/admin/messages'
    })
  } else {
    notifierClient(clientId, {
      title: 'Nouveau message de UniC Plaquiste',
      message: text.trim().slice(0, 60),
      link: '/client/chat'
    })
  }
}

// Écouter les messages d'une conversation en temps réel (client précis)
// Retourne une fonction "unsubscribe" à appeler au démontage du composant
// Note: tri fait en JS (pas orderBy dans la requête) pour éviter de devoir créer
// un index Firestore composite, comme dans le reste de l'app.
export const ecouterMessagesClient = (clientId, callback, onError) => {
  if (!clientId) return () => {}
  const q = query(collection(db, 'messages'), where('clientId', '==', clientId))
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    list.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0))
    callback(list)
  }, (error) => {
    console.error('ecouterMessagesClient:', error)
    // Avant: l'erreur restait invisible et la page bloquait sur "Chargement..." pour toujours.
    // Maintenant: on prévient l'appelant pour qu'il puisse arrêter le chargement et afficher l'erreur.
    if (onError) onError(error)
  })
}

// Liste des conversations pour l'admin (1 par client ayant déjà écrit)
export const getConversationsAdmin = async () => {
  try {
    const snap = await getDocs(collection(db, 'messages'))
    const map = {}
    snap.docs.forEach(d => {
      const m = d.data()
      const cle = m.clientId
      if (!cle) return
      if (!map[cle] || (m.createdAt?.seconds || 0) > (map[cle].createdAt?.seconds || 0)) {
        map[cle] = { clientId: cle, clientEmail: m.clientEmail, lastText: m.text, createdAt: m.createdAt }
      }
    })
    return Object.values(map).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
  } catch (e) {
    console.error('getConversationsAdmin:', e)
    return []
  }
}

// Marquer comme lus tous les messages d'une conversation envoyés par "l'autre partie"
export const marquerMessagesLus = async (clientId, role) => {
  try {
    const q = query(collection(db, 'messages'), where('clientId', '==', clientId))
    const snap = await getDocs(q)
    const autreRole = role === 'client' ? 'admin' : 'client'
    const aMarquer = snap.docs.filter(d => {
      const m = d.data()
      return m.senderRole === autreRole && m.read === false
    })
    await Promise.all(aMarquer.map(d => updateDoc(doc(db, 'messages', d.id), { read: true })))
  } catch (e) {
    console.error('marquerMessagesLus:', e)
  }
}

// Supprimer un message envoyé par erreur (uniquement son propre message, ou un admin pour modération)
export const supprimerMessage = async (messageId) => {
  try {
    await deleteDoc(doc(db, 'messages', messageId))
    return true
  } catch (e) {
    console.error('supprimerMessage:', e)
    return false
  }
}
