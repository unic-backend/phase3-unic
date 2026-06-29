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
      formulaireComplete: false,
      statut: 'nouveau',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
  }
  return uid
}

// Écoute la conversation/données en temps réel
export function ecouterConversation(uid, callback) {
  return onSnapshot(doc(db, 'prospects', uid), (snap) => {
    callback(snap.exists() ? snap.data() : null)
  })
}

// Soumission du formulaire de demande de devis (étape 1 de /discussion).
// C'est la SOURCE FIABLE des infos structurées — contrairement à une extraction
// IA depuis du texte libre, ici c'est le client qui tape directement les champs.
export async function soumettreFormulaireProspect(uid, donnees) {
  const ref = doc(db, 'prospects', uid)
  const messageAccueil = {
    role: 'assistant',
    content: `Merci ${donnees.nom || ''} ! J'ai bien noté ta demande${donnees.typeProjet ? ` (${donnees.typeProjet})` : ''}${donnees.localisation ? ` à ${donnees.localisation}` : ''}. Ousmane va l'examiner et te recontactera avec un devis personnalisé. Tu peux ajouter une précision ici si besoin, ou continuer la discussion directement sur WhatsApp.`,
    timestamp: Timestamp.now(),
  }
  await updateDoc(ref, {
    coordonnees: { nom: donnees.nom || '', telephone: donnees.telephone || '' },
    infosCollectees: {
      typeProjet: donnees.typeProjet || '',
      surfaceM2: donnees.surfaceM2 ? Number(donnees.surfaceM2) : null,
      avecPeinture: donnees.avecPeinture ?? null,
      localisation: donnees.localisation || '',
      budgetIndicatif: donnees.budgetIndicatif || '',
      delaiSouhaite: donnees.delaiSouhaite || '',
      exigencesParticulieres: donnees.exigencesParticulieres || '',
    },
    photos: donnees.photos || [],
    formulaireComplete: true,
    statut: 'nouveau',
    messages: arrayUnion(messageAccueil),
    updatedAt: Timestamp.now(),
  })
}

// Envoie un message du prospect (étape 2, après le formulaire) et obtient la réponse de l'IA.
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
    body: JSON.stringify({ messages: historique, contexteConnu: { ...data.coordonnees, ...data.infosCollectees } }),
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

// Marquer un prospect comme traité / pas encore traité (suivi admin)
export const marquerProspectStatut = async (uid, statut) => {
  try {
    await updateDoc(doc(db, 'prospects', uid), { statut, updatedAt: Timestamp.now() })
    return true
  } catch (e) {
    console.error('marquerProspectStatut:', e)
    return false
  }
}

// Sauvegarder le résultat de l'analyse IA à la demande (admin uniquement, jamais automatique)
export const enregistrerAnalyseIA = async (uid, texte) => {
  try {
    await updateDoc(doc(db, 'prospects', uid), {
      analyseIA: { texte, dateAnalyse: Timestamp.now() },
    })
    return true
  } catch (e) {
    console.error('enregistrerAnalyseIA:', e)
    return false
  }
}
