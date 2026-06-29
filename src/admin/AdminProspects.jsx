import { useState, useEffect } from 'react'
import { getTousProspects } from '../services/prospectService'
import { Users2, MessageCircle, X } from 'lucide-react'

export default function AdminProspects() {
  const [prospects, setProspects] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectionne, setSelectionne] = useState(null)

  useEffect(() => {
    let actif = true
    getTousProspects().then((list) => { if (actif) { setProspects(list); setLoading(false) } })
    return () => { actif = false }
  }, [])

  const formatDate = (d) => d?.seconds ? new Date(d.seconds * 1000).toLocaleString('fr-FR') : '-'
  const dernierMessage = (p) => {
    const msgs = p.messages || []
    return msgs.length ? msgs[msgs.length - 1].content : '(pas encore de message)'
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Prospects</h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          Visiteurs arrivés via le lien WhatsApp (app.unicplaquiste.com/discussion)
        </p>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton-dark h-20 rounded-2xl" />)}
        </div>
      )}

      {!loading && prospects.length === 0 && (
        <div className="card-dark p-10 text-center">
          <Users2 size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-semibold text-white">Aucun prospect pour l'instant</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Envoie le lien <span className="font-mono">app.unicplaquiste.com/discussion</span> sur WhatsApp à un client pour démarrer.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {prospects.map((p) => (
          <button key={p.id} onClick={() => setSelectionne(p)} className="card-dark p-4 w-full text-left transition hover:opacity-90">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{dernierMessage(p)}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                  {(p.messages || []).length} message(s) · {formatDate(p.updatedAt)}
                </p>
              </div>
              <MessageCircle size={18} className="shrink-0" style={{ color: 'var(--gold)' }} />
            </div>
          </button>
        ))}
      </div>

      {/* Détail conversation */}
      {selectionne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="card-dark w-full max-w-md max-h-[80vh] flex flex-col animate-fade-in">
            <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--dark-border)' }}>
              <p className="font-bold text-white">Conversation</p>
              <button onClick={() => setSelectionne(null)} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {(selectionne.messages || []).map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap"
                    style={m.role === 'user'
                      ? { background: 'var(--gold)', color: '#060D18' }
                      : { background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)', color: 'white' }}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
