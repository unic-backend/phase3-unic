import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTousDevis } from '../services/quoteService'
import { getToutesFactures } from '../services/invoiceService'
import { getTousProspects } from '../services/prospectService'
import { getTousProjets, ETAPES_CHANTIER } from '../services/projectService'
import { getTousAvis } from '../services/reviewService'
import { ListChecks, FileText, Receipt, Users2, Building2, Star, ChevronRight, CheckCircle2 } from 'lucide-react'

// Nombre de jours entre une date Firestore/ISO et aujourd'hui
function joursDepuis(dateVal) {
  if (!dateVal) return 0
  const ms = dateVal?.seconds ? dateVal.seconds * 1000 : new Date(dateVal).getTime()
  if (isNaN(ms)) return 0
  return Math.floor((Date.now() - ms) / 86400000)
}

/**
 * ATraiterAujourdhui — cockpit du matin de l'admin.
 * Analyse devis/factures/prospects/projets/avis et génère une liste
 * d'actions concrètes et cliquables. Aucune alerte inventée : tout vient
 * des vraies données.
 */
export default function ATraiterAujourdhui() {
  const [taches, setTaches] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    let actif = true
    async function analyser() {
      const [devis, factures, prospects, projets, avis] = await Promise.all([
        getTousDevis().catch(() => []),
        getToutesFactures().catch(() => []),
        getTousProspects().catch(() => []),
        getTousProjets().catch(() => []),
        getTousAvis().catch(() => []),
      ])
      if (!actif) return

      const liste = []

      // 1. Devis en attente depuis +3 jours
      const devisVieux = devis.filter(d => d.status === 'En attente' && joursDepuis(d.createdAt) >= 3)
      if (devisVieux.length > 0) {
        liste.push({
          id: 'devis-attente', icon: FileText, couleur: '#F6C344', bg: 'rgba(246,195,68,0.12)',
          texte: `${devisVieux.length} devis en attente depuis plus de 3 jours`,
          action: () => navigate('/admin/devis'), priorite: 2,
        })
      }

      // 2. Factures en retard (échéance dépassée, non payées)
      const facturesRetard = factures.filter(f => {
        if (f.status === 'Payée' || !f.dueDate) return false
        return new Date(f.dueDate) < new Date()
      })
      if (facturesRetard.length > 0) {
        liste.push({
          id: 'factures-retard', icon: Receipt, couleur: '#F87171', bg: 'rgba(248,113,113,0.12)',
          texte: `${facturesRetard.length} facture${facturesRetard.length > 1 ? 's' : ''} en retard à relancer`,
          action: () => navigate('/admin/factures'), priorite: 1,
        })
      }

      // 3. Prospects nouveaux non traités
      const prospectsChauds = prospects.filter(p => p.statut === 'nouveau')
      if (prospectsChauds.length > 0) {
        liste.push({
          id: 'prospects', icon: Users2, couleur: '#60A5FA', bg: 'rgba(96,165,250,0.12)',
          texte: `${prospectsChauds.length} nouveau${prospectsChauds.length > 1 ? 'x' : ''} prospect${prospectsChauds.length > 1 ? 's' : ''} à contacter`,
          action: () => navigate('/admin/prospects'), priorite: 2,
        })
      }

      // 4. Chantiers bloqués à la même étape depuis longtemps (>14j sans MAJ)
      const indexLivre = ETAPES_CHANTIER.indexOf('Livré')
      const chantiersBloc = projets.filter(p =>
        (p.etapeIndex ?? 0) < indexLivre && joursDepuis(p.updatedAt || p.createdAt) >= 14
      )
      if (chantiersBloc.length > 0) {
        liste.push({
          id: 'chantiers', icon: Building2, couleur: '#A78BFA', bg: 'rgba(167,139,250,0.12)',
          texte: `${chantiersBloc.length} chantier${chantiersBloc.length > 1 ? 's' : ''} sans avancement depuis 2 semaines`,
          action: () => navigate('/admin/projets'), priorite: 3,
        })
      }

      // 5. Avis en attente de validation
      const avisAttente = avis.filter(a => a.statut === 'en_attente')
      if (avisAttente.length > 0) {
        liste.push({
          id: 'avis', icon: Star, couleur: '#F6C344', bg: 'rgba(246,195,68,0.12)',
          texte: `${avisAttente.length} avis client${avisAttente.length > 1 ? 's' : ''} à valider`,
          action: () => navigate('/admin/avis'), priorite: 3,
        })
      }

      liste.sort((a, b) => a.priorite - b.priorite)
      setTaches(liste)
      setLoading(false)
    }
    analyser()
    return () => { actif = false }
  }, [navigate])

  if (loading) return <div className="skeleton-dark h-32 rounded-2xl" />

  return (
    <div className="card-glass p-5 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <ListChecks size={20} style={{ color: 'var(--gold)' }} />
        <h2 className="font-bold text-white">À traiter aujourd'hui</h2>
      </div>

      {taches.length === 0 ? (
        <div className="flex items-center gap-3 py-2">
          <CheckCircle2 size={22} style={{ color: '#34D399' }} />
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Tout est à jour, rien d'urgent. Bravo ! 🎉
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {taches.map(t => {
            const Icon = t.icon
            return (
              <button key={t.id} onClick={t.action}
                className="w-full flex items-center gap-3 p-3 rounded-xl transition text-left btn-press"
                style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: t.bg }}>
                  <Icon size={17} style={{ color: t.couleur }} />
                </div>
                <p className="flex-1 text-sm font-medium text-white">{t.texte}</p>
                <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
