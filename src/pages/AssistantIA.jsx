/**
 * AssistantIA — Page client de l'assistant IA
 * Route : /client/assistant
 *
 * Utilise le composant partagé AIChat.
 * Ne contient aucune logique métier — tout est dans AIChat et iaService.
 */
import AIChat from '../components/AIChat'

const CLIENT_SUGGESTIONS = [
  '💰 Combien coûte un faux plafond BA13 ?',
  '📋 Je souhaite demander un devis',
  '🏗 Quels sont vos services ?',
  '📍 Intervenez-vous à Thiès ?',
]

export default function AssistantIA() {
  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-white">Assistant IA</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          Votre assistant intelligent disponible 24h/24.
        </p>
      </div>

      <AIChat
        storageKey="unic-ia-client"
        welcomeTitle="Bonjour 👋"
        welcomeText="Je suis UniC IA. Je peux vous aider pour vos devis, matériaux, tarifs et réalisations."
        suggestions={CLIENT_SUGGESTIONS}
        placeholder="Posez votre question à UniC IA…"
      />
    </div>
  )
}
