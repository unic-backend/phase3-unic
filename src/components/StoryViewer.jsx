import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { marquerVue, marquerClic, ACTIONS_STORY } from '../services/storyService'
import { useAuth } from '../hooks/useAuth'

const DUREE_IMAGE_MS = 5000 // une image reste 5s (la vidéo suit sa propre durée)
const WHATSAPP = '221777085092'

/**
 * StoryViewer — lecteur plein écran des stories, façon WhatsApp/Instagram.
 * Props :
 *   stories : liste des stories actives
 *   startIndex : index de départ
 *   onClose : callback de fermeture
 */
export default function StoryViewer({ stories, startIndex = 0, onClose }) {
  const [index, setIndex] = useState(startIndex)
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef(null)
  const videoRef = useRef(null)
  const navigate = useNavigate()
  const { user } = useAuth()

  const story = stories[index]

  const suivant = useCallback(() => {
    if (index < stories.length - 1) { setIndex(i => i + 1); setProgress(0) }
    else onClose()
  }, [index, stories.length, onClose])

  const precedent = () => {
    if (index > 0) { setIndex(i => i - 1); setProgress(0) }
  }

  // Marquer la vue à chaque changement de story
  useEffect(() => {
    if (story && user?.id) marquerVue(story.id, user.id)
  }, [story, user])

  // Progression automatique (image = timer, vidéo = suit la lecture)
  useEffect(() => {
    if (!story || paused) return
    if (story.mediaType === 'image') {
      const start = Date.now()
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - start
        const p = Math.min(100, (elapsed / DUREE_IMAGE_MS) * 100)
        setProgress(p)
        if (p >= 100) { clearInterval(timerRef.current); suivant() }
      }, 50)
      return () => clearInterval(timerRef.current)
    }
  }, [story, paused, suivant])

  // Clavier : flèches + échap
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') suivant()
      else if (e.key === 'ArrowLeft') precedent()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [suivant, onClose])

  const onVideoTime = () => {
    const v = videoRef.current
    if (v && v.duration) setProgress((v.currentTime / v.duration) * 100)
  }

  const handleAction = async () => {
    if (user?.id && story) await marquerClic(story.id, user.id)
    const type = story.actionType
    const projet = story.projetType || ''
    onClose()
    if (type === 'je-veux-ca' || type === 'devis') {
      navigate(projet ? `/client/devis/new?type=${projet}` : '/client/devis/new')
    } else if (type === 'assistant') {
      navigate('/client/assistant')
    } else if (type === 'whatsapp') {
      const msg = encodeURIComponent(`Bonjour UniC Plaquiste, je suis intéressé par ce que j'ai vu dans votre story${story.texte ? ` : "${story.texte}"` : ''}.`)
      window.open(`https://wa.me/${WHATSAPP}?text=${msg}`, '_blank', 'noopener')
    }
  }

  if (!story) return null
  const action = ACTIONS_STORY.find(a => a.id === story.actionType)
  const aBouton = action && action.id !== 'aucun'

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.95)' }}>
      {/* Barres de progression (une par story) */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-3 z-10" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        {stories.map((_, i) => (
          <div key={i} className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.3)' }}>
            <div className="h-full rounded-full" style={{
              background: 'white',
              width: i < index ? '100%' : i === index ? `${progress}%` : '0%',
              transition: i === index ? 'width 0.05s linear' : 'none',
            }} />
          </div>
        ))}
      </div>

      {/* En-tête */}
      <div className="absolute left-0 right-0 flex items-center justify-between px-4 z-10" style={{ top: 'calc(max(0.75rem, env(safe-area-inset-top)) + 20px)' }}>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--gold)', color: '#060D18' }}>UP</div>
          <span className="text-white text-sm font-semibold">UniC Plaquiste</span>
        </div>
        <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <X size={20} color="white" />
        </button>
      </div>

      {/* Média */}
      <div className="relative w-full h-full flex items-center justify-center"
        onMouseDown={() => setPaused(true)} onMouseUp={() => setPaused(false)}
        onTouchStart={() => setPaused(true)} onTouchEnd={() => setPaused(false)}>
        {story.mediaType === 'video' ? (
          <video ref={videoRef} src={story.mediaUrl} className="max-w-full max-h-full object-contain"
            autoPlay playsInline onTimeUpdate={onVideoTime} onEnded={suivant} />
        ) : (
          <img src={story.mediaUrl} alt="" className="max-w-full max-h-full object-contain" />
        )}

        {/* Zones de navigation tactile (gauche = précédent, droite = suivant) */}
        <button onClick={precedent} className="absolute left-0 top-0 bottom-0 w-1/3" aria-label="Précédent" />
        <button onClick={suivant} className="absolute right-0 top-0 bottom-0 w-1/3" aria-label="Suivant" />
      </div>

      {/* Légende + bouton d'action */}
      <div className="absolute bottom-0 left-0 right-0 p-4 z-10" style={{
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
        background: 'linear-gradient(0deg, rgba(0,0,0,0.75) 0%, transparent 100%)',
      }}>
        {story.texte && <p className="text-white text-center text-base font-medium mb-3 px-4">{story.texte}</p>}
        {aBouton && (
          <button onClick={handleAction}
            className="w-full py-4 rounded-2xl font-bold text-base btn-press flex items-center justify-center gap-2 shadow-xl"
            style={{ background: 'var(--gold)', color: '#060D18' }}>
            <span>{action.emoji}</span> {action.label}
          </button>
        )}
      </div>
    </div>
  )
}
