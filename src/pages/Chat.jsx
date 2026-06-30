import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { envoyerMessage, ecouterMessagesClient, marquerMessagesLus, supprimerMessage } from '../services/messageService'
import { Send, Trash2, MessageSquare } from 'lucide-react'
import Toast from '../components/Toast'

export default function Chat() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [toast, setToast] = useState(null)
  const finRef = useRef(null)

  useEffect(() => {
    if (!user?.id) { setLoading(false); return }
    const unsub = ecouterMessagesClient(user.id, (list) => { setMessages(list); setLoading(false) }, (err) => { setLoading(false); setToast({ message: 'Erreur: ' + (err.code || err.message), type: 'error' }) })
    marquerMessagesLus(user.id, 'client')
    return () => unsub()
  }, [user])

  useEffect(() => { finRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleSend = async () => {
    if (!message.trim() || envoi) return; setEnvoi(true)
    try { await envoyerMessage({ clientId: user.id, clientEmail: user.email, senderId: user.id, senderRole: 'client', text: message.trim() }); setMessage('') }
    catch (err) { setToast({ message: 'Non envoyé. Réessayez.', type: 'error' }) }
    finally { setEnvoi(false) }
  }

  const handleDelete = async (msg) => { if (!window.confirm('Supprimer ?')) return; if (!(await supprimerMessage(msg.id))) setToast({ message: 'Impossible.', type: 'error' }) }

  const formatHeure = (ts) => { if (!ts?.seconds) return ''; return new Date(ts.seconds * 1000).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }

  return (
    <div className="space-y-4 h-full flex flex-col max-w-3xl mx-auto">
      <div className="animate-fade-in"><h1 className="text-2xl font-bold text-white">Chat</h1><p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Conversation avec UniC Plaquiste</p></div>

      <div className="card-dark flex-1 flex flex-col min-h-[400px] overflow-hidden p-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-3 dark-scrollbar">
          {loading && <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>Chargement...</p>}
          {!loading && messages.length === 0 && (
            <div className="text-center py-12"><MessageSquare size={32} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} /><p className="text-sm" style={{ color: 'var(--text-muted)' }}>Écrivez à UniC Plaquiste !</p></div>
          )}
          {!loading && messages.map(msg => (
            <div key={msg.id} className={`flex items-end gap-1.5 group ${msg.senderRole === 'client' ? 'justify-end' : 'justify-start'}`}>
              {msg.senderId === user?.id && <button onClick={() => handleDelete(msg)} className="opacity-0 group-hover:opacity-60 transition btn-press" style={{ color: 'var(--text-muted)' }}><Trash2 size={13}/></button>}
              <div className={`max-w-[75%] px-3.5 py-2.5 text-sm ${msg.senderRole === 'client' ? 'rounded-2xl rounded-br-md' : 'rounded-2xl rounded-bl-md'}`}
                style={{ background: msg.senderRole === 'client' ? 'linear-gradient(135deg, var(--gold-dim), var(--gold))' : 'var(--dark-elevated)', color: msg.senderRole === 'client' ? '#060D18' : 'white' }}>
                <p>{msg.text}</p><p className="text-[10px] mt-1 text-right" style={{ opacity: 0.6 }}>{formatHeure(msg.createdAt)}</p>
              </div>
            </div>
          ))}
          <div ref={finRef} />
        </div>

        <div className="p-3 flex gap-2" style={{ borderTop: '1px solid var(--dark-border)' }}>
          <input type="text" value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Votre message..." disabled={envoi} className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white outline-none disabled:opacity-50"
            style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }} />
          <button onClick={handleSend} disabled={envoi || !message.trim()} className="w-10 h-10 rounded-xl flex items-center justify-center btn-press disabled:opacity-40"
            style={{ background: 'var(--gold)', color: '#060D18' }}><Send size={18}/></button>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
