import { useState, useEffect, useMemo } from 'react'
import {
  getTousProspects, marquerProspectStatut, enregistrerAnalyseIA,
  convertirProspectEnClient, supprimerProspect, STATUTS_PIPELINE, SOURCES_LABEL,
} from '../services/prospectService'
import { demanderAssistant } from '../services/iaService'
import { calculerPrixUnitaire, calculerMontant, estSurDevis } from '../utils/pricing'
import {
  Users2, MessageCircle, X, MapPin, Ruler, Wallet, Clock,
  Phone, Sparkles, ImageIcon, UserPlus, ChevronRight, FileText, Trash2,
} from 'lucide-react'

const LABELS_TYPE = {
  'faux-plafond': 'Faux plafond BA13',
  cloison: 'Cloison sèche',
  peinture: 'Peinture décoration',
  doublage: 'Doublage mural',
  corniche: 'Corniches décoratives',
  renovation: 'Rénovation complète',
}

// Map rapide couleur par statut id
const COULEUR_STATUT = Object.fromEntries(STATUTS_PIPELINE.map(s => [s.id, s.couleur]))
const LABEL_STATUT = Object.fromEntries(STATUTS_PIPELINE.map(s => [s.id, s.label]))

function estimation(infos) {
  if (!infos?.typeProjet || !infos?.surfaceM2) return null
  if (estSurDevis(infos.typeProjet)) return 'Sur devis personnalisé'
  if (infos.avecPeinture === undefined || infos.avecPeinture === null) {
    const sans = calculerPrixUnitaire(infos.typeProjet, false)
    const avec = calculerPrixUnitaire(infos.typeProjet, true)
    if (sans === avec) return `~${calculerMontant(infos.typeProjet, infos.surfaceM2, false).toLocaleString('fr-FR')} FCFA`
    return `${(infos.surfaceM2 * sans).toLocaleString('fr-FR')} – ${(infos.surfaceM2 * avec).toLocaleString('fr-FR')} FCFA selon finition`
  }
  return `~${calculerMontant(infos.typeProjet, infos.surfaceM2, infos.avecPeinture).toLocaleString('fr-FR')} FCFA`
}

function construireQuestionAnalyse(p) {
  const i = p.infosCollectees || {}
  const c = p.coordonnees || {}
  return `Voici une demande de devis reçue via ${SOURCES_LABEL[p.source] || p.source || 'source inconnue'} pour UniC Plaquiste. Résume-la en 2-3 phrases et propose une suggestion d'estimation interne si pertinent (c'est une suggestion à valider, jamais un devis officiel).

Client : ${c.nom || 'inconnu'} (${c.telephone || 'pas de numéro'})
Type de projet : ${i.typeProjet ? (LABELS_TYPE[i.typeProjet] || i.typeProjet) : 'non précisé'}
Surface : ${i.surfaceM2 ? i.surfaceM2 + ' m²' : 'non précisée'}
Peinture incluse : ${i.avecPeinture === true ? 'oui' : i.avecPeinture === false ? 'non' : 'non précisé'}
Localisation : ${i.localisation || 'non précisée'}
Budget indicatif client : ${i.budgetIndicatif || 'non précisé'}
Délai souhaité : ${i.delaiSouhaite || 'non précisé'}
Exigences particulières : ${i.exigencesParticulieres || 'aucune'}
Photos jointes : ${(p.photos || []).length}`
}

function BadgeSource({ source }) {
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: 'rgba(96,165,250,0.12)', color: '#93C5FD' }}>
      {SOURCES_LABEL[source] || source || '—'}
    </span>
  )
}

function BadgeStatut({ statut }) {
  const couleur = COULEUR_STATUT[statut] || '#9CA3AF'
  const label = LABEL_STATUT[statut] || statut || '—'
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: `${couleur}22`, color: couleur, border: `1px solid ${couleur}44` }}>
      {label}
    </span>
  )
}

function FicheInfos({ prospect }) {
  const infos = prospect.infosCollectees
  const coord = prospect.coordonnees
  const photos = prospect.photos || []
  if (!infos && !coord) return null
  const est = infos ? estimation(infos) : null
  return (
    <div className="rounded-xl p-3 space-y-1.5 text-sm"
      style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }}>
      {coord?.nom && (
        <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
          <Users2 size={13} style={{ color: 'var(--text-muted)' }} /><span>{coord.nom}</span>
        </div>
      )}
      {coord?.telephone && (
        <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
          <Phone size={13} style={{ color: 'var(--text-muted)' }} /><span>{coord.telephone}</span>
        </div>
      )}
      {coord?.email && coord.email !== coord.nom && (
        <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
          <MessageCircle size={13} style={{ color: 'var(--text-muted)' }} /><span className="text-xs truncate">{coord.email}</span>
        </div>
      )}
      {infos?.typeProjet && (
        <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
          <Ruler size={13} style={{ color: 'var(--text-muted)' }} /><span>{LABELS_TYPE[infos.typeProjet] || infos.typeProjet}</span>
        </div>
      )}
      {infos?.localisation && (
        <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
          <MapPin size={13} style={{ color: 'var(--text-muted)' }} /><span>{infos.localisation}</span>
        </div>
      )}
      {infos?.surfaceM2 && (
        <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
          <Ruler size={13} style={{ color: 'var(--text-muted)' }} />
          <span>{infos.surfaceM2} m²{infos.avecPeinture === true ? ' · avec peinture' : infos.avecPeinture === false ? ' · sans peinture' : ''}</span>
        </div>
      )}
      {infos?.budgetIndicatif && (
        <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
          <Wallet size={13} style={{ color: 'var(--text-muted)' }} /><span>Budget : {infos.budgetIndicatif}</span>
        </div>
      )}
      {infos?.delaiSouhaite && (
        <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
          <Clock size={13} style={{ color: 'var(--text-muted)' }} /><span>{infos.delaiSouhaite}</span>
        </div>
      )}
      {infos?.exigencesParticulieres && (
        <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>"{infos.exigencesParticulieres}"</p>
      )}
      {photos.length > 0 && (
        <div className="flex items-center gap-2 pt-1">
          <ImageIcon size={13} style={{ color: 'var(--text-muted)' }} />
          <div className="flex gap-1.5">
            {photos.map((url) => (
              <a key={url} href={url} target="_blank" rel="noreferrer">
                <img src={url} className="w-10 h-10 rounded-lg object-cover" alt="" />
              </a>
            ))}
          </div>
        </div>
      )}
      {est && (
        <p className="text-sm font-semibold pt-1" style={{
          color: 'var(--gold)',
          borderTop: '1px solid var(--dark-border)',
          marginTop: '6px',
          paddingTop: '8px',
        }}>
          💰 {est}
        </p>
      )}
      {prospect.devisNumero && (
        <div className="flex items-center gap-2 pt-1" style={{ color: '#34D399' }}>
          <FileText size={13} /><span className="text-xs">Devis lié : {prospect.devisNumero}</span>
        </div>
      )}
    </div>
  )
}

export default function AdminProspects() {
  const [prospects, setProspects] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectionne, setSelectionne] = useState(null)
  const [filtreStatut, setFiltreStatut] = useState('tous')
  const [filtreSource, setFiltreSource] = useState('toutes')
  const [analyseEnCours, setAnalyseEnCours] = useState(false)
  const [erreurAnalyse, setErreurAnalyse] = useState('')
  const [conversionEnCours, setConversionEnCours] = useState(false)
  const [erreurConversion, setErreurConversion] = useState('')

  const charger = async () => {
    setLoading(true)
    setProspects(await getTousProspects())
    setLoading(false)
  }
  useEffect(() => { charger() }, [])

  const formatDate = (d) => d?.seconds ? new Date(d.seconds * 1000).toLocaleString('fr-FR') : '—'

  const changerStatut = async (p, nouveauStatut) => {
    if (await marquerProspectStatut(p.id, nouveauStatut)) {
      setProspects((prev) => prev.map((x) => x.id === p.id ? { ...x, statut: nouveauStatut } : x))
      setSelectionne((prev) => prev?.id === p.id ? { ...prev, statut: nouveauStatut } : prev)
    }
  }

  const analyserAvecIA = async (p) => {
    setAnalyseEnCours(true)
    setErreurAnalyse('')
    try {
      const texte = await demanderAssistant(construireQuestionAnalyse(p))
      await enregistrerAnalyseIA(p.id, texte)
      const miseAJour = { analyseIA: { texte } }
      setProspects((prev) => prev.map((x) => x.id === p.id ? { ...x, ...miseAJour } : x))
      setSelectionne((prev) => prev?.id === p.id ? { ...prev, ...miseAJour } : prev)
    } catch (e) {
      setErreurAnalyse(e.message || 'Erreur lors de l\'analyse')
    } finally {
      setAnalyseEnCours(false)
    }
  }

  const convertirEnClient = async (p) => {
    if (!window.confirm(`Créer un compte client + un devis pour ${p.coordonnees?.nom || 'ce prospect'} ?`)) return
    setConversionEnCours(true)
    setErreurConversion('')
    try {
      const devis = await convertirProspectEnClient(p)
      const miseAJour = { statut: 'devis_en_cours', devisId: devis.id, devisNumero: devis.quoteNumber }
      setProspects((prev) => prev.map((x) => x.id === p.id ? { ...x, ...miseAJour } : x))
      setSelectionne((prev) => prev?.id === p.id ? { ...prev, ...miseAJour } : prev)
    } catch (e) {
      setErreurConversion(e.message || 'Erreur lors de la conversion')
    } finally {
      setConversionEnCours(false)
    }
  }

  const prospectsFiltres = useMemo(() => {
    return prospects
      .filter(p => filtreStatut === 'tous' || p.statut === filtreStatut)
      .filter(p => filtreSource === 'toutes' || p.source === filtreSource)
  }, [prospects, filtreStatut, filtreSource])

  const compteParStatut = useMemo(() => {
    const map = {}
    prospects.forEach(p => { map[p.statut] = (map[p.statut] || 0) + 1 })
    return map
  }, [prospects])

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Prospects</h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          Toutes les demandes — site public, app, clients connectés
        </p>
      </div>

      {/* Filtres source */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { id: 'toutes', label: 'Toutes sources' },
          { id: 'site_public', label: '🌐 Site public' },
          { id: 'app_anonyme', label: '📱 App visiteur' },
          { id: 'app_client', label: '👤 Client connecté' },
        ].map(s => (
          <button key={s.id} onClick={() => setFiltreSource(s.id)}
            className="px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all"
            style={filtreSource === s.id
              ? { background: 'var(--gold)', color: '#060D18' }
              : { background: 'var(--dark-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--dark-border)' }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Pipeline statuts */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        <button onClick={() => setFiltreStatut('tous')}
          className="px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all"
          style={filtreStatut === 'tous'
            ? { background: 'var(--gold)', color: '#060D18' }
            : { background: 'var(--dark-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--dark-border)' }}>
          Tous ({prospects.length})
        </button>
        {STATUTS_PIPELINE.map(s => {
          const count = compteParStatut[s.id] || 0
          if (count === 0 && filtreStatut !== s.id) return null
          return (
            <button key={s.id} onClick={() => setFiltreStatut(s.id)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all"
              style={filtreStatut === s.id
                ? { background: s.couleur, color: '#060D18' }
                : { background: 'var(--dark-elevated)', color: s.couleur, border: `1px solid ${s.couleur}33` }}>
              {s.label} {count > 0 ? `(${count})` : ''}
            </button>
          )
        })}
      </div>

      {loading && (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="skeleton-dark h-24 rounded-2xl" />)}
        </div>
      )}

      {!loading && prospectsFiltres.length === 0 && (
        <div className="card-dark p-10 text-center">
          <Users2 size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-semibold text-white">Aucun prospect ici</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Les demandes apparaissent ici dès qu'un visiteur remplit le formulaire public
            ou qu'un client connecté soumet une demande de devis.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {prospectsFiltres.map(p => (
          <div key={p.id} className="card-dark p-4">
            <button onClick={() => setSelectionne(p)} className="w-full text-left">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <BadgeStatut statut={p.statut || 'nouveau'} />
                    <BadgeSource source={p.source} />
                  </div>
                  <p className="text-sm font-medium text-white truncate">
                    {p.coordonnees?.nom || p.clientEmail || '(formulaire non rempli)'}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {(p.messages || []).length} message(s) · {formatDate(p.updatedAt)}
                  </p>
                </div>
                <ChevronRight size={16} className="shrink-0 mt-1" style={{ color: 'var(--text-muted)' }} />
              </div>
            </button>
            <FicheInfos prospect={p} />
          </div>
        ))}
      </div>

      {/* ═══ DÉTAIL PROSPECT ═══ */}
      {selectionne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="card-dark w-full max-w-md max-h-[85vh] flex flex-col animate-fade-in">
            <div className="flex items-center justify-between p-4 shrink-0"
              style={{ borderBottom: '1px solid var(--dark-border)' }}>
              <p className="font-bold text-white">Détail de la demande</p>
              <button onClick={() => setSelectionne(null)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Source + statut actuel */}
              <div className="flex items-center gap-2 flex-wrap">
                <BadgeStatut statut={selectionne.statut || 'nouveau'} />
                <BadgeSource source={selectionne.source} />
              </div>

              <FicheInfos prospect={selectionne} />

              {/* Pipeline statuts */}
              <div>
                <p className="text-xs font-semibold mb-2" style={{ color: 'var(--gold)' }}>CHANGER LE STATUT</p>
                <div className="flex gap-1.5 flex-wrap">
                  {STATUTS_PIPELINE.map(s => (
                    <button key={s.id} onClick={() => changerStatut(selectionne, s.id)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium transition"
                      style={selectionne.statut === s.id
                        ? { background: `${s.couleur}25`, color: s.couleur, border: `1px solid ${s.couleur}50` }
                        : { background: 'var(--dark-elevated)', color: 'var(--text-muted)', border: '1px solid var(--dark-border)' }}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Analyse IA */}
              {selectionne.analyseIA?.texte && (
                <div className="rounded-xl p-3 text-sm whitespace-pre-wrap"
                  style={{ background: 'rgba(246,195,68,0.08)', border: '1px solid rgba(246,195,68,0.2)', color: 'white' }}>
                  <div className="flex items-center gap-2 mb-1.5" style={{ color: 'var(--gold)' }}>
                    <Sparkles size={13} />
                    <span className="text-xs font-bold uppercase tracking-wide">Suggestion IA — à valider</span>
                  </div>
                  {selectionne.analyseIA.texte}
                </div>
              )}
              {erreurAnalyse && <p className="text-xs" style={{ color: '#F87171' }}>⚠️ {erreurAnalyse}</p>}
              {erreurConversion && <p className="text-xs" style={{ color: '#F87171' }}>⚠️ {erreurConversion}</p>}

              <button onClick={() => analyserAvecIA(selectionne)} disabled={analyseEnCours}
                className="w-full py-2.5 rounded-xl font-semibold text-sm btn-press disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)', color: 'var(--gold)' }}>
                <Sparkles size={15} />
                {analyseEnCours ? 'Analyse en cours...' : selectionne.analyseIA ? 'Relancer l\'analyse IA' : 'Analyser avec l\'IA'}
              </button>

              {/* Messages */}
              {(selectionne.messages || []).length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold" style={{ color: 'var(--gold)' }}>CONVERSATION</p>
                  {(selectionne.messages || []).map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap"
                        style={m.role === 'user'
                          ? { background: 'var(--gold)', color: '#060D18' }
                          : { background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)', color: 'white' }}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pied de modale */}
            <div className="p-3 shrink-0 space-y-2" style={{ borderTop: '1px solid var(--dark-border)' }}>
              {/* Conversion uniquement si pas encore de devis et pas client connecté */}
              {!selectionne.devisId && selectionne.source !== 'app_client' && selectionne.infosCollectees?.typeProjet && (
                <button onClick={() => convertirEnClient(selectionne)} disabled={conversionEnCours}
                  className="w-full py-2.5 rounded-xl font-semibold text-sm btn-press disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: 'var(--gold)', color: '#060D18' }}>
                  <UserPlus size={16} />
                  {conversionEnCours ? 'Création...' : 'Créer le compte client + le devis'}
                </button>
              )}
              <button
                onClick={async () => {
                  if (!window.confirm('Supprimer définitivement ce prospect ? Cette action est irréversible.')) return
                  if (await supprimerProspect(selectionne.id)) {
                    setProspects((prev) => prev.filter((x) => x.id !== selectionne.id))
                    setSelectionne(null)
                  } else {
                    window.alert('Suppression impossible. Vérifie que les règles Firestore ont été republiées.')
                  }
                }}
                className="w-full py-2 rounded-xl font-semibold text-xs btn-press flex items-center justify-center gap-1.5"
                style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171', border: '1px solid rgba(248,113,113,0.2)' }}>
                <Trash2 size={14} /> Supprimer ce prospect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
