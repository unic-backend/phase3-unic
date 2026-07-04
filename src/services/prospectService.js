import { signInAnonymously, signOut } from 'firebase/auth'
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, onSnapshot, Timestamp, arrayUnion, addDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/init'
import { creerDevis } from './quoteService'
import { notifierAdmins } from './notificationService'
import { isAdminEmail } from '../config/admins'

// Limite de messages par discussion (protection contre les coûts/abus,
// surtout important ici car le lien est public et générique — voir prospect-chat.js)
export const MAX_MESSAGES = 30
const DISCUSSION_SESSION_KEY = 'unic-prospect-session-uid'

// ─── Statuts du pipeline complet ────────────────────────────────────────────
export const STATUTS_PIPELINE = [
  { id: 'nouveau',           label: 'Nouveau',              couleur: '#F2C200' },
  { id: 'contacte',         label: 'Contacté',             couleur: '#60A5FA' },
  { id: 'visite_planifiee', label: 'Visite planifiée',     couleur: '#A78BFA' },
  { id: 'devis_en_cours',   label: 'Devis en cours',       couleur: '#FB923C' },
  { id: 'devis_envoye',     label: 'Devis envoyé',         couleur: '#F472B6' },
  { id: 'devis_approuve',   label: 'Devis approuvé',       couleur: '#34D399' },
  { id: 'devis_rejete',     label: 'Devis rejeté',         couleur: '#F87171' },
  { id: 'chantier_en_cours', label: 'Chantier en cours',   couleur: '#22D3EE' },
  { id: 'termine',          label: 'Terminé',              couleur: '#86EFAC' },
]

export const SOURCES_LABEL = {
  site_public:   '🌐 Site public',
  app_anonyme:   '📱 App (visiteur)',
  app_client:    '👤 Client connecté',
}

// ─── SESSION ANONYME (formulaire public /discussion) ─────────────────────────

// Démarre (ou reprend) une session anonyme + son document prospect associé.
// Appelé au chargement de la page /discussion.
export async function demarrerSession() {
  if (typeof auth.authStateReady === 'function') {
    await auth.authStateReady()
  }

  if (auth.currentUser && !auth.currentUser.isAnonymous) {
    if (isAdminEmail(auth.currentUser.email)) {
      throw new Error('Cette page est reservee aux prospects. Utilise l espace admin pour suivre les demandes.')
    }
    return ouvrirOuCreerProspect(auth.currentUser.uid)
  }

  let sessionUid = ''
  try { sessionUid = sessionStorage.getItem(DISCUSSION_SESSION_KEY) || '' } catch {}

  if (!auth.currentUser || auth.currentUser.uid !== sessionUid) {
    if (auth.currentUser?.isAnonymous) {
      await signOut(auth)
    }
    await signInAnonymously(auth)
    try { sessionStorage.setItem(DISCUSSION_SESSION_KEY, auth.currentUser.uid) } catch {}
  }

  const uid = auth.currentUser.uid
  return ouvrirOuCreerProspect(uid)
}

async function ouvrirOuCreerProspect(uid) {
  const ref = doc(db, 'prospects', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, {
      uid,
      messages: [],
      formulaireComplete: false,
      statut: 'nouveau',
      source: 'app_anonyme',
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
    source: 'site_public',
    formulaireComplete: true,
    statut: 'nouveau',
    messages: arrayUnion(messageAccueil),
    updatedAt: Timestamp.now(),
  })

  notifierAdmins({
    title: 'Nouveau prospect',
    message: `${donnees.nom || 'Un prospect'} a envoye une demande${donnees.typeProjet ? ` (${donnees.typeProjet})` : ''}.`,
    link: '/admin/prospects'
  })
}

// Envoie un message du prospect (étape 2, après le formulaire) et obtient la réponse de l'IA.
export async function envoyerMessageProspect(uid, texte) {
  if (!auth.currentUser || auth.currentUser.uid !== uid) {
    throw new Error('Session de discussion invalide. Recharge la page pour continuer.')
  }

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

// ─── PROSPECT DEPUIS CLIENT CONNECTÉ ────────────────────────────────────────
// Créé automatiquement quand un client connecté soumet une demande de devis
// via NewDevis.jsx. NON bloquant — appelé en background après creerDevis().
// L'admin voit ainsi TOUTES les demandes dans un seul pipeline.
export const creerProspectDepuisClient = async (user, formData, devisId, devisNumero) => {
  try {
    if (!user?.id) return null
    const prospect = {
      // Identité — liée au compte client
      clientId: user.id,
      clientEmail: user.email || '',
      source: 'app_client',
      coordonnees: {
        nom: user.nom || user.email || 'Client',
        telephone: user.telephone || '',
        email: user.email || '',
      },
      // Infos du projet
      infosCollectees: {
        typeProjet: formData.type || '',
        surfaceM2: formData.surface ? Number(formData.surface) : null,
        avecPeinture: formData.avecPeinture ?? null,
        localisation: formData.localisation || 'Dakar',
        budgetIndicatif: formData.budget || '',
        delaiSouhaite: formData.urgence || '',
        exigencesParticulieres: formData.description || '',
      },
      photos: [],
      // Lien direct vers le devis créé
      devisId: devisId || null,
      devisNumero: devisNumero || null,
      // Pipeline
      statut: 'devis_en_cours',
      formulaireComplete: true,
      messages: [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }
    const ref = await addDoc(collection(db, 'prospects'), prospect)
    return ref.id
  } catch (e) {
    // Non bloquant — on ne fail pas silencieusement le flux principal
    console.error('creerProspectDepuisClient:', e)
    return null
  }
}

// Convertit un prospect en véritable client + crée le devis correspondant (admin uniquement).
// Réutilise l'uid anonyme déjà existant comme identifiant client — pas besoin
// d'email/mot de passe pour cette étape. Limite à savoir : cette identité reste
// liée au navigateur/appareil du prospect (session anonyme), pas encore à un
// compte email/mot de passe permanent multi-appareils.
export const convertirProspectEnClient = async (prospect) => {
  const uid = prospect.id
  const coord = prospect.coordonnees || {}
  const infos = prospect.infosCollectees || {}

  await setDoc(doc(db, 'users', uid), {
    nom: coord.nom || 'Client',
    telephone: coord.telephone || '',
    isAdmin: false,
    creeViaProspect: true,
    createdAt: Timestamp.now(),
  }, { merge: true })

  const devis = await creerDevis(uid, '', {
    type: infos.typeProjet || '',
    surface: infos.surfaceM2 || 0,
    avecPeinture: infos.avecPeinture,
    clientNom: coord.nom || '',
    description: infos.exigencesParticulieres || `Demande reçue via le formulaire WhatsApp.${infos.budgetIndicatif ? ` Budget indiqué par le client : ${infos.budgetIndicatif}.` : ''}`,
    localisation: infos.localisation || 'Dakar',
    urgence: infos.delaiSouhaite || '',
    budget: infos.budgetIndicatif || '',
  })

  await updateDoc(doc(db, 'prospects', uid), {
    statut: 'traite',
    devisCreeId: devis.id,
    devisCreeNumero: devis.quoteNumber,
    updatedAt: Timestamp.now(),
  })

  return devis
}
