import { collection, addDoc, updateDoc, doc, getDoc, query, where, getDocs, Timestamp } from 'firebase/firestore'
import { db } from '../firebase/init'

// Les étapes d'un chantier (dans l'ordre)
export const ETAPES_CHANTIER = [
  'Devis validé',
  'Chantier démarré',
  'En cours',
  'Finition',
  'Livré'
]

// Créer un projet (admin)
export const creerProjet = async (clientId, clientEmail, data) => {
  const projet = {
    clientId: clientId || 'inconnu',
    clientEmail: clientEmail || '',
    name: data.name || 'Nouveau projet',
    type: data.type || '',
    surface: Number(data.surface) || 0,
    montant: Number(data.montant) || 0,
    etapeIndex: 0,                 // index dans ETAPES_CHANTIER
    dateDebut: data.dateDebut || new Date().toISOString().slice(0, 10),
    dateFin: data.dateFin || '',
    notes: data.notes || '',
    photos: [],                    // tableau d'URLs
    createdAt: Timestamp.now()
  }
  const docRef = await addDoc(collection(db, 'projects'), projet)
  return { id: docRef.id, ...projet }
}

// Projets d'un client
export const getProjetsClient = async (clientId) => {
  try {
    const q = query(collection(db, 'projects'), where('clientId', '==', clientId))
    const snap = await getDocs(q)
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    return list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
  } catch (e) {
    console.error('getProjetsClient:', e)
    return []
  }
}

// Tous les projets (admin)
export const getTousProjets = async () => {
  try {
    const snap = await getDocs(collection(db, 'projects'))
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    return list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
  } catch (e) {
    console.error('getTousProjets:', e)
    return []
  }
}

// Un projet précis
export const getProjet = async (projetId) => {
  try {
    const snap = await getDoc(doc(db, 'projects', projetId))
    return snap.exists() ? { id: snap.id, ...snap.data() } : null
  } catch (e) {
    console.error('getProjet:', e)
    return null
  }
}

// Avancer / changer l'étape (admin)
export const changerEtape = async (projetId, etapeIndex) => {
  try {
    await updateDoc(doc(db, 'projects', projetId), { etapeIndex })
    return true
  } catch (e) {
    console.error('changerEtape:', e)
    return false
  }
}

// Ajouter une photo par URL
export const ajouterPhoto = async (projet, url) => {
  try {
    const nouvellesPhotos = [...(projet.photos || []), url]
    await updateDoc(doc(db, 'projects', projet.id), { photos: nouvellesPhotos })
    return url
  } catch (e) {
    console.error('ajouterPhoto:', e)
    return null
  }
}

// Clé API ImgBB (gratuit, sans carte bancaire)
const IMGBB_API_KEY = '4dff6612cbda7c80c5cdd6b982ed6075'

// Compresser l'image avant upload
async function compresserImage(file, maxWidth = 1600, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Lecture impossible'))
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = () => reject(new Error('Image invalide'))
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img
        if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth }
        canvas.width = width; canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        canvas.toBlob((blob) => {
          blob ? resolve(new File([blob], file.name || 'photo.jpg', { type: 'image/jpeg' })) : reject(new Error('Compression échouée'))
        }, 'image/jpeg', quality)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

// Upload photo vers ImgBB (gratuit)
export const uploadPhotoFichier = async (projet, file) => {
  try {
    if (!file || !file.type.startsWith('image/')) return null
    const compressedFile = await compresserImage(file)
    const formData = new FormData()
    formData.append('image', compressedFile)
    formData.append('key', IMGBB_API_KEY)
    const response = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: formData })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    if (!data.success) throw new Error('ImgBB erreur')
    const url = data.data.url
    const nouvellesPhotos = [...(projet.photos || []), url]
    await updateDoc(doc(db, 'projects', projet.id), { photos: nouvellesPhotos })
    return url
  } catch (e) {
    console.error('uploadPhotoFichier ERROR:', e.message)
    return null
  }
}
