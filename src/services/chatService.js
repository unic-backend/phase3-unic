import { collection, addDoc, updateDoc, doc, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore'
import { db } from '../firebase/init'

export const sendMessage = async (conversationId, senderId, senderName, content) => {
  try {
    await addDoc(collection(db, 'messages'), {
      conversationId,
      senderId,
      senderName,
      content,
      type: 'text',
      read: false,
      timestamp: Timestamp.now()
    })
  } catch (error) {
    console.error('Error sending message:', error)
    throw error
  }
}

// Listen to messages in real-time
export const listenToMessages = (conversationId, callback) => {
  try {
    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'asc')
    )
    
    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      callback(messages)
    })
  } catch (error) {
    console.error('Error listening to messages:', error)
    throw error
  }
}

export const markMessageAsRead = async (messageId) => {
  try {
    await updateDoc(doc(db, 'messages', messageId), {
      read: true
    })
  } catch (error) {
    console.error('Error marking message as read:', error)
    throw error
  }
}
