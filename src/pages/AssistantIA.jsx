import AIChat from '../components/AIChat'
import { useAuth } from '../hooks/useAuth'

export default function AssistantIA() {
  const { user } = useAuth()
  const prenom = user?.nom?.split(' ')[0] || user?.email?.split('@')[0] || ''

  return (
    <AIChat
      storageKey="unic-ia-client"
      welcomeTitle="Bonjour"
      welcomeText="Je suis votre assistant IA. Je connais votre entreprise, vos services, vos outils et vos méthodes. Comment puis-je vous aider aujourd'hui ?"
      placeholder="Pose ta question ou demande quelque chose..."
      userName={prenom}
    />
  )
}
