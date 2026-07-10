import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Smartphone, ArrowRight } from 'lucide-react'
import logo from '../assets/logo.webp'

/**
 * BoutonAppFlottant — bouton flottant sur le site vitrine qui pousse les
 * visiteurs vers l'application (installation PWA si possible, sinon ouverture
 * de l'espace client).
 *
 * Comportement :
 *  - Masqué si l'app tourne déjà en mode installé (standalone).
 *  - Si l'installation PWA est possible → propose "Installer l'app".
 *  - Sinon → "Ouvrir l'application" (vers /login).
 *  - Le visiteur peut le fermer ; il ne réapparaît pas dans la même session.
 */
export default function BoutonAppFlottant() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [visible, setVisible] = useState(true)
  const [etendu, setEtendu] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Déjà installée → on ne montre rien
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setVisible(false)
      return
    }
    // Fermé récemment dans cette session ?
    if (sessionStorage.getItem('bouton-app-ferme') === '1') {
      setVisible(false)
      return
    }

    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)

    // Déploie le libellé après 2s pour attirer l'œil, puis se rétracte
    const t1 = setTimeout(() => setEtendu(true), 1500)
    const t2 = setTimeout(() => setEtendu(false), 6000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      clearTimeout(t1); clearTimeout(t2)
    }
  }, [])

  const fermer = (e) => {
    e.stopPropagation()
    setVisible(false)
    sessionStorage.setItem('bouton-app-ferme', '1')
  }

  const agir = async () => {
    if (deferredPrompt) {
      // Installation PWA native
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') setVisible(false)
      setDeferredPrompt(null)
    } else {
      // Pas installable (ou déjà installée ailleurs) → ouvrir l'espace client
      navigate('/login')
    }
  }

  if (!visible) return null

  const label = deferredPrompt ? "Installer l'application" : "Ouvrir l'application"

  return (
    <div className="fixed z-50 flex items-center"
      style={{ bottom: 'max(1.25rem, env(safe-area-inset-bottom))', right: '1rem' }}>
      <button
        onClick={agir}
        onMouseEnter={() => setEtendu(true)}
        className="group flex items-center gap-2.5 rounded-full shadow-2xl transition-all duration-300 btn-press"
        style={{
          background: 'linear-gradient(135deg, #1A3FA0, #2A5BD7)',
          padding: etendu ? '0.7rem 1.1rem 0.7rem 0.7rem' : '0.7rem',
          boxShadow: '0 8px 32px rgba(26,63,160,0.45)',
        }}
      >
        {/* Logo dans un rond */}
        <span className="relative flex items-center justify-center shrink-0">
          <span className="absolute inline-flex h-full w-full rounded-full opacity-40 animate-ping"
            style={{ background: '#F2C200' }} />
          <img src={logo} alt="UniC" className="relative w-9 h-9 rounded-full object-cover"
            style={{ border: '2px solid rgba(255,255,255,0.3)' }} />
        </span>

        {/* Libellé (visible quand étendu) */}
        <span className="flex items-center gap-1.5 overflow-hidden transition-all duration-300 whitespace-nowrap"
          style={{ maxWidth: etendu ? '220px' : '0px', opacity: etendu ? 1 : 0 }}>
          <span className="text-white font-bold text-sm">{label}</span>
          <ArrowRight size={15} className="text-white/80" />
        </span>
      </button>

      {/* Bouton fermer (petit, en haut à droite du bouton) */}
      <button onClick={fermer} aria-label="Fermer"
        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow-md"
        style={{ background: '#0C1829', border: '1px solid rgba(255,255,255,0.15)' }}>
        <X size={11} color="#8899B4" />
      </button>
    </div>
  )
}
