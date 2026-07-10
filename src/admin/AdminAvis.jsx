import { useState, useEffect } from 'react'
import { getTousAvis, modererAvis, supprimerAvis } from '../services/reviewService'
import { Star, Check, X, Trash2, Clock, MessageSquare } from 'lucide-react'

function Etoiles({ note }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={14} fill={i <= note ? '#F6C344' : 'none'}
          style={{ color: i <= note ? '#F6C344' : 'var(--text-muted)' }} />
      ))}
    </div>
  )
}

const STATUT_LABEL = {
  en_attente: { label: 'En attente', color: '#F6C344', bg: 'rgba(246,195,68,0.12)' },
  valide: { label: 'Publié', color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
  rejete: { label: 'Rejeté', color: '#F87171', bg: 'rgba(248,113,113,0.12)' },
}

export default function AdminAvis() {
  const [avis, setAvis] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtre, setFiltre] = useState('en_attente')
  const [message, setMessage] = useState('')

  const flash = (t) => { setMessage(t); setTimeout(() => setMessage(''), 3000) }

  const charger = async () => {
    setLoading(true)
    setAvis(await getTousAvis())
    setLoading(false)
  }
  useEffect(() => { charger() }, [])

  const moderer = async (id, statut) => {
    if (await modererAvis(id, statut)) {
      setAvis(prev => prev.map(a => a.id === id ? { ...a, statut } : a))
      flash(statut === 'valide' ? 'Avis publié sur le site !' : 'Avis mis à jour.')
    }
  }

  const supprimer = async (id) => {
    if (!window.confirm('Supprimer définitivement cet avis ?')) return
    if (await supprimerAvis(id)) {
      setAvis(prev => prev.filter(a => a.id !== id))
      flash('Avis supprimé.')
    }
  }

  const filtres = [
    { id: 'en_attente', label: 'À valider' },
    { id: 'valide', label: 'Publiés' },
    { id: 'rejete', label: 'Rejetés' },
    { id: 'tous', label: 'Tous' },
  ]
  const avisFiltres = filtre === 'tous' ? avis : avis.filter(a => a.statut === filtre)
  const nbEnAttente = avis.filter(a => a.statut === 'en_attente').length

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Avis clients</h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          Validez les avis pour les afficher sur votre site
        </p>
      </div>

      {message && (
        <div className="px-4 py-2.5 rounded-2xl text-sm font-semibold badge-success animate-scale-in">{message}</div>
      )}

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {filtres.map(f => (
          <button key={f.id} onClick={() => setFiltre(f.id)}
            className="px-3 py-2 rounded-xl text-xs font-semibold transition"
            style={{
              background: filtre === f.id ? 'var(--gold)' : 'var(--dark-elevated)',
              color: filtre === f.id ? '#060D18' : 'var(--text-secondary)',
            }}>
            {f.label}
            {f.id === 'en_attente' && nbEnAttente > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]"
                style={{ background: filtre === f.id ? '#060D18' : 'var(--gold)', color: filtre === f.id ? 'var(--gold)' : '#060D18' }}>
                {nbEnAttente}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && <div className="space-y-3">{[1, 2].map(i => <div key={i} className="skeleton-dark h-28 rounded-2xl" />)}</div>}

      {!loading && avisFiltres.length === 0 && (
        <div className="card-dark p-10 text-center">
          <MessageSquare size={34} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-semibold text-white">Aucun avis {filtre === 'en_attente' ? 'à valider' : ''}</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Les avis arrivent quand un chantier est livré et que le client le note.
          </p>
        </div>
      )}

      {!loading && avisFiltres.map(a => {
        const st = STATUT_LABEL[a.statut] || STATUT_LABEL.en_attente
        return (
          <div key={a.id} className="card-dark p-4 animate-fade-in">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="font-bold text-white text-sm">{a.clientNom}</p>
                {a.projetNom && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{a.projetNom}</p>}
              </div>
              <span className="text-[10px] font-bold uppercase px-2 py-1 rounded-full shrink-0"
                style={{ background: st.bg, color: st.color }}>{st.label}</span>
            </div>
            <Etoiles note={a.note} />
            {a.commentaire && <p className="text-sm text-gray-300 mt-2 leading-relaxed">« {a.commentaire} »</p>}

            <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--dark-border)' }}>
              {a.statut !== 'valide' && (
                <button onClick={() => moderer(a.id, 'valide')}
                  className="flex-1 py-2 rounded-xl text-xs font-bold btn-press flex items-center justify-center gap-1"
                  style={{ background: 'rgba(52,211,153,0.12)', color: '#34D399' }}>
                  <Check size={14} /> Publier
                </button>
              )}
              {a.statut !== 'rejete' && (
                <button onClick={() => moderer(a.id, 'rejete')}
                  className="flex-1 py-2 rounded-xl text-xs font-bold btn-press flex items-center justify-center gap-1"
                  style={{ background: 'var(--dark-elevated)', color: 'var(--text-secondary)' }}>
                  <X size={14} /> Rejeter
                </button>
              )}
              <button onClick={() => supprimer(a.id)}
                className="py-2 px-3 rounded-xl btn-press"
                style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171' }}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
