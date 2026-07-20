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
      <div style={{
        minHeight: '100vh',
        background: '#060D18',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: "'Manrope', system-ui, sans-serif",
      }}>
        <div style={{
          maxWidth: '400px',
          width: '100%',
          background: '#0C1829',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          padding: '32px 24px',
          textAlign: 'center',
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: 'rgba(246,195,68,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', fontSize: '28px',
          }}>
            ⚠️
          </div>
          <h1 style={{ color: 'white', fontSize: '18px', fontWeight: 800, margin: '0 0 8px' }}>
            Une erreur est survenue
          </h1>
          <p style={{ color: '#8899B4', fontSize: '14px', lineHeight: 1.6, margin: '0 0 24px' }}>
            Pas de panique — tes données sont en sécurité.
            Réessaie ou recharge l'application.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={this.reessayer} style={{
              width: '100%', padding: '13px', borderRadius: '14px', border: 'none',
              background: 'linear-gradient(135deg, #C89B2F, #F6C344)',
              color: '#060D18', fontWeight: 800, fontSize: '14px', cursor: 'pointer',
              fontFamily: 'inherit',
            }}>
              Réessayer
            </button>
            <button onClick={this.recharger} style={{
              width: '100%', padding: '13px', borderRadius: '14px',
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'transparent', color: '#8899B4',
              fontWeight: 600, fontSize: '14px', cursor: 'pointer',
              fontFamily: 'inherit',
            }}>
              Recharger l'application
            </button>
          </div>
          <p style={{ color: '#4A5B73', fontSize: '11px', marginTop: '20px' }}>
            Si le problème persiste :{' '}
            <a href="https://wa.me/221777085092" target="_blank" rel="noopener noreferrer"
              style={{ color: '#F6C344', fontWeight: 700, textDecoration: 'underline' }}>
              WhatsApp +221 77 708 50 92
            </a>
          </p>
        </div>
      </div>
    )
  }
}
