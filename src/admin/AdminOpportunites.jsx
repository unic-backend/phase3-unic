import { useState, useEffect, useMemo } from 'react'
import { ajouterOpportunite, getToutesOpportunites, modifierStatutOpportunite, supprimerOpportunite, TYPES_OPPORTUNITE, STATUTS_OPPORTUNITE, SOURCES_OPPORTUNITE } from '../services/opportuniteService'
import { demanderAssistant } from '../services/iaService'
import { Search, Plus, X, ExternalLink, Sparkles, Trash2, MapPin, Calendar, DollarSign } from 'lucide-react'

const ic = "w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-[#4A5B73] outline-none bg-[#0C1829] border border-[rgba(255,255,255,0.06)]"

const COULEURS_STATUT = {
  'À étudier': '#F2C200', 'En cours de préparation': '#60A5FA', 'Soumis': '#A78BFA',
  'Gagné': '#34D399', 'Perdu': '#F87171', 'Annulé': '#6B7280'
}

const LIENS_SOURCES = {
  'DCMP Sénégal': 'https://www.dcmp.sn/marches/avis',
  'ARMP': 'https://www.armp.sn',
}

function fmtFCFA(n) {
  return Math.round(Number(n)||0).toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ') + ' FCFA'
}

export default function AdminOpportunites() {
  const [opportunites, setOpportunites] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectionne, setSelectionne] = useState(null)
  const [msg, setMsg] = useState('')
  const [filtreStatut, setFiltreStatut] = useState('Tous')
  const [analyseEnCours, setAnalyseEnCours] = useState(false)
  const [analyseTexte, setAnalyseTexte] = useState('')
  const [form, setForm] = useState({ titre: '', type: TYPES_OPPORTUNITE[0], source: SOURCES_OPPORTUNITE[0], lien: '', localisation: '', montantEstime: '', deadline: '', statut: 'À étudier', notes: '' })

  const flash = t => { setMsg(t); setTimeout(() => setMsg(''), 3000) }
  const charger = async () => { setLoading(true); setOpportunites(await getToutesOpportunites()); setLoading(false) }
  useEffect(() => { charger() }, [])

  const ajouter = async () => {
    if (!form.titre) { flash('Titre requis'); return }
    const o = await ajouterOpportunite(form)
    if (o) {
      setOpportunites(prev => [o, ...prev])
      setShowForm(false)
      setForm({ titre: '', type: TYPES_OPPORTUNITE[0], source: SOURCES_OPPORTUNITE[0], lien: '', localisation: '', montantEstime: '', deadline: '', statut: 'À étudier', notes: '' })
      flash('Opportunité ajoutée')
    }
  }

  const changerStatut = async (o, statut) => {
    if (await modifierStatutOpportunite(o.id, statut)) {
      setOpportunites(prev => prev.map(x => x.id === o.id ? { ...x, statut } : x))
      setSelectionne(prev => prev?.id === o.id ? { ...prev, statut } : prev)
    }
  }

  const supprimer = async (id) => {
    if (!window.confirm('Supprimer ?')) return
    if (await supprimerOpportunite(id)) { setOpportunites(prev => prev.filter(x => x.id !== id)); setSelectionne(null); flash('Supprimée') }
  }

  const analyserIA = async (o) => {
    setAnalyseEnCours(true)
    setAnalyseTexte('')
    const question = `Analyse cette opportunité de chantier pour UniC Plaquiste (plaquisterie, faux plafonds BA13, cloisons, décoration à Dakar) :
Titre : ${o.titre}
Type : ${o.type}
Localisation : ${o.localisation || 'non précisé'}
Montant estimé : ${o.montantEstime ? fmtFCFA(o.montantEstime) : 'non précisé'}
Deadline : ${o.deadline || 'non précisé'}
Notes : ${o.notes || 'aucune'}

Dis-moi : 1) Si cette opportunité est pertinente pour UniC Plaquiste 2) Les points de vigilance 3) La prochaine action recommandée. Sois concis.`
    try {
      const texte = await demanderAssistant(question)
      setAnalyseTexte(texte)
    } catch (e) { setAnalyseTexte('Erreur IA : ' + e.message) }
    setAnalyseEnCours(false)
  }

  const filtrees = useMemo(() => {
    if (filtreStatut === 'Tous') return opportunites
    return opportunites.filter(o => o.statut === filtreStatut)
  }, [opportunites, filtreStatut])

  const stats = useMemo(() => ({
    total: opportunites.length,
    aEtudier: opportunites.filter(o => o.statut === 'À étudier').length,
    gagnes: opportunites.filter(o => o.statut === 'Gagné').length,
    valeurPotentielle: opportunites.filter(o => !['Perdu','Annulé'].includes(o.statut)).reduce((s,o) => s+(o.montantEstime||0), 0),
  }), [opportunites])

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
            <Search size={26} style={{ color: 'var(--gold)' }} /> Appels d'offres
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {stats.total} opportunité(s) · {stats.aEtudier} à étudier · Valeur potentielle : <span style={{ color: 'var(--gold)' }}>{fmtFCFA(stats.valeurPotentielle)}</span>
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold btn-press" style={{ background: 'var(--gold)', color: '#060D18' }}>
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {msg && <div className="px-4 py-2.5 rounded-2xl text-sm font-semibold badge-success">{msg}</div>}

      {/* Liens sources officielles */}
      <div className="card-dark p-3">
        <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>SOURCES OFFICIELLES À CONSULTER</p>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(LIENS_SOURCES).map(([nom, url]) => (
            <a key={nom} href={url} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium btn-press"
              style={{ background: 'var(--dark-elevated)', color: 'var(--gold)', border: '1px solid rgba(242,194,0,0.2)' }}>
              <ExternalLink size={12} /> {nom}
            </a>
          ))}
          <a href="https://www.google.com/search?q=appel+offres+construction+Senegal+2026"
            target="_blank" rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium btn-press"
            style={{ background: 'var(--dark-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--dark-border)' }}>
            <Search size={12} /> Rechercher Google
          </a>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['Tous', ...STATUTS_OPPORTUNITE].map(s => (
          <button key={s} onClick={() => setFiltreStatut(s)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all"
            style={filtreStatut === s ? { background: COULEURS_STATUT[s] || 'var(--gold)', color: '#060D18' } : { background: 'var(--dark-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--dark-border)' }}>
            {s}
          </button>
        ))}
      </div>

      {loading && <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="skeleton-dark h-20 rounded-2xl" />)}</div>}

      {!loading && filtrees.length === 0 && (
        <div className="card-dark p-10 text-center">
          <Search size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-semibold text-white">Aucune opportunité</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Ajoute manuellement les appels d'offres que tu trouves sur les sites officiels.</p>
        </div>
      )}

      <div className="space-y-2">
        {filtrees.map(o => (
          <button key={o.id} onClick={() => { setSelectionne(o); setAnalyseTexte('') }} className="card-dark p-4 w-full text-left transition hover:opacity-90">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${COULEURS_STATUT[o.statut]}20`, color: COULEURS_STATUT[o.statut] }}>{o.statut}</span>
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{o.type}</span>
                </div>
                <p className="text-sm font-semibold text-white truncate">{o.titre}</p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {o.localisation && <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><MapPin size={10} />{o.localisation}</span>}
                  {o.deadline && <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}><Calendar size={10} />{o.deadline}</span>}
                  {o.montantEstime > 0 && <span className="text-xs font-semibold" style={{ color: 'var(--gold)' }}>{fmtFCFA(o.montantEstime)}</span>}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Détail opportunité */}
      {selectionne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="card-dark w-full max-w-md max-h-[85vh] flex flex-col animate-fade-in">
            <div className="flex items-center justify-between p-4 shrink-0" style={{ borderBottom: '1px solid var(--dark-border)' }}>
              <p className="font-bold text-white truncate">{selectionne.titre}</p>
              <button onClick={() => setSelectionne(null)} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                {selectionne.localisation && <div className="card-dark p-2.5"><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Lieu</p><p className="text-white">{selectionne.localisation}</p></div>}
                {selectionne.deadline && <div className="card-dark p-2.5"><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Deadline</p><p className="text-white">{selectionne.deadline}</p></div>}
                {selectionne.montantEstime > 0 && <div className="card-dark p-2.5"><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Montant estimé</p><p className="font-semibold" style={{ color: 'var(--gold)' }}>{fmtFCFA(selectionne.montantEstime)}</p></div>}
                <div className="card-dark p-2.5"><p className="text-xs" style={{ color: 'var(--text-muted)' }}>Source</p><p className="text-white">{selectionne.source}</p></div>
              </div>
              {selectionne.notes && <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{selectionne.notes}</p>}
              {selectionne.lien && <a href={selectionne.lien} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm" style={{ color: 'var(--gold)' }}><ExternalLink size={14}/> Voir l'annonce</a>}

              {/* Changer statut */}
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>STATUT</p>
                <div className="flex gap-1.5 flex-wrap">
                  {STATUTS_OPPORTUNITE.map(s => (
                    <button key={s} onClick={() => changerStatut(selectionne, s)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium transition"
                      style={selectionne.statut === s ? { background: `${COULEURS_STATUT[s]}25`, color: COULEURS_STATUT[s], border: `1px solid ${COULEURS_STATUT[s]}50` } : { background: 'var(--dark-elevated)', color: 'var(--text-muted)', border: '1px solid var(--dark-border)' }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Analyse IA */}
              <button onClick={() => analyserIA(selectionne)} disabled={analyseEnCours}
                className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 btn-press disabled:opacity-50"
                style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)', color: 'var(--gold)' }}>
                <Sparkles size={15} /> {analyseEnCours ? 'Analyse...' : 'Analyser avec l\'IA'}
              </button>
              {analyseTexte && (
                <div className="rounded-xl p-3 text-sm whitespace-pre-wrap" style={{ background: 'rgba(246,195,68,0.05)', border: '1px solid rgba(246,195,68,0.15)', color: 'white' }}>
                  <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--gold)' }}>
                    <Sparkles size={12} /> <span className="text-xs font-bold uppercase">Analyse IA</span>
                  </div>
                  {analyseTexte}
                </div>
              )}
              <button onClick={() => supprimer(selectionne.id)} className="w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2" style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171' }}>
                <Trash2 size={14} /> Supprimer
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
              <p className="font-bold text-white">Nouvelle opportunité</p>
              <button onClick={() => setShowForm(false)} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2.5">
              <input value={form.titre} onChange={e => setForm({...form, titre: e.target.value})} placeholder="Titre de l'appel d'offres" className={ic} />
              <div className="grid grid-cols-2 gap-2">
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} className={ic}>
                  {TYPES_OPPORTUNITE.map(t => <option key={t}>{t}</option>)}
                </select>
                <select value={form.source} onChange={e => setForm({...form, source: e.target.value})} className={ic}>
                  {SOURCES_OPPORTUNITE.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input value={form.localisation} onChange={e => setForm({...form, localisation: e.target.value})} placeholder="Localisation" className={ic} />
                <input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} className={ic} />
              </div>
              <input type="number" value={form.montantEstime} onChange={e => setForm({...form, montantEstime: e.target.value})} placeholder="Montant estimé (FCFA)" className={ic} />
              <input value={form.lien} onChange={e => setForm({...form, lien: e.target.value})} placeholder="Lien vers l'annonce (optionnel)" className={ic} />
              <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} placeholder="Notes..." className={ic + ' resize-none'} />
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
