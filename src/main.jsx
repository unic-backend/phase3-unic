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
}
