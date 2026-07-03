/**
 * AIChat — Composant partagé de conversation IA
 *
 * Utilisé par :
 *  - /client/assistant  (AssistantIA.jsx)
 *  - /admin/connaissances  (AdminBaseConnaissances.jsx)
 *
 * Garanties :
 *  - L'historique est préservé via sessionStorage (survit à la navigation,
 *    effacé au rafraîchissement de page — comportement voulu).
 *  - La carte de bienvenue disparaît dès le premier message utilisateur.
 *  - Le markdown de la réponse IA est rendu (gras, titres, listes, séparateurs).
 *  - L'indicateur de frappe s'affiche pendant l'appel API.
 *  - L'input est vidé et garde le focus après l'envoi.
 *  - Scroll automatique vers le dernier message.
 *  - Aucun appel API ni logique métier n'est modifié ici.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { demanderAssistant } from '../services/iaService'
import { Send, Sparkles, Bot } from 'lucide-react'

// ── Rendu Markdown inline ────────────────────────────────────────────────────
// Gère **gras** et *italique* sans dépendance externe.
function parseInline(text, keyPrefix = '') {
  if (!text) return null
  const parts = []
  let rem = text
  let k = 0

  while (rem.length > 0) {
    const boldRe  = /\*\*(.+?)\*\*/
    const italRe  = /\*([^*]+)\*/
    const bm = rem.match(boldRe)
    const im = rem.match(italRe)
    const bi = bm ? rem.indexOf(bm[0]) : Infinity
    const ii = im ? rem.indexOf(im[0]) : Infinity

    if (!bm && !im) { parts.push(rem); break }

    if (bi <= ii && bm) {
      if (bi > 0) parts.push(rem.slice(0, bi))
      parts.push(<strong key={`${keyPrefix}b${k++}`} className="font-semibold text-white">{bm[1]}</strong>)
      rem = rem.slice(bi + bm[0].length)
    } else if (im) {
      if (ii > 0) parts.push(rem.slice(0, ii))
      parts.push(<em key={`${keyPrefix}i${k++}`} className="italic">{im[1]}</em>)
      rem = rem.slice(ii + im[0].length)
    } else {
      parts.push(rem); break
    }
  }
  return parts
}

// ── Rendu Markdown bloc ──────────────────────────────────────────────────────
// Gère : # h1, ## h2, - liste, --- séparateur, paragraphes.
function MarkdownContent({ text }) {
  if (!text) return null

  // Normaliser les séparateurs inline (--- en milieu de texte)
  const normalized = text
    .replace(/([^\n])\s*---\s*([^\n])/g, '$1\n---\n$2')
    .replace(/([^\n])\s*## /g, '$1\n## ')
    .replace(/([^\n])\s*# /g, '$1\n# ')

  const lines   = normalized.split('\n')
  const output  = []
  const listBuf = []
  let key = 0

  function flushList() {
    if (!listBuf.length) return
    output.push(
      <ul key={key++} className="space-y-1 my-2">
        {listBuf.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed">
            <span className="mt-[3px] w-1 h-1 rounded-full shrink-0 inline-block self-start mt-2"
              style={{ background: 'var(--gold)', minWidth: '4px', minHeight: '4px' }} />
            <span style={{ color: '#D1DBF0' }}>{parseInline(item, `l${i}-`)}</span>
          </li>
        ))}
      </ul>
    )
    listBuf.length = 0
  }

  lines.forEach((raw) => {
    const line = raw.trimEnd()

    if (!line.trim()) return // skip empty lines

    if (line.trim() === '---') {
      flushList()
      output.push(
        <hr key={key++} className="my-3 border-none h-px"
          style={{ background: 'rgba(255,255,255,0.06)' }} />
      )
      return
    }

    if (line.trimStart().startsWith('# ')) {
      flushList()
      const content = line.trimStart().slice(2)
      output.push(
        <p key={key++} className="text-sm font-bold mt-3 mb-1 text-white">
          {parseInline(content, `h1-${key}`)}
        </p>
      )
      return
    }

    if (line.trimStart().startsWith('## ')) {
      flushList()
      const content = line.trimStart().slice(3)
      output.push(
        <p key={key++} className="text-sm font-semibold mt-2.5 mb-0.5"
          style={{ color: 'var(--gold)' }}>
          {parseInline(content, `h2-${key}`)}
        </p>
      )
      return
    }

    if (line.trimStart().startsWith('- ') || line.trimStart().startsWith('* ')) {
      listBuf.push(line.trimStart().slice(2))
      return
    }

    flushList()
    output.push(
      <p key={key++} className="text-sm leading-relaxed mb-0.5"
        style={{ color: '#D1DBF0' }}>
        {parseInline(line.trim(), `p-${key}`)}
      </p>
    )
  })

  flushList()

  return output.length
    ? <div className="space-y-0.5">{output}</div>
    : <p className="text-sm leading-relaxed" style={{ color: '#D1DBF0' }}>{text}</p>
}

// ── Indicateur de frappe ──────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-end gap-2 msg-pop">
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        style={{ background: 'linear-gradient(135deg, #1A3FA0, #2A5BD7)' }}>
        <Bot size={14} className="text-white" />
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-bl-sm flex flex-col gap-0.5"
        style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }}>
        <span className="text-[10px] font-semibold mb-1" style={{ color: 'var(--gold)' }}>
          UniC IA
        </span>
        <div className="flex items-center gap-[5px]">
          {[0, 160, 320].map((d) => (
            <span key={d} className="block w-1.5 h-1.5 rounded-full"
              style={{
                background: '#8899B4',
                animation: `typingBounce 1.3s ease-in-out ${d}ms infinite`,
              }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Bulle de message ──────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser  = msg.role === 'user'
  const isError = msg.role === 'error'

  if (isUser) {
    return (
      <div className="flex justify-end msg-pop">
        <div className="max-w-[78%] sm:max-w-[65%]">
          <div className="px-4 py-3 rounded-2xl rounded-br-sm chat-bubble-client">
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
          </div>
          <p className="text-[10px] text-right mt-1 pr-1" style={{ color: 'var(--text-muted)' }}>
            {new Date(msg.ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-end gap-2 msg-pop">
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'rgba(248,113,113,0.15)' }}>
          <span className="text-xs font-bold" style={{ color: '#F87171' }}>!</span>
        </div>
        <div className="max-w-[78%] px-4 py-3 rounded-2xl rounded-bl-sm text-sm"
          style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: '#F87171' }}>
          ⚠️ {msg.content}
        </div>
      </div>
    )
  }

  // Assistant message
  return (
    <div className="flex items-end gap-2 msg-pop">
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-lg"
        style={{ background: 'linear-gradient(135deg, #1A3FA0, #2A5BD7)' }}>
        <Bot size={14} className="text-white" />
      </div>
      <div className="max-w-[84%] sm:max-w-[75%]">
        <div className="px-4 py-3 rounded-2xl rounded-bl-sm chat-bubble-other">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles size={11} style={{ color: 'var(--gold)' }} />
            <span className="text-[10px] font-bold uppercase tracking-wide"
              style={{ color: 'var(--gold)' }}>
              UniC IA
            </span>
          </div>
          <MarkdownContent text={msg.content} />
        </div>
        <p className="text-[10px] mt-1 pl-1" style={{ color: 'var(--text-muted)' }}>
          {new Date(msg.ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────
/**
 * @param {object}   props
 * @param {string}   props.storageKey       Clé sessionStorage (ex: 'unic-ia-client')
 * @param {string}   [props.welcomeTitle]   Titre de la carte de bienvenue
 * @param {string}   [props.welcomeText]    Sous-titre de la carte de bienvenue
 * @param {string[]} [props.suggestions]    Chips de suggestions rapides
 * @param {string}   [props.placeholder]    Placeholder de l'input
 * @param {boolean}  [props.compact]        Mode compact (admin, intégré dans une page)
 */
export default function AIChat({
  storageKey     = 'unic-ia-default',
  welcomeTitle   = 'Bonjour 👋',
  welcomeText    = 'Je suis UniC IA. Je peux vous aider pour vos devis, matériaux, tarifs et réalisations.',
  suggestions    = [
    '💰 Combien coûte un faux plafond BA13 ?',
    '📋 Je souhaite un devis',
    '🏗 Quels sont vos services ?',
    '📍 Travaillez-vous à Thiès ?',
  ],
  placeholder    = 'Posez votre question…',
  compact        = false,
}) {
  // ── État de conversation (persisté en sessionStorage) ──────────────────────
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem(storageKey)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const [input,     setInput]     = useState('')
  const [isTyping,  setIsTyping]  = useState(false)

  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  // Persistance sessionStorage
  useEffect(() => {
    try { sessionStorage.setItem(storageKey, JSON.stringify(messages)) } catch {}
  }, [messages, storageKey])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // ── Envoi d'un message ──────────────────────────────────────────────────────
  // NE MODIFIE PAS demanderAssistant — appel identique à avant.
  const sendMessage = useCallback(async (text) => {
    const question = (text || input).trim()
    if (!question || isTyping) return

    const userMsg = { id: `u-${Date.now()}`, role: 'user', content: question, ts: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    inputRef.current?.focus()
    setIsTyping(true)

    try {
      const reponse = await demanderAssistant(question) // ← INCHANGÉ
      const aiMsg = { id: `a-${Date.now()}`, role: 'assistant', content: reponse, ts: Date.now() }
      setMessages(prev => [...prev, aiMsg])
    } catch (err) {
      const errMsg = {
        id:      `e-${Date.now()}`,
        role:    'error',
        content: err.message || 'Une erreur est survenue. Réessayez.',
        ts:      Date.now(),
      }
      setMessages(prev => [...prev, errMsg])
    } finally {
      setIsTyping(false)
    }
  }, [input, isTyping])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const autoResize = (e) => {
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  const hasUserMessages = messages.some(m => m.role === 'user')
  const showWelcome     = !hasUserMessages

  // ── Rendu ───────────────────────────────────────────────────────────────────
  const containerClass = compact
    ? 'flex flex-col'
    : 'flex flex-col chat-container rounded-2xl overflow-hidden max-w-3xl mx-auto'

  const containerStyle = compact
    ? {}
    : { background: 'var(--dark-surface)', border: '1px solid var(--dark-border)' }

  return (
    <div className={containerClass} style={containerStyle}>

      {/* ── Header (mode non-compact uniquement) ── */}
      {!compact && (
        <div className="flex items-center gap-3 px-4 py-3.5 shrink-0"
          style={{
            borderBottom: '1px solid var(--dark-border)',
            background: 'linear-gradient(180deg, rgba(26,63,160,0.08) 0%, transparent 100%)',
          }}>
          <div className="relative">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #1A3FA0, #2A5BD7)' }}>
              <Bot size={18} className="text-white" />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
              style={{ background: '#34D399', borderColor: 'var(--dark-surface)' }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">UniC IA</p>
            <p className="text-xs" style={{ color: '#34D399' }}>Assistant disponible 24h/24</p>
          </div>
        </div>
      )}

      {/* ── Zone de messages (scrollable) ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 dark-scrollbar space-y-3" style={{ minHeight: 0 }}>

        {/* Carte de bienvenue — visible seulement avant le 1er message utilisateur */}
        {showWelcome && (
          <div className="animate-fade-in">
            {/* Salutation */}
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg, #1A3FA0, #2A5BD7)' }}>
                <Bot size={18} className="text-white" />
              </div>
              <div className="card-dark p-4 flex-1">
                <p className="font-bold text-white text-base mb-1">{welcomeTitle}</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{welcomeText}</p>
              </div>
            </div>

            {/* Chips de suggestions */}
            {suggestions.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-wide mb-2 ml-1"
                  style={{ color: 'var(--text-muted)' }}>
                  Suggestions
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((sug) => (
                    <button
                      key={sug}
                      onClick={() => sendMessage(sug)}
                      disabled={isTyping}
                      className="text-xs px-3.5 py-2 rounded-xl font-medium transition-all btn-press disabled:opacity-40"
                      style={{
                        background: 'var(--dark-elevated)',
                        border: '1px solid var(--dark-border)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message d'intro */}
            <div className="rounded-xl p-4 text-sm"
              style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }}>
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles size={13} style={{ color: 'var(--gold)' }} />
                <span className="text-xs font-semibold" style={{ color: 'var(--gold)' }}>UniC IA</span>
              </div>
              <p style={{ color: 'var(--text-secondary)' }}>
                Posez-moi toutes vos questions concernant UniC Plaquiste. Je pourrai bientôt préparer
                vos devis, expliquer les matériaux, calculer des estimations et répondre à vos
                questions techniques.
              </p>
            </div>
          </div>
        )}

        {/* Historique de conversation */}
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {/* Indicateur de frappe */}
        {isTyping && <TypingDots />}

        {/* Ancre de scroll */}
        <div ref={bottomRef} />
      </div>

      {/* ── Zone de saisie ── */}
      <div className="px-4 pt-3 pb-4 shrink-0"
        style={{ borderTop: '1px solid var(--dark-border)' }}>
        <div className="flex items-end gap-2.5">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); autoResize(e) }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isTyping}
            rows={1}
            className="flex-1 px-4 py-3 text-sm disabled:opacity-50 chat-input"
            style={{ minHeight: '46px' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={isTyping || !input.trim()}
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-200 disabled:opacity-35 btn-press"
            style={{
              background: input.trim() ? 'var(--gold)' : 'var(--dark-elevated)',
              color:      input.trim() ? '#060D18'    : 'var(--text-muted)',
              border:     input.trim() ? 'none'       : '1.5px solid var(--dark-border)',
            }}
          >
            <Send size={17} />
          </button>
        </div>
        <p className="text-[10px] text-center mt-2 select-none" style={{ color: 'var(--text-muted)' }}>
          Entrée pour envoyer · Maj+Entrée pour nouvelle ligne
        </p>
      </div>
    </div>
  )
}
