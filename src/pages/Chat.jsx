import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import {
  envoyerMessage,
  ecouterMessagesClient,
  marquerMessagesLus,
  supprimerMessage,
} from '../services/messageService'
import { Send, Trash2, MessageSquare } from 'lucide-react'
import Toast from '../components/Toast'

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmtTime = (ts) => {
  if (!ts?.seconds) return ''
  return new Date(ts.seconds * 1000).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const fmtDateSep = (ts) => {
  if (!ts?.seconds) return null
  const d = new Date(ts.seconds * 1000)
  const today     = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString())     return "Aujourd'hui"
  if (d.toDateString() === yesterday.toDateString()) return 'Hier'
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}

const isSameDay = (ts1, ts2) => {
  if (!ts1?.seconds || !ts2?.seconds) return false
  return (
    new Date(ts1.seconds * 1000).toDateString() ===
    new Date(ts2.seconds * 1000).toDateString()
  )
}

// ── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 msg-pop">
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
        style={{ background: 'linear-gradient(135deg, #1A3FA0, #2A5BD7)' }}
      >
        <span className="text-[10px] font-bold text-white">U</span>
      </div>

      {/* Dots bubble */}
      <div
        className="px-4 py-3 rounded-2xl rounded-bl-sm"
        style={{
          background: 'var(--dark-elevated)',
          border: '1px solid var(--dark-border)',
        }}
      >
        <div className="flex items-center gap-[5px]">
          {[0, 160, 320].map((delay) => (
            <span
              key={delay}
              className="block w-1.5 h-1.5 rounded-full"
              style={{
                background: '#8899B4',
                animation: `typingBounce 1.3s ease-in-out ${delay}ms infinite`,
              }}
            />
          ))}
        </div>
      </div>

      <span className="text-[11px] self-end pb-0.5" style={{ color: 'var(--text-muted)' }}>
        UniC IA est en train d'écrire…
      </span>
    </div>
  )
}

// ── Date separator ────────────────────────────────────────────────────────────

function DateSeparator({ label }) {
  return (
    <div className="flex items-center gap-3 my-5 select-none">
      <div className="flex-1 h-px" style={{ background: 'var(--dark-border)' }} />
      <span
        className="text-[11px] font-medium px-3 py-1 rounded-full"
        style={{ background: 'var(--dark-elevated)', color: 'var(--text-muted)' }}
      >
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: 'var(--dark-border)' }} />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Chat() {
  const { user } = useAuth()

  // ── State (all original names preserved) ──
  const [messages,    setMessages]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [message,     setMessage]     = useState('')
  const [envoi,       setEnvoi]       = useState(false)
  const [toast,       setToast]       = useState(null)

  // ── New UI-only state ──
  const [showTyping, setShowTyping] = useState(false)

  const finRef       = useRef(null)
  const inputRef     = useRef(null)
  const typingTimer  = useRef(null)

  // ── Firebase listener — UNCHANGED ────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) { setLoading(false); return }

    const unsub = ecouterMessagesClient(
      user.id,
      (list) => { setMessages(list); setLoading(false) },
      (err)  => {
        setLoading(false)
        setToast({ message: 'Erreur : ' + (err.code || err.message), type: 'error' })
      }
    )
    marquerMessagesLus(user.id, 'client')
    return () => unsub()
  }, [user])

  // ── Auto-scroll ──────────────────────────────────────────────────────────
  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, showTyping])

  // ── Hide typing indicator when admin replies ──────────────────────────────
  useEffect(() => {
    const last = messages[messages.length - 1]
    if (last?.senderRole === 'admin') {
      clearTimeout(typingTimer.current)
      setShowTyping(false)
    }
  }, [messages])

  // Cleanup timer on unmount
  useEffect(() => () => clearTimeout(typingTimer.current), [])

  // ── Send — ORIGINAL logic, refactored for UX ─────────────────────────────
  const handleSend = useCallback(async () => {
    const text = message.trim()
    if (!text || envoi) return

    setEnvoi(true)
    setMessage('')          // clear immediately for snappy feel
    inputRef.current?.focus()

    try {
      await envoyerMessage({
        clientId:    user.id,
        clientEmail: user.email,
        senderId:    user.id,
        senderRole:  'client',
        text,
      })
      // Show typing indicator for 7 seconds after sending
      setShowTyping(true)
      clearTimeout(typingTimer.current)
      typingTimer.current = setTimeout(() => setShowTyping(false), 7000)
    } catch (err) {
      setMessage(text) // restore message on failure
      setToast({ message: 'Message non envoyé. Réessayez.', type: 'error' })
    } finally {
      setEnvoi(false)
    }
  }, [message, envoi, user])

  // ── Delete — UNCHANGED ────────────────────────────────────────────────────
  const handleDelete = async (msg) => {
    if (!window.confirm('Supprimer ce message ?')) return
    if (!(await supprimerMessage(msg.id))) {
      setToast({ message: 'Impossible de supprimer.', type: 'error' })
    }
  }

  // ── Keyboard: Enter sends, Shift+Enter = newline ──────────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ── Textarea auto-resize ──────────────────────────────────────────────────
  const autoResize = (e) => {
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col max-w-3xl mx-auto animate-fade-in chat-container rounded-2xl overflow-hidden"
      style={{ background: 'var(--dark-surface)', border: '1px solid var(--dark-border)' }}>

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3.5 shrink-0"
        style={{
          borderBottom: '1px solid var(--dark-border)',
          background: 'linear-gradient(180deg, rgba(26,63,160,0.08) 0%, transparent 100%)',
        }}>
        <div className="relative">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg shrink-0"
            style={{ background: 'linear-gradient(135deg, #1A3FA0, #2A5BD7)' }}>
            <span className="text-sm font-bold text-white">U</span>
          </div>
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
            style={{ background: '#34D399', borderColor: 'var(--dark-surface)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">UniC Plaquiste</p>
          <p className="text-xs" style={{ color: '#34D399' }}>En ligne · répond rapidement</p>
        </div>
      </div>

      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 dark-scrollbar" style={{ minHeight: 0 }}>

        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-4 pt-2">
            {[70, 45, 80].map((w, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                {i % 2 === 0 && <div className="w-7 h-7 rounded-full skeleton-dark shrink-0 mr-2" />}
                <div className="skeleton-dark rounded-2xl h-10" style={{ width: `${w}%` }} />
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full min-h-[220px] text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-xl"
              style={{ background: 'linear-gradient(135deg, #1A3FA0, #2A5BD7)' }}>
              <MessageSquare size={28} className="text-white" />
            </div>
            <p className="font-semibold text-white text-base mb-1">Démarrez la conversation</p>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Notre équipe vous répond en quelques minutes.
            </p>
          </div>
        )}

        {/* Message list */}
        {!loading && messages.map((msg, i) => {
          const isClient      = msg.senderRole === 'client'
          const isMine        = msg.senderId === user?.id
          const prev          = messages[i - 1]
          const next          = messages[i + 1]
          const showDate      = !prev || !isSameDay(prev.createdAt, msg.createdAt)
          const isFirstGroup  = !prev || prev.senderRole !== msg.senderRole
          const isLastGroup   = !next || next.senderRole !== msg.senderRole

          // Bubble shape: first/middle/last in a group
          const bubbleClass = isClient
            ? isFirstGroup && isLastGroup ? 'chat-bubble-client'
              : isFirstGroup  ? 'chat-bubble-group-client rounded-2xl'
              : isLastGroup   ? 'rounded-2xl rounded-br-md bg-[linear-gradient(135deg,var(--gold-dim),var(--gold))]'
              : 'chat-bubble-mid-client bg-[linear-gradient(135deg,var(--gold-dim),var(--gold))]'
            : isFirstGroup && isLastGroup ? 'chat-bubble-other'
              : isFirstGroup  ? 'chat-bubble-group-other rounded-2xl'
              : isLastGroup   ? 'rounded-2xl rounded-bl-md'
              : 'chat-bubble-mid-other rounded-lg'

          return (
            <div key={msg.id}>
              {showDate && <DateSeparator label={fmtDateSep(msg.createdAt)} />}

              <div className={`flex items-end gap-2 ${isClient ? 'justify-end' : 'justify-start'} ${isLastGroup ? 'mb-3' : 'mb-0.5'}`}>

                {/* Admin avatar — only on last message in group */}
                {!isClient && (
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-opacity ${isLastGroup ? 'opacity-100' : 'opacity-0'}`}
                    style={{ background: 'linear-gradient(135deg, #1A3FA0, #2A5BD7)' }}>
                    <span className="text-[10px] font-bold text-white">U</span>
                  </div>
                )}

                {/* Delete button — shows on hover */}
                {isMine && (
                  <button
                    onClick={() => handleDelete(msg)}
                    className="opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity p-1 rounded-lg shrink-0"
                    style={{ color: '#F87171' }}
                    title="Supprimer"
                  >
                    <Trash2 size={12} />
                  </button>
                )}

                {/* Bubble */}
                <div className="max-w-[78%] sm:max-w-[65%]">
                  <div
                    className={`px-4 py-2.5 text-sm leading-relaxed break-words msg-pop ${
                      isClient
                        ? 'chat-bubble-client'
                        : 'chat-bubble-other'
                    }`}
                    style={isClient ? {} : {
                      background: 'var(--dark-elevated)',
                      border: '1px solid var(--dark-border)',
                    }}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>

                  {/* Timestamp + read receipt — only on last of group */}
                  {isLastGroup && (
                    <div className={`flex items-center gap-1 mt-1 px-1 ${isClient ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {fmtTime(msg.createdAt)}
                      </span>
                      {isClient && (
                        <span className="text-[11px] font-medium" style={{ color: msg.read ? '#34D399' : 'var(--text-muted)' }}>
                          {msg.read ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Typing indicator */}
        {showTyping && <div className="mt-2"><TypingIndicator /></div>}

        {/* Scroll anchor */}
        <div ref={finRef} />
      </div>

      {/* ── Input area ── */}
      <div className="px-4 pt-3 pb-4 shrink-0" style={{ borderTop: '1px solid var(--dark-border)' }}>
        <div className="flex items-end gap-2.5">
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => { setMessage(e.target.value); autoResize(e) }}
            onKeyDown={handleKeyDown}
            placeholder="Message…"
            disabled={envoi}
            rows={1}
            className="flex-1 px-4 py-3 text-sm disabled:opacity-50 chat-input"
            style={{ minHeight: '46px' }}
          />

          <button
            onClick={handleSend}
            disabled={envoi || !message.trim()}
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-200 disabled:opacity-35 btn-press"
            style={{
              background: message.trim() ? 'var(--gold)' : 'var(--dark-elevated)',
              color:      message.trim() ? '#060D18'    : 'var(--text-muted)',
              border:     message.trim() ? 'none'       : '1.5px solid var(--dark-border)',
              transform:  message.trim() ? 'scale(1)'  : 'scale(0.95)',
            }}
          >
            <Send size={17} />
          </button>
        </div>

        <p className="text-[10px] text-center mt-2 select-none" style={{ color: 'var(--text-muted)' }}>
          Entrée pour envoyer · Maj+Entrée pour nouvelle ligne
        </p>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  )
}
