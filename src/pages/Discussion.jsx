import { useState, useEffect, useRef } from 'react'
import { demarrerSession, ecouterConversation, envoyerMessageProspect, MAX_MESSAGES } from '../services/prospectService'
import { Send, Sparkles, AlertCircle } from 'lucide-react'
import logo from '../assets/logo.webp'

export default function Discussion() {
  const [uid, setUid] = useState(null)
  const [messages, setMessages] = useState([])
  const [texte, setTexte] = useState('')
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const [erreur, setErreur] = useState('')
  const [pretAEcrire, setPretAEcrire] = useState(false)
  const finDesMessages = useRef(null)

  // Démarrage de la session anonyme + écoute de la conversation
  useEffect(() => {
    let unsubscribe = () => {}
    let actif = true

    demarrerSession()
      .then((idSession) => {
        if (!actif) return
        setUid(idSession)
        unsubscribe = ecouterConversation(idSession, (data) => {
          setMessages(data?.messages || [])
        })
        setPretAEcrire(true)
      })
      .catch((e) => {
        console.error('Erreur démarrage session:', e)
        setErreur('Impossible de démarrer la discussion. Recharge la page.')
      })

    return () => { actif = false; unsubscribe() }
  }, [])

  useEffect(() => {
    finDesMessages.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const limiteAtteinte = messages.length >= MAX_MESSAGES

  const envoyer = async (e) => {
    e.preventDefault()
    if (!texte.trim() || envoiEnCours || !uid || limiteAtteinte) return
    setErreur('')
    setEnvoiEnCours(true)
    const contenu = texte.trim()
    setTexte('')
    try {
      await envoyerMessageProspect(uid, contenu)
    } catch (err) {
      setErreur(err.message || 'Erreur lors de l\'envoi.')
    } finally {
      setEnvoiEnCours(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--dark-bg)' }}>
      {/* En-tête */}
      <div className="px-4 py-3 flex items-center gap-3 sticky top-0 z-10 glass-dark"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))', borderBottom: '1px solid var(--dark-border)' }}>
        <img src={logo} alt="UniC Plaquiste" className="h-9 w-auto" />
        <div>
          <p className="text-sm font-bold text-white">UniC Plaquiste</p>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Assistant en ligne</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-w-lg w-full mx-auto">
        {messages.length === 0 && pretAEcrire && (
          <div className="rounded-2xl p-4 text-sm" style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)', color: 'var(--text-secondary)' }}>
            👋 Bonjour ! Je suis l'assistant de UniC Plaquiste. Décris-moi ton projet (type de travaux, surface, localisation...) et je transmettrai tout à Ousmane pour te préparer un devis.
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap"
              style={m.role === 'user'
                ? { background: 'var(--gold)', color: '#060D18' }
                : { background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)', color: 'white' }}>
              {m.content}
            </div>
          </div>
        ))}

        {envoiEnCours && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-4 py-2.5 text-sm flex items-center gap-2" style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)', color: 'var(--text-muted)' }}>
              <Sparkles size={14} className="animate-pulse" /> en train d'écrire...
            </div>
          </div>
        )}

        {erreur && (
          <div className="rounded-xl p-3 text-sm flex items-start gap-2" style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171' }}>
            <AlertCircle size={16} className="shrink-0 mt-0.5" /> {erreur}
          </div>
        )}

        {limiteAtteinte && (
          <div className="rounded-xl p-4 text-sm text-center" style={{ background: 'rgba(246,195,68,0.08)', border: '1px solid rgba(246,195,68,0.2)', color: 'var(--text-secondary)' }}>
            Cette discussion a atteint sa limite. 📞 Continue directement avec Ousmane sur{' '}
            <a href="https://wa.me/221777085092" className="font-semibold" style={{ color: 'var(--gold)' }}>WhatsApp</a>.
          </div>
        )}

        <div ref={finDesMessages} />
      </div>

      {/* Saisie */}
      <form onSubmit={envoyer} className="p-3 flex gap-2 sticky bottom-0" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))', borderTop: '1px solid var(--dark-border)', background: 'var(--dark-bg)' }}>
        <input
          type="text"
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          placeholder={limiteAtteinte ? 'Discussion terminée' : 'Écris ton message...'}
          disabled={!pretAEcrire || envoiEnCours || limiteAtteinte}
          className="flex-1 max-w-lg mx-auto px-4 py-3 rounded-xl text-sm text-white placeholder-[#4A5B73] outline-none disabled:opacity-50"
          style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }}
        />
        <button
          type="submit"
          disabled={!pretAEcrire || envoiEnCours || !texte.trim() || limiteAtteinte}
          className="px-4 rounded-xl font-semibold btn-press disabled:opacity-50"
          style={{ background: 'var(--gold)', color: '#060D18' }}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  )
}
