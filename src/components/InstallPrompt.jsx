import { useState, useEffect } from 'react'
import { X, Share, MoreVertical, PlusSquare, Smartphone, Download, ChevronRight } from 'lucide-react'
import logo from '../assets/logo.webp'

/**
 * InstallPrompt — invitation à installer l'application (PWA).
 *
 * Problème résolu : avant, quand le navigateur ne déclenchait pas
 * l'événement d'installation native (toujours le cas sur iPhone, souvent
 * sur Android), on affichait du TEXTE NON CLIQUABLE. Les clients voyaient
 * "installer" écrit mais rien ne se passait au clic.
 *
 * Maintenant : le bouton est TOUJOURS cliquable.
 *  - Installation native possible → un tap installe directement.
 *  - Sinon → une modale s'ouvre avec un guide visuel pas-à-pas adapté
 *    au téléphone détecté (iPhone/Safari ou Android/Chrome).
 *
 * Props :
 *  - compact : version réduite (pour la page Espace client / login)
 */

function detecterPlateforme() {
  const ua = navigator.userAgent || ''
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios'
  if (/android/i.test(ua)) return 'android'
  return 'desktop'
}

export default function InstallPrompt({ compact = false }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [installed, setInstalled] = useState(false)
  const [guideOuvert, setGuideOuvert] = useState(false)
  const plateforme = detecterPlateforme()

  useEffect(() => {
    // Déjà installée (mode standalone) → rien à afficher
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setInstalled(true)
      return
    }
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    const onInstalled = () => { setInstalled(true); setDeferredPrompt(null); setGuideOuvert(false) }
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Installation native en un tap
      deferredPrompt.prompt()
      const result = await deferredPrompt.userChoice
      if (result.outcome === 'accepted') setInstalled(true)
      setDeferredPrompt(null)
    } else {
      // Pas d'installation native → guide visuel cliquable
      setGuideOuvert(true)
    }
  }

  if (installed) return null

  // ── Étapes du guide selon la plateforme ──
  const etapesIos = [
    { icone: Share, texte: <>Touchez le bouton <b>Partager</b> en bas de Safari (le carré avec une flèche vers le haut)</> },
    { icone: PlusSquare, texte: <>Faites défiler et touchez <b>« Sur l'écran d'accueil »</b></> },
    { icone: Smartphone, texte: <>Touchez <b>« Ajouter »</b> en haut à droite — c'est fait !</> },
  ]
  const etapesAndroid = [
    { icone: MoreVertical, texte: <>Touchez le menu <b>⋮</b> en haut à droite de Chrome</> },
    { icone: Download, texte: <>Touchez <b>« Installer l'application »</b> ou <b>« Ajouter à l'écran d'accueil »</b></> },
    { icone: Smartphone, texte: <>Confirmez — l'icône UniC apparaît sur votre écran d'accueil !</> },
  ]
  const etapes = plateforme === 'ios' ? etapesIos : etapesAndroid

  return (
    <>
      {/* ── Bandeau / bouton (TOUJOURS cliquable) ── */}
      {compact ? (
        <button onClick={handleInstall}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition btn-press"
          style={{ background: 'rgba(246,195,68,0.1)', border: '1px solid rgba(246,195,68,0.3)' }}>
          <img src={logo} alt="" className="w-9 h-9 rounded-xl object-cover shrink-0" />
          <div className="flex-1 text-left">
            <p className="text-sm font-bold" style={{ color: '#F6C344' }}>Installer l'application</p>
            <p className="text-[11px]" style={{ color: '#8899B4' }}>Accès direct depuis votre écran d'accueil</p>
          </div>
          <ChevronRight size={18} style={{ color: '#F6C344' }} />
        </button>
      ) : (
        <div className="bg-gradient-to-r from-[#1A3FA0] to-[#0D1B4B] py-4 px-6">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-white text-center sm:text-left">
              <p className="font-bold text-lg">📲 Installez l'application UniC Plaquiste</p>
              <p className="text-sm text-blue-200">
                Gratuit · s'ajoute à votre écran d'accueil comme WhatsApp · rien à télécharger sur Play Store
              </p>
            </div>
            <button onClick={handleInstall}
              className="bg-[#F2C200] text-[#1A3FA0] px-6 py-3 rounded-2xl font-bold hover:bg-yellow-400 transition whitespace-nowrap btn-press shadow-lg flex items-center gap-2">
              <Download size={18} /> Installer sur mon téléphone
            </button>
          </div>
        </div>
      )}

      {/* ── Guide visuel pas-à-pas (quand pas d'installation native) ── */}
      {guideOuvert && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)' }} onClick={() => setGuideOuvert(false)}>
          <div onClick={e => e.stopPropagation()}
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 space-y-5 animate-scale-in"
            style={{ background: '#0C1829', border: '1px solid rgba(255,255,255,0.08)' }}>

            {/* En-tête */}
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
              <button onClick={() => setGuideOuvert(false)} aria-label="Fermer"
                className="p-1.5 rounded-lg" style={{ color: '#8899B4' }}>
                <X size={20} />
              </button>
            </div>

            {/* Étapes numérotées avec icônes */}
            <div className="space-y-3">
              {etapes.map((etape, i) => {
                const Icone = etape.icone
                return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-2xl"
                    style={{ background: '#111F35', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm"
                      style={{ background: '#F6C344', color: '#060D18' }}>
                      {i + 1}
                    </div>
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
              Une fois installée, l'app UniC s'ouvre comme WhatsApp, directement depuis votre écran d'accueil.
            </p>

            <button onClick={() => setGuideOuvert(false)}
              className="w-full py-3 rounded-xl font-bold text-sm btn-press"
              style={{ background: '#F6C344', color: '#060D18' }}>
              J'ai compris
            </button>
          </div>
        </div>
      )}
    </>
  )
}
