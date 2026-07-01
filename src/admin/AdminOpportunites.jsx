import { useState, useEffect, useMemo } from 'react'
import {
  ajouterOpportunite, getToutesOpportunites, modifierOpportunite,
  supprimerOpportunite, changerStatut, changerPriorite,
  enregistrerAnalyseIA, ajouterNote, ajouterRappel, getRappelsEchus,
  construirePromptAnalyse,
  TYPES_OPPORTUNITE, STATUTS_OPPORTUNITE, PRIORITES,
  COULEURS_STATUT, COULEURS_PRIORITE,
} from '../services/opportuniteService'
import { demanderAssistant } from '../services/iaService'
import { uploadImagePublique } from '../utils/imageUpload'
import { CONNECTEURS, getConnecteur, getConnecteursFuturs } from '../connectors/index.js'
import {
  Briefcase, Plus, X, ExternalLink, Sparkles, Trash2, MapPin, Calendar,
  Bell, ChevronDown, ChevronUp, FileText, AlertTriangle, CheckCircle2,
  TrendingUp, Filter, Paperclip, Clock,
} from 'lucide-react'

const ic = "w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-[#4A5B73] outline-none bg-[#0C1829] border border-[rgba(255,255,255,0.06)]"

function fmtFCFA(n, devise = 'FCFA') {
  if (!n) return '—'
  return Math.round(Number(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ') + ' ' + devise
}

function joursRestants(deadline) {
  if (!deadline) return null
  return Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24))
}

function BadgeStatut({ statut, onClick }) {
  return (
    <button onClick={onClick}
      className="text-[10px] font-bold px-2 py-0.5 rounded-full transition"
      style={{ background: `${COULEURS_STATUT[statut]}20`, color: COULEURS_STATUT[statut], border: `1px solid ${COULEURS_STATUT[statut]}40` }}>
      {statut}
    </button>
  )
}

function BadgePriorite({ priorite }) {
  const couleur = COULEURS_PRIORITE[priorite] || '#9CA3AF'
  return (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: `${couleur}15`, color: couleur }}>
      {priorite === 'Haute' ? '↑' : priorite === 'Faible' ? '↓' : '→'} {priorite}
    </span>
  )
}

export default function AdminOpportunites() {
  const [opportunites, setOpportunites] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectionne, setSelectionne] = useState(null)
  const [onglet, setOnglet] = useState('liste') // 'liste' | 'sources'
  const [msg, setMsg] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [filtreStatut, setFiltreStatut] = useState('Tous')
  const [filtrePriorite, setFiltrePriorite] = useState('Toutes')
  const [analyseEnCours, setAnalyseEnCours] = useState(false)
  const [showRappelForm, setShowRappelForm] = useState(false)
  const [rappelForm, setRappelForm] = useState({ date: '', message: '' })
  const [noteTemp, setNoteTemp] = useState('')
  const [rappelsEchus, setRappelsEchus] = useState([])
  const [form, setForm] = useState({
    titre: '', description: '', type: TYPES_OPPORTUNITE[0],
    lienOriginal: '', 'localisation.pays': 'SN', 'localisation.ville': '',
    montantEstime: '', devise: 'FCFA',
    deadline: '', datePublication: new Date().toISOString().slice(0, 10),
    statut: 'Nouveau', priorite: 'Normale', tags: '', notes: '',
  })

  const flash = t => { setMsg(t); setTimeout(() => setMsg(''), 4000) }

  const charger = async () => {
    setLoading(true)
    const list = await getToutesOpportunites()
    setOpportunites(list)
    setRappelsEchus(getRappelsEchus(list))
    setLoading(false)
  }
  useEffect(() => { charger() }, [])

  // Rafraîchir le sélectionné quand la liste change
  useEffect(() => {
    if (selectionne) {
      const maj = opportunites.find(o => o.id === selectionne.id)
      if (maj) setSelectionne(maj)
    }
  }, [opportunites])

  const ajouter = async () => {
    if (!form.titre.trim()) { flash('Titre requis'); return }
    const data = {
      ...form,
      localisation: { pays: form['localisation.pays'] || 'SN', ville: form['localisation.ville'] || '' },
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    }
    const o = await ajouterOpportunite(data, 'manual', 'Saisie manuelle')
    if (o) {
      setOpportunites(prev => [o, ...prev])
      setShowForm(false)
      resetForm()
      flash('Opportunité ajoutée')
    }
  }

  const resetForm = () => setForm({
    titre: '', description: '', type: TYPES_OPPORTUNITE[0],
    lienOriginal: '', 'localisation.pays': 'SN', 'localisation.ville': '',
    montantEstime: '', devise: 'FCFA',
    deadline: '', datePublication: new Date().toISOString().slice(0, 10),
    statut: 'Nouveau', priorite: 'Normale', tags: '', notes: '',
  })

  const mettreAJourStatut = async (o, statut) => {
    if (await changerStatut(o.id, statut)) {
      const maj = { ...o, statut }
      setOpportunites(prev => prev.map(x => x.id === o.id ? maj : x))
    }
  }

  const mettreAJourPriorite = async (o, priorite) => {
    if (await changerPriorite(o.id, priorite)) {
      setOpportunites(prev => prev.map(x => x.id === o.id ? { ...x, priorite } : x))
    }
  }

  const analyserIA = async (o) => {
    setAnalyseEnCours(true)
    try {
      const texte = await demanderAssistant(construirePromptAnalyse(o))
      // Détecter un score approximatif et une recommandation dans la réponse
      const scoreMatch = texte.match(/(\d+)\s*\/\s*10/)
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 5
      const recommandation = texte.includes('GO') ? 'GO' : texte.includes('NO-GO') ? 'NO-GO' : 'À ÉTUDIER'
      await enregistrerAnalyseIA(o.id, { texte, score, recommandation })
      const maj = { ...o, analyseIA: { texte, score, recommandation, dateAnalyse: { seconds: Date.now()/1000 } } }
      setOpportunites(prev => prev.map(x => x.id === o.id ? maj : x))
    } catch (e) { flash('Erreur IA : ' + e.message) }
    setAnalyseEnCours(false)
  }

  const sauvegarderNote = async (o) => {
    if (await ajouterNote(o.id, noteTemp)) {
      setOpportunites(prev => prev.map(x => x.id === o.id ? { ...x, notes: noteTemp } : x))
      flash('Note sauvegardée')
    }
  }

  const ajouterRappelAction = async (o) => {
    if (!rappelForm.date) { flash('Date requise'); return }
    if (await ajouterRappel(o.id, rappelForm)) {
      const nouveauxRappels = [...(o.rappels||[]), { ...rappelForm, declenche: false }]
      setOpportunites(prev => prev.map(x => x.id === o.id ? { ...x, rappels: nouveauxRappels } : x))
      setShowRappelForm(false)
      setRappelForm({ date: '', message: '' })
      flash('Rappel ajouté')
    }
  }

  const supprimer = async (id) => {
    if (!window.confirm('Supprimer cette opportunité ?')) return
    if (await supprimerOpportunite(id)) {
      setOpportunites(prev => prev.filter(o => o.id !== id))
      setSelectionne(null)
      flash('Supprimée')
    }
  }

  const filtrees = useMemo(() => opportunites
    .filter(o => filtreStatut === 'Tous' || o.statut === filtreStatut)
    .filter(o => filtrePriorite === 'Toutes' || o.priorite === filtrePriorite),
  [opportunites, filtreStatut, filtrePriorite])

  const stats = useMemo(() => ({
    nouveau: opportunites.filter(o => o.statut === 'Nouveau').length,
    actif: opportunites.filter(o => ['En étude','En préparation','Soumis'].includes(o.statut)).length,
    gagne: opportunites.filter(o => o.statut === 'Gagné').length,
    valeurPotentielle: opportunites
      .filter(o => !['Perdu','Annulé'].includes(o.statut))
      .reduce((s,o) => s + (o.montantEstime||0), 0),
  }), [opportunites])

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      {/* En-tête */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
            <Briefcase size={26} style={{ color: 'var(--gold)' }} /> Opportunités
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {stats.nouveau} nouveau(x) · {stats.actif} en cours · {stats.gagne} gagné(s) · Valeur potentielle : <span style={{ color: 'var(--gold)' }}>{fmtFCFA(stats.valeurPotentielle)}</span>
          </p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold btn-press shrink-0"
          style={{ background: 'var(--gold)', color: '#060D18' }}>
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {msg && <div className="px-4 py-2.5 rounded-2xl text-sm font-semibold badge-success animate-fade-in">{msg}</div>}

      {/* Alertes rappels */}
      {rappelsEchus.length > 0 && (
        <div className="rounded-2xl p-3 space-y-1.5" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
          <div className="flex items-center gap-2" style={{ color: '#F87171' }}>
            <Bell size={15} /> <p className="text-sm font-bold">{rappelsEchus.length} rappel(s) actif(s)</p>
          </div>
          {rappelsEchus.slice(0, 3).map((r, i) => (
            <button key={i} onClick={() => setSelectionne(r.opportunite)}
              className="text-xs block w-full text-left pl-5" style={{ color: '#FCA5A5' }}>
              • {r.rappel.message || r.opportunite.titre} — {r.rappel.date}
            </button>
          ))}
        </div>
      )}

      {/* Onglets */}
      <div className="flex gap-2">
        {[['liste','Liste'],['sources','Sources futures']].map(([id, label]) => (
          <button key={id} onClick={() => setOnglet(id)}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition"
            style={onglet === id ? { background: 'var(--gold)', color: '#060D18' } : { background: 'var(--dark-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--dark-border)' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ═══ ONGLET SOURCES ═══ */}
      {onglet === 'sources' && (
        <div className="space-y-3">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Architecture modulaire prête pour l'intégration de nouvelles sources. Chaque connecteur s'ajoute sans modifier l'interface.
          </p>
          {CONNECTEURS.map(c => (
            <div key={c.id} className="card-dark p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{c.logo}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white">{c.nom}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={c.disponible ? { background: 'rgba(52,211,153,0.15)', color: '#34D399' } : { background: 'rgba(107,114,128,0.2)', color: '#9CA3AF' }}>
                        {c.disponible ? 'Actif' : 'À venir'}
                      </span>
                      {c.automatique && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(96,165,250,0.15)', color: '#60A5FA' }}>Auto</span>}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{c.description}</p>
                  </div>
                </div>
                {c.lienSource && (
                  <a href={c.lienSource} target="_blank" rel="noreferrer"
                    className="p-2 rounded-lg" style={{ color: 'var(--gold)' }}>
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
            </div>
          ))}
          <div className="card-dark p-4" style={{ border: '1px dashed rgba(242,194,0,0.3)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--gold)' }}>+ Connecteurs planifiés</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              ARMP Sénégal · Banque Mondiale · BAD · UN Global Marketplace · Google Alerts · Parsing email Gmail
              <br />Ajouter un connecteur = créer <code className="px-1 rounded" style={{ background: 'var(--dark-elevated)' }}>src/connectors/mon_source.js</code> et l'enregistrer dans <code className="px-1 rounded" style={{ background: 'var(--dark-elevated)' }}>index.js</code>.
            </p>
          </div>
        </div>
      )}

      {/* ═══ ONGLET LISTE ═══ */}
      {onglet === 'liste' && (
        <>
          {/* Filtres */}
          <div className="space-y-2">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {['Tous', ...STATUTS_OPPORTUNITE].map(s => (
                <button key={s} onClick={() => setFiltreStatut(s)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all"
                  style={filtreStatut === s ? { background: COULEURS_STATUT[s] || 'var(--gold)', color: '#060D18' } : { background: 'var(--dark-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--dark-border)' }}>
                  {s}
                </button>
              ))}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {['Toutes', ...PRIORITES].map(p => (
                <button key={p} onClick={() => setFiltrePriorite(p)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all"
                  style={filtrePriorite === p ? { background: COULEURS_PRIORITE[p] || 'var(--gold)', color: '#060D18' } : { background: 'var(--dark-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--dark-border)' }}>
                  {p === 'Toutes' ? 'Toutes priorités' : p}
                </button>
              ))}
            </div>
          </div>

          {loading && <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="skeleton-dark h-24 rounded-2xl" />)}</div>}

          {!loading && filtrees.length === 0 && (
            <div className="card-dark p-10 text-center">
              <Briefcase size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="font-semibold text-white">Aucune opportunité</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Ajoute manuellement les appels d'offres que tu trouves.</p>
            </div>
          )}

          <div className="space-y-2">
            {filtrees.map(o => {
              const jours = joursRestants(o.deadline)
              const urgente = jours !== null && jours <= 3 && jours >= 0
              return (
                <button key={o.id} onClick={() => { setSelectionne(o); setNoteTemp(o.notes || '') }}
                  className="card-dark p-4 w-full text-left transition hover:opacity-90"
                  style={urgente ? { borderLeft: '3px solid #F87171' } : {}}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <BadgeStatut statut={o.statut} onClick={e => { e.stopPropagation() }} />
                        <BadgePriorite priorite={o.priorite} />
                        <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          {getConnecteur(o.sourceId)?.logo} {o.sourceNom}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-white">{o.titre}</p>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        {o.localisation?.ville && <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><MapPin size={10} />{o.localisation.ville}</span>}
                        {o.deadline && (
                          <span className="text-xs flex items-center gap-1" style={{ color: urgente ? '#F87171' : 'var(--text-muted)' }}>
                            <Clock size={10} />
                            {urgente ? `⚡ ${jours}j restants` : `Deadline: ${o.deadline}`}
                          </span>
                        )}
                        {o.montantEstime > 0 && <span className="text-xs font-semibold" style={{ color: 'var(--gold)' }}>{fmtFCFA(o.montantEstime, o.devise)}</span>}
                        {o.analyseIA && (
                          <span className="text-xs flex items-center gap-1" style={{ color: o.analyseIA.recommandation === 'GO' ? '#34D399' : o.analyseIA.recommandation === 'NO-GO' ? '#F87171' : '#FACC15' }}>
                            <Sparkles size={10} /> {o.analyseIA.recommandation} ({o.analyseIA.score}/10)
                          </span>
                        )}
                      </div>
                    </div>
                    {(o.rappels?.length > 0 || o.documents?.length > 0) && (
                      <div className="flex gap-1 shrink-0">
                        {o.rappels?.length > 0 && <Bell size={14} style={{ color: 'var(--text-muted)' }} />}
                        {o.documents?.length > 0 && <Paperclip size={14} style={{ color: 'var(--text-muted)' }} />}
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}

      {/* ═══ DÉTAIL OPPORTUNITÉ ═══ */}
      {selectionne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="card-dark w-full max-w-lg max-h-[90vh] flex flex-col animate-fade-in">
            <div className="flex items-center justify-between p-4 shrink-0" style={{ borderBottom: '1px solid var(--dark-border)' }}>
              <p className="font-bold text-white truncate flex-1 mr-2">{selectionne.titre}</p>
              <button onClick={() => setSelectionne(null)} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Infos principales */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Type', val: selectionne.type },
                  { label: 'Source', val: `${getConnecteur(selectionne.sourceId)?.logo} ${selectionne.sourceNom}` },
                  { label: 'Localisation', val: [selectionne.localisation?.ville, selectionne.localisation?.pays].filter(Boolean).join(', ') || '—' },
                  { label: 'Montant', val: selectionne.montantEstime > 0 ? fmtFCFA(selectionne.montantEstime, selectionne.devise) : '—' },
                  { label: 'Deadline', val: selectionne.deadline || '—' },
                  { label: 'Publication', val: selectionne.datePublication || '—' },
                ].map(({ label, val }) => val && val !== '—' && (
                  <div key={label} className="card-dark p-2.5">
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{label}</p>
                    <p className="text-sm text-white font-medium">{val}</p>
                  </div>
                ))}
              </div>

              {selectionne.description && (
                <div>
                  <p className="text-xs font-semibold mb-1" style={{ color: 'var(--gold)' }}>DESCRIPTION</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{selectionne.description}</p>
                </div>
              )}

              {selectionne.lienOriginal && (
                <a href={selectionne.lienOriginal} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-sm" style={{ color: 'var(--gold)' }}>
                  <ExternalLink size={14} /> Voir l'annonce originale
                </a>
              )}

              {/* Changer statut */}
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--gold)' }}>STATUT</p>
                <div className="flex gap-1.5 flex-wrap">
                  {STATUTS_OPPORTUNITE.map(s => (
                    <button key={s} onClick={() => mettreAJourStatut(selectionne, s)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium transition"
                      style={selectionne.statut === s ? { background: `${COULEURS_STATUT[s]}25`, color: COULEURS_STATUT[s], border: `1px solid ${COULEURS_STATUT[s]}50` } : { background: 'var(--dark-elevated)', color: 'var(--text-muted)', border: '1px solid var(--dark-border)' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Changer priorité */}
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--gold)' }}>PRIORITÉ</p>
                <div className="flex gap-2">
                  {PRIORITES.map(p => (
                    <button key={p} onClick={() => mettreAJourPriorite(selectionne, p)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition"
                      style={selectionne.priorite === p ? { background: `${COULEURS_PRIORITE[p]}25`, color: COULEURS_PRIORITE[p], border: `1px solid ${COULEURS_PRIORITE[p]}50` } : { background: 'var(--dark-elevated)', color: 'var(--text-muted)', border: '1px solid var(--dark-border)' }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Analyse IA */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold" style={{ color: 'var(--gold)' }}>ANALYSE IA</p>
                  <button onClick={() => analyserIA(selectionne)} disabled={analyseEnCours}
                    className="flex items-center gap-1 text-xs font-semibold disabled:opacity-50" style={{ color: 'var(--gold)' }}>
                    <Sparkles size={12} /> {analyseEnCours ? 'Analyse...' : selectionne.analyseIA ? 'Relancer' : 'Analyser'}
                  </button>
                </div>
                {selectionne.analyseIA && (
                  <div className="rounded-xl p-3 text-sm whitespace-pre-wrap space-y-2" style={{ background: 'rgba(246,195,68,0.05)', border: '1px solid rgba(246,195,68,0.15)', color: 'white' }}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase" style={{ color: 'var(--gold)' }}>Score : {selectionne.analyseIA.score}/10</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: selectionne.analyseIA.recommandation === 'GO' ? 'rgba(52,211,153,0.15)' : selectionne.analyseIA.recommandation === 'NO-GO' ? 'rgba(248,113,113,0.15)' : 'rgba(250,204,21,0.15)', color: selectionne.analyseIA.recommandation === 'GO' ? '#34D399' : selectionne.analyseIA.recommandation === 'NO-GO' ? '#F87171' : '#FACC15' }}>
                        {selectionne.analyseIA.recommandation}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{selectionne.analyseIA.texte}</p>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--gold)' }}>NOTES</p>
                <textarea value={noteTemp} onChange={e => setNoteTemp(e.target.value)} rows={3}
                  placeholder="Ajoute des notes sur cette opportunité..."
                  className="w-full px-3 py-2 rounded-xl text-sm text-white placeholder-[#4A5B73] outline-none resize-none"
                  style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }} />
                <button onClick={() => sauvegarderNote(selectionne)} className="mt-2 text-xs font-semibold" style={{ color: 'var(--gold)' }}>
                  Sauvegarder la note
                </button>
              </div>

              {/* Rappels */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold" style={{ color: 'var(--gold)' }}>RAPPELS</p>
                  <button onClick={() => setShowRappelForm(!showRappelForm)} className="text-xs font-semibold" style={{ color: 'var(--gold)' }}>
                    + Ajouter
                  </button>
                </div>
                {showRappelForm && (
                  <div className="flex gap-2 mb-2">
                    <input type="date" value={rappelForm.date} onChange={e => setRappelForm({...rappelForm, date: e.target.value})}
                      className="flex-1 px-2.5 py-2 rounded-lg text-xs text-white outline-none"
                      style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }} />
                    <input value={rappelForm.message} onChange={e => setRappelForm({...rappelForm, message: e.target.value})}
                      placeholder="Message" className="flex-1 px-2.5 py-2 rounded-lg text-xs text-white outline-none placeholder-[#4A5B73]"
                      style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }} />
                    <button onClick={() => ajouterRappelAction(selectionne)}
                      className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: 'var(--gold)', color: '#060D18' }}>
                      OK
                    </button>
                  </div>
                )}
                {(selectionne.rappels || []).length === 0 && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Aucun rappel</p>}
                {(selectionne.rappels || []).map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <Bell size={11} /> {r.date} — {r.message || 'Rappel'}
                  </div>
                ))}
              </div>

              {/* Suppression */}
              <button onClick={() => supprimer(selectionne.id)}
                className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171' }}>
                <Trash2 size={15} /> Supprimer cette opportunité
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ FORMULAIRE AJOUT ═══ */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="card-dark p-5 w-full max-w-lg max-h-[90vh] flex flex-col animate-fade-in">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <p className="font-bold text-white">Nouvelle opportunité</p>
              <button onClick={() => { setShowForm(false); resetForm() }} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2.5">
              <input value={form.titre} onChange={e => setForm({...form, titre: e.target.value})} placeholder="Titre de l'opportunité *" className={ic} />
              <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3}
                placeholder="Description complète..." className={ic + ' resize-none'} />
              <div className="grid grid-cols-2 gap-2">
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className={ic}>
                  {TYPES_OPPORTUNITE.map(t => <option key={t}>{t}</option>)}
                </select>
                <select value={form.priorite} onChange={e => setForm({...form, priorite: e.target.value})} className={ic}>
                  {PRIORITES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input value={form['localisation.ville']} onChange={e => setForm({...form, 'localisation.ville': e.target.value})} placeholder="Ville" className={ic} />
                <input value={form['localisation.pays']} onChange={e => setForm({...form, 'localisation.pays': e.target.value})} placeholder="Pays (ex: SN)" className={ic} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" value={form.montantEstime} onChange={e => setForm({...form, montantEstime: e.target.value})} placeholder="Montant estimé" className={ic} />
                <select value={form.devise} onChange={e => setForm({...form, devise: e.target.value})} className={ic}>
                  {['FCFA','EUR','USD','GBP'].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Deadline</label>
                  <input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} className={ic} /></div>
                <div><label className="text-xs block mb-1" style={{ color: 'var(--text-muted)' }}>Publication</label>
                  <input type="date" value={form.datePublication} onChange={e => setForm({...form, datePublication: e.target.value})} className={ic} /></div>
              </div>
              <input value={form.lienOriginal} onChange={e => setForm({...form, lienOriginal: e.target.value})} placeholder="Lien vers l'annonce (optionnel)" className={ic} />
              <input value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} placeholder="Tags séparés par virgules (ex: Dakar, BA13, hôtel)" className={ic} />
              <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2}
                placeholder="Notes initiales..." className={ic + ' resize-none'} />
            </div>
            <button onClick={ajouter} className="mt-3 w-full py-2.5 rounded-xl font-semibold btn-press shrink-0" style={{ background: 'var(--gold)', color: '#060D18' }}>
              Enregistrer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
