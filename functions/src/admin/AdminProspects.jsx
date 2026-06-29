import { useState, useEffect, useMemo } from 'react'
import { getTousProspects, marquerProspectStatut } from '../services/prospectService'
import { calculerPrixUnitaire, calculerMontant, estSurDevis } from '../utils/pricing'
import { Users2, MessageCircle, X, MapPin, Ruler, Wallet, Clock, CheckCircle2, Circle } from 'lucide-react'

const LABELS_TYPE = {
  'faux-plafond': 'Faux plafond BA13',
  cloison: 'Cloison sèche',
  peinture: 'Peinture décoration',
  doublage: 'Doublage mural',
  corniche: 'Corniches décoratives',
  renovation: 'Rénovation complète',
}

function estimation(infos) {
  if (!infos?.typeProjet || !infos?.surfaceM2) return null
  if (estSurDevis(infos.typeProjet)) return 'Sur devis personnalisé'
  if (infos.avecPeinture === undefined || infos.avecPeinture === null) {
    const sans = calculerPrixUnitaire(infos.typeProjet, false)
    const avec = calculerPrixUnitaire(infos.typeProjet, true)
    if (sans === avec) return `~${calculerMontant(infos.typeProjet, infos.surfaceM2, false).toLocaleString('fr-FR')} FCFA (estimation)`
    return `${(infos.surfaceM2 * sans).toLocaleString('fr-FR')} – ${(infos.surfaceM2 * avec).toLocaleString('fr-FR')} FCFA selon finition (estimation)`
  }
  return `~${calculerMontant(infos.typeProjet, infos.surfaceM2, infos.avecPeinture).toLocaleString('fr-FR')} FCFA (estimation)`
}

function Ligne({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
      <Icon size={13} style={{ color: 'var(--text-muted)' }} />
      <span>{label}</span>
    </div>
  )
}

function FicheInfos({ infos }) {
  if (!infos) return null
  const est = estimation(infos)
  return (
    <div className="rounded-xl p-3 space-y-1.5 text-sm" style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }}>
      {infos.typeProjet && <Ligne icon={Ruler} label={LABELS_TYPE[infos.typeProjet] || infos.typeProjet} />}
      {infos.localisation && <Ligne icon={MapPin} label={infos.localisation} />}
      {infos.surfaceM2 && <Ligne icon={Ruler} label={`${infos.surfaceM2} m²${infos.avecPeinture === true ? ' · avec peinture' : infos.avecPeinture === false ? ' · sans peinture' : ''}`} />}
      {infos.budgetIndicatif && <Ligne icon={Wallet} label={`Budget client : ${infos.budgetIndicatif}`} />}
      {infos.delaiSouhaite && <Ligne icon={Clock} label={infos.delaiSouhaite} />}
      {infos.exigencesParticulieres && <p className="text-xs italic" style={{ color: 'var(--text-muted)' }}>"{infos.exigencesParticulieres}"</p>}
      {est && (
        <p className="text-sm font-semibold pt-1" style={{ color: 'var(--gold)', borderTop: '1px solid var(--dark-border)', marginTop: '6px', paddingTop: '8px' }}>
          💰 {est}
        </p>
      )}
    </div>
  )
}

export default function AdminProspects() {
  const [prospects, setProspects] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectionne, setSelectionne] = useState(null)
  const [filtre, setFiltre] = useState('Tous')

  const charger = async () => {
    setLoading(true)
    setProspects(await getTousProspects())
    setLoading(false)
  }
  useEffect(() => { charger() }, [])

  const formatDate = (d) => d?.seconds ? new Date(d.seconds * 1000).toLocaleString('fr-FR') : '-'
  const dernierMessage = (p) => {
    const msgs = p.messages || []
    return msgs.length ? msgs[msgs.length - 1].content : '(pas encore de message)'
  }

  const basculerStatut = async (p) => {
    const nouveau = p.statut === 'traite' ? 'nouveau' : 'traite'
    if (await marquerProspectStatut(p.id, nouveau)) {
      setProspects((prev) => prev.map((x) => x.id === p.id ? { ...x, statut: nouveau } : x))
      setSelectionne((prev) => prev && prev.id === p.id ? { ...prev, statut: nouveau } : prev)
    }
  }

  const filtres = [
    { key: 'Tous', icon: Users2 },
    { key: 'Nouveau', icon: Circle },
    { key: 'Traité', icon: CheckCircle2 },
  ]

  const prospectsFiltres = useMemo(() => {
    if (filtre === 'Nouveau') return prospects.filter((p) => p.statut !== 'traite')
    if (filtre === 'Traité') return prospects.filter((p) => p.statut === 'traite')
    return prospects
  }, [prospects, filtre])

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Prospects</h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          Visiteurs arrivés via le lien WhatsApp (app.unicplaquiste.com/discussion)
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filtres.map((f) => {
          const Icon = f.icon
          const actif = filtre === f.key
          return (
            <button key={f.key} onClick={() => setFiltre(f.key)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all"
              style={actif ? { background: 'var(--gold)', color: '#060D18' } : { background: 'var(--dark-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--dark-border)' }}>
              <Icon size={14} /> {f.key}
            </button>
          )
        })}
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton-dark h-24 rounded-2xl" />)}
        </div>
      )}

      {!loading && prospectsFiltres.length === 0 && (
        <div className="card-dark p-10 text-center">
          <Users2 size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-semibold text-white">Aucun prospect ici</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Envoie le lien <span className="font-mono">app.unicplaquiste.com/discussion</span> sur WhatsApp à un client pour démarrer.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {prospectsFiltres.map((p) => (
          <div key={p.id} className="card-dark p-4">
            <button onClick={() => setSelectionne(p)} className="w-full text-left">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {p.statut === 'traite'
                      ? <CheckCircle2 size={14} style={{ color: '#34D399' }} />
                      : <Circle size={14} style={{ color: 'var(--gold)' }} />}
                    <p className="text-xs font-semibold" style={{ color: p.statut === 'traite' ? '#34D399' : 'var(--gold)' }}>
                      {p.statut === 'traite' ? 'Traité' : 'Nouveau'}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-white truncate mt-1">{dernierMessage(p)}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {(p.messages || []).length} message(s) · {formatDate(p.updatedAt)}
                  </p>
                </div>
                <MessageCircle size={18} className="shrink-0" style={{ color: 'var(--text-muted)' }} />
              </div>
            </button>
            {p.infosCollectees && <FicheInfos infos={p.infosCollectees} />}
          </div>
        ))}
      </div>

      {/* Détail conversation */}
      {selectionne && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="card-dark w-full max-w-md max-h-[85vh] flex flex-col animate-fade-in">
            <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--dark-border)' }}>
              <p className="font-bold text-white">Conversation</p>
              <button onClick={() => setSelectionne(null)} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>

            {selectionne.infosCollectees && (
              <div className="p-4" style={{ borderBottom: '1px solid var(--dark-border)' }}>
                <FicheInfos infos={selectionne.infosCollectees} />
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
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

            <div className="p-3" style={{ borderTop: '1px solid var(--dark-border)' }}>
              <button onClick={() => basculerStatut(selectionne)}
                className="w-full py-2.5 rounded-xl font-semibold text-sm btn-press transition"
                style={selectionne.statut === 'traite'
                  ? { background: 'var(--dark-elevated)', color: 'var(--text-secondary)' }
                  : { background: 'var(--gold)', color: '#060D18' }}>
                {selectionne.statut === 'traite' ? 'Remettre en "Nouveau"' : '✓ Marquer comme traité'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
