/**
 * SCRIPT D'INITIALISATION FIREBASE
 * ===================================
 * À exécuter UNE SEULE FOIS pour créer toutes les collections et configurer l'admin
 * 
 * Utilisation:
 * 1. Ouvre la console du navigateur (F12)
 * 2. Copie/colle tout ce fichier dans la console
 * 3. Tape : initializeFirebaseApp()
 * 4. Attends que ça finisse
 */

import { db } from '../firebase/init'
import { collection, doc, setDoc, query, where, getDocs } from 'firebase/firestore'
import { auth } from '../firebase/init'

export async function initializeFirebaseApp() {
  console.log('🔧 DÉMARRAGE DE L\'INITIALISATION FIREBASE...\n')

  const ADMIN_EMAILS = [
    'admin@unicplaquiste.com',
    'unicplaquiste@gmail.com',
    'odiop2020@gmail.com'
  ]

  try {
    // 1. Créer la structure users pour l'utilisateur actuellement connecté
    console.log('1️⃣ Configuration de l\'utilisateur admin...')
    const currentUser = auth.currentUser
    
    if (!currentUser) {
      console.error('❌ Aucun utilisateur connecté! Connecte-toi d\'abord.')
      return
    }

    const emailLower = currentUser.email.toLowerCase()
    const isAdmin = ADMIN_EMAILS.includes(emailLower)

    console.log(`   Email: ${emailLower}`)
    console.log(`   Est admin: ${isAdmin}`)

    // Créer/mettre à jour le document utilisateur
    await setDoc(doc(db, 'users', currentUser.uid), {
      id: currentUser.uid,
      email: emailLower,
      nom: 'Administrateur',
      telephone: '',
      isAdmin: isAdmin,
      createdAt: new Date(),
      updatedAt: new Date()
    }, { merge: true })

    console.log(`   ✅ Utilisateur ${emailLower} configuré (isAdmin: ${isAdmin})\n`)

    // 2. Vérifier les collections
    console.log('2️⃣ Vérification des collections...')

    // Vérifier quotes
    try {
      const quotesSnap = await getDocs(collection(db, 'quotes'))
      console.log(`   ✅ Collection 'quotes' existe (${quotesSnap.docs.length} documents)`)
    } catch (e) {
      console.log(`   ⚠️ Collection 'quotes' n'existe pas - elle sera créée au premier devis`)
    }

    // Vérifier invoices
    try {
      const invoicesSnap = await getDocs(collection(db, 'invoices'))
      console.log(`   ✅ Collection 'invoices' existe (${invoicesSnap.docs.length} documents)`)
    } catch (e) {
      console.log(`   ⚠️ Collection 'invoices' n'existe pas - elle sera créée à la première facture`)
    }

    // Vérifier messages
    try {
      const messagesSnap = await getDocs(collection(db, 'messages'))
      console.log(`   ✅ Collection 'messages' existe (${messagesSnap.docs.length} documents)`)
    } catch (e) {
      console.log(`   ⚠️ Collection 'messages' n'existe pas - elle sera créée au premier message`)
    }

    // Vérifier users
    try {
      const usersSnap = await getDocs(collection(db, 'users'))
      console.log(`   ✅ Collection 'users' existe (${usersSnap.docs.length} documents)\n`)
    } catch (e) {
      console.log(`   ⚠️ Collection 'users' n'existe pas - créée avec ton compte\n`)
    }

    console.log('✅ INITIALISATION RÉUSSIE!')
    console.log('\n📋 À faire maintenant:')
    console.log('1. Redécharge la page (F5)')
    console.log('2. Reconnecte-toi avec ton compte admin')
    console.log('3. Va sur "Devis" - tu dois voir les devis')
    console.log('\n💡 Les collections quotes, invoices, messages se créeront automatiquement')
    console.log('   quand tu crées le premier élément.')

  } catch (error) {
    console.error('❌ ERREUR INITIALISATION:', error.message)
    console.error('Détails:', error)
  }
}

// Export aussi pour utilisation en import
export default initializeFirebaseApp
