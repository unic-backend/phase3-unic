import { useState, useEffect, useRef } from 'react'
import {
  publierStory, getToutesStories, supprimerStory, ACTIONS_STORY, verifierDureeVideo,
} from '../services/storyService'
import {
  Clapperboard, Plus, X, Trash2, Eye, MousePointerClick, Image as ImageIcon,
  Film, Clock, Send, Check,
} from 'lucide-react'

// Types de projets, pour lier une story à un devis pré-rempli
const TYPES_PROJET = [
  { id: '', label: 'Aucun (général)' },
  { id: 'faux-plafond', label: 'Faux plafond BA13' },
  { id: 'cloison', label: 'Cloison sèche' },
  { id: 'peinture', label: 'Peinture décoration' },
  { id: 'doublage', label: 'Doublage mural' },
  { id: 'corniche', label: 'Corniches décoratives' },
  { id: 'renovation', label: 'Rénovation complète' },
]

function tempsRestant(expiresAt) {
  const exp = expiresAt?.toMillis ? expiresAt.toMillis() : 0
  const diff = exp - Date.now()
  if (diff <= 0) return 'Expirée'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  return h > 0 ? `${h}h ${m}min restantes` : `${m}min restantes`
}

export default function AdminStories() {
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [isVideo, setIsVideo] = useState(false)
  const [texte, setTexte] = useState('')
  const [actionType, setActionType] = useState('je-veux-ca')
  const [projetType, setProjetType] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [message, setMessage] = useState('')
  const [detailOuvert, setDetailOuvert] = useState(null) // id de la story dépliée
  const fileRef = useRef(null)

  const flash = (t) => { setMessage(t); setTimeout(() => setMessage(''), 3500) }

  const charger = async () => {
    setLoading(true)
    setStories(await getToutesStories())
    setLoading(false)
  }
  useEffect(() => { charger() }, [])

  const choisirFichier = async (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    const vid = f.type.startsWith('video/')
    if (vid) {
      try { await verifierDureeVideo(f) }
      catch (err) { flash(err.message); return }
    }
    setFile(f)
    setIsVideo(vid)
    setPreview(URL.createObjectURL(f))
  }

  const publier = async () => {
    if (!file) { flash('Choisis une photo ou une vidéo.'); return }
    setPublishing(true)
    try {
      await publierStory(file, { texte, actionType, projetType })
      flash('Story publiée ! Tous tes clients vont la voir.')
      setShowForm(false)
      setFile(null); setPreview(null); setTexte(''); setActionType('je-veux-ca'); setProjetType('')
      await charger()
    } catch (err) {
      flash(err.message || 'Erreur lors de la publication.')
    }
    setPublishing(false)
  }

  const supprimer = async (s) => {
    if (!window.confirm('Supprimer cette story définitivement ?')) return
    if (await supprimerStory(s.id)) {
      setStories(prev => prev.filter(x => x.id !== s.id))
      flash('Story supprimée.')
    } else {
      flash('Suppression impossible.')
    }
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex justify-between items-center animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Stories</h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Publie des moments que tous tes clients verront (24h)</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="px-4 py-2.5 rounded-xl font-semibold text-sm btn-press flex items-center gap-2"
          style={{ background: showForm ? 'var(--dark-elevated)' : 'var(--gold)', color: showForm ? 'var(--text-secondary)' : '#060D18' }}>
          {showForm ? <><X size={16}/> Annuler</> : <><Plus size={16} strokeWidth={2.5}/> Publier</>}
        </button>
      </div>

      {message && (
        <div className="px-4 py-2.5 rounded-2xl text-sm font-semibold badge-success animate-scale-in">{message}</div>
      )}

      {/* Formulaire de publication */}
      {showForm && (
        <div className="card-glass p-5 space-y-4 animate-fade-in">
          {/* Zone média */}
          {!preview ? (
            <button onClick={() => fileRef.current?.click()}
              className="w-full py-10 rounded-2xl flex flex-col items-center gap-3 transition"
              style={{ background: 'var(--dark-elevated)', border: '2px dashed var(--dark-border)' }}>
              <div className="flex gap-3">
                <ImageIcon size={28} style={{ color: 'var(--gold)' }} />
                <Film size={28} style={{ color: 'var(--gold)' }} />
              </div>
              <p className="text-sm font-semibold text-white">Choisir une photo ou une vidéo</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Photo compressée automatiquement · Vidéo max 30s</p>
            </button>
          ) : (
            <div className="relative rounded-2xl overflow-hidden" style={{ background: '#000' }}>
              {isVideo
                ? <video src={preview} className="w-full max-h-80 object-contain" controls />
                : <img src={preview} alt="Aperçu" className="w-full max-h-80 object-contain" />}
              <button onClick={() => { setFile(null); setPreview(null) }}
                className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-lg"
                style={{ background: 'rgba(0,0,0,0.6)', color: 'white' }}>
                <X size={18} />
              </button>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*,video/*" onChange={choisirFichier} className="hidden" />

          {/* Texte */}
          <div>
            <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Légende (optionnel)</label>
            <input value={texte} onChange={e => setTexte(e.target.value)} maxLength={200}
              placeholder="Ex : Faux plafond avec spots LED, livré à Mermoz ✨"
              className="w-full mt-1.5 px-4 py-3 rounded-xl text-sm text-white outline-none"
              style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }} />
          </div>

          {/* Bouton d'action */}
          <div>
            <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Bouton d'action affiché aux clients</label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              {ACTIONS_STORY.map(a => (
                <button key={a.id} onClick={() => setActionType(a.id)}
                  className="px-3 py-2.5 rounded-xl text-sm font-semibold transition text-left flex items-center gap-2"
                  style={{
                    background: actionType === a.id ? 'rgba(246,195,68,0.12)' : 'var(--dark-elevated)',
                    border: `1px solid ${actionType === a.id ? 'var(--gold)' : 'var(--dark-border)'}`,
                    color: actionType === a.id ? 'var(--gold)' : 'var(--text-secondary)',
                  }}>
                  <span>{a.emoji}</span> {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Type de projet (pour pré-remplir le devis) */}
          {(actionType === 'je-veux-ca' || actionType === 'devis') && (
            <div>
              <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Type de projet lié (pré-remplit le devis du client)</label>
              <select value={projetType} onChange={e => setProjetType(e.target.value)}
                className="w-full mt-1.5 px-4 py-3 rounded-xl text-sm text-white outline-none"
                style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }}>
                {TYPES_PROJET.map(t => <option key={t.id} value={t.id} style={{ background: '#0C1829' }}>{t.label}</option>)}
              </select>
            </div>
          )}

          <button onClick={publier} disabled={publishing || !file}
            className="w-full py-3 rounded-xl font-bold text-sm btn-press disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: 'var(--gold)', color: '#060D18' }}>
            <Send size={16} /> {publishing ? 'Publication…' : 'Publier la story'}
          </button>
        </div>
      )}

      {/* Liste des stories */}
      {loading && <div className="space-y-3">{[1,2].map(i => <div key={i} className="skeleton-dark h-28 rounded-2xl" />)}</div>}

      {!loading && stories.length === 0 && (
        <div className="card-dark p-10 text-center">
          <Clapperboard size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-semibold text-white">Aucune story</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Publie ta première story pour attirer tes clients.</p>
        </div>
      )}

      {!loading && stories.map(s => {
        const action = ACTIONS_STORY.find(a => a.id === s.actionType)
        const estOuvert = detailOuvert === s.id
        const vuesDetail = (s.vuesDetail || []).slice().sort((a, b) => (b.date || 0) - (a.date || 0))
        const clicsDetail = (s.clicsDetail || []).slice().sort((a, b) => (b.date || 0) - (a.date || 0))
        const clicIds = new Set(clicsDetail.map(c => c.userId))
        const fmtHeure = (ts) => ts ? new Date(ts).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''
        return (
          <div key={s.id} className="card-dark p-3 animate-fade-in" style={{ opacity: s.expiree ? 0.6 : 1 }}>
            <div className="flex gap-3">
              <div className="w-20 h-24 rounded-xl overflow-hidden shrink-0" style={{ background: '#000' }}>
                {s.mediaType === 'video'
                  ? <video src={s.mediaUrl} className="w-full h-full object-cover" muted />
                  : <img src={s.mediaUrl} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  {s.mediaType === 'video' ? <Film size={13} style={{ color: 'var(--gold)' }}/> : <ImageIcon size={13} style={{ color: 'var(--gold)' }}/>}
                  <span className="text-xs font-semibold" style={{ color: s.expiree ? '#F87171' : '#34D399' }}>
                    <Clock size={11} className="inline mb-0.5" /> {s.expiree ? 'Expirée' : tempsRestant(s.expiresAt)}
                  </span>
                </div>
                {s.texte && <p className="text-sm text-white truncate">{s.texte}</p>}
                {action && action.id !== 'aucun' && (
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Bouton : {action.emoji} {action.label}</p>
                )}
                {/* Stats cliquables → ouvrent le détail "qui a vu" */}
                <button onClick={() => setDetailOuvert(estOuvert ? null : s.id)}
                  className="flex gap-4 mt-2 btn-press">
                  <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                    <Eye size={13} /> {s.vues || 0} vues
                  </span>
                  <span className="text-xs flex items-center gap-1" style={{ color: 'var(--gold)' }}>
                    <MousePointerClick size={13} /> {s.clics || 0} clics
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{estOuvert ? '▲' : '▼'}</span>
                </button>
              </div>
              <button onClick={() => supprimer(s)} className="p-2 rounded-lg self-start shrink-0"
                style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171' }} aria-label="Supprimer">
                <Trash2 size={15} />
              </button>
            </div>

            {/* Panneau détaillé — qui a vu, façon WhatsApp */}
            {estOuvert && (
              <div className="mt-3 pt-3 space-y-2" style={{ borderTop: '1px solid var(--dark-border)' }}>
                {vuesDetail.length === 0 ? (
                  <p className="text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>
                    Personne n'a encore vu cette story.
                  </p>
                ) : (
                  <>
                    <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                      Vu par {vuesDetail.length} personne{vuesDetail.length > 1 ? 's' : ''}
                    </p>
                    {vuesDetail.map((v, i) => {
                      const aClique = clicIds.has(v.userId)
                      return (
                        <div key={i} className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                            style={{ background: 'rgba(96,165,250,0.15)', color: '#60A5FA' }}>
                            {(v.nom || 'C').charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">{v.nom || 'Client'}</p>
                            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{fmtHeure(v.date)}</p>
                          </div>
                          {aClique && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1"
                              style={{ background: 'rgba(246,195,68,0.12)', color: 'var(--gold)' }}>
                              <MousePointerClick size={10} /> A cliqué
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
