import { useState, useEffect, useMemo } from 'react'
import { getTousDevis, changerStatutDevis, supprimerDevis, modifierMontantDevis, enregistrerDetailDevis, modifierInfosDevis, genererLienSignature } from '../services/quoteService'
import { creerFacture } from '../services/invoiceService'
import { telechargerDevisPDF } from '../pdf/generatePdf'
import { demanderAssistant } from '../services/iaService'
import SearchBar from '../components/SearchBar'
import SortSelect from '../components/SortSelect'
import { trierListe, OPTIONS_TRI } from '../utils/tri'
import { formatMontant } from '../utils/pricing'
import { Check, X, RotateCcw, FileText, Trash2, Clock, CheckCircle2, XCircle, Pencil, FileDown, ListPlus, Plus, Sparkles, Send, Copy } from 'lucide-react'

export default function AdminDevis() {
  const [devisList, setDevisList] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [factures, setFactures] = useState({})
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('Tous')
  const [sortKey, setSortKey] = useState('date_desc')
  const [enEdition, setEnEdition] = useState(null)
  const [nouveauMontant, setNouveauMontant] = useState('')
  const [detailEnEdition, setDetailEnEdition] = useState(null)
  const [lignesEdit, setLignesEdit] = useState([])
  const [lignesMainOeuvreEdit, setLignesMainOeuvreEdit] = useState([])
  const [exclusionsEdit, setExclusionsEdit] = useState('')
  const [modalitesPaiementEdit, setModalitesPaiementEdit] = useState('')
  const [clientNomEdit, setClientNomEdit] = useState('')
  const [descriptionEdit, setDescriptionEdit] = useState('')
  const [ameliorationEnCours, setAmeliorationEnCours] = useState(false)
  const [pdfEnCours, setPdfEnCours] = useState(null)
  const [erreurPdf, setErreurPdf] = useState('')
  const [lienSignature, setLienSignature] = useState(null)
  const [lienSignatureEnCours, setLienSignatureEnCours] = useState(null)

  const charger = async () => { setLoading(true); setDevisList(await getTousDevis()); setLoading(false) }
  useEffect(() => { charger() }, [])

  const formatDate = (d) => {
    if (!d) return '-'
    if (d.seconds) return new Date(d.seconds * 1000).toLocaleDateString('fr-FR')
    return String(d)
  }

  const handleDelete = async (devis) => {
    if (!window.confirm(`Supprimer définitivement le devis ${devis.quoteNumber} ?`)) return
    const ok = await supprimerDevis(devis.id)
    if (ok) { setDevisList(prev => prev.filter(d => d.id !== devis.id)); flash('Devis supprimé') }
    else flash('Erreur: suppression impossible')
  }

  const flash = (t) => { setMessage(t); setTimeout(() => setMessage(''), 3000) }

  const decider = async (devis, statut) => {
    if (await changerStatutDevis(devis.id, statut)) {
      flash(`Devis ${devis.quoteNumber} : ${statut}`)
      setDevisList(prev => prev.map(d => d.id === devis.id ? { ...d, status: statut } : d))
    }
  }

  const ouvrirEditionMontant = (devis) => {
    setEnEdition(devis.id)
    setNouveauMontant(String(devis.totalTTC || ''))
  }

  const enregistrerMontant = async (devis) => {
    const montant = Number(nouveauMontant)
    if (!nouveauMontant || isNaN(montant) || montant < 0) { flash('Montant invalide'); return }
    if (await modifierMontantDevis(devis.id, montant)) {
      setEnEdition(null)
      await charger()
      flash(`Montant mis à jour : ${montant.toLocaleString('fr-FR')} FCFA`)
    } else {
      flash('Erreur lors de la mise à jour')
    }
  }

  const ouvrirDetail = (devis) => {
    setDetailEnEdition(devis.id)
    setLignesEdit(
      devis.lignesMateriaux && devis.lignesMateriaux.length > 0
        ? devis.lignesMateriaux.map(l => ({ ...l }))
        : [{ designation: '', prixUnitaire: '', quantite: '' }]
    )
    setLignesMainOeuvreEdit(
      devis.lignesMainOeuvre && devis.lignesMainOeuvre.length > 0
        ? devis.lignesMainOeuvre.map(l => ({ ...l }))
        : devis.forfaitMainOeuvre?.montant
          ? [{ ...devis.forfaitMainOeuvre }]
          : [{ designation: '', montant: '' }]
    )
    setExclusionsEdit(devis.exclusions || '')
    setModalitesPaiementEdit(devis.modalitesPaiement || '')
    setClientNomEdit(devis.clientNom || '')
    setDescriptionEdit(devis.description || '')
  }

  const modifierLigne = (index, champ, valeur) => {
    setLignesEdit(prev => prev.map((l, i) => i === index ? { ...l, [champ]: valeur } : l))
  }

  const ajouterLigne = () => setLignesEdit(prev => [...prev, { designation: '', prixUnitaire: '', quantite: '' }])
  const supprimerLigne = (index) => setLignesEdit(prev => prev.filter((_, i) => i !== index))

  const modifierLigneMainOeuvre = (index, champ, valeur) => {
    setLignesMainOeuvreEdit(prev => prev.map((l, i) => i === index ? { ...l, [champ]: valeur } : l))
  }
  const ajouterLigneMainOeuvre = () => setLignesMainOeuvreEdit(prev => [...prev, { designation: '', montant: '' }])
  const supprimerLigneMainOeuvre = (index) => setLignesMainOeuvreEdit(prev => prev.filter((_, i) => i !== index))

  const totalLignesEdit = lignesEdit.reduce((s, l) => s + (Number(l.prixUnitaire) || 0) * (Number(l.quantite) || 0), 0)
  const totalMainOeuvreEdit = lignesMainOeuvreEdit.reduce((s, l) => s + (Number(l.montant) || 0), 0)
  const totalGeneralEdit = totalLignesEdit + totalMainOeuvreEdit

  const enregistrerDetail = async (devis) => {
    const lignesValides = lignesEdit.filter(l => l.designation.trim())
    const mainOeuvreValide = lignesMainOeuvreEdit.filter(l => l.designation.trim())
    const ok1 = await enregistrerDetailDevis(devis.id, { lignesMateriaux: lignesValides, lignesMainOeuvre: mainOeuvreValide, exclusions: exclusionsEdit, modalitesPaiement: modalitesPaiementEdit })
    const ok2 = await modifierInfosDevis(devis.id, { clientNom: clientNomEdit, description: descriptionEdit })
    if (ok1 && ok2) {
      setDetailEnEdition(null)
      await charger()
      flash('Détail du devis enregistré')
    } else {
      flash('Erreur lors de l\'enregistrement')
    }
  }

  const ameliorerDescription = async () => {
    if (!descriptionEdit.trim()) { flash('Écris d\'abord une description de base'); return }
    setAmeliorationEnCours(true)
    try {
      const question = `Voici une description brute d'un projet, écrite par un client : "${descriptionEdit}". Réécris-la en un paragraphe professionnel pour un devis officiel de plaquisterie (style : "Fourniture et pose de... Les travaux incluent..."). Réponds UNIQUEMENT avec le paragraphe, sans aucune autre phrase autour, en français, sans accents (comme le reste du document).`
      const resultat = await demanderAssistant(question)
      setDescriptionEdit(resultat.trim())
    } catch (e) {
      flash('Erreur IA : ' + (e.message || 'inconnue'))
    } finally {
      setAmeliorationEnCours(false)
    }
  }

  const genererPDF = async (devis) => {
    setPdfEnCours(devis.id)
    setErreurPdf('')
    try {
      await telechargerDevisPDF(devis)
    } catch (e) {
      console.error('Erreur génération PDF:', e)
      setErreurPdf('Erreur lors de la génération du PDF')
      flash('Erreur lors de la génération du PDF')
    } finally {
      setPdfEnCours(null)
    }
  }

  const envoyerPourSignature = async (devis) => {
    setLienSignatureEnCours(devis.id)
    const token = await genererLienSignature(devis.id)
    if (token) {
      const lien = `${window.location.origin}/signer/${token}`
      setLienSignature({ devisId: devis.id, lien })
      await charger()
      flash('Lien de signature généré — copie-le et envoie-le sur WhatsApp')
    } else {
      flash('Erreur lors de la génération du lien')
    }
    setLienSignatureEnCours(null)
  }

  const copierLien = async (lien) => {
    await navigator.clipboard.writeText(lien)
    flash('Lien copié !')
  }

  const genererFacture = async (devis) => {
    const fac = await creerFacture(devis.clientId, devis.clientEmail, {
      amount: devis.totalTTC, status: 'En attente', issueDate: new Date().toISOString().slice(0, 10),
      designation: devis.description || devis.title || '',
      modalitesPaiement: devis.modalitesPaiement || ''
    })
    if (fac) {
      setFactures(prev => ({ ...prev, [devis.id]: true }))
      flash(`Facture créée pour ${devis.quoteNumber}`)
    } else flash('Erreur lors de la création')
  }

  const badge = (s) =>
    s === 'En attente' ? 'badge-warning' :
    s === 'Approuvé' ? 'badge-success' : 'badge-danger'

  const filteredDevis = useMemo(() => {
    let list = devisList
    if (filter !== 'Tous') list = list.filter(d => d.status === filter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(d =>
        (d.quoteNumber || '').toLowerCase().includes(q) ||
        (d.clientEmail || '').toLowerCase().includes(q) ||
        (d.type || '').toLowerCase().includes(q)
      )
    }
    return trierListe(list, sortKey, 'createdAt', 'totalTTC')
  }, [devisList, search, filter, sortKey])

  const filters = [
    { key: 'Tous', icon: FileText, color: '#60A5FA' },
    { key: 'En attente', icon: Clock, color: '#FBBF24' },
    { key: 'Approuvé', icon: CheckCircle2, color: '#34D399' },
    { key: 'Rejeté', icon: XCircle, color: '#F87171' },
  ]

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div className="animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Gérer Devis</h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Demandes de devis des clients</p>
      </div>

      {message && (
        <div className="px-4 py-2.5 rounded-2xl text-sm font-semibold badge-success animate-scale-in">{message}</div>
      )}

      <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un devis, un client..." dark />

      <div className="flex gap-2 flex-wrap items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {filters.map(f => {
            const Icon = f.icon
            const active = filter === f.key
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition active:scale-95 flex items-center gap-1.5 ${
                  active ? 'text-white' : ''
                }`}
                style={active
                  ? { background: `${f.color}20`, color: f.color, border: `1px solid ${f.color}40` }
                  : { background: 'var(--dark-surface)', border: '1px solid var(--dark-border)', color: 'var(--text-muted)' }
                }
              >
                <Icon size={14} /> {f.key}
              </button>
            )
          })}
        </div>
        <SortSelect value={sortKey} onChange={setSortKey} options={OPTIONS_TRI} dark />
      </div>

      {loading && (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="skeleton-dark h-40 rounded-2xl" />)}
        </div>
      )}

      {!loading && devisList.length === 0 && (
        <div className="card-dark p-10 text-center">
          <FileText size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-semibold text-white">Aucune demande de devis</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Les nouvelles demandes apparaîtront ici.</p>
        </div>
      )}

      {!loading && devisList.length > 0 && filteredDevis.length === 0 && (
        <div className="card-dark p-8 text-center" style={{ color: 'var(--text-muted)' }}>
          Aucun résultat pour cette recherche.
        </div>
      )}

      {!loading && filteredDevis.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredDevis.map((devis, i) => (
            <div key={devis.id} className="card-dark p-4 space-y-3 animate-fade-in" style={{ opacity: 0, animationDelay: `${i * 50}ms` }}>
              <div className="flex justify-between items-start gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">{devis.quoteNumber}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{devis.clientEmail || 'client'}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{formatDate(devis.createdAt)}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${badge(devis.status)}`}>
                  {devis.status}
                </span>
              </div>

              <div className="text-sm space-y-1.5" style={{ borderTop: '1px solid var(--dark-border)', paddingTop: '10px' }}>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>Type</span>
                  <span className="font-medium text-white">{devis.type}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-muted)' }}>Surface</span>
                  <span className="font-medium text-white">{devis.surface} m²</span>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ color: 'var(--text-muted)' }}>Montant</span>
                  {enEdition === devis.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number" autoFocus value={nouveauMontant}
                        onChange={(e) => setNouveauMontant(e.target.value)}
                        className="w-28 px-2 py-1 rounded-lg text-sm text-white text-right outline-none"
                        style={{ background: 'var(--dark-elevated)', border: '1px solid var(--gold)' }}
                        placeholder="FCFA"
                      />
                      <button onClick={() => enregistrerMontant(devis)} className="p-1.5 rounded-lg" style={{ background: 'rgba(52,211,153,0.15)', color: '#34D399' }}>
                        <Check size={14} />
                      </button>
                      <button onClick={() => setEnEdition(null)} className="p-1.5 rounded-lg" style={{ background: 'var(--dark-elevated)', color: 'var(--text-muted)' }}>
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold" style={{ color: 'var(--gold)' }}>{formatMontant(devis)}</span>
                      {devis.status !== 'Rejeté' && (
                        <button onClick={() => ouvrirEditionMontant(devis)} className="p-1 rounded-lg transition hover:bg-dark-700" style={{ color: 'var(--text-muted)' }} title="Modifier le montant">
                          <Pencil size={13} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {devis.description && (
                <p className="text-xs p-2.5 rounded-xl" style={{ background: 'var(--dark-elevated)', color: 'var(--text-secondary)' }}>{devis.description}</p>
              )}

              {devis.status !== 'Rejeté' && (
                <div className="flex gap-2">
                  <button onClick={() => ouvrirDetail(devis)}
                    className="flex-1 py-2 rounded-xl font-semibold text-xs transition btn-press flex items-center justify-center gap-1.5"
                    style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)', color: 'var(--text-secondary)' }}>
                    <ListPlus size={13} /> Détailler les lignes
                  </button>
                  <button onClick={() => genererPDF(devis)} disabled={pdfEnCours === devis.id}
                    className="flex-1 py-2 rounded-xl font-semibold text-xs transition btn-press disabled:opacity-50 flex items-center justify-center gap-1.5"
                    style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)', color: 'var(--gold)' }}>
                    <FileDown size={13} /> {pdfEnCours === devis.id ? 'Génération...' : 'PDF'}
                  </button>
                </div>
              )}

              {devis.status === 'En attente' ? (
                <div className="flex gap-2 pt-1">
                  <button onClick={() => decider(devis, 'Approuvé')}
                    className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition btn-press flex items-center justify-center gap-1.5"
                    style={{ background: 'rgba(52,211,153,0.15)', color: '#34D399' }}>
                    <Check size={16}/> Approuver
                  </button>
                  <button onClick={() => decider(devis, 'Rejeté')}
                    className="flex-1 py-2.5 rounded-xl font-semibold text-sm transition btn-press flex items-center justify-center gap-1.5"
                    style={{ background: 'rgba(248,113,113,0.15)', color: '#F87171' }}>
                    <X size={16}/> Rejeter
                  </button>
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <button onClick={() => decider(devis, 'En attente')}
                    className="w-full py-2 rounded-xl font-semibold text-xs transition btn-press flex items-center justify-center gap-1.5"
                    style={{ background: 'var(--dark-elevated)', color: 'var(--text-secondary)' }}>
                    <RotateCcw size={14}/> Remettre en attente
                  </button>

                  {devis.status === 'Approuvé' && (
                    devis.surDevis ? (
                      <p className="text-center text-xs p-2.5 rounded-xl" style={{ background: 'rgba(96,165,250,0.08)', color: 'var(--text-secondary)' }}>
                        ⚠️ Prix "sur devis" — clique sur le crayon ✏️ près du montant ci-dessus pour fixer le prix avant de créer la facture.
                      </p>
                    ) : devis.status === 'Signé' ? (
                      <p className="text-center text-xs font-semibold py-2 rounded-xl badge-success">✓ Signé par le client</p>
                    ) : (
                      <>
                        {devis.status !== 'En attente de signature' && (
                          <button onClick={() => envoyerPourSignature(devis)} disabled={lienSignatureEnCours === devis.id}
                            className="w-full py-2.5 rounded-xl font-semibold text-sm transition btn-press disabled:opacity-50 flex items-center justify-center gap-1.5"
                            style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.3)', color: '#60A5FA' }}>
                            <Send size={15}/> {lienSignatureEnCours === devis.id ? 'Génération...' : 'Envoyer pour signature'}
                          </button>
                        )}
                        {devis.status === 'En attente de signature' && (
                          <p className="text-center text-xs font-semibold py-2 rounded-xl" style={{ background: 'rgba(250,204,21,0.1)', color: '#FACC15' }}>
                            ⏳ En attente de signature client
                          </p>
                        )}
                        {lienSignature?.devisId === devis.id && (
                          <div className="rounded-xl p-3 space-y-2" style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }}>
                            <p className="text-xs font-semibold" style={{ color: 'var(--gold)' }}>Lien à envoyer sur WhatsApp :</p>
                            <p className="text-[11px] break-all" style={{ color: 'var(--text-secondary)' }}>{lienSignature.lien}</p>
                            <button onClick={() => copierLien(lienSignature.lien)}
                              className="w-full py-2 rounded-xl text-xs font-semibold btn-press flex items-center justify-center gap-1.5"
                              style={{ background: 'var(--gold)', color: '#060D18' }}>
                              <Copy size={13}/> Copier le lien
                            </button>
                          </div>
                        )}
                        {factures[devis.id] ? (
                          <p className="text-center text-xs font-semibold py-2 rounded-xl badge-success">Facture créée — visible chez le client</p>
                        ) : (
                          <button onClick={() => genererFacture(devis)}
                            className="w-full py-2.5 rounded-xl font-semibold text-sm transition btn-press flex items-center justify-center gap-1.5"
                            style={{ background: 'var(--gold)', color: '#060D18' }}>
                            <FileText size={15}/> Créer la facture
                          </button>
                        )}
                      </>
                    )
                  )}

                  {devis.status === 'Rejeté' && (
                    <button onClick={() => handleDelete(devis)}
                      className="w-full py-2 rounded-xl font-semibold text-xs transition btn-press flex items-center justify-center gap-1.5"
                      style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171' }}>
                      <Trash2 size={14}/> Supprimer
                    </button>
                  )}
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
              <p className="font-bold text-white">Détail du devis</p>
              <button onClick={() => setDetailEnEdition(null)} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--gold)' }}>NOM DU CLIENT</p>
                <input value={clientNomEdit} onChange={(e) => setClientNomEdit(e.target.value)}
                  placeholder="Nom du client (pour le PDF)" className="w-full px-2.5 py-2 rounded-lg text-xs text-white placeholder-[#4A5B73] outline-none"
                  style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }} />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold" style={{ color: 'var(--gold)' }}>OBJET DU DEVIS</p>
                  <button onClick={ameliorerDescription} disabled={ameliorationEnCours}
                    className="flex items-center gap-1 text-xs font-semibold disabled:opacity-50" style={{ color: 'var(--gold)' }}>
                    <Sparkles size={12} /> {ameliorationEnCours ? 'Amélioration...' : 'Améliorer avec l\'IA'}
                  </button>
                </div>
                <textarea value={descriptionEdit} onChange={(e) => setDescriptionEdit(e.target.value)} rows={3}
                  placeholder="Décris le projet..." className="w-full px-2.5 py-2 rounded-lg text-xs text-white placeholder-[#4A5B73] outline-none resize-none"
                  style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }} />
              </div>

              <div style={{ borderTop: '1px solid var(--dark-border)', paddingTop: '14px' }}>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--gold)' }}>MATÉRIAUX</p>
                <div className="space-y-2">
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
                </div>
                <button onClick={ajouterLigne} className="mt-2 flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--gold)' }}>
                  <Plus size={14} /> Ajouter une ligne
                </button>
                <p className="text-xs mt-2 text-right" style={{ color: 'var(--text-secondary)' }}>
                  Total matériaux : <span className="font-semibold" style={{ color: 'var(--gold)' }}>{totalLignesEdit.toLocaleString('fr-FR')} FCFA</span>
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--dark-border)', paddingTop: '14px' }}>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--gold)' }}>MAIN-D'ŒUVRE</p>
                <div className="space-y-2">
                  {lignesMainOeuvreEdit.map((ligne, i) => (
                    <div key={i} className="flex gap-1.5 items-center">
                      <input value={ligne.designation} onChange={(e) => modifierLigneMainOeuvre(i, 'designation', e.target.value)}
                        placeholder="Ex: Forfait pose & finition" className="flex-1 px-2.5 py-2 rounded-lg text-xs text-white placeholder-[#4A5B73] outline-none"
                        style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }} />
                      <input value={ligne.montant} onChange={(e) => modifierLigneMainOeuvre(i, 'montant', e.target.value)}
                        type="number" placeholder="Montant" className="w-24 px-2 py-2 rounded-lg text-xs text-white placeholder-[#4A5B73] outline-none"
                        style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }} />
                      <button onClick={() => supprimerLigneMainOeuvre(i)} className="p-2 rounded-lg shrink-0" style={{ color: '#F87171' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={ajouterLigneMainOeuvre} className="mt-2 flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--gold)' }}>
                  <Plus size={14} /> Ajouter une ligne
                </button>
                <p className="text-xs mt-2 text-right" style={{ color: 'var(--text-secondary)' }}>
                  Total main-d'œuvre : <span className="font-semibold" style={{ color: 'var(--gold)' }}>{totalMainOeuvreEdit.toLocaleString('fr-FR')} FCFA</span>
                </p>
              </div>

              <div className="rounded-xl p-3 text-right" style={{ background: 'rgba(246,195,68,0.1)' }}>
                <span className="text-sm font-bold" style={{ color: 'var(--gold)' }}>Total général : {totalGeneralEdit.toLocaleString('fr-FR')} FCFA</span>
              </div>

              <div style={{ borderTop: '1px solid var(--dark-border)', paddingTop: '14px' }}>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--gold)' }}>NE SONT PAS INCLUS <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(une ligne par exclusion)</span></p>
                <textarea value={exclusionsEdit} onChange={(e) => setExclusionsEdit(e.target.value)} rows={2}
                  placeholder={"Ex: Travaux d'electricite et luminaires\nTout autre travail non lie a cette prestation"}
                  className="w-full px-2.5 py-2 rounded-lg text-xs text-white placeholder-[#4A5B73] outline-none resize-none"
                  style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }} />
              </div>

              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--gold)' }}>MODALITÉS DE PAIEMENT <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(à définir pour CE devis, une ligne par échéance)</span></p>
                <textarea value={modalitesPaiementEdit} onChange={(e) => setModalitesPaiementEdit(e.target.value)} rows={2}
                  placeholder={"Ex: 80% au demarrage des travaux\n20% a la fin des travaux et satisfaction"}
                  className="w-full px-2.5 py-2 rounded-lg text-xs text-white placeholder-[#4A5B73] outline-none resize-none"
                  style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }} />
              </div>
            </div>

            <div className="p-3 shrink-0" style={{ borderTop: '1px solid var(--dark-border)' }}>
              <button onClick={() => enregistrerDetail(devisList.find(d => d.id === detailEnEdition))}
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
