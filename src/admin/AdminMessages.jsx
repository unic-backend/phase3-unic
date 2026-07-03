import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import {
  envoyerMessage,
  ecouterMessagesClient,
  getConversationsAdmin,
  marquerMessagesLus,
  supprimerMessage,
} from '../services/messageService'
import { Send, MessageSquare, Trash2, ArrowLeft, Search, RefreshCw } from 'lucide-react'
import Toast from '../components/Toast'

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmtTime = (ts) => {
  if (!ts?.seconds) return ''
  return new Date(ts.seconds * 1000).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit',
  })
}

const fmtDateSep = (ts) => {
  if (!ts?.seconds) return null
  const d         = new Date(ts.seconds * 1000)
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

const initiales = (email = '') => {
  const parts = email.split('@')[0].split(/[._-]/)
  return parts.slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join('') || '?'
}

const PALETTE = ['#60A5FA', '#34D399', '#FBBF24', '#A78BFA', '#F87171', '#F472B6']
const getColor = (i) => PALETTE[i % PALETTE.length]

// ── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator({ name }) {
  return (
    <div className="flex items-end gap-2 msg-pop">
      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
        style={{ background: 'rgba(96,165,250,0.15)', color: '#60A5FA' }}>
        <span className="text-[10px] font-bold">{name.charAt(0).toUpperCase()}</span>
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-bl-sm"
        style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }}>
        <div className="flex items-center gap-[5px]">
          {[0, 160, 320].map((delay) => (
            <span key={delay} className="block w-1.5 h-1.5 rounded-full"
              style={{ background: '#8899B4', animation: `typingBounce 1.3s ease-in-out ${delay}ms infinite` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Date separator ────────────────────────────────────────────────────────────

function DateSeparator({ label }) {
  return (
    <div className="flex items-center gap-3 my-5 select-none">
      <div className="flex-1 h-px" style={{ background: 'var(--dark-border)' }} />
      <span className="text-[11px] font-medium px-3 py-1 rounded-full"
        style={{ background: 'var(--dark-elevated)', color: 'var(--text-muted)' }}>
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: 'var(--dark-border)' }} />
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AdminMessages() {
  const { user } = useAuth()

  // ── State (all original names preserved) ──
  const [conversations, setConversations] = useState([])
  const [loadingConv,   setLoadingConv]   = useState(true)
  const [selected,      setSelected]      = useState(null)
  const [messages,      setMessages]      = useState([])
  const [message,       setMessage]       = useState('')
  const [envoi,         setEnvoi]         = useState(false)
  const [toast,         setToast]         = useState(null)

  // ── New UI-only state ──
  const [search,     setSearch]     = useState('')
  const [showTyping, setShowTyping] = useState(false)

  const finRef       = useRef(null)
  const inputRef     = useRef(null)
  const typingTimer  = useRef(null)

  // ── Load conversations — UNCHANGED ───────────────────────────────────────
  const chargerConversations = async () => {
    setLoadingConv(true)
    setConversations(await getConversationsAdmin())
    setLoadingConv(false)
  }

  useEffect(() => { chargerConversations() }, [])

  // ── Listen to selected conversation — UNCHANGED ───────────────────────────
  useEffect(() => {
    if (!selected) return
    const unsubscribe = ecouterMessagesClient(
      selected.clientId,
      setMessages,
      (error) => setToast({ message: 'Erreur : ' + (error.code || error.message), type: 'error' })
    )
    marquerMessagesLus(selected.clientId, 'admin')
    return () => unsubscribe()
  }, [selected])

  // ── Auto-scroll ──────────────────────────────────────────────────────────
  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, showTyping])

  // ── Hide typing indicator when client replies ──────────────────────────────
  useEffect(() => {
    const last = messages[messages.length - 1]
    if (last?.senderRole === 'client') {
      clearTimeout(typingTimer.current)
      setShowTyping(false)
    }
  }, [messages])

  useEffect(() => () => clearTimeout(typingTimer.current), [])

  // ── Send — ORIGINAL logic ─────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = message.trim()
    if (!text || envoi || !selected) return

    setEnvoi(true)
    setMessage('')
    inputRef.current?.focus()

    try {
      await envoyerMessage({
        clientId:    selected.clientId,
        clientEmail: selected.clientEmail,
        senderId:    user.id,
        senderRole:  'admin',
        text,
      })
      setShowTyping(true)
      clearTimeout(typingTimer.current)
      typingTimer.current = setTimeout(() => setShowTyping(false), 6000)
    } catch (err) {
      setMessage(text)
      setToast({ message: 'Message non envoyé. Réessayez.', type: 'error' })
    } finally {
      setEnvoi(false)
    }
  }, [message, envoi, selected, user])

  // ── Delete — UNCHANGED ────────────────────────────────────────────────────
  const handleDelete = async (msg) => {
    if (!window.confirm('Supprimer ce message ?')) return
    if (!(await supprimerMessage(msg.id))) {
      setToast({ message: 'Impossible de supprimer.', type: 'error' })
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const autoResize = (e) => {
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  // ── Filtered conversations ─────────────────────────────────────────────────
  const filteredConvs = conversations.filter((c) =>
    !search || c.clientEmail?.toLowerCase().includes(search.toLowerCase())
  )

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto animate-fade-in">

      {/* Page title */}
      <div className="mb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Messages</h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          Communiquez avec vos clients
        </p>
      </div>

      {/* Layout: conversation list + chat panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 chat-container">

        {/* ── Conversation list ── */}
        <div className={`flex flex-col rounded-2xl overflow-hidden ${selected ? 'hidden md:flex' : 'flex'}`}
          style={{ background: 'var(--dark-surface)', border: '1px solid var(--dark-border)' }}>

          {/* Search header */}
          <div className="px-4 py-3.5 shrink-0" style={{ borderBottom: '1px solid var(--dark-border)' }}>
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un client…"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none text-white"
                style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }}
              />
            </div>
          </div>

          {/* Refresh button */}
          <div className="px-4 py-2 flex justify-end shrink-0">
            <button onClick={chargerConversations} disabled={loadingConv}
              className="flex items-center gap-1.5 text-xs font-medium transition btn-press disabled:opacity-50"
              style={{ color: 'var(--text-muted)' }}>
              <RefreshCw size={12} className={loadingConv ? 'animate-spin' : ''} />
              Actualiser
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto dark-scrollbar">
            {loadingConv && (
              <div className="p-4 space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton-dark h-16 rounded-xl" />
                ))}
              </div>
            )}

            {!loadingConv && filteredConvs.length === 0 && (
              <div className="text-center py-12 px-4">
                <MessageSquare size={28} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {search ? 'Aucun résultat' : 'Aucun message'}
                </p>
              </div>
            )}

            {filteredConvs.map((conv, i) => {
              const isActive = selected?.clientId === conv.clientId
              const color    = getColor(i)
              return (
                <button
                  key={conv.clientId}
                  onClick={() => setSelected(conv)}
                  className="w-full text-left px-4 py-3.5 flex items-center gap-3 transition-colors"
                  style={{
                    background:  isActive ? 'var(--dark-elevated)' : 'transparent',
                    borderLeft:  `3px solid ${isActive ? 'var(--gold)' : 'transparent'}`,
                    borderBottom: '1px solid var(--dark-border)',
                  }}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: `${color}18`, color }}>
                    {initiales(conv.clientEmail)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {conv.clientEmail?.split('@')[0] || 'Client'}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      {conv.lastText}
                    </p>
                  </div>

                  {/* Unread badge */}
                  {conv.unreadAdmin > 0 && (
                    <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0"
                      style={{ background: 'var(--gold)', color: '#060D18' }}>
                      {conv.unreadAdmin}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Chat panel ── */}
        <div className={`md:col-span-2 flex flex-col rounded-2xl overflow-hidden ${!selected ? 'hidden md:flex' : 'flex'}`}
          style={{ background: 'var(--dark-surface)', border: '1px solid var(--dark-border)' }}>

          {/* No conversation selected */}
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ background: 'var(--dark-elevated)' }}>
                <MessageSquare size={28} style={{ color: 'var(--text-muted)' }} />
              </div>
              <p className="font-semibold text-white mb-1">Sélectionner une conversation</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Choisissez un client dans la liste pour voir les messages.
              </p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-4 py-3.5 shrink-0"
                style={{
                  borderBottom: '1px solid var(--dark-border)',
                  background: 'linear-gradient(180deg, rgba(26,63,160,0.06) 0%, transparent 100%)',
                }}>
                {/* Back button — mobile only */}
                <button onClick={() => setSelected(null)}
                  className="md:hidden p-2 rounded-xl btn-press" style={{ color: 'var(--text-secondary)' }}>
                  <ArrowLeft size={20} />
                </button>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 relative"
                  style={{ background: 'rgba(96,165,250,0.15)', color: '#60A5FA' }}>
                  {initiales(selected.clientEmail)}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2"
                    style={{ background: '#34D399', borderColor: 'var(--dark-surface)' }} />
                </div>

                {/* Client info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {selected.clientEmail?.split('@')[0]}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {selected.clientEmail}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 dark-scrollbar" style={{ minHeight: 0 }}>
                {messages.map((msg, i) => {
                  const isAdmin      = msg.senderRole === 'admin'
                  const isMine       = msg.senderId === user?.id
                  const prev         = messages[i - 1]
                  const next         = messages[i + 1]
                  const showDate     = !prev || !isSameDay(prev.createdAt, msg.createdAt)
                  const isLastGroup  = !next || next.senderRole !== msg.senderRole

                  return (
                    <div key={msg.id}>
                      {showDate && <DateSeparator label={fmtDateSep(msg.createdAt)} />}

                      <div className={`flex items-end gap-2 ${isAdmin ? 'justify-end' : 'justify-start'} ${isLastGroup ? 'mb-3' : 'mb-0.5'}`}>

                        {/* Client avatar */}
                        {!isAdmin && (
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold transition-opacity ${isLastGroup ? 'opacity-100' : 'opacity-0'}`}
                            style={{ background: 'rgba(96,165,250,0.15)', color: '#60A5FA' }}>
                            {initiales(selected.clientEmail)}
                          </div>
                        )}

                        {/* Delete button */}
                        {isMine && (
                          <button onClick={() => handleDelete(msg)}
                            className="opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity p-1 rounded-lg shrink-0"
                            style={{ color: '#F87171' }} title="Supprimer">
                            <Trash2 size={12} />
                          </button>
                        )}

                        {/* Bubble */}
                        <div className="max-w-[78%] sm:max-w-[65%]">
                          <div
                            className={`px-4 py-2.5 text-sm leading-relaxed break-words msg-pop ${
                              isAdmin ? 'chat-bubble-client' : 'chat-bubble-other'
                            }`}
                            style={isAdmin ? {} : {
                              background: 'var(--dark-elevated)',
                              border: '1px solid var(--dark-border)',
                            }}
                          >
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                          </div>

                          {isLastGroup && (
                            <div className={`flex items-center gap-1 mt-1 px-1 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                {fmtTime(msg.createdAt)}
                              </span>
                              {isAdmin && (
                                <span className="text-[11px]" style={{ color: msg.read ? '#34D399' : 'var(--text-muted)' }}>
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

                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <MessageSquare size={28} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Aucun message encore.</p>
                  </div>
                )}

                {showTyping && (
                  <div className="mt-2">
                    <TypingIndicator name={selected.clientEmail?.split('@')[0] || 'Client'} />
                  </div>
                )}

                <div ref={finRef} />
              </div>

              {/* Input */}
              <div className="px-4 pt-3 pb-4 shrink-0" style={{ borderTop: '1px solid var(--dark-border)' }}>
                <div className="flex items-end gap-2.5">
                  <textarea
                    ref={inputRef}
                    value={message}
                    onChange={(e) => { setMessage(e.target.value); autoResize(e) }}
                    onKeyDown={handleKeyDown}
                    placeholder={`Répondre à ${selected.clientEmail?.split('@')[0]}…`}
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
                    }}
                  >
                    <Send size={17} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
