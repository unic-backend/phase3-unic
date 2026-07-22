import { useState, useEffect } from 'react'
import { X, ArrowRight, Share, MoreVertical, PlusSquare, Smartphone, Download } from 'lucide-react'
import logo from '../assets/logo.webp'

function detecterPlateforme() {
  const ua = navigator.userAgent || ''
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios'
  if (/android/i.test(ua)) return 'android'
  return 'desktop'
}

/**
 * BoutonAppFlottant — bouton flottant qui aide les visiteurs à INSTALLER
 * l'application sur leur téléphone.
 *
 * Comportement :
 *  - Masqué si l'app tourne déjà en mode installé (standalone).
 *  - Installation native possible (Android/Chrome) → un tap installe.
 *  - Sinon (iPhone notamment) → guide visuel pas-à-pas adapté au téléphone.
 *  - Le visiteur peut le fermer ; il ne réapparaît pas dans la même session.
 */
export default function BoutonAppFlottant() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [visible, setVisible] = useState(true)
  const [etendu, setEtendu] = useState(false)
  const [guideOuvert, setGuideOuvert] = useState(false)
  const plateforme = detecterPlateforme()
  const [mounted, setMounted] = useState(false)
  const [exiting, setExiting] = useState(false)

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

  // Indique que le composant a monté pour déclencher l'animation d'entrée
  useEffect(() => {
    setMounted(true)
  }, [])

  const fermer = (e) => {
    e.stopPropagation()
    setExiting(true)
    // Laisse l'animation de sortie se jouer avant de masquer définitivement
    setTimeout(() => {
      setVisible(false)
      sessionStorage.setItem('bouton-app-ferme', '1')
    }, 200) // doit correspondre à la durée de l'animation de sortie
  }

  const agir = async () => {
    if (deferredPrompt) {
      // Installation PWA native (Android/Chrome) : un tap suffit
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') setVisible(false)
      setDeferredPrompt(null)
    } else {
      // Pas d'installation native (toujours le cas sur iPhone) → guide visuel
      // pas-à-pas. C'est ici que les clients avaient besoin d'aide : avant, on
      // les renvoyait vers la connexion et ils restaient sur le web.
      setGuideOuvert(true)
    }
  }

  if (!visible) return null

  const label = "Installer l'application"

  // Étapes d'installation selon le téléphone détecté
  const etapesGuide = plateforme === 'ios'
    ? [
        { icone: Share, texte: <>Touchez le bouton <b>Partager</b> en bas de Safari (carré avec une flèche vers le haut)</> },
        { icone: PlusSquare, texte: <>Faites défiler et touchez <b>« Sur l'écran d'accueil »</b></> },
        { icone: Smartphone, texte: <>Touchez <b>« Ajouter »</b> en haut à droite — c'est fait !</> },
      ]
    : [
        { icone: MoreVertical, texte: <>Touchez le menu <b>⋮</b> en haut à droite de Chrome</> },
        { icone: Download, texte: <>Touchez <b>« Installer l'application »</b> ou <b>« Ajouter à l'écran d'accueil »</b></> },
        { icone: Smartphone, texte: <>Confirmez — l'icône UniC apparaît sur votre écran d'accueil !</> },
      ]

  return (
    <div
      className={`fixed z-50 flex items-center
        ${mounted && !exiting ? 'animate-[slideUp_300ms_ease-out] animate-[fadeIn_300ms_ease-out]' : ''}
        ${exiting ? 'animate-[fadeOutSlideDown_200ms_ease-in]' : ''}`}
      style={{ bottom: 'max(1.25rem, env(safe-area-inset-bottom))', right: '1rem' }}
    >
      <button
        onClick={agir}
        onMouseEnter={() => setEtendu(true)}
        onMouseLeave={() => setEtendu(false)}
        className="group flex items-center gap-2.5 rounded-full shadow-2xl transition-all duration-300 btn-press
          hover:scale-[1.02] hover:shadow-3xl hover:-translate-y-1
          active:scale-95 active:shadow-[0_0_0_2px_rgba(255,255,255,0.2)]"
        style={{
          background: 'linear-gradient(135deg, #1A3FA0, #2A5BD7)',
          padding: etendu ? '0.7rem 1.1rem 0.7rem 0.7rem' : '0.7rem',
          boxShadow: '0 8px 32px rgba(26,63,160,0.45)',
        }}
      >
        {/* Logo dans un rond */}
        <span className="relative flex items-center justify-center shrink-0">
          <span className="absolute inline-flex h-full w-full rounded-full opacity-40 animate-pulse-slow"
            style={{ background: '#F2C200' }} />
          <img src={logo} alt="UniC" className="relative w-9 h-9 rounded-full object-cover"
            style={{ border: '2px solid rgba(255,255,255,0.3)' }} />
        </span>

        {/* Libellé (visible quand étendu) */}
        <span className={`flex items-center gap-1.5 overflow-hidden transition-all duration-300 whitespace-nowrap
          ${etendu ? 'animate-fadeInSlide' : ''}`}
          style={{ maxWidth: etendu ? '220px' : '0px', opacity: etendu ? 1 : 0 }}>
          <span className="text-white font-bold text-sm">{label}</span>
          <ArrowRight size={15} className="text-white/80" />
        </span>
      </button>

      {/* Bouton fermer (petit, en haut à droite du bouton) */}
      <button onClick={fermer} aria-label="Fermer"
        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow-md
          hover:rotate-6 hover:scale-105 transition-transform duration-200"
        style={{ background: '#0C1829', border: '1px solid rgba(255,255,255,0.15)' }}>
        <X size={11} color="#8899B4" />
      </button>

      {/* Guide d'installation pas-à-pas (quand pas d'installation native) */}
      {guideOuvert && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)' }} onClick={() => setGuideOuvert(false)}>
          <div onClick={e => e.stopPropagation()}
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-5 animate-scale-in"
            style={{ background: '#0C1829', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img src={logo} alt="UniC" className="w-12 h-12 rounded-2xl object-cover" />
                <div>
                  <p className="font-bold text-white">Installer UniC Plaquiste</p>
                  <p className="text-xs" style={{ color: '#8899B4' }}>
                    {plateforme === 'ios' ? 'Sur votre iPhone — 3 étapes' : 'Sur votre téléphone — 3 étapes'}
                  </p>
                </div>
              </div>
              <button onClick={() => setGuideOuvert(false)} aria-label="Fermer le guide"
                className="p-1.5 rounded-lg" style={{ color: '#8899B4' }}>
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3">
              {etapesGuide.map((etape, i) => {
                const Icone = etape.icone
                return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-2xl"
                    style={{ background: '#111F35', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm"
                      style={{ background: '#F6C344', color: '#060D18' }}>{i + 1}</div>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(246,195,68,0.12)' }}>
                      <Icone size={20} style={{ color: '#F6C344' }} />
                    </div>
                    <p className="text-sm text-gray-200 leading-snug">{etape.texte}</p>
                  </div>
                )
              })}
            </div>

            <p className="text-[11px] text-center" style={{ color: '#4A5B73' }}>
              Gratuit et instantané. L'app s'ouvre ensuite comme WhatsApp, depuis votre écran d'accueil.
            </p>

            <button onClick={() => setGuideOuvert(false)}
              className="w-full py-3 rounded-xl font-bold text-sm btn-press"
              style={{ background: '#F6C344', color: '#060D18' }}>
              J'ai compris
            </button>
          </div>
        </div>
      )}
    </div>
  )
}