import { useState, useEffect, useMemo } from 'react'
import { getTousProjets } from '../services/projectService'
import { getTousDevis } from '../services/quoteService'
import { Calendar, ChevronLeft, ChevronRight, Building2 } from 'lucide-react'

const MOIS_NOM = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const JOURS = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']
const COULEURS_STATUT = { 'En cours': '#34D399', 'Terminé': '#60A5FA', 'En pause': '#FACC15', 'Planifié': '#A78BFA' }

function dateStr(ts) {
  if (!ts) return null
  if (typeof ts === 'string') return ts
  if (ts?.seconds) return new Date(ts.seconds * 1000).toISOString().slice(0, 10)
  return new Date(ts).toISOString().slice(0, 10)
}

export default function AdminCalendrier() {
  const [projets, setProjets] = useState([])
  const [devis, setDevis] = useState([])
  const [loading, setLoading] = useState(true)
  const [aujourd, setAujourd] = useState(new Date())
  const [selectionne, setSelectionne] = useState(null)

  useEffect(() => {
    Promise.all([getTousProjets(), getTousDevis()]).then(([p, d]) => {
      setProjets(p); setDevis(d); setLoading(false)
    })
  }, [])

  const annee = aujourd.getFullYear()
  const mois = aujourd.getMonth()
  const premierJour = new Date(annee, mois, 1)
  const dernierJour = new Date(annee, mois + 1, 0)

  // Décalage pour commencer lundi
  const debutCalendrier = new Date(premierJour)
  const jourSemaine = (premierJour.getDay() + 6) % 7
  debutCalendrier.setDate(debutCalendrier.getDate() - jourSemaine)

  const evenements = useMemo(() => {
    const evts = []
    projets.forEach(p => {
      if (p.dateDebut) evts.push({ date: dateStr(p.dateDebut), titre: p.name, type: 'Début', couleur: '#34D399', projet: p })
      if (p.dateFin) evts.push({ date: dateStr(p.dateFin), titre: p.name, type: 'Fin', couleur: '#F87171', projet: p })
    })
    devis.filter(d => ['Approuvé','Signé'].includes(d.status)).forEach(d => {
      const dateCreation = d.createdAt?.seconds ? new Date(d.createdAt.seconds * 1000).toISOString().slice(0, 10) : null
      if (dateCreation) evts.push({ date: dateCreation, titre: `Devis approuvé - ${d.clientNom || d.quoteNumber}`, type: 'Devis', couleur: '#F2C200', devis: d })
    })
    return evts
  }, [projets, devis])

  const evtsParDate = useMemo(() => {
    const map = {}
    evenements.forEach(e => { if (!map[e.date]) map[e.date] = []; map[e.date].push(e) })
    return map
  }, [evenements])

  const jours = []
  const cur = new Date(debutCalendrier)
  for (let i = 0; i < 42; i++) {
    jours.push(new Date(cur))
    cur.setDate(cur.getDate() + 1)
  }

  const moisPrecedent = () => setAujourd(new Date(annee, mois - 1, 1))
  const moisSuivant = () => setAujourd(new Date(annee, mois + 1, 1))
  const aujourdhui = new Date().toISOString().slice(0, 10)

  // Liste des événements du mois pour la vue liste en dessous
  const evtsMois = evenements
    .filter(e => e.date?.startsWith(`${annee}-${String(mois+1).padStart(2,'0')}`))
    .sort((a, b) => a.date.localeCompare(b.date))

  if (loading) return <div className="skeleton-dark h-96 rounded-2xl" />

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
          <Calendar size={26} style={{ color: 'var(--gold)' }} /> Calendrier
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Projets, chantiers et devis approuvés</p>
      </div>

      <div className="card-dark p-4">
        {/* Navigation mois */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={moisPrecedent} className="p-2 rounded-xl btn-press" style={{ background: 'var(--dark-elevated)', color: 'white' }}>
            <ChevronLeft size={18} />
          </button>
          <p className="text-lg font-bold text-white">{MOIS_NOM[mois]} {annee}</p>
          <button onClick={moisSuivant} className="p-2 rounded-xl btn-press" style={{ background: 'var(--dark-elevated)', color: 'white' }}>
            <ChevronRight size={18} />
          </button>
        </div>

        {/* En-têtes jours */}
        <div className="grid grid-cols-7 mb-2">
          {JOURS.map(j => <p key={j} className="text-center text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{j}</p>)}
        </div>

        {/* Grille calendrier */}
        <div className="grid grid-cols-7 gap-0.5">
          {jours.map((jour, i) => {
            const ds = jour.toISOString().slice(0, 10)
            const estMoisActuel = jour.getMonth() === mois
            const estAujourdhui = ds === aujourdhui
            const evts = evtsParDate[ds] || []
            return (
              <button key={i} onClick={() => evts.length && setSelectionne({ date: ds, evts })}
                className={`min-h-[44px] p-1 rounded-lg text-left transition ${evts.length ? 'hover:opacity-80' : ''}`}
                style={{ background: estAujourdhui ? 'rgba(242,194,0,0.12)' : 'transparent', border: estAujourdhui ? '1px solid rgba(242,194,0,0.4)' : '1px solid transparent' }}>
                <p className={`text-xs font-medium ${estAujourdhui ? '' : ''}`}
                  style={{ color: estAujourdhui ? 'var(--gold)' : estMoisActuel ? 'white' : 'var(--text-muted)' }}>
                  {jour.getDate()}
                </p>
                {evts.slice(0, 2).map((e, j) => (
                  <div key={j} className="mt-0.5 px-1 rounded text-[9px] truncate font-medium" style={{ background: `${e.couleur}25`, color: e.couleur }}>
                    {e.titre}
                  </div>
                ))}
                {evts.length > 2 && <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>+{evts.length-2}</p>}
              </button>
            )
          })}
        </div>
      </div>

      {/* Événements du mois */}
      {evtsMois.length > 0 && (
        <div className="card-dark p-4">
          <p className="text-sm font-bold text-white mb-3">Événements de {MOIS_NOM[mois]}</p>
          <div className="space-y-2">
            {evtsMois.map((e, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: e.couleur }} />
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{e.date.slice(8, 10)}/{e.date.slice(5, 7)}</p>
                <p className="text-sm text-white truncate flex-1">{e.titre}</p>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0" style={{ background: `${e.couleur}20`, color: e.couleur }}>{e.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {evtsMois.length === 0 && !loading && (
        <div className="card-dark p-8 text-center">
          <Calendar size={32} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Aucun événement ce mois-ci. Ajoute des dates de début/fin à tes projets.</p>
        </div>
      )}

      {/* Popup détail jour */}
      {selectionne && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setSelectionne(null)}>
          <div className="card-dark p-4 w-full max-w-sm animate-fade-in mb-safe" onClick={e => e.stopPropagation()}>
            <p className="font-bold text-white mb-3">{selectionne.date}</p>
            <div className="space-y-2">
              {selectionne.evts.map((e, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: e.couleur }} />
                  <div>
                    <p className="text-sm font-medium text-white">{e.titre}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{e.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
