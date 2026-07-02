import { useState, useEffect } from 'react'
import { getTousPortfolio } from '../services/portfolioService'
import { MapPin, Ruler, Clock, Images, X } from 'lucide-react'

function fmtFCFA(n) {
  if (!n) return null
  return Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FCFA'
}

export default function PortfolioClient() {
  const [projets, setProjets] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectionne, setSelectionne] = useState(null)
  const [filtre, setFiltre] = useState('Tous')

  useEffect(() => {
    getTousPortfolio().then(p => { setProjets(p); setLoading(false) })
  }, [])

  const types = ['Tous', ...new Set(projets.map(p => p.type).filter(Boolean))]

  const filtres = filtre === 'Tous' ? projets : projets.filter(p => p.type === filtre)

  if (loading) return (
    <div className="grid grid-cols-2 gap-3 animate-pulse">
      {[1,2,3,4].map(i => <div key={i} className="skeleton-dark h-40 rounded-2xl" />)}
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Images size={24} style={{ color: 'var(--gold)' }} /> Nos Réalisations
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Découvrez nos projets réalisés à Dakar et en Afrique de l'Ouest
        </p>
      </div>

      {/* Filtres par type */}
      {types.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {types.map(t => (
            <button key={t} onClick={() => setFiltre(t)}
              className="px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all"
              style={filtre === t
                ? { background: 'var(--gold)', color: '#060D18' }
                : { background: 'var(--dark-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--dark-border)' }}>
              {t}
            </button>
          ))}
        </div>
      )}

      {filtres.length === 0 && (
        <div className="card-dark p-10 text-center">
          <Images size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-semibold text-white">Aucune réalisation pour le moment</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Revenez bientôt — de nouveaux projets seront ajoutés régulièrement.
          </p>
        </div>
      )}

      {/* Grille galerie */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {filtres.map(p => (
          <button key={p.id} onClick={() => setSelectionne(p)}
            className="card-dark overflow-hidden text-left transition hover:opacity-90 active:scale-95">
            {/* Image */}
            <div className="aspect-video w-full overflow-hidden bg-[#0C1829]">
              {p.photos?.[0]
                ? <img src={p.photos[0]} alt={p.titre} className="w-full h-full object-cover" loading="lazy" />
                : <div className="w-full h-full flex items-center justify-center">
                    <Images size={24} style={{ color: 'var(--text-muted)' }} />
                  </div>
              }
            </div>
            {/* Infos */}
            <div className="p-3">
              <p className="text-sm font-semibold text-white truncate">{p.titre}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--gold)' }}>{p.type}</p>
              {p.localisation && (
                <p className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                  <MapPin size={10} />{p.localisation}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Modale détail */}
      {selectionne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}
          onClick={() => setSelectionne(null)}>
          <div className="card-dark w-full max-w-md max-h-[85vh] flex flex-col animate-fade-in"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 shrink-0"
              style={{ borderBottom: '1px solid var(--dark-border)' }}>
              <p className="font-bold text-white truncate">{selectionne.titre}</p>
              <button onClick={() => setSelectionne(null)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Photos */}
              {selectionne.photos?.length > 0 && (
                <div className="flex gap-2 p-3 overflow-x-auto">
                  {selectionne.photos.map((url, i) => (
                    <img key={i} src={url} alt=""
                      className="h-40 w-56 object-cover rounded-xl shrink-0"
                      loading="lazy" />
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="p-4 grid grid-cols-2 gap-2">
                <div className="card-dark p-3">
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Type</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{selectionne.type || '—'}</p>
                </div>
                <div className="card-dark p-3">
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Année</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{selectionne.annee || '—'}</p>
                </div>
                {selectionne.localisation && (
                  <div className="card-dark p-3">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Localisation</p>
                    <p className="text-sm font-semibold text-white mt-0.5">{selectionne.localisation}</p>
                  </div>
                )}
                {selectionne.surfaceM2 > 0 && (
                  <div className="card-dark p-3">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Surface</p>
                    <p className="text-sm font-semibold text-white mt-0.5">{selectionne.surfaceM2} m²</p>
                  </div>
                )}
                {selectionne.dureeJours > 0 && (
                  <div className="card-dark p-3">
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Durée</p>
                    <p className="text-sm font-semibold text-white mt-0.5">{selectionne.dureeJours} jours</p>
                  </div>
                )}
              </div>

              {selectionne.notes && (
                <div className="px-4 pb-4">
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{selectionne.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
