import { useState } from 'react'
import {
  Bot,
  Send,
  Sparkles
} from 'lucide-react'

import { poserQuestion } from '../services/assistantIAService'

export default function AssistantIA() {
  const [message, setMessage] = useState('')
const [reponse, setReponse] = useState('')
const [loading, setLoading] = useState(false)

  const suggestions = [
    '💰 Combien coûte un faux plafond BA13 ?',
    '📋 Je souhaite un devis',
    '🏗️ Quels sont vos services ?',
    '📍 Travaillez-vous à Thiès ?'
  ]
const envoyerQuestion = async () => {
  if (!message.trim() || loading) return

  try {
    setLoading(true)

    const resultat = await poserQuestion(message)

    setReponse(resultat)
  } catch (e) {
  console.error(e)
  setReponse("❌ " + e.message)
  } finally {
    setLoading(false)
  }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Bot size={28} />
          UniC IA
        </h1>

        <p
          className="mt-2 text-sm"
          style={{ color: 'var(--text-secondary)' }}
        >
          Votre assistant intelligent disponible 24h/24.
        </p>
      </div>
            <div className="card-dark p-6">

        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: 'rgba(242,194,0,0.12)'
            }}
          >
            <Bot
              size={30}
              style={{ color: 'var(--gold)' }}
            />
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">
              Bonjour 👋
            </h2>

            <p
              className="text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              Je suis UniC IA. Je peux vous aider pour vos devis,
              matériaux, tarifs et réalisations.
            </p>
          </div>
        </div>

        <div className="mb-6">
          <p
            className="font-semibold mb-3"
            style={{ color: 'white' }}
          >
            Suggestions
          </p>

          <div className="flex flex-wrap gap-2">
            {suggestions.map((item) => (
              <button
                key={item}
                onClick={() => setMessage(item)}
                className="px-4 py-2 rounded-xl transition text-sm"
                style={{
                  background: 'var(--dark-elevated)',
                  border: '1px solid var(--dark-border)',
                  color: 'white'
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div
          className="rounded-2xl p-5 mb-6"
          style={{
            background: 'var(--dark-elevated)',
            border: '1px solid var(--dark-border)'
          }}
        >
          <div className="flex gap-3">
            <Sparkles
              size={22}
              style={{ color: 'var(--gold)' }}
            />

            <p
              className="text-sm leading-7"
              style={{
                color: 'var(--text-secondary)'
              }}
            >
              Posez-moi toutes vos questions concernant
              UniC Plaquiste. Je pourrai bientôt préparer
              vos devis, expliquer les matériaux,
              calculer des estimations et répondre à vos
              questions techniques.
            </p>
          </div>
        </div>

        <div
          className="min-h-[260px] rounded-2xl p-4 mb-5"
          style={{
            background: 'var(--dark-elevated)',
            border: '1px solid var(--dark-border)'
          }}
        >
          <div className="flex gap-3">
            <Bot
              size={22}
              style={{ color: 'var(--gold)' }}
            />

            <div>
              <p className="font-semibold text-white">
                UniC IA
              </p>

              <p
                className="text-sm mt-2"
                style={{
                  color: 'var(--text-secondary)'
                }}
              >
               {loading
  ? "⏳ UniC IA réfléchit..."
  : (reponse || "Bonjour 👋 Comment puis-je vous aider aujourd'hui ?")
}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Écrivez votre question..."
            className="flex-1 px-4 py-3 rounded-xl outline-none text-white"
            style={{
              background: 'var(--dark-elevated)',
              border: '1px solid var(--dark-border)'
            }}
          />
<button
  onClick={envoyerQuestion}
  disabled={loading}
  className="w-12 h-12 rounded-xl flex items-center justify-center"
  style={{
    background: 'var(--gold)',
    color: '#08101F'
  }}
>
  <Send size={20} />
</button>
        </div>

      </div>
          </div>
  )
}