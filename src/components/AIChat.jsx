/**
 * AIChat — Composant partagé de conversation IA premium
 *
 * Utilisé par :
 *  - /client/assistant  (AssistantIA.jsx)
 *  - /admin/connaissances  (AdminBaseConnaissances.jsx)
 *
 * Design inspiré de la capture de référence :
 *  - Avatar IA = logo UniC Plaquiste
 *  - 4 cartes actions rapides avec icônes colorées
 *  - Bulles dorées (user) à droite, dark (IA) à gauche
 *  - Accusés de lecture ✓✓
 *  - Typing indicator "UniC IA analyse..."
 *  - Disclaimer en bas de l'input
 *  - Historique persisté en sessionStorage
 *  - Markdown rendu (gras, titres, listes)
 *
 * Backend 100% inchangé : demanderAssistant() de iaService.js
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { demanderAssistant } from '../services/iaService'
import { Send, FileText, Calculator, Lightbulb, Building2, Sparkles } from 'lucide-react'
import logo from '../assets/logo.webp'

// ── Markdown inline ──────────────────────────────────────────────────────────
function parseInline(text, keyPrefix = '') {
  if (!text) return null
  const parts = []
  let rem = text, k = 0
  while (rem.length > 0) {
    const bm = rem.match(/\*\*(.+?)\*\*/)
    const im = rem.match(/\*([^*]+)\*/)
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
    } else { parts.push(rem); break }
  }
  return parts
}

// ── Markdown bloc ────────────────────────────────────────────────────────────
function MarkdownContent({ text }) {
  if (!text) return null
  const normalized = text
    .replace(/([^\n])\s*---\s*([^\n])/g, '$1\n---\n$2')
    .replace(/([^\n])\s*## /g, '$1\n## ')
    .replace(/([^\n])\s*# /g, '$1\n# ')
  const lines = normalized.split('\n'), output = [], listBuf = []
  let key = 0
  function flushList() {
    if (!listBuf.length) return
    output.push(
      <ul key={key++} className="space-y-1.5 my-2">
        {listBuf.map((item, i) => (
          <li key={i} className="flex gap-2.5 text-sm leading-relaxed">
            <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-2" style={{ background: 'var(--gold)' }} />
            <span style={{ color: '#D1DBF0' }}>{parseInline(item, `l${i}-`)}</span>
          </li>
        ))}
      </ul>
    )
    listBuf.length = 0
  }
  lines.forEach((raw) => {
    const line = raw.trimEnd()
    if (!line.trim()) return
    if (line.trim() === '---') { flushList(); output.push(<hr key={key++} className="my-3 border-none h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />); return }
    if (line.trimStart().startsWith('# ')) { flushList(); output.push(<p key={key++} className="text-sm font-bold mt-3 mb-1 text-white">{parseInline(line.trimStart().slice(2), `h1-${key}`)}</p>); return }
    if (line.trimStart().startsWith('## ')) { flushList(); output.push(<p key={key++} className="text-sm font-semibold mt-2.5 mb-0.5" style={{ color: 'var(--gold)' }}>{parseInline(line.trimStart().slice(3), `h2-${key}`)}</p>); return }
    if (line.trimStart().startsWith('- ') || line.trimStart().startsWith('* ')) { listBuf.push(line.trimStart().slice(2)); return }
    flushList()
    output.push(<p key={key++} className="text-sm leading-relaxed mb-0.5" style={{ color: '#D1DBF0' }}>{parseInline(line.trim(), `p-${key}`)}</p>)
  })
  flushList()
  return output.length ? <div className="space-y-0.5">{output}</div> : <p className="text-sm leading-relaxed" style={{ color: '#D1DBF0' }}>{text}</p>
}

// ── Typing indicator ─────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-end gap-2.5 msg-pop">
      <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 shadow-lg" style={{ border: '2px solid rgba(246,195,68,0.3)' }}>
        <img src={logo} alt="UniC" className="w-full h-full object-contain" style={{ background: '#0C1829' }} />
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-bl-sm" style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }}>
        <span className="text-[10px] font-bold mb-1 block" style={{ color: 'var(--gold)' }}>UniC IA analyse...</span>
        <div className="flex items-center gap-[5px]">
          {[0, 160, 320].map(d => (
            <span key={d} className="block w-1.5 h-1.5 rounded-full"
              style={{ background: '#8899B4', animation: `typingBounce 1.3s ease-in-out ${d}ms infinite` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Timestamp formatter ──────────────────────────────────────────────────────
const fmtTime = (ts) => new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

// ── Quick Action Card ────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { icon: FileText,    color: '#F6C344', bg: 'rgba(246,195,68,0.12)',  label: 'Rédiger un devis',      desc: 'Générer un devis professionnel personnalisé', prompt: 'Je veux rédiger un devis pour un client' },
  { icon: Calculator,  color: '#34D399', bg: 'rgba(52,211,153,0.12)',  label: 'Calculer un prix',      desc: 'Estimer le coût d\'un projet en fonction des surfaces', prompt: 'Calcule le prix pour un faux plafond BA13' },
  { icon: Lightbulb,   color: '#60A5FA', bg: 'rgba(96,165,250,0.12)',  label: 'Conseil technique',     desc: 'Obtenir des conseils sur les matériaux et techniques', prompt: 'Donne-moi un conseil technique sur le BA13' },
  { icon: Building2,   color: '#A78BFA', bg: 'rgba(167,139,250,0.12)', label: 'Infos entreprise',      desc: 'En savoir plus sur UniC Plaquiste', prompt: 'Quels sont les services de UniC Plaquiste ?' },
]

function QuickActionCard({ action, onSend, disabled }) {
  const Icon = action.icon
  return (
    <button onClick={() => onSend(action.prompt)} disabled={disabled}
      className="card-glass p-3.5 text-left flex flex-col gap-2 btn-press disabled:opacity-40 transition-all">
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: action.bg }}>
        <Icon size={20} strokeWidth={1.6} style={{ color: action.color }} />
      </div>
      <div>
        <p className="text-xs font-bold text-white leading-tight">{action.label}</p>
        <p className="text-[10px] mt-0.5 leading-snug" style={{ color: 'var(--text-muted)' }}>{action.desc}</p>
      </div>
    </button>
  )
}

// ── Message Bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  const isError = msg.role === 'error'

  if (isUser) {
    return (
      <div className="flex justify-end gap-2.5 msg-pop">
        <div className="max-w-[80%] sm:max-w-[68%]">
          <div className="px-4 py-3 rounded-2xl rounded-br-sm chat-bubble-client">
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
          </div>
          <div className="flex items-center justify-end gap-1 mt-1 pr-1">
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{fmtTime(msg.ts)}</span>
            <span className="text-[11px] font-medium" style={{ color: '#34D399' }}>✓✓</span>
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-end gap-2.5 msg-pop">
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'rgba(248,113,113,0.15)', border: '2px solid rgba(248,113,113,0.3)' }}>
          <span className="text-xs font-bold" style={{ color: '#F87171' }}>!</span>
        </div>
        <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-bl-sm text-sm"
          style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)', color: '#F87171' }}>
          ⚠️ {msg.content}
        </div>
      </div>
    )
  }

  // IA message
  return (
    <div className="flex items-end gap-2.5 msg-pop">
      <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 shadow-lg self-start mt-1"
        style={{ border: '2px solid rgba(246,195,68,0.3)' }}>
        <img src={logo} alt="UniC IA" className="w-full h-full object-contain" style={{ background: '#0C1829' }} />
      </div>
      <div className="max-w-[84%] sm:max-w-[75%]">
        <div className="px-4 py-3 rounded-2xl rounded-bl-sm" style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }}>
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles size={11} style={{ color: 'var(--gold)' }} />
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--gold)' }}>UniC IA</span>
          </div>
          <MarkdownContent text={msg.content} />
        </div>
        <p className="text-[10px] mt-1 pl-1" style={{ color: 'var(--text-muted)' }}>{fmtTime(msg.ts)}</p>
      </div>
    </div>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function AIChat({
  storageKey   = 'unic-ia-default',
  welcomeTitle = 'Bonjour',
  welcomeText  = 'Je suis votre assistant IA. Je connais votre entreprise, vos services, vos outils et vos méthodes. Comment puis-je vous aider aujourd\'hui ?',
  suggestions  = [],
  placeholder  = 'Pose ta question ou demande quelque chose...',
  compact      = false,
  userName     = '',
}) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState(() => {
    try { const s = sessionStorage.getItem(storageKey); return s ? JSON.parse(s) : [] }
    catch { return [] }
  })
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { try { sessionStorage.setItem(storageKey, JSON.stringify(messages)) } catch {} }, [messages, storageKey])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, isTyping])

  // ── Envoi — demanderAssistant() INCHANGÉ ───────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    const question = (text || input).trim()
    if (!question || isTyping) return
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: 'user', content: question, ts: Date.now() }])
    setInput('')
    inputRef.current?.focus()
    setIsTyping(true)
    try {
      const reponse = await demanderAssistant(question)
      setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: reponse, ts: Date.now() }])
    } catch (err) {
      setMessages(prev => [...prev, { id: `e-${Date.now()}`, role: 'error', content: err.message || 'Erreur. Réessayez.', ts: Date.now() }])
    } finally { setIsTyping(false) }
  }, [input, isTyping])

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }
  const autoResize = (e) => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }

  const hasUserMessages = messages.some(m => m.role === 'user')
  const displayName = userName || 'Ousmane'

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className={compact ? 'flex flex-col' : 'flex flex-col chat-container rounded-2xl overflow-hidden max-w-3xl mx-auto'}
      style={compact ? {} : { background: 'var(--dark-surface)', border: '1px solid var(--dark-border)' }}>

      {/* ── Header ── */}
      {!compact && (
        <div className="flex items-center gap-3 px-4 py-3 shrink-0"
          style={{ borderBottom: '1px solid var(--dark-border)', background: 'linear-gradient(180deg, rgba(26,63,160,0.06) 0%, transparent 100%)' }}>
          <div className="w-10 h-10 rounded-full overflow-hidden shadow-lg shrink-0" style={{ border: '2px solid rgba(246,195,68,0.25)' }}>
            <img src={logo} alt="UniC" className="w-full h-full object-contain" style={{ background: '#0C1829' }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">Assistant IA</p>
            <p className="text-[11px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: '#34D399' }} />
              <span style={{ color: '#34D399' }}>En ligne</span>
            </p>
          </div>
        </div>
      )}

      {/* ── Zone messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 dark-scrollbar space-y-4" style={{ minHeight: 0 }}>

        {/* Carte bienvenue — seulement avant le 1er message */}
        {!hasUserMessages && (
          <div className="animate-fade-in space-y-5">
            {/* Titre premium */}
            <div className="text-center pt-2">
              <h2 className="text-xl font-extrabold text-white" style={{ letterSpacing: '-0.02em' }}>
                {welcomeTitle} {displayName} ! <span className="inline-block animate-bounce">👋</span>
              </h2>
              <p className="text-sm mt-2 mx-auto max-w-md" style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                {welcomeText}
              </p>
            </div>

            {/* 4 cartes actions rapides */}
            <div className="grid grid-cols-2 gap-2.5">
              {QUICK_ACTIONS.map((a, i) => (
                <QuickActionCard key={i} action={a} onSend={sendMessage} disabled={isTyping} />
              ))}
            </div>

            {/* Séparateur contextuel */}
            <div className="flex items-center gap-3 select-none">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
              <span className="text-[10px] px-3 py-1 rounded-full flex items-center gap-1.5"
                style={{ background: 'var(--dark-elevated)', color: 'var(--text-muted)', border: '1px solid var(--dark-border)' }}>
                <span className="text-[8px]">⦿⦿⦿</span> Je comprends votre entreprise et me souviens de tout.
              </span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
            </div>

            {/* Message de bienvenue IA */}
            <div className="flex items-start gap-2.5">
              <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 shadow-lg mt-0.5"
                style={{ border: '2px solid rgba(246,195,68,0.3)' }}>
                <img src={logo} alt="UniC IA" className="w-full h-full object-contain" style={{ background: '#0C1829' }} />
              </div>
              <div className="flex-1">
                <div className="px-4 py-3 rounded-2xl rounded-bl-sm" style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }}>
                  <p className="text-sm leading-relaxed" style={{ color: '#D1DBF0' }}>
                    <strong className="text-white">Salut {displayName} !</strong> 👋<br />
                    Je suis là pour t'aider dans ton quotidien : devis, conseils, calculs, gestion de projets et bien plus encore.
                  </p>
                  <p className="text-sm mt-2" style={{ color: '#D1DBF0' }}>
                    Que souhaites-tu faire aujourd'hui ?
                  </p>
                </div>
                <p className="text-[10px] mt-1 pl-1" style={{ color: 'var(--text-muted)' }}>{fmtTime(Date.now())}</p>
              </div>
            </div>
          </div>
        )}

        {/* Historique de conversation */}
        {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}

        {/* Typing indicator */}
        {isTyping && <TypingDots />}

        <div ref={bottomRef} />
      </div>

      {/* ── Zone de saisie premium ── */}
      <div className="px-4 pt-3 pb-3 shrink-0" style={{ borderTop: '1px solid var(--dark-border)' }}>
        <div className="flex items-end gap-2 rounded-2xl px-1 py-1"
          style={{ background: 'var(--dark-elevated)', border: '1.5px solid var(--dark-border)' }}>
          {/* Icône IA */}
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ml-1"
            style={{ background: 'rgba(246,195,68,0.1)' }}>
            <Sparkles size={16} style={{ color: 'var(--gold)' }} />
          </div>
          {/* Textarea */}
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); autoResize(e) }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isTyping}
            rows={1}
            className="flex-1 py-2.5 px-1 text-sm bg-transparent text-white outline-none resize-none disabled:opacity-50 placeholder-[#4A5B73]"
            style={{ minHeight: '38px', maxHeight: '120px' }}
          />
          {/* Bouton envoyer */}
          <button onClick={() => sendMessage()} disabled={isTyping || !input.trim()}
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mr-0.5 transition-all duration-200 disabled:opacity-30 btn-press"
            style={{
              background: input.trim() ? 'var(--gold)' : 'transparent',
              color: input.trim() ? '#060D18' : 'var(--text-muted)',
            }}>
            <Send size={16} strokeWidth={2.2} />
          </button>
        </div>
        <p className="text-[9px] text-center mt-2 select-none" style={{ color: 'var(--text-muted)' }}>
          L'IA peut se tromper, vérifiez toujours les informations importantes.
        </p>
      </div>
    </div>
  )
}
