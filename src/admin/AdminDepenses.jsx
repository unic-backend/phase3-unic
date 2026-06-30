import { useState, useEffect, useMemo } from 'react'
import { ajouterDepense, getToutesDepenses, supprimerDepense, CATEGORIES_DEPENSE } from '../services/depenseService'
import { getTousProjets } from '../services/projectService'
import { Receipt, Plus, Trash2, X, Check, Filter } from 'lucide-react'

const ic = "w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-[#4A5B73] outline-none bg-[#0C1829] border border-[rgba(255,255,255,0.06)]"

function fmtFCFA(n) {
  return Math.round(Number(n)||0).toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ') + ' FCFA'
}

const COULEURS_CAT = { 'Matériaux':'#F2C200','Transport':'#60A5FA','Carburant':'#FB923C','Salaires':'#34D399','Outillage':'#A78BFA','Sous-traitance':'#F87171','Frais admin':'#38BDF8','Autre':'#9CA3AF' }

export default function AdminDepenses() {
  const [depenses, setDepenses] = useState([])
  const [projets, setProjets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [msg, setMsg] = useState('')
  const [filtreCat, setFiltreCat] = useState('Toutes')
  const [filtreProjet, setFiltreProjet] = useState('')
  const [form, setForm] = useState({ libelle: '', categorie: CATEGORIES_DEPENSE[0], montant: '', projetId: '', date: new Date().toISOString().slice(0,10), notes: '' })

  const flash = t => { setMsg(t); setTimeout(() => setMsg(''), 3000) }

  const charger = async () => {
    setLoading(true)
    const [d, p] = await Promise.all([getToutesDepenses(), getTousProjets()])
    setDepenses(d); setProjets(p); setLoading(false)
  }
  useEffect(() => { charger() }, [])

  const ajouter = async () => {
    if (!form.libelle || !form.montant) { flash('Libellé et montant requis'); return }
    const projetNom = projets.find(p => p.id === form.projetId)?.name || ''
    const d = await ajouterDepense({ ...form, projetNom })
    if (d) { setDepenses(prev => [d, ...prev]); setShowForm(false); setForm({ libelle: '', categorie: CATEGORIES_DEPENSE[0], montant: '', projetId: '', date: new Date().toISOString().slice(0,10), notes: '' }); flash('Dépense ajoutée') }
  }

  const supprimer = async (id) => {
    if (!window.confirm('Supprimer cette dépense ?')) return
    if (await supprimerDepense(id)) { setDepenses(prev => prev.filter(d => d.id !== id)); flash('Supprimée') }
  }

  const depensesFiltrees = useMemo(() => depenses
    .filter(d => filtreCat === 'Toutes' || d.categorie === filtreCat)
    .filter(d => !filtreProjet || d.projetId === filtreProjet),
  [depenses, filtreCat, filtreProjet])

  const totalFiltre = depensesFiltrees.reduce((s,d) => s + (d.montant||0), 0)
  const totalGlobal = depenses.reduce((s,d) => s + (d.montant||0), 0)

  const statsCat = useMemo(() => {
    const map = {}
    depenses.forEach(d => { map[d.categorie] = (map[d.categorie]||0) + (d.montant||0) })
    return Object.entries(map).sort((a,b) => b[1]-a[1])
  }, [depenses])

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
            <Receipt size={26} style={{ color: 'var(--gold)' }} /> Dépenses
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Total global : <span className="font-bold" style={{ color: 'var(--gold)' }}>{fmtFCFA(totalGlobal)}</span>
          </p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold btn-press"
          style={{ background: 'var(--gold)', color: '#060D18' }}>
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {msg && <div className="px-4 py-2.5 rounded-2xl text-sm font-semibold badge-success">{msg}</div>}

      {/* Stats par catégorie */}
      {statsCat.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {statsCat.slice(0, 4).map(([cat, total]) => (
            <div key={cat} className="card-dark p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full" style={{ background: COULEURS_CAT[cat] || '#9CA3AF' }} />
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{cat}</p>
              </div>
              <p className="text-sm font-bold text-white">{fmtFCFA(total)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['Toutes', ...CATEGORIES_DEPENSE].map(cat => (
          <button key={cat} onClick={() => setFiltreCat(cat)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all"
            style={filtreCat === cat ? { background: 'var(--gold)', color: '#060D18' } : { background: 'var(--dark-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--dark-border)' }}>
            {cat}
          </button>
        ))}
      </div>

      {projets.length > 0 && (
        <select value={filtreProjet} onChange={e => setFiltreProjet(e.target.value)}
          className="w-full md:w-64 px-3 py-2 rounded-xl text-sm text-white outline-none"
          style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }}>
          <option value="">Tous les projets</option>
          {projets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      )}

      {loading && <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="skeleton-dark h-16 rounded-2xl" />)}</div>}

      {!loading && depensesFiltrees.length === 0 && (
        <div className="card-dark p-10 text-center">
          <Receipt size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-semibold text-white">Aucune dépense enregistrée</p>
        </div>
      )}

      {!loading && depensesFiltrees.length > 0 && (
        <>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {depensesFiltrees.length} dépense(s) — Total : <span className="font-semibold text-white">{fmtFCFA(totalFiltre)}</span>
          </p>
          <div className="space-y-2">
            {depensesFiltrees.map(d => (
              <div key={d.id} className="card-dark p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-2 h-8 rounded-full shrink-0" style={{ background: COULEURS_CAT[d.categorie] || '#9CA3AF' }} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{d.libelle}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {d.categorie}{d.projetNom ? ` · ${d.projetNom}` : ''} · {d.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-bold text-white">{fmtFCFA(d.montant)}</span>
                  <button onClick={() => supprimer(d.id)} className="p-1.5 rounded-lg" style={{ color: '#F87171' }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Formulaire modale */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="card-dark p-5 w-full max-w-md space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <p className="font-bold text-white">Nouvelle dépense</p>
              <button onClick={() => setShowForm(false)} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <input value={form.libelle} onChange={e => setForm({...form, libelle: e.target.value})} placeholder="Libellé (ex: Plaques BA13)" className={ic} />
            <div className="grid grid-cols-2 gap-2">
              <select value={form.categorie} onChange={e => setForm({...form, categorie: e.target.value})} className={ic}>
                {CATEGORIES_DEPENSE.map(c => <option key={c}>{c}</option>)}
              </select>
              <input type="number" value={form.montant} onChange={e => setForm({...form, montant: e.target.value})} placeholder="Montant (FCFA)" className={ic} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className={ic} />
              {projets.length > 0 && (
                <select value={form.projetId} onChange={e => setForm({...form, projetId: e.target.value})} className={ic}>
                  <option value="">Aucun projet</option>
                  {projets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              )}
            </div>
            <input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Notes (optionnel)" className={ic} />
            <button onClick={ajouter} className="w-full py-2.5 rounded-xl font-semibold btn-press" style={{ background: 'var(--gold)', color: '#060D18' }}>
              <Check size={16} className="inline mr-1" /> Enregistrer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
