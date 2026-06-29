import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { envoyerMessage, ecouterMessagesClient, getConversationsAdmin, marquerMessagesLus, supprimerMessage } from '../services/messageService'
import { Send, MessageSquare, Trash2, ArrowLeft, Phone, Video, Search } from 'lucide-react'
import Toast from '../components/Toast'

export default function AdminMessages() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [loadingConv, setLoadingConv] = useState(true)
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [message, setMessage] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [toast, setToast] = useState(null)
  const finRef = useRef(null)

  const chargerConversations = async () => {
    setLoadingConv(true)
    setConversations(await getConversationsAdmin())
    setLoadingConv(false)
  }

  useEffect(() => { chargerConversations() }, [])

  useEffect(() => {
    if (!selected) return
    const unsubscribe = ecouterMessagesClient(selected.clientId, setMessages,
      (error) => setToast({ message: 'Erreur: ' + (error.code || error.message), type: 'error' })
    )
    marquerMessagesLus(selected.clientId, 'admin')
    return () => unsubscribe()
  }, [selected])

  useEffect(() => { finRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleSend = async () => {
    if (!message.trim() || envoi || !selected) return
    setEnvoi(true)
    try {
      await envoyerMessage({ clientId: selected.clientId, clientEmail: selected.clientEmail, senderId: user.id, senderRole: 'admin', text: message.trim() })
      setMessage('')
    } catch (err) {
      setToast({ message: 'Message non envoyé. Réessayez.', type: 'error' })
    } finally { setEnvoi(false) }
  }

  const handleDelete = async (msg) => {
    if (!window.confirm('Supprimer ce message ?')) return
    if (!(await supprimerMessage(msg.id))) setToast({ message: 'Impossible de supprimer.', type: 'error' })
  }

  const formatHeure = (ts) => {
    if (!ts?.seconds) return ''
    return new Date(ts.seconds * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  }

  const initiales = (email) => {
    const parts = email.split('@')[0].split(/[._-]/)
    return parts.slice(0, 2).map(p => p.charAt(0).toUpperCase()).join('')
  }

  const colors = ['#60A5FA', '#34D399', '#FBBF24', '#A78BFA', '#F87171', '#F472B6']
  const getColor = (i) => colors[i % colors.length]

  return (
    <div className="max-w-5xl mx-auto">
      <div className="animate-fade-in mb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Messages</h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Communiquez avec vos clients</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ minHeight: '500px' }}>

        {/* Liste conversations */}
        <div className={`card-dark p-0 overflow-hidden ${selected ? 'hidden md:block' : ''}`}>
          <div className="p-4" style={{ borderBottom: '1px solid var(--dark-border)' }}>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input type="text" placeholder="Rechercher..." className="w-full pl-9 pr-3 py-2 rounded-xl text-sm bg-transparent outline-none text-white placeholder-[#4A5B73]"
                style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }} />
            </div>
          </div>

          {loadingConv && (
            <div className="p-4 space-y-3">
              {[1,2,3].map(i => <div key={i} className="skeleton-dark h-16 rounded-xl" />)}
            </div>
          )}

          {!loadingConv && conversations.length === 0 && (
            <div className="text-center py-12 px-4">
              <MessageSquare size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Aucun message</p>
            </div>
          )}

          <div className="overflow-y-auto dark-scrollbar" style={{ maxHeight: '450px' }}>
            {conversations.map((conv, i) => {
              const active = selected?.clientId === conv.clientId
              return (
                <button key={conv.clientId} onClick={() => setSelected(conv)}
                  className="w-full text-left p-3.5 flex items-center gap-3 transition btn-press"
                  style={{
                    background: active ? 'var(--dark-elevated)' : 'transparent',
                    borderLeft: active ? '3px solid var(--gold)' : '3px solid transparent',
                    borderBottom: '1px solid var(--dark-border)'
                  }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: `${getColor(i)}20`, color: getColor(i) }}>
                    {initiales(conv.clientEmail)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{conv.clientEmail.split('@')[0]}</p>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{conv.lastText}</p>
                  </div>
                  {conv.unreadAdmin > 0 && (
                    <span className="w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0"
                      style={{ background: 'var(--gold)', color: '#060D18' }}>{conv.unreadAdmin}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Zone Chat */}
        <div className={`md:col-span-2 card-dark p-0 flex flex-col overflow-hidden ${!selected ? 'hidden md:flex' : 'flex'}`}>
          {!selected ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare size={40} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
                <p style={{ color: 'var(--text-muted)' }}>Sélectionner une conversation</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header chat */}
              <div className="p-4 flex items-center gap-3" style={{ borderBottom: '1px solid var(--dark-border)' }}>
                <button onClick={() => setSelected(null)} className="md:hidden btn-press" style={{ color: 'var(--text-secondary)' }}>
                  <ArrowLeft size={20} />
                </button>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'rgba(96,165,250,0.15)', color: '#60A5FA' }}>
                  {initiales(selected.clientEmail)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{selected.clientEmail.split('@')[0]}</p>
                  <p className="text-xs" style={{ color: '#34D399' }}>En ligne</p>
                </div>
                <button className="p-2 rounded-xl" style={{ color: 'var(--text-muted)' }}><Phone size={18} /></button>
                <button className="p-2 rounded-xl" style={{ color: 'var(--text-muted)' }}><Video size={18} /></button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 dark-scrollbar" style={{ maxHeight: '380px' }}>
                {messages.map(msg => (
                  <div key={msg.id} className={`flex items-end gap-1.5 group ${msg.senderRole === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    {msg.senderId === user?.id && (
                      <button onClick={() => handleDelete(msg)}
                        className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition btn-press"
                        style={{ color: 'var(--text-muted)' }}>
                        <Trash2 size={13} />
                      </button>
                    )}
                    <div className={`max-w-[75%] px-3.5 py-2.5 text-sm ${
                      msg.senderRole === 'admin'
                        ? 'rounded-2xl rounded-br-md text-white'
                        : 'rounded-2xl rounded-bl-md text-white'
                    }`}
                    style={{
                      background: msg.senderRole === 'admin'
                        ? 'linear-gradient(135deg, var(--gold-dim), var(--gold))'
                        : 'var(--dark-elevated)',
                      color: msg.senderRole === 'admin' ? '#060D18' : 'white'
                    }}>
                      <p>{msg.text}</p>
                      <p className="text-[10px] mt-1 text-right" style={{ opacity: 0.6 }}>{formatHeure(msg.createdAt)}</p>
                    </div>
                  </div>
                ))}
                <div ref={finRef} />
              </div>

              {/* Input */}
              <div className="p-3 flex gap-2" style={{ borderTop: '1px solid var(--dark-border)' }}>
                <input
                  type="text" value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Votre message..."
                  disabled={envoi}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white outline-none disabled:opacity-50"
                  style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }}
                />
                <button onClick={handleSend} disabled={envoi || !message.trim()}
                  className="w-10 h-10 rounded-xl flex items-center justify-center btn-press disabled:opacity-40 transition"
                  style={{ background: 'var(--gold)', color: '#060D18' }}>
                  <Send size={18} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
