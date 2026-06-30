import { useState } from 'react'
import { db } from '../firebase/init'
import { auth } from '../firebase/init'
import { doc, setDoc, getDocs, collection } from 'firebase/firestore'

export default function InitAdmin() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const initializeFirebase = async () => {
    setLoading(true)
    setMessage('🔄 Initialisation en cours...')

    const ADMIN_EMAILS = [
      'admin@unicplaquiste.com',
      'unicplaquiste@gmail.com',
      'odiop2020@gmail.com'
    ]

    try {
      const currentUser = auth.currentUser
      
      if (!currentUser) {
        setMessage('❌ Aucun utilisateur connecté!')
        setLoading(false)
        return
      }

      const emailLower = currentUser.email.toLowerCase()
      const isAdmin = ADMIN_EMAILS.includes(emailLower)

      // Créer/configurer l'utilisateur admin
      await setDoc(doc(db, 'users', currentUser.uid), {
        id: currentUser.uid,
        email: emailLower,
        nom: 'Admin UniC',
        telephone: '',
        isAdmin: isAdmin,
        createdAt: new Date(),
        updatedAt: new Date()
      }, { merge: true })

      // Vérifier les collections
      let status = `✅ Utilisateur ${emailLower} configuré (isAdmin: ${isAdmin})\n\n`

      try {
        const quotesSnap = await getDocs(collection(db, 'quotes'))
        status += `✅ Quotes: ${quotesSnap.docs.length} documents\n`
      } catch (e) {
        status += `⚠️ Quotes: collection sera créée au premier devis\n`
      }

      try {
        const invoicesSnap = await getDocs(collection(db, 'invoices'))
        status += `✅ Invoices: ${invoicesSnap.docs.length} documents\n`
      } catch (e) {
        status += `⚠️ Invoices: collection sera créée à la première facture\n`
      }

      try {
        const usersSnap = await getDocs(collection(db, 'users'))
        status += `✅ Users: ${usersSnap.docs.length} documents\n`
      } catch (e) {
        status += `⚠️ Users: collection créée\n`
      }

      setMessage(status + '\n✅ INITIALISATION RÉUSSIE!\n\nRedécharge la page et reconnecte-toi.')
    } catch (error) {
      setMessage(`❌ Erreur: ${error.message}`)
    }

    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-[#1A3FA0] mb-6">Initialiser Firebase</h1>
      
      <button
        onClick={initializeFirebase}
        disabled={loading}
        className="bg-[#1A3FA0] text-white px-6 py-4 rounded-2xl font-bold hover:bg-blue-900 active:scale-95 transition disabled:opacity-50"
      >
        {loading ? '⏳ Initialisation...' : '🔧 Initialiser Maintenant'}
      </button>

      {message && (
        <div className="mt-6 bg-white rounded-2xl shadow-sm p-6 whitespace-pre-wrap font-mono text-sm">
          {message}
        </div>
      )}
    </div>
  )
}
