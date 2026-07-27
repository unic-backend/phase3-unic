/**
 * ErrorBoundary — filet de sécurité global.
 *
 * Sans lui, la moindre erreur React non gérée = écran blanc total,
 * sans message, sans issue pour l'utilisateur. Avec lui : un écran
 * de récupération aux couleurs UniC avec deux issues (réessayer / recharger).
 *
 * Composant classe obligatoire : les hooks ne peuvent pas attraper
 * les erreurs de rendu (componentDidCatch / getDerivedStateFromError
 * n'existent qu'en classe).
 */
import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    // En dev uniquement — terser (drop_console) supprime tout en prod.
    console.error('ErrorBoundary:', error, info)
  }

  reessayer = () => {
    // Tente de re-rendre l'arbre sans recharger (suffit pour les erreurs transitoires)
    this.setState({ hasError: false })
  }

  recharger = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: 'var(--dark-bg)', fontFamily: "'Manrope', system-ui, sans-serif" }}
      >
        <div className="card-dark animate-fade-in w-full max-w-[400px] px-6 py-8 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 text-[28px]"
            style={{ background: 'rgba(246,195,68,0.12)' }}
          >
            ⚠️
          </div>
          <h1 className="text-white text-lg font-extrabold mb-2">
            Une erreur est survenue
          </h1>
          <p className="text-[#8899B4] text-sm leading-relaxed mb-6">
            Pas de panique — tes données sont en sécurité.
            Réessaie ou recharge l'application.
          </p>
          <div className="flex flex-col gap-2.5">
            <button
              onClick={this.reessayer}
              className="cta-gold w-full py-3 rounded-2xl border-none font-extrabold text-sm cursor-pointer"
              style={{ fontFamily: 'inherit' }}
            >
              Réessayer
            </button>
            <button
              onClick={this.recharger}
              className="w-full py-3 rounded-2xl bg-transparent text-[#8899B4] font-semibold text-sm cursor-pointer"
              style={{ border: '1px solid var(--dark-border-strong)', fontFamily: 'inherit' }}
            >
              Recharger l'application
            </button>
          </div>
          <p className="text-[#4A5B73] text-[11px] mt-5">
            Si le problème persiste : WhatsApp +221 77 708 50 92
          </p>
        </div>
      </div>
    )
  }
}
