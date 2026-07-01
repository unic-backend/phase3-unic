import { useState, useEffect, useMemo } from 'react'
import { getToutesFactures, marquerFacturePayee, creerFacture, supprimerFacture } from '../services/invoiceService'
import { getUsersForSelect } from '../services/userService'
import { Plus, X, Save, CheckCircle2, Trash2, Receipt, Clock, Eye } from 'lucide-react'
import SearchBar from '../components/SearchBar'
import SortSelect from '../components/SortSelect'
import { trierListe, OPTIONS_TRI } from '../utils/tri'

export default function AdminFactures() {
  const [factures, setFactures] = useState([])
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('Tous')
  const [sortKey, setSortKey] = useState('date_desc')
  const [formData, setFormData] = useState({ clientId: '', clientEmail: '', amount: '', issueDate: new Date().toISOString().slice(0, 10), dueDate: '' })

  const charger = async () => { setLoading(true); setFactures(await getToutesFactures()); setClients(await getUsersForSelect()); setLoading(false) }
  useEffect(() => { charger() }, [])

  const flash = (t) => { setMessage(t); setTimeout(() => setMessage(''), 3000) }

  const badge = (s) =>
    s === 'Payée' ? 'badge-success' :
    s === 'En attente' ? 'badge-warning' :
    s === 'En vérification' ? 'badge-info' :
    s === 'Brouillon' ? 'badge-info' : 'badge-danger'

  const handleClientChange = (e) => {
    const clientId = e.target.value
    const sel = clients.find(c => c.id === clientId)
    if (sel) setFormData({ ...formData, clientId, clientEmail: sel.email })
  }

  const soumettre = async () => {
    if (!formData.clientId || !formData.amount || formData.amount <= 0) { flash('Remplis tous les champs'); return }
    try {
      const nouvelle = await creerFacture(formData.clientId, formData.clientEmail, { amount: Number(formData.amount), issueDate: formData.issueDate, dueDate: formData.dueDate })
      setFactures([nouvelle, ...factures])
      flash(`Facture ${nouvelle.invoiceNumber} créée`)
      setShowForm(false)
      setFormData({ clientId: '', clientEmail: '', amount: '', issueDate: new Date().toISOString().slice(0, 10), dueDate: '' })
    } catch { flash('Erreur lors de la création') }
  }

  const payer = async (f) => { if (await marquerFacturePayee(f.id)) setFactures(prev => prev.map(x => x.id === f.id ? { ...x, status: 'Payée' } : x)) }

  const handleDelete = async (f) => {
    if (!window.confirm(`Supprimer ${f.invoiceNumber} ?`)) return
    if (await supprimerFacture(f.id)) setFactures(prev => prev.filter(x => x.id !== f.id))
    else flash('Erreur suppression')
  }

  const filteredFactures = useMemo(() => {
    let list = factures
    if (filter !== 'Tous') list = list.filter(f => f.status === filter)
    if (search.trim()) { const q = search.trim().toLowerCase(); list = list.filter(f => (f.invoiceNumber || '').toLowerCase().includes(q) || (f.clientEmail || '').toLowerCase().includes(q)) }
    return trierListe(list, sortKey, 'createdAt', 'amount')
  }, [factures, search, filter, sortKey])

  const filters = [
    { key: 'Tous', icon: Receipt, color: '#60A5FA' },
    { key: 'En attente', icon: Clock, color: '#FBBF24' },
    { key: 'En vérification', icon: Eye, color: '#60A5FA' },
    { key: 'Payée', icon: CheckCircle2, color: '#34D399' },
  ]

  const inputDark = "w-full px-4 py-3 rounded-xl text-sm text-white outline-none bg-[#111F35] border border-[rgba(255,255,255,0.06)] placeholder-[#4A5B73] focus:border-[#F6C344]"

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div className="flex justify-between items-center animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Gérer Factures</h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Factures émises aux clients</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2.5 rounded-xl font-semibold text-sm btn-press flex items-center gap-2"
          style={{ background: showForm ? 'var(--dark-elevated)' : 'var(--gold)', color: showForm ? 'var(--text-secondary)' : '#060D18' }}>
          {showForm ? <><X size={16}/> Annuler</> : <><Plus size={16} strokeWidth={2.5}/> Créer</>}
        </button>
      </div>

      {message && <div className={`px-4 py-2.5 rounded-xl text-sm font-semibold animate-scale-in ${message.includes('créée') ? 'badge-success' : 'badge-danger'}`}>{message}</div>}

      {/* Formulaire création */}
      {showForm && (
        <div className="card-dark p-5 space-y-4 animate-fade-in" style={{ animationDuration: '0.2s' }}>
          <h2 className="text-base font-semibold text-white">Créer une facture</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Client *</label>
              <select value={formData.clientId} onChange={handleClientChange} className={inputDark} required>
                <option value="">-- Sélectionner --</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.nom} ({c.email})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Montant FCFA *</label>
              <input type="number" name="amount" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} className={inputDark} placeholder="0" min="1" required />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Date d'émission</label>
              <input type="date" name="issueDate" value={formData.issueDate} onChange={(e) => setFormData({...formData, issueDate: e.target.value})} className={inputDark} />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Date limite paiement</label>
              <input type="date" name="dueDate" value={formData.dueDate} onChange={(e) => setFormData({...formData, dueDate: e.target.value})} className={inputDark} />
            </div>
          </div>
          <button onClick={soumettre} className="w-full py-3 rounded-xl font-semibold btn-press flex items-center justify-center gap-2"
            style={{ background: 'var(--gold)', color: '#060D18' }}>
            <Save size={16}/> Créer facture
          </button>
        </div>
      )}

      <SearchBar value={search} onChange={setSearch} placeholder="Rechercher une facture, un client..." dark />

      <div className="flex gap-2 flex-wrap items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {filters.map(f => {
            const Icon = f.icon; const active = filter === f.key
            return (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold transition active:scale-95 flex items-center gap-1.5"
                style={active
                  ? { background: `${f.color}20`, color: f.color, border: `1px solid ${f.color}40` }
                  : { background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', color: 'var(--text-muted)' }
                }>
                <Icon size={14} /> {f.key}
              </button>
            )
          })}
        </div>
        <SortSelect value={sortKey} onChange={setSortKey} options={OPTIONS_TRI} dark />
      </div>

      {loading && <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="skeleton-dark h-32 rounded-2xl" />)}</div>}

      {!loading && factures.length === 0 && (
        <div className="card-dark p-10 text-center">
          <Receipt size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-semibold text-white">Aucune facture</p>
        </div>
      )}

      {!loading && factures.length > 0 && filteredFactures.length === 0 && (
        <div className="card-dark p-8 text-center" style={{ color: 'var(--text-muted)' }}>Aucun résultat.</div>
      )}

      {!loading && filteredFactures.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredFactures.map((f, i) => (
            <div key={f.id} className="card-dark p-4 space-y-3 animate-fade-in" style={{ opacity: 0, animationDelay: `${i * 50}ms` }}>
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">{f.invoiceNumber}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{f.clientEmail}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${badge(f.status)}`}>{f.status}</span>
              </div>
              <div className="flex justify-between text-sm" style={{ borderTop: '1px solid var(--dark-border)', paddingTop: '10px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Montant</span>
                <span className="font-semibold" style={{ color: 'var(--gold)' }}>{(f.amount || f.totalTTC || 0).toLocaleString('fr-FR')} FCFA</span>
              </div>
              {f.status !== 'Payée' && (
                <div className="space-y-2 pt-1">
                  <button onClick={() => payer(f)}
                    className="w-full py-2.5 rounded-xl font-semibold text-sm transition btn-press flex items-center justify-center gap-1.5"
                    style={{ background: 'rgba(52,211,153,0.15)', color: '#34D399' }}>
                    <CheckCircle2 size={16}/> Marquer payée
                  </button>
                  <button onClick={() => handleDelete(f)}
                    className="w-full py-2 rounded-xl font-semibold text-xs transition btn-press flex items-center justify-center gap-1.5"
                    style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171' }}>
                    <Trash2 size={14}/> Supprimer
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
