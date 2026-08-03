import { useState, useEffect } from 'react'
import { ajouterPortfolio, getTousPortfolio, supprimerPortfolio } from '../services/portfolioService'
import { uploadImagePublique } from '../utils/imageUpload'
import { Images, Plus, X, Trash2, MapPin, Ruler, DollarSign, Clock, Camera } from 'lucide-react'

const ic = "w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-[#4A5B73] outline-none bg-[#0C1829] border border-[rgba(255,255,255,0.06)]"

function fmtFCFA(n) {
  return Math.round(Number(n)||0).toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ') + ' FCFA'
}

const TYPES = ['Faux plafond BA13','Cloison sèche','Peinture décoration','Doublage mural','Corniches','Rénovation complète','Autre']

export default function AdminPortfolio() {
  const [projets, setProjets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [msg, setMsg] = useState('')
  const [uploading, setUploading] = useState(false)
  const [selectionne, setSelectionne] = useState(null)
  const [form, setForm] = useState({ titre: '', type: TYPES[0], localisation: '', surfaceM2: '', cout: '', dureeJours: '', annee: new Date().getFullYear(), photos: [], notes: '' })

  const flash = t => { setMsg(t); setTimeout(() => setMsg(''), 3000) }
  const charger = async () => { setLoading(true); setProjets(await getTousPortfolio()); setLoading(false) }
  useEffect(() => { charger() }, [])

  const ajouterPhotos = async (e) => {
    const fichiers = Array.from(e.target.files || []).slice(0, 6 - form.photos.length)
    setUploading(true)
    const urls = []
    for (const f of fichiers) { const url = await uploadImagePublique(f); if(url) urls.push(url) }
    setForm(prev => ({ ...prev, photos: [...prev.photos, ...urls] }))
    setUploading(false)
  }

  const ajouter = async () => {
    if (!form.titre) { flash('Titre requis'); return }
    const p = await ajouterPortfolio(form)
    if (p) {
      setProjets(prev => [p, ...prev])
      setShowForm(false)
      setForm({ titre: '', type: TYPES[0], localisation: '', surfaceM2: '', cout: '', dureeJours: '', annee: new Date().getFullYear(), photos: [], notes: '' })
      flash('Projet ajouté au portfolio')
    }
  }

  const supprimer = async (id) => {
    if (!window.confirm('Supprimer ce projet ?')) return
    if (await supprimerPortfolio(id)) { setProjets(prev => prev.filter(p => p.id !== id)); setSelectionne(null); flash('Supprimé') }
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
            <Images size={26} style={{ color: 'var(--gold)' }} /> Portfolio
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {projets.length} projet(s) réalisé(s) — référencés aussi dans la base IA
          </p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold btn-press"
          style={{ background: 'var(--gold)', color: '#060D18' }}>
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {msg && <div className="px-4 py-2.5 rounded-2xl text-sm font-semibold badge-success">{msg}</div>}

      {loading && <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{[1,2,3].map(i => <div key={i} className="skeleton-dark h-40 rounded-2xl" />)}</div>}

      {!loading && projets.length === 0 && (
        <div className="card-dark p-10 text-center">
          <Images size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-semibold text-white">Portfolio vide</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Ajoute tes projets réalisés pour les montrer aux clients et enrichir l'IA.</p>
        </div>
      )}

      {!loading && projets.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {projets.map(p => (
            <button key={p.id} onClick={() => setSelectionne(p)} className="card-dark overflow-hidden text-left transition hover:opacity-90">
              <div className="aspect-video w-full overflow-hidden" style={{ background: 'var(--dark-elevated)' }}>
                {p.photos?.[0]
                  ? <img src={p.photos[0]} alt={p.titre} loading="lazy" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><Images size={24} style={{ color: 'var(--text-muted)' }} /></div>}
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-white truncate">{p.titre}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{p.type} · {p.annee}</p>
                {p.localisation && <p className="text-xs" style={{ color: 'var(--text-muted)' }}><MapPin size={10} className="inline mr-0.5" />{p.localisation}</p>}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Détail projet */}
      {selectionne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="card-dark w-full max-w-md max-h-[85vh] flex flex-col animate-fade-in">
            <div className="flex items-center justify-between p-4 shrink-0" style={{ borderBottom: '1px solid var(--dark-border)' }}>
              <p className="font-bold text-white truncate">{selectionne.titre}</p>
              <button onClick={() => setSelectionne(null)} aria-label="Fermer" className="p-2.5 -m-2.5" style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selectionne.photos?.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  {selectionne.photos.map((url, i) => <img key={i} src={url} alt={`${selectionne.titre || 'Photo du projet'} ${i + 1}`} className="h-28 w-40 object-cover rounded-xl shrink-0" />)}
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 text-sm">
                {selectionne.localisation && <div className="card-dark p-2.5"><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Localisation</p><p className="font-semibold text-white">{selectionne.localisation}</p></div>}
                {selectionne.surfaceM2 > 0 && <div className="card-dark p-2.5"><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Surface</p><p className="font-semibold text-white">{selectionne.surfaceM2} m²</p></div>}
                {selectionne.cout > 0 && <div className="card-dark p-2.5"><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Coût</p><p className="font-semibold text-white">{fmtFCFA(selectionne.cout)}</p></div>}
                {selectionne.dureeJours > 0 && <div className="card-dark p-2.5"><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Durée</p><p className="font-semibold text-white">{selectionne.dureeJours} jours</p></div>}
              </div>
              {selectionne.notes && <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{selectionne.notes}</p>}
              <button onClick={() => supprimer(selectionne.id)} className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2" style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171' }}>
                <Trash2 size={15} /> Supprimer ce projet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire modale */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="card-dark p-5 w-full max-w-md max-h-[85vh] flex flex-col animate-fade-in">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <p className="font-bold text-white">Nouveau projet</p>
              <button onClick={() => setShowForm(false)} aria-label="Fermer" className="p-2.5 -m-2.5" style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3">
              <input value={form.titre} onChange={e => setForm({...form, titre: e.target.value})} placeholder="Titre du projet (ex: Faux plafond Villa X)" className={ic} />
              <div className="grid grid-cols-2 gap-2">
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className={ic}>
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
                <input type="number" value={form.annee} onChange={e => setForm({...form, annee: e.target.value})} placeholder="Année" className={ic} />
              </div>
              <input value={form.localisation} onChange={e => setForm({...form, localisation: e.target.value})} placeholder="Localisation (ex: Almadies, Dakar)" className={ic} />
              <div className="grid grid-cols-3 gap-2">
                <input type="number" value={form.surfaceM2} onChange={e => setForm({...form, surfaceM2: e.target.value})} placeholder="Surface m²" className={ic} />
                <input type="number" value={form.cout} onChange={e => setForm({...form, cout: e.target.value})} placeholder="Coût FCFA" className={ic} />
                <input type="number" value={form.dureeJours} onChange={e => setForm({...form, dureeJours: e.target.value})} placeholder="Durée j." className={ic} />
              </div>
              <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} placeholder="Notes ou description..." className={ic + ' resize-none'} />
              <label className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium cursor-pointer" style={{ background: 'var(--dark-elevated)', border: '1px dashed var(--dark-border-strong)', color: 'var(--text-secondary)' }}>
                <Camera size={16} /> {uploading ? 'Upload...' : `Photos (${form.photos.length}/6)`}
                <input type="file" accept="image/*" multiple className="hidden" onChange={ajouterPhotos} disabled={uploading || form.photos.length >= 6} />
              </label>
              {form.photos.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {form.photos.map((url, i) => (
                    <div key={i} className="relative w-16 h-16">
                      <img src={url} className="w-full h-full object-cover rounded-lg" alt="" />
                      <button type="button" onClick={() => setForm(prev => ({ ...prev, photos: prev.photos.filter((_,j) => j !== i) }))}
                        aria-label="Retirer cette photo"
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#F87171' }}>
                        <X size={10} color="white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={ajouter} className="mt-3 w-full py-2.5 rounded-xl font-semibold btn-press shrink-0" style={{ background: 'var(--gold)', color: '#060D18' }}>
              Enregistrer dans le portfolio
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
