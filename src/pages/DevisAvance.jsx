import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getDevisClient, supprimerDevis } from '../services/quoteService'
import { telechargerDevisPDF } from '../pdf/generatePdf'
import Toast from '../components/Toast'
import { Plus, Trash2, FileText, Clock, CheckCircle2, XCircle, X, Download } from 'lucide-react'
import SortSelect from '../components/SortSelect'
import { trierListe, OPTIONS_TRI } from '../utils/tri'
import { formatMontant } from '../utils/pricing'

export default function DevisAvance() {
  const { user } = useAuth()
  const [devisList, setDevisList] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDevis, setSelectedDevis] = useState(null)
  const [toast, setToast] = useState(null)
  const [filter, setFilter] = useState('Tous')
  const [sortKey, setSortKey] = useState('date_desc')
  const [pdfEnCours, setPdfEnCours] = useState(false)

  // Le client peut télécharger son devis dès qu'il est approuvé ou signé.
  const peutTelecharger = (s) => ['Approuvé', 'En attente de signature', 'Signé'].includes(s)

  const telecharger = async (devis) => {
    setPdfEnCours(true)
    try {
      await telechargerDevisPDF(devis)
    } catch (e) {
      console.error('Erreur PDF client:', e)
      setToast({ message: 'Erreur lors du téléchargement. Réessayez.', type: 'error' })
    } finally {
      setPdfEnCours(false)
    }
  }

  const badge = (s) => {
    if (s === 'En attente') return 'badge-warning'
    if (s === 'Approuvé') return 'badge-success'
    if (s === 'Rejeté') return 'badge-danger'
    if (s === 'En attente de signature') return 'badge-warning'
    if (s === 'Signé') return 'badge-success'
    return 'badge-warning'
  }

  useEffect(() => {
    let actif = true
    async function charger() {
      if (!user?.id) { setLoading(false); return }
      const list = await getDevisClient(user.id)
      if (actif) { setDevisList(list); setLoading(false) }
    }
    charger()
    return () => { actif = false }
  }, [user])

  const filteredDevis = useMemo(() => {
    const list = filter === 'Tous' ? devisList : devisList.filter(d => d.status === filter)
    return trierListe(list, sortKey, 'createdAt', 'totalTTC')
  }, [filter, devisList, sortKey])

  const handleDelete = async (devis) => {
    if (!window.confirm(`Supprimer ${devis.quoteNumber} ?`)) return
    if (await supprimerDevis(devis.id)) {
      setDevisList(prev => prev.filter(d => d.id !== devis.id)); setSelectedDevis(null)
      setToast({ message: 'Devis supprimé', type: 'success' })
    } else setToast({ message: 'Suppression impossible', type: 'error' })
  }

  const formatDate = (d) => { if (!d) return '-'; if (d.seconds) return new Date(d.seconds * 1000).toLocaleDateString('fr-FR'); return String(d) }

  const filters = [
    { key: 'Tous', icon: FileText, color: '#60A5FA' },
    { key: 'En attente', icon: Clock, color: '#FBBF24' },
    { key: 'Approuvé', icon: CheckCircle2, color: '#34D399' },
    { key: 'En attente de signature', icon: FileText, color: '#60A5FA' },
    { key: 'Signé', icon: CheckCircle2, color: '#34D399' },
    { key: 'Rejeté', icon: XCircle, color: '#F87171' },
  ]

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 animate-fade-in">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Mes Devis</h1>
          <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Suivi de vos demandes</p>
        </div>
        <Link to="/client/devis/new" className="px-5 py-2.5 rounded-xl font-semibold text-sm btn-press flex items-center gap-2 text-center"
          style={{ background: 'var(--gold)', color: '#060D18' }}>
          <Plus size={16} strokeWidth={2.5}/> Nouveau devis
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {filters.map(f => {
            const Icon = f.icon; const active = filter === f.key
            return (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold transition active:scale-95 flex items-center gap-1.5"
                style={active ? { background: `${f.color}20`, color: f.color, border: `1px solid ${f.color}40` } : { background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', color: 'var(--text-muted)' }}>
                <Icon size={14} /> {f.key}
              </button>
            )
          })}
        </div>
        <SortSelect value={sortKey} onChange={setSortKey} options={OPTIONS_TRI} dark />
      </div>

      {loading && <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton-dark h-36 rounded-2xl" />)}</div>}

      {!loading && filteredDevis.length === 0 && (
        <div className="card-dark p-10 text-center">
          <FileText size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Aucun devis</p>
          <Link to="/client/devis/new" className="text-xs font-semibold mt-2 inline-block" style={{ color: 'var(--gold)' }}>Faire une demande</Link>
        </div>
      )}

      {!loading && filteredDevis.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredDevis.map((devis, i) => (
            <div key={devis.id} className="card-dark p-4 space-y-3 animate-fade-in" style={{ opacity: 0, animationDelay: `${i * 50}ms` }}>
              <div className="flex justify-between items-start gap-2">
                <div><p className="font-semibold text-white">{devis.quoteNumber}</p><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(devis.createdAt)}</p></div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${badge(devis.status)}`}>{devis.status}</span>
              </div>
              <div className="text-sm space-y-1" style={{ borderTop: '1px solid var(--dark-border)', paddingTop: '8px' }}>
                <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Surface</span><span className="font-medium text-white">{devis.surface} m²</span></div>
                <div className="flex justify-between"><span style={{ color: 'var(--text-muted)' }}>Montant</span><span className="font-semibold" style={{ color: 'var(--gold)' }}>{formatMontant(devis)}</span></div>
              </div>
              <button onClick={() => setSelectedDevis(devis)} className="w-full py-2 rounded-xl font-semibold text-xs btn-press"
                style={{ background: 'var(--dark-elevated)', color: 'var(--gold)', border: '1px solid var(--dark-border)' }}>Voir le détail</button>
            </div>
          ))}
        </div>
      )}

      {selectedDevis && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center md:p-4 z-50 animate-fade-in" style={{ animationDuration: '0.2s' }}>
          <div className="rounded-t-2xl md:rounded-2xl max-w-lg w-full max-h-[88vh] overflow-y-auto p-5 space-y-4 dark-scrollbar animate-slide-up"
            style={{ background: 'var(--dark-surface)', border: '1px solid var(--dark-border)' }}>
            <div className="flex justify-between items-start gap-2">
              <div><h2 className="text-lg font-bold text-white">{selectedDevis.title || selectedDevis.quoteNumber}</h2><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{selectedDevis.quoteNumber}</p></div>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${badge(selectedDevis.status)}`}>{selectedDevis.status}</span>
            </div>
            {selectedDevis.description && <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{selectedDevis.description}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl p-3 text-center" style={{ background: 'var(--dark-elevated)' }}><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Surface</p><p className="text-lg font-bold text-white">{selectedDevis.surface} m²</p></div>
              <div className="rounded-xl p-3 text-center" style={{ background: 'var(--dark-elevated)' }}><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Type</p><p className="text-sm font-bold text-white">{selectedDevis.type}</p></div>
            </div>
            <div style={{ borderTop: '1px solid var(--dark-border)', paddingTop: '12px' }}>
              <div className="flex justify-between text-sm mb-2"><span style={{ color: 'var(--text-muted)' }}>Prix unitaire</span><span className="font-medium text-white">{(selectedDevis.pricePerM2 || 15000).toLocaleString('fr-FR')} FCFA/m²</span></div>
              <div className="flex justify-between text-lg font-bold" style={{ borderTop: '1px solid var(--dark-border)', paddingTop: '8px' }}><span className="text-white">Total estimé</span><span style={{ color: 'var(--gold)' }}>{formatMontant(selectedDevis)}</span></div>
            </div>
            {selectedDevis.status === 'En attente' && <div className="rounded-xl p-3 text-xs badge-warning">Votre demande est en cours d'examen.</div>}
            {selectedDevis.status === 'En attente de signature' && (
              <div className="rounded-xl p-3 text-xs" style={{ background: 'rgba(96,165,250,0.1)', color: '#60A5FA' }}>
                ✍️ Votre devis est prêt — UniC Plaquiste vous enverra un lien de signature sur WhatsApp.
              </div>
            )}
            {selectedDevis.status === 'Signé' && (
              <div className="rounded-xl p-3 text-xs badge-success">✓ Devis signé — les travaux vont pouvoir démarrer.</div>
            )}

            {/* Téléchargement PDF — dès que le devis est prêt (approuvé/signé) */}
            {peutTelecharger(selectedDevis.status) && (
              <button onClick={() => telecharger(selectedDevis)} disabled={pdfEnCours}
                className="w-full py-3 rounded-xl font-bold text-sm btn-press flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'var(--gold)', color: '#060D18' }}>
                <Download size={16} /> {pdfEnCours ? 'Préparation…' : 'Télécharger le devis (PDF)'}
              </button>
            )}

            {<button onClick={() => handleDelete(selectedDevis)} className="w-full py-2 rounded-xl font-semibold text-xs btn-press flex items-center justify-center gap-1.5" style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171' }}><Trash2 size={14}/> Supprimer ce devis</button>}
            <button onClick={() => setSelectedDevis(null)} className="w-full py-2.5 rounded-xl font-semibold text-sm btn-press" style={{ background: 'var(--dark-elevated)', color: 'var(--text-secondary)' }}>Fermer</button>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
