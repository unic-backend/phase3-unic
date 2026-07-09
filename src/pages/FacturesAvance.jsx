import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getFacturesClient, signalerPaiement, supprimerFacture } from '../services/invoiceService'
import { telechargerFacturePDF } from '../pdf/generatePdf'
import { PAIEMENT } from '../config/paiement'
import Toast from '../components/Toast'
import { CreditCard, Copy, CheckCircle2, Receipt, Clock, Eye, X, Trash2, Download } from 'lucide-react'
import SortSelect from '../components/SortSelect'
import { trierListe, OPTIONS_TRI } from '../utils/tri'

export default function FacturesAvance() {
  const { user } = useAuth()
  const [factures, setFactures] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFacture, setSelectedFacture] = useState(null)
  const [toast, setToast] = useState(null)
  const [filter, setFilter] = useState('Tous')
  const [sortKey, setSortKey] = useState('date_desc')
  const [showPayment, setShowPayment] = useState(false)
  const [pdfEnCours, setPdfEnCours] = useState(false)

  const telechargerPdf = async (facture) => {
    setPdfEnCours(true)
    try {
      await telechargerFacturePDF(facture)
    } catch (e) {
      console.error('Erreur PDF facture:', e)
      setToast({ message: 'Erreur lors du téléchargement. Réessayez.', type: 'error' })
    } finally {
      setPdfEnCours(false)
    }
  }

  useEffect(() => {
    let actif = true
    async function charger() { if (!user?.id) { setLoading(false); return }; const list = await getFacturesClient(user.id); if (actif) { setFactures(list); setLoading(false) } }
    charger(); return () => { actif = false }
  }, [user])

  const badge = (s) => s === 'Payée' ? 'badge-success' : s === 'En attente' ? 'badge-warning' : s === 'En vérification' ? 'badge-info' : 'badge-danger'

  const filteredFactures = useMemo(() => {
    const list = filter === 'Tous' ? factures : factures.filter(f => f.status === filter)
    return trierListe(list, sortKey, 'createdAt', 'amount')
  }, [filter, factures, sortKey])

  const totalAmount = useMemo(() => filteredFactures.reduce((sum, f) => sum + (f.amount || 0), 0), [filteredFactures])

  const copierNumero = (numero) => { navigator.clipboard?.writeText(numero).catch(() => {}); setToast({ message: 'Numéro copié ! ' + numero, type: 'success' }) }

  const envoyerPreuveWhatsApp = async (facture) => {
    const msg = encodeURIComponent(`Bonjour UniC Plaquiste, j'ai payé la facture ${facture.invoiceNumber} (${facture.amount.toLocaleString('fr-FR')} FCFA). Voici ma preuve :`)
    window.open(`https://wa.me/${PAIEMENT.whatsapp}?text=${msg}`, '_blank')
    const ok = await signalerPaiement(facture.id)
    if (ok) { setFactures(prev => prev.map(f => f.id === facture.id ? { ...f, status: 'En vérification' } : f)); setToast({ message: 'Paiement signalé !', type: 'success' }) }
    fermerModal()
  }

  const fermerModal = () => { setSelectedFacture(null); setShowPayment(false) }

  const handleDeleteFacture = async (facture) => {
    if (!window.confirm(`Supprimer la facture ${facture.invoiceNumber} ?`)) return
    if (await supprimerFacture(facture.id)) {
      setFactures(prev => prev.filter(f => f.id !== facture.id))
      fermerModal()
      setToast({ message: 'Facture supprimée', type: 'success' })
    }
  }

  const filters = [
    { key: 'Tous', icon: Receipt, color: '#60A5FA' },
    { key: 'En attente', icon: Clock, color: '#FBBF24' },
    { key: 'En vérification', icon: Eye, color: '#60A5FA' },
    { key: 'Payée', icon: CheckCircle2, color: '#34D399' },
  ]

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="animate-fade-in"><h1 className="text-2xl md:text-3xl font-bold text-white">Mes Factures</h1><p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Suivi de vos paiements</p></div>

      <div className="grid grid-cols-3 gap-3">
        {[{ label: 'Total', val: totalAmount.toLocaleString('fr-FR'), sub: 'FCFA', color: 'var(--gold)' }, { label: 'Factures', val: filteredFactures.length, color: 'white' }, { label: 'À payer', val: factures.filter(f => f.status === 'En attente').length, color: '#FBBF24' }].map((s, i) => (
          <div key={i} className="card-dark p-3 animate-fade-in" style={{ opacity: 0, animationDelay: `${i * 80}ms` }}>
            <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            <p className="text-lg font-bold" style={{ color: s.color }}>{s.val}</p>
            {s.sub && <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.sub}</p>}
          </div>
        ))}
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

      {loading && <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton-dark h-28 rounded-2xl" />)}</div>}

      {!loading && filteredFactures.length === 0 && (
        <div className="card-dark p-10 text-center"><Receipt size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} /><p className="text-sm" style={{ color: 'var(--text-muted)' }}>Aucune facture</p></div>
      )}

      {!loading && filteredFactures.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredFactures.map((f, i) => (
            <div key={f.id} className="card-dark p-4 space-y-3 animate-fade-in" style={{ opacity: 0, animationDelay: `${i * 50}ms` }}>
              <div className="flex justify-between items-start gap-2">
                <div><p className="font-semibold text-white">{f.invoiceNumber}</p><p className="text-xs" style={{ color: 'var(--text-muted)' }}>{f.issueDate}</p></div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${badge(f.status)}`}>{f.status}</span>
              </div>
              <div className="flex justify-between text-sm"><span style={{ color: 'var(--text-muted)' }}>Montant</span><span className="font-semibold" style={{ color: 'var(--gold)' }}>{(f.amount || 0).toLocaleString('fr-FR')} FCFA</span></div>
              <button onClick={() => setSelectedFacture(f)} className="w-full py-2 rounded-xl font-semibold text-xs btn-press"
                style={{ background: 'var(--dark-elevated)', color: 'var(--gold)', border: '1px solid var(--dark-border)' }}>Voir le détail</button>
            </div>
          ))}
        </div>
      )}

      {selectedFacture && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" style={{ animationDuration: '0.2s' }}>
          <div className="rounded-2xl max-w-md w-full max-h-[88vh] overflow-y-auto p-5 space-y-4 dark-scrollbar" style={{ background: 'var(--dark-surface)', border: '1px solid var(--dark-border)' }}>
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-bold text-white">{selectedFacture.invoiceNumber}</h2>
              <button onClick={fermerModal} style={{ color: 'var(--text-muted)' }}><X size={20}/></button>
            </div>

            <div className="rounded-xl p-4 space-y-2" style={{ background: 'var(--dark-elevated)' }}>
              <div className="flex justify-between text-sm"><span style={{ color: 'var(--text-muted)' }}>Montant</span><span className="font-semibold" style={{ color: 'var(--gold)' }}>{selectedFacture.amount.toLocaleString('fr-FR')} FCFA</span></div>
              <div className="flex justify-between text-sm"><span style={{ color: 'var(--text-muted)' }}>Émise</span><span className="font-medium text-white">{selectedFacture.issueDate}</span></div>
              <div className="flex justify-between text-sm"><span style={{ color: 'var(--text-muted)' }}>Échéance</span><span className="font-medium text-white">{selectedFacture.dueDate}</span></div>
            </div>

            {selectedFacture.status === 'En attente' && !showPayment && (
              <button onClick={() => setShowPayment(true)} className="w-full py-3 rounded-xl font-semibold text-sm btn-press flex items-center justify-center gap-2"
                style={{ background: 'rgba(52,211,153,0.15)', color: '#34D399' }}><CreditCard size={18}/> Payer cette facture</button>
            )}

            {selectedFacture.status === 'En attente' && showPayment && (
              <div className="space-y-3">
                <p className="text-xs text-center" style={{ color: 'var(--text-secondary)' }}>Envoyez <strong className="text-white">{selectedFacture.amount.toLocaleString('fr-FR')} FCFA</strong> à {PAIEMENT.beneficiaire} :</p>

                {[PAIEMENT.wave, PAIEMENT.orangeMoney].map((m, i) => (
                  <div key={i} className="rounded-xl p-3 flex items-center justify-between" style={{ border: `1px solid ${m.couleur}40` }}>
                    <div><p className="text-xs font-semibold" style={{ color: m.couleur }}>{m.nom}</p><p className="font-bold text-white text-sm">{m.numero}</p></div>
                    <button onClick={() => copierNumero(m.numero)} className="px-3 py-1.5 rounded-lg text-xs font-semibold btn-press flex items-center gap-1"
                      style={{ background: 'var(--dark-elevated)', color: 'var(--text-secondary)' }}><Copy size={12}/> Copier</button>
                  </div>
                ))}

                <button onClick={() => envoyerPreuveWhatsApp(selectedFacture)} className="w-full py-3 rounded-xl font-semibold text-sm btn-press flex items-center justify-center gap-2"
                  style={{ background: '#25D366', color: 'white' }}><CheckCircle2 size={16}/> J'ai payé — WhatsApp</button>
                <p className="text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>Envoyez la capture par WhatsApp pour validation.</p>
              </div>
            )}

            {selectedFacture.status === 'En vérification' && (
              <div className="rounded-xl p-3 text-center badge-info"><p className="text-xs font-semibold">Paiement en cours de vérification</p></div>
            )}

            {selectedFacture.status === 'Payée' && (
              <div className="rounded-xl p-3 text-center badge-success"><p className="text-xs font-semibold flex items-center justify-center gap-1"><CheckCircle2 size={14}/> Facture payée</p></div>
            )}

            {/* Téléchargement PDF de la facture (avec les 2 signatures si signée) */}
            <button onClick={() => telechargerPdf(selectedFacture)} disabled={pdfEnCours}
              className="w-full py-3 rounded-xl font-bold text-sm btn-press flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ background: 'var(--gold)', color: '#060D18' }}>
              <Download size={16} /> {pdfEnCours ? 'Préparation…' : 'Télécharger la facture (PDF)'}
            </button>

            <button onClick={fermerModal} className="w-full py-2.5 rounded-xl font-semibold text-sm btn-press" style={{ background: 'var(--dark-elevated)', color: 'var(--text-secondary)' }}>Fermer</button>
            <button onClick={() => handleDeleteFacture(selectedFacture)} className="w-full py-2 rounded-xl font-semibold text-xs btn-press flex items-center justify-center gap-1.5" style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171' }}>
              <Trash2 size={14}/> Supprimer cette facture
            </button>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
