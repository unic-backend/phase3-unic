import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getProjetsClient, ETAPES_CHANTIER } from '../services/projectService'
import { Building2, CheckCircle2, Circle, Calendar, Ruler, Wallet, X } from 'lucide-react'

export default function Projets() {
  const { user } = useAuth()
  const [projets, setProjets] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    let actif = true
    async function charger() { if (!user?.id) { setLoading(false); return }; const list = await getProjetsClient(user.id); if (actif) { setProjets(list); setLoading(false) } }
    charger(); return () => { actif = false }
  }, [user])

  const progress = (i) => Math.round(((i + 1) / ETAPES_CHANTIER.length) * 100)

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="animate-fade-in"><h1 className="text-2xl md:text-3xl font-bold text-white">Mes Projets</h1><p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Suivi en temps réel</p></div>

      {loading && <div className="space-y-3">{[1,2].map(i => <div key={i} className="skeleton-dark h-28 rounded-2xl" />)}</div>}

      {!loading && projets.length === 0 && (
        <div className="card-dark p-10 text-center"><Building2 size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} /><p className="font-semibold text-white">Aucun projet</p><p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Vos chantiers apparaîtront ici.</p></div>
      )}

      {!loading && projets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {projets.map((p, i) => (
            <button key={p.id} onClick={() => setSelected(p)} className="card-dark p-4 text-left space-y-3 btn-press animate-fade-in" style={{ opacity: 0, animationDelay: `${i * 60}ms` }}>
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-semibold text-white">{p.name}</h3>
                <span className="badge-info px-2.5 py-1 rounded-full text-[11px] font-semibold">{ETAPES_CHANTIER[p.etapeIndex]}</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--dark-elevated)' }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${progress(p.etapeIndex)}%`, background: 'linear-gradient(90deg, var(--gold-dim), var(--gold))' }} />
              </div>
              <p className="text-xs" style={{ color: 'var(--gold)' }}>{progress(p.etapeIndex)}% complété</p>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" style={{ animationDuration: '0.2s' }}>
          <div className="rounded-2xl max-w-lg w-full max-h-[88vh] overflow-y-auto p-5 space-y-4 dark-scrollbar" style={{ background: 'var(--dark-surface)', border: '1px solid var(--dark-border)' }}>
            <div className="flex justify-between items-start"><h2 className="text-lg font-bold text-white">{selected.name}</h2><button onClick={() => setSelected(null)} style={{ color: 'var(--text-muted)' }}><X size={20}/></button></div>
            <div className="grid grid-cols-3 gap-2">
              {[{ icon: Ruler, label: 'Surface', val: `${selected.surface} m²` }, { icon: Wallet, label: 'Montant', val: (selected.montant || 0).toLocaleString('fr-FR') }, { icon: Calendar, label: 'Début', val: selected.dateDebut || '-' }].map((d, i) => (
                <div key={i} className="rounded-xl p-3 text-center" style={{ background: 'var(--dark-elevated)' }}>
                  <d.icon size={16} className="mx-auto mb-1" style={{ color: 'var(--gold)' }} /><p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{d.label}</p><p className="text-xs font-semibold text-white">{d.val}</p>
                </div>
              ))}
            </div>
            <div><p className="text-xs font-semibold text-white mb-2">Avancement</p>
              <div className="space-y-2">
                {ETAPES_CHANTIER.map((etape, i) => {
                  const fait = i <= selected.etapeIndex
                  return <div key={i} className="flex items-center gap-2.5">{fait ? <CheckCircle2 size={18} className="text-emerald-400 shrink-0" /> : <Circle size={18} className="shrink-0" style={{ color: 'var(--text-muted)' }} />}<span className="text-sm" style={{ color: fait ? 'white' : 'var(--text-muted)', fontWeight: fait ? 500 : 400 }}>{etape}</span></div>
                })}
              </div>
            </div>
            {selected.photos?.length > 0 && (<div><p className="text-xs font-semibold text-white mb-2">Photos</p><div className="grid grid-cols-3 gap-2">{selected.photos.map((url, i) => <a key={i} href={url} target="_blank" rel="noreferrer"><img src={url} alt={`photo ${i+1}`} className="w-full h-20 object-cover rounded-lg" loading="lazy" onError={e => { e.target.style.display='none' }} /></a>)}</div></div>)}
            {selected.notes && <div className="rounded-xl p-3" style={{ background: 'var(--dark-elevated)' }}><p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Notes</p><p className="text-xs text-white mt-1">{selected.notes}</p></div>}
            <button onClick={() => setSelected(null)} className="w-full py-2.5 rounded-xl font-semibold text-sm btn-press" style={{ background: 'var(--dark-elevated)', color: 'var(--text-secondary)' }}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  )
}
