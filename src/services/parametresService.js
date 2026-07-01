import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore'
import { db } from '../firebase/init'

// Signature numérique de UniC Plaquiste, dessinée une fois et réutilisée
// automatiquement sur tous les PDF (devis + factures) générés ensuite.
export const enregistrerSignatureAdmin = async (imageBase64) => {
  try {
    await setDoc(doc(db, 'parametres', 'signatureAdmin'), {
      image: imageBase64,
      updatedAt: Timestamp.now(),
    })
    return true
  } catch (e) {
    console.error('enregistrerSignatureAdmin:', e)
    return false
  }
}

export const getSignatureAdmin = async () => {
  try {
    const snap = await getDoc(doc(db, 'parametres', 'signatureAdmin'))
    return snap.exists() ? snap.data().image : null
  } catch (e) {
    console.error('getSignatureAdmin:', e)
    return null
  }
}
