import { useState, useEffect, useMemo, useRef } from 'react'
import SearchBar from '../components/SearchBar'
import { getTousProjets, creerProjet, changerEtape, ajouterPhoto, uploadPhotoFichier, ETAPES_CHANTIER } from '../services/projectService'
import { getTousDevis } from '../services/quoteService'
import { Building2, Plus, ChevronRight, ChevronLeft, Camera, Upload, X } from 'lucide-react'

export default function AdminProjets() {
  const [projets, setProjets] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({ clientId: '', clientEmail: '', name: '', type: '', surface: '', montant: '', dateDebut: '', notes: '' })

  const charger = async () => {
    setLoading(true)
    const [projs, devis] = await Promise.all([getTousProjets(), getTousDevis()])
    setProjets(projs)
    const map = {}
    devis.forEach(d => { const cle = d.clientId; if (cle && !map[cle]) map[cle] = { clientId: d.clientId, clientEmail: d.clientEmail || cle } })
    setClients(Object.values(map))
    setLoading(false)
  }
  useEffect(() => { charger() }, [])

  const flash = (t) => { setMessage(t); setTimeout(() => setMessage(''), 3000) }

  const handleCreer = async () => {
    if (!form.clientId || !form.name) { flash('Choisissez un client et un nom'); return }
    const client = clients.find(c => c.clientId === form.clientId)
    const p = await creerProjet(form.clientId, client?.clientEmail || '', form)
    if (p) { setProjets(prev => [p, ...prev]); setShowForm(false); setForm({ clientId: '', clientEmail: '', name: '', type: '', surface: '', montant: '', dateDebut: '', notes: '' }); flash('Projet créé !') }
  }

  const avancer = async (p, delta) => {
    const newIndex = Math.max(0, Math.min(ETAPES_CHANTIER.length - 1, p.etapeIndex + delta))
    if (await changerEtape(p.id, newIndex)) {
      setProjets(prev => prev.map(x => x.id === p.id ? { ...x, etapeIndex: newIndex } : x))
      setSelected(s => s?.id === p.id ? { ...s, etapeIndex: newIndex } : s)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !selected) return
    if (file.size > 5 * 1024 * 1024) { flash('Image trop grande (max 5 MB)'); e.target.value = ''; return }
    setUploading(true)
    const url = await uploadPhotoFichier(selected, file)
    setUploading(false)
    if (url) {
      const maj = { ...selected, photos: [...(selected.photos || []), url] }
      setProjets(prev => prev.map(x => x.id === selected.id ? maj : x)); setSelected(maj); flash('Photo ajoutée !')
    } else flash('Erreur upload')
    e.target.value = ''
  }

  const filteredProjets = useMemo(() => {
    if (!search.trim()) return projets
    const q = search.trim().toLowerCase()
    return projets.filter(p => (p.name || '').toLowerCase().includes(q) || (p.clientEmail || '').toLowerCase().includes(q))
  }, [projets, search])

  const inputDark = "w-full px-4 py-3 rounded-xl text-sm text-white outline-none bg-[#111F35] border border-[rgba(255,255,255,0.06)] placeholder-[#4A5B73] focus:border-[#F6C344]"

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div className="flex justify-between items-center gap-3 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Gérer Projets</h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Chantiers en cours</p>
        </div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2.5 rounded-xl font-semibold text-sm btn-press flex items-center gap-2"
          style={{ background: 'var(--gold)', color: '#060D18' }}>
          <Plus size={16} strokeWidth={2.5}/> Nouveau
        </button>
      </div>

      {message && <div className="px-4 py-2.5 rounded-xl text-sm font-semibold badge-success animate-scale-in">{message}</div>}

      {loading && <div className="space-y-3">{[1,2].map(i => <div key={i} className="skeleton-dark h-28 rounded-2xl" />)}</div>}

      {!loading && projets.length === 0 && (
        <div className="card-dark p-10 text-center">
          <Building2 size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-semibold text-white">Aucun projet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Cliquez sur "Nouveau" pour démarrer.</p>
        </div>
      )}

      {!loading && projets.length > 0 && (
        <>
          <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un projet..." dark />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredProjets.map((p, i) => (
              <div key={p.id} className="card-dark p-4 space-y-3 animate-fade-in" style={{ opacity: 0, animationDelay: `${i * 60}ms` }}>
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white truncate">{p.name}</h3>
                    <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{p.clientEmail}</p>
                  </div>
                  <span className="badge-info px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap">
                    {ETAPES_CHANTIER[p.etapeIndex]}
                  </span>
                </div>
                <button onClick={() => setSelected(p)} className="w-full py-2.5 rounded-xl font-semibold text-sm transition btn-press"
                  style={{ background: 'var(--dark-elevated)', color: 'var(--gold)', border: '1px solid var(--dark-border)' }}>
                  Gérer ce projet
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal Nouveau projet */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" style={{ animationDuration: '0.2s' }}>
          <div className="rounded-2xl max-w-lg w-full max-h-[88vh] overflow-y-auto p-5 space-y-3 dark-scrollbar"
            style={{ background: 'var(--dark-surface)', border: '1px solid var(--dark-border)' }}>
            <div className="flex justify-between items-center mb-1">
              <h2 className="text-lg font-bold text-white">Nouveau projet</h2>
              <button onClick={() => setShowForm(false)} className="btn-press" style={{ color: 'var(--text-muted)' }}><X size={20}/></button>
            </div>
            <select value={form.clientId} onChange={e => setForm({...form, clientId: e.target.value})} className={inputDark}>
              <option value="">-- Choisir un client --</option>
              {clients.map(c => <option key={c.clientId} value={c.clientId}>{c.clientEmail}</option>)}
            </select>
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nom du projet" className={inputDark} />
            <input value={form.type} onChange={e => setForm({...form, type: e.target.value})} placeholder="Type de travaux" className={inputDark} />
            <div className="flex gap-3">
              <input value={form.surface} onChange={e => setForm({...form, surface: e.target.value})} type="number" placeholder="Surface m²" className={inputDark} />
              <input value={form.montant} onChange={e => setForm({...form, montant: e.target.value})} type="number" placeholder="Montant FCFA" className={inputDark} />
            </div>
            <input value={form.dateDebut} onChange={e => setForm({...form, dateDebut: e.target.value})} type="date" className={inputDark} />
            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Notes" rows="2" className={inputDark} />
            <button onClick={handleCreer} className="w-full py-3 rounded-xl font-semibold btn-press" style={{ background: 'var(--gold)', color: '#060D18' }}>Créer le projet</button>
          </div>
        </div>
      )}

      {/* Modal Gestion projet */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" style={{ animationDuration: '0.2s' }}>
          <div className="rounded-2xl max-w-lg w-full max-h-[88vh] overflow-y-auto p-5 space-y-4 dark-scrollbar"
            style={{ background: 'var(--dark-surface)', border: '1px solid var(--dark-border)' }}>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">{selected.name}</h2>
              <button onClick={() => setSelected(null)} className="btn-press" style={{ color: 'var(--text-muted)' }}><X size={20}/></button>
            </div>

            {/* Étape */}
            <div className="rounded-xl p-4 text-center" style={{ background: 'var(--dark-elevated)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Étape actuelle</p>
              <p className="text-lg font-bold mt-1" style={{ color: 'var(--gold)' }}>{ETAPES_CHANTIER[selected.etapeIndex]}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => avancer(selected, -1)} disabled={selected.etapeIndex === 0}
                  className="flex-1 py-2 rounded-xl font-semibold text-sm disabled:opacity-30 btn-press flex items-center justify-center gap-1"
                  style={{ background: 'var(--dark-surface)', color: 'var(--text-secondary)' }}>
                  <ChevronLeft size={16}/> Reculer
                </button>
                <button onClick={() => avancer(selected, 1)} disabled={selected.etapeIndex === ETAPES_CHANTIER.length - 1}
                  className="flex-1 py-2 rounded-xl font-semibold text-sm disabled:opacity-30 btn-press flex items-center justify-center gap-1"
                  style={{ background: 'var(--gold)', color: '#060D18' }}>
                  Avancer <ChevronRight size={16}/>
                </button>
              </div>
            </div>

            {/* Upload photo */}
            <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--dark-elevated)', border: '1px solid rgba(246,195,68,0.2)' }}>
              <div className="flex items-center gap-2">
                <Camera size={16} style={{ color: 'var(--gold)' }} />
                <p className="text-sm font-semibold" style={{ color: 'var(--gold)' }}>Ajouter une photo</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" />
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className="w-full py-3 rounded-xl font-semibold text-sm btn-press disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'var(--gold)', color: '#060D18' }}>
                {uploading ? (
                  <><div className="animate-spin h-4 w-4 border-2 border-[#060D18] border-t-transparent rounded-full" /> Upload en cours...</>
                ) : (
                  <><Upload size={16}/> Choisir une photo</>
                )}
              </button>
              <p className="text-[11px] text-center" style={{ color: 'var(--text-muted)' }}>Caméra ou galerie — max 5 MB</p>
            </div>

            {/* Photos */}
            {selected.photos?.length > 0 && (
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Photos ({selected.photos.length})</p>
                <div className="grid grid-cols-3 gap-2">
                  {selected.photos.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer">
                      <img src={url} alt={`photo ${i+1}`} className="w-full h-20 object-cover rounded-lg" loading="lazy"
                        onError={(e) => { e.target.style.display='none'; e.target.parentElement.innerHTML='<div class="w-full h-20 rounded-lg flex items-center justify-center text-[10px]" style="background:var(--dark-elevated);color:var(--text-muted)">Erreur</div>' }} />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => setSelected(null)} className="w-full py-2.5 rounded-xl font-semibold text-sm btn-press"
              style={{ background: 'var(--dark-elevated)', color: 'var(--text-secondary)' }}>Fermer</button>
          </div>
        </div>
      )}
    </div>
  )
}
