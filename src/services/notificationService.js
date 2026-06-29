import { collection, addDoc, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore'
import { db } from '../firebase/init'

// Notification pour UN client précis (userId = uid du client)
export const notifierClient = async (userId, { title, message, link = '' }) => {
  if (!userId) return
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      forAdmins: false,
      title,
      message,
      link,
      read: false,
      createdAt: Timestamp.now()
    })
  } catch (e) {
    console.error('notifierClient:', e)
  }
}

// Notification pour TOUS les admins (visible par n'importe quel compte admin)
export const notifierAdmins = async ({ title, message, link = '' }) => {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId: null,
      forAdmins: true,
      title,
      message,
      link,
      read: false,
      createdAt: Timestamp.now()
    })
  } catch (e) {
    console.error('notifierAdmins:', e)
  }
}

// Récupérer les notifications d'un client (les siennes uniquement)
export const getNotificationsClient = async (userId) => {
  try {
    const q = query(collection(db, 'notifications'), where('userId', '==', userId))
    const snap = await getDocs(q)
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    return list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
  } catch (e) {
    console.error('getNotificationsClient:', e)
    return []
  }
}

// Récupérer les notifications admin (partagées entre tous les comptes admin)
export const getNotificationsAdmin = async () => {
  try {
    const q = query(collection(db, 'notifications'), where('forAdmins', '==', true))
    const snap = await getDocs(q)
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    return list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
  } catch (e) {
    console.error('getNotificationsAdmin:', e)
    return []
  }
}

// Marquer une notification comme lue
export const marquerNotificationLue = async (notifId) => {
  try {
    await updateDoc(doc(db, 'notifications', notifId), { read: true })
    return true
  } catch (e) {
    console.error('marquerNotificationLue:', e)
    return false
  }
}

// Marquer PLUSIEURS notifications comme lues en une fois (bouton "Tout marquer comme lu")
export const marquerToutesLues = async (notifIds) => {
  try {
    await Promise.all(notifIds.map(id => updateDoc(doc(db, 'notifications', id), { read: true })))
    return true
  } catch (e) {
    console.error('marquerToutesLues:', e)
    return false
  }
}
