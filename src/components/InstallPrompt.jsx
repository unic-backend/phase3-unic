import { useState, useEffect } from 'react'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // Déjà installé en mode standalone ?
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true)
      return
    }

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)

    window.addEventListener('appinstalled', () => {
      setInstalled(true)
      setDeferredPrompt(null)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const result = await deferredPrompt.userChoice
    if (result.outcome === 'accepted') {
      setInstalled(true)
    }
    setDeferredPrompt(null)
  }

  // Pas de bouton si déjà installé ou si le navigateur ne propose pas l'install
  if (installed) return null

  return (
    <div className="bg-gradient-to-r from-[#1A3FA0] to-[#0D1B4B] py-4 px-6">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-white text-center sm:text-left">
          <p className="font-bold text-lg">📲 Installer l'application UniC Plaquiste</p>
          <p className="text-sm text-blue-200">Accédez plus vite à votre espace client, sans passer par le navigateur</p>
        </div>
        {deferredPrompt ? (
          <button
            onClick={handleInstall}
            className="bg-[#F2C200] text-[#1A3FA0] px-6 py-3 rounded-2xl font-bold hover:bg-yellow-400 transition whitespace-nowrap btn-press"
          >
            Installer l'app
          </button>
        ) : (
          <div className="text-white text-sm text-center">
            <p className="font-bold">Pour installer :</p>
            <p className="text-blue-200">Menu ⋮ du navigateur → "Ajouter à l'écran d'accueil"</p>
          </div>
        )}
      </div>
    </div>
  )
}
