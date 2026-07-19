import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import './styles.css'
import './firebase/init.js'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)

// ── Service Worker (PWA) ──────────────────────────────────────────────────────
// Enregistré uniquement en production : en dev, un SW casserait le HMR de Vite.
// C'est ce qui rend l'app réellement installable et disponible hors-ligne.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Échec silencieux : l'app fonctionne normalement sans SW.
    })
  })
  // Quand une NOUVELLE version de l'app prend le contrôle (après un déploiement),
  // on recharge l'onglet une seule fois : les utilisateurs ont toujours la
  // dernière version sans devoir rafraîchir à la main.
  let dejaRecharge = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (dejaRecharge) return
    dejaRecharge = true
    window.location.reload()
  })
}
