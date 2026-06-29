import { useState, useEffect, useMemo } from 'react'
import { getToutesFactures, marquerFacturePayee, creerFacture, supprimerFacture, enregistrerDetailFacture } from '../services/invoiceService'
import { getUsersForSelect } from '../services/userService'
import { telechargerFacturePDF } from '../pdf/generatePdf'
import { Plus, X, Save, CheckCircle2, Trash2, Receipt, Clock, Eye, FileDown, ListPlus, Check } from 'lucide-react'
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
  const [formData, setFormData] = useState({ clientId: '', clientEmail: '', clientNom: '', amount: '', designation: '', modalitesPaiement: '', issueDate: new Date().toISOString().slice(0, 10), dueDate: '' })
  const [pdfEnCours, setPdfEnCours] = useState(null)
  const [detailEnEdition, setDetailEnEdition] = useState(null)
  const [lignesEdit, setLignesEdit] = useState([])

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
    if (sel) setFormData({ ...formData, clientId, clientEmail: sel.email, clientNom: sel.nom || '' })
  }

  const soumettre = async () => {
    if (!formData.clientId || !formData.amount || formData.amount <= 0) { flash('Remplis tous les champs'); return }
    try {
      const nouvelle = await creerFacture(formData.clientId, formData.clientEmail, { amount: Number(formData.amount), issueDate: formData.issueDate, dueDate: formData.dueDate, designation: formData.designation, modalitesPaiement: formData.modalitesPaiement, clientNom: formData.clientNom })
      setFactures([nouvelle, ...factures])
      flash(`Facture ${nouvelle.invoiceNumber} créée`)
      setShowForm(false)
      setFormData({ clientId: '', clientEmail: '', clientNom: '', amount: '', designation: '', modalitesPaiement: '', issueDate: new Date().toISOString().slice(0, 10), dueDate: '' })
    } catch { flash('Erreur lors de la création') }
  }

  const genererPDF = async (facture) => {
    setPdfEnCours(facture.id)
    try {
      await telechargerFacturePDF(facture)
    } catch (e) {
      console.error('Erreur génération PDF:', e)
      flash('Erreur lors de la génération du PDF')
    } finally {
      setPdfEnCours(null)
    }
  }

  const ouvrirDetail = (facture) => {
    setDetailEnEdition(facture.id)
    setLignesEdit(
      facture.lignesMateriaux && facture.lignesMateriaux.length > 0
        ? facture.lignesMateriaux.map(l => ({ ...l }))
        : [{ designation: facture.designation || '', prixUnitaire: facture.amount || '', quantite: 1 }]
    )
  }
  const modifierLigne = (index, champ, valeur) => setLignesEdit(prev => prev.map((l, i) => i === index ? { ...l, [champ]: valeur } : l))
  const ajouterLigne = () => setLignesEdit(prev => [...prev, { designation: '', prixUnitaire: '', quantite: '' }])
  const supprimerLigne = (index) => setLignesEdit(prev => prev.filter((_, i) => i !== index))
  const totalLignesEdit = lignesEdit.reduce((s, l) => s + (Number(l.prixUnitaire) || 0) * (Number(l.quantite) || 0), 0)

  const enregistrerDetail = async (facture) => {
    const lignesValides = lignesEdit.filter(l => l.designation.trim())
    if (await enregistrerDetailFacture(facture.id, { lignesMateriaux: lignesValides })) {
      setFactures(prev => prev.map(f => f.id === facture.id ? { ...f, lignesMateriaux: lignesValides, amount: totalLignesEdit } : f))
      setDetailEnEdition(null)
      flash('Détail de la facture enregistré')
    } else {
      flash('Erreur lors de l\'enregistrement')
    }
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
            <div className="md:col-span-2">
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Désignation (description de la prestation, pour le PDF)</label>
              <input type="text" name="designation" value={formData.designation} onChange={(e) => setFormData({...formData, designation: e.target.value})} className={inputDark} placeholder="Ex: Forfait décoration murale BA13 + peinture" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Modalités de paiement (pour le PDF — une ligne par échéance)</label>
              <textarea value={formData.modalitesPaiement} onChange={(e) => setFormData({...formData, modalitesPaiement: e.target.value})} rows={2}
                placeholder={"Ex: 50% au demarrage des travaux\n50% a la fin des travaux et satisfaction"}
                className={inputDark + ' resize-none'} />
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
              <button onClick={() => ouvrirDetail(f)}
                className="w-full py-2 rounded-xl font-semibold text-xs transition btn-press flex items-center justify-center gap-1.5"
                style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)', color: 'var(--text-secondary)' }}>
                <ListPlus size={13}/> Détailler les lignes
              </button>
              <button onClick={() => genererPDF(f)} disabled={pdfEnCours === f.id}
                className="w-full py-2 rounded-xl font-semibold text-xs transition btn-press disabled:opacity-50 flex items-center justify-center gap-1.5"
                style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)', color: 'var(--gold)' }}>
                <FileDown size={13}/> {pdfEnCours === f.id ? 'Génération...' : 'Télécharger le PDF'}
              </button>
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

      {detailEnEdition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="card-dark w-full max-w-lg max-h-[85vh] flex flex-col animate-fade-in">
            <div className="flex items-center justify-between p-4 shrink-0" style={{ borderBottom: '1px solid var(--dark-border)' }}>
              <p className="font-bold text-white">Détail de la facture</p>
              <button onClick={() => setDetailEnEdition(null)} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {lignesEdit.map((ligne, i) => (
                <div key={i} className="flex gap-1.5 items-center">
                  <input value={ligne.designation} onChange={(e) => modifierLigne(i, 'designation', e.target.value)}
                    placeholder="Désignation" className="flex-1 px-2.5 py-2 rounded-lg text-xs text-white placeholder-[#4A5B73] outline-none"
                    style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }} />
                  <input value={ligne.prixUnitaire} onChange={(e) => modifierLigne(i, 'prixUnitaire', e.target.value)}
                    type="number" placeholder="Prix unit." className="w-20 px-2 py-2 rounded-lg text-xs text-white placeholder-[#4A5B73] outline-none"
                    style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }} />
                  <input value={ligne.quantite} onChange={(e) => modifierLigne(i, 'quantite', e.target.value)}
                    type="number" placeholder="Qte" className="w-14 px-2 py-2 rounded-lg text-xs text-white placeholder-[#4A5B73] outline-none"
                    style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }} />
                  <button onClick={() => supprimerLigne(i)} className="p-2 rounded-lg shrink-0" style={{ color: '#F87171' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button onClick={ajouterLigne} className="mt-1 flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--gold)' }}>
                <Plus size={14} /> Ajouter une ligne
              </button>
              <div className="rounded-xl p-3 text-right mt-3" style={{ background: 'rgba(246,195,68,0.1)' }}>
                <span className="text-sm font-bold" style={{ color: 'var(--gold)' }}>Total : {totalLignesEdit.toLocaleString('fr-FR')} FCFA</span>
              </div>
            </div>

            <div className="p-3 shrink-0" style={{ borderTop: '1px solid var(--dark-border)' }}>
              <button onClick={() => enregistrerDetail(factures.find(f => f.id === detailEnEdition))}
                className="w-full py-2.5 rounded-xl font-semibold text-sm btn-press flex items-center justify-center gap-2"
                style={{ background: 'var(--gold)', color: '#060D18' }}>
                <Check size={16} /> Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
