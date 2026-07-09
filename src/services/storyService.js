/**
 * storyService — gestion des stories UniC Plaquiste.
 *
 * Concept : l'admin (Ousmane) publie des stories (photo ou vidéo courte)
 * que tous les clients inscrits voient sur leur dashboard, façon WhatsApp.
 * Chaque story a un bouton d'action ("Je veux ça", WhatsApp, devis, IA)
 * et des statistiques (vues, clics) visibles côté admin.
 *
 * Stockage :
 *  - Média (photo/vidéo) → Firebase Storage (dossier stories/)
 *  - Métadonnées + stats → Firestore (collection stories/)
 *
 * Expiration : 24h après publication (comme WhatsApp). Les stories expirées
 * sont filtrées à la lecture ; une purge douce supprime le média Storage.
 */
import { db } from '../firebase/init'
import {
  collection, addDoc, getDocs, doc, getDoc, updateDoc, deleteDoc,
  query, orderBy, Timestamp, increment, arrayUnion,
} from 'firebase/firestore'
import { compresserImage } from '../utils/imageUpload'

// ── Configuration Cloudinary ──────────────────────────────────────────────────
// Hébergement gratuit des médias (photos + vidéos), sans carte bancaire.
// Le preset est en mode "Unsigned" : conçu pour l'upload direct depuis le
// navigateur sans exposer de secret (méthode recommandée par Cloudinary).
const CLOUDINARY_CLOUD_NAME = 'ax4mkt5v'
const CLOUDINARY_UPLOAD_PRESET = 'zah9ick4'

const DUREE_VIE_MS = 24 * 60 * 60 * 1000 // 24 heures

// Types de boutons d'action disponibles sur une story
export const ACTIONS_STORY = [
  { id: 'je-veux-ca',  label: 'Je veux ça',            emoji: '✨' },
  { id: 'devis',       label: 'Demander un devis',     emoji: '📋' },
  { id: 'whatsapp',    label: 'Contacter sur WhatsApp', emoji: '💬' },
  { id: 'assistant',   label: 'Discuter avec l\'IA',    emoji: '🤖' },
  { id: 'aucun',       label: 'Aucun bouton',           emoji: '—' },
]

// Limites média
// Photos : compressées automatiquement avant envoi → aucune limite bloquante
// pour l'utilisateur (une photo Samsung de 12 Mo devient ~1 Mo).
// Vidéos : envoyées telles quelles puis compressées par Cloudinary à la
// livraison. On accepte jusqu'à 100 Mo en entrée pour couvrir les vidéos
// brutes de smartphone.
const MAX_VIDEO_MO = 100
const MAX_VIDEO_DUREE_S = 35 // tolérance au-delà de 30s

/**
 * Vérifie qu'un fichier vidéo ne dépasse pas la durée max (lecture métadonnées).
 * Retourne la durée en secondes, ou rejette si trop longue.
 */
export function verifierDureeVideo(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      if (video.duration > MAX_VIDEO_DUREE_S) {
        reject(new Error(`Vidéo trop longue (${Math.round(video.duration)}s). Maximum ${MAX_VIDEO_DUREE_S}s.`))
      } else {
        resolve(video.duration)
      }
    }
    video.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Vidéo illisible.')) }
    video.src = url
  })
}

/**
 * Publie une nouvelle story (admin uniquement).
 * @param {File}   file        Photo ou vidéo.
 * @param {Object} options     { texte, actionType, projetType }
 */
export async function publierStory(file, { texte = '', actionType = 'je-veux-ca', projetType = '' } = {}) {
  if (!file) throw new Error('Aucun fichier sélectionné.')

  const estVideo = file.type.startsWith('video/')
  const estImage = file.type.startsWith('image/')
  if (!estVideo && !estImage) throw new Error('Format non supporté (photo ou vidéo uniquement).')

  let fichierAEnvoyer = file

  if (estImage) {
    // Compression automatique de la photo (une photo Samsung de 12 Mo passe
    // à ~1 Mo, sans perte visible). Format story vertical : largeur max 1280px.
    try {
      fichierAEnvoyer = await compresserImage(file, 1280, 0.82)
    } catch {
      // Si la compression échoue, on tente d'envoyer l'original (rare)
      fichierAEnvoyer = file
    }
  } else {
    // Vidéo : vérifier la durée, et refuser seulement si vraiment énorme (>100 Mo)
    await verifierDureeVideo(file)
    if (file.size > MAX_VIDEO_MO * 1024 * 1024) {
      throw new Error(`Vidéo trop lourde (max ${MAX_VIDEO_MO} Mo). Filme une séquence plus courte.`)
    }
  }

  // Upload média sur Cloudinary (endpoint unsigned, adapté image ou vidéo)
  const resource = estVideo ? 'video' : 'image'
  const formData = new FormData()
  formData.append('file', fichierAEnvoyer)
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
  formData.append('folder', 'stories')
  // Cloudinary compresse la vidéo côté serveur à la réception :
  // q_auto = qualité automatique optimale, format le plus léger conservé.
  if (estVideo) {
    formData.append('quality', 'auto')
  }

  const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resource}/upload`
  const res = await fetch(uploadUrl, { method: 'POST', body: formData })
  if (!res.ok) {
    let detail = ''
    try { detail = (await res.json())?.error?.message || '' } catch { /* ignore */ }
    throw new Error(detail || 'Échec de l\'envoi du média. Réessaie.')
  }
  const data = await res.json()
  // Pour les vidéos : on demande à Cloudinary une version compressée à la
  // livraison (q_auto,f_auto) en insérant les transformations dans l'URL.
  // Ça réduit fortement le poids côté client sans toucher au fichier source.
  let mediaUrl = data.secure_url
  if (estVideo && mediaUrl.includes('/upload/')) {
    mediaUrl = mediaUrl.replace('/upload/', '/upload/q_auto,f_auto/')
  }
  const publicId = data.public_id

  // Métadonnées Firestore
  const now = Date.now()
  const docRef = await addDoc(collection(db, 'stories'), {
    mediaUrl,
    mediaType: estVideo ? 'video' : 'image',
    cloudinaryPublicId: publicId,
    cloudinaryResource: resource,
    texte: texte.slice(0, 200),
    actionType,
    projetType: projetType || '',
    createdAt: Timestamp.fromMillis(now),
    expiresAt: Timestamp.fromMillis(now + DUREE_VIE_MS),
    vues: 0,
    vuePar: [],          // uids ayant vu (évite le double comptage)
    clics: 0,
    clicPar: [],         // uids ayant cliqué le bouton
  })
  return docRef.id
}

/**
 * Récupère les stories ACTIVES (non expirées), les plus récentes d'abord.
 * Utilisé côté client (dashboard) et côté admin.
 */
export async function getStoriesActives() {
  try {
    const q = query(collection(db, 'stories'), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    const now = Date.now()
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(s => {
        const exp = s.expiresAt?.toMillis ? s.expiresAt.toMillis() : 0
        return exp > now
      })
  } catch (e) {
    console.error('getStoriesActives:', e)
    return []
  }
}

/**
 * Récupère TOUTES les stories (y compris expirées) — pour l'admin,
 * afin de consulter l'historique et les stats passées.
 */
export async function getToutesStories() {
  try {
    const q = query(collection(db, 'stories'), orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    const now = Date.now()
    return snap.docs.map(d => {
      const data = d.data()
      const exp = data.expiresAt?.toMillis ? data.expiresAt.toMillis() : 0
      return { id: d.id, ...data, expiree: exp <= now }
    })
  } catch (e) {
    console.error('getToutesStories:', e)
    return []
  }
}

/**
 * Enregistre une vue (une seule par utilisateur, sans double comptage).
 */
export async function marquerVue(storyId, userId) {
  if (!storyId || !userId) return
  try {
    const storyRef = doc(db, 'stories', storyId)
    const snap = await getDoc(storyRef)
    if (!snap.exists()) return
    const dejaVu = (snap.data().vuePar || []).includes(userId)
    if (dejaVu) return
    await updateDoc(storyRef, { vues: increment(1), vuePar: arrayUnion(userId) })
  } catch (e) {
    console.error('marquerVue:', e)
  }
}

/**
 * Enregistre un clic sur le bouton d'action (une fois par utilisateur).
 */
export async function marquerClic(storyId, userId) {
  if (!storyId || !userId) return
  try {
    const storyRef = doc(db, 'stories', storyId)
    const snap = await getDoc(storyRef)
    if (!snap.exists()) return
    const dejaClique = (snap.data().clicPar || []).includes(userId)
    if (dejaClique) return
    await updateDoc(storyRef, { clics: increment(1), clicPar: arrayUnion(userId) })
  } catch (e) {
    console.error('marquerClic:', e)
  }
}

/**
 * Supprime une story (admin) : retire le document Firestore, ce qui la fait
 * disparaître immédiatement de l'app pour tous.
 * Note : le média reste stocké sur Cloudinary (la suppression distante exige
 * la clé secrète, qu'on ne met jamais dans le navigateur pour des raisons de
 * sécurité). Cloudinary offrant 25 Go gratuits, ce n'est pas un souci ;
 * les médias peuvent être purgés manuellement depuis le dashboard Cloudinary
 * si besoin (dossier "stories").
 */
export async function supprimerStory(storyId) {
  try {
    await deleteDoc(doc(db, 'stories', storyId))
    return true
  } catch (e) {
    console.error('supprimerStory:', e)
    return false
  }
}
