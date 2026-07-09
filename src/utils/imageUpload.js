// Compression + upload ImgBB (gratuit, sans carte bancaire) — utilisé par le
// formulaire public de demande de devis. Même service que projectService.js
// utilise pour les photos de chantier (clé ImgBB partagée).
const IMGBB_API_KEY = '4dff6612cbda7c80c5cdd6b982ed6075'

export async function compresserImage(file, maxWidth = 1600, quality = 0.85) {
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

export async function uploadImagePublique(file) {
  if (!file || !file.type.startsWith('image/')) return null
  const compressedFile = await compresserImage(file)
  const formData = new FormData()
  formData.append('image', compressedFile)
  formData.append('key', IMGBB_API_KEY)
  const response = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: formData })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const data = await response.json()
  if (!data.success) throw new Error('ImgBB erreur')
  return data.data.url
}

// Prepare une image pour l'analyse par l'IA (vision Claude).
// Retourne { dataUrl, base64, mediaType } : dataUrl pour l'apercu local,
// base64 + mediaType pour l'API. Image compressee (max 1024px) pour limiter
// la taille des tokens vision et rester rapide.
export async function prepareImagePourIA(file) {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Format non supporté. Envoie une image (JPG, PNG).')
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error('Image trop lourde (max 12 Mo).')
  }
  const compressed = await compresserImage(file, 1024, 0.8)
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Lecture impossible'))
    reader.onload = () => resolve(reader.result)
    reader.readAsDataURL(compressed)
  })
  // dataUrl = "data:image/jpeg;base64,XXXX" -> on extrait mediaType + base64
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/)
  if (!match) throw new Error('Conversion image échouée')
  return { dataUrl, mediaType: match[1], base64: match[2] }
}
