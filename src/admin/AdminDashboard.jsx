import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getTousDevis } from '../services/quoteService'
import { getToutesFactures } from '../services/invoiceService'
import { getStatistiquesInscriptions } from '../services/userService'
import { getStoriesActives } from '../services/storyService'
import ATraiterAujourdhui from '../components/ATraiterAujourdhui'
import AnimatedNumber from '../components/AnimatedNumber'
import {
  FileText, Clock, CheckCircle2, Wallet, Users, Receipt,
  ChevronRight, TrendingUp, ArrowUpRight, Plus,
  Building2, Eye, UserPlus, Clapperboard
} from 'lucide-react'

export default function AdminDashboard() {
  const [devis, setDevis] = useState([])
  const [factures, setFactures] = useState([])
  const [inscriptions, setInscriptions] = useState({ total: 0, ceMois: 0 })
  const [nbStories, setNbStories] = useState(0)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    let actif = true
    async function charger() {
      const [listDevis, listFactures, statsInscriptions, storiesActives] = await Promise.all([
        getTousDevis(),
        getToutesFactures(),
        getStatistiquesInscriptions(),
        getStoriesActives()
      ])
      if (actif) {
        setDevis(listDevis)
        setFactures(listFactures)
        setInscriptions(statsInscriptions)
        setNbStories(storiesActives.length)
        setLoading(false)
      }
    }
    charger()
    return () => { actif = false }
  }, [])

  const enAttente = devis.filter(d => d.status === 'En attente').length
  const approuves = devis.filter(d => d.status === 'Approuvé').length
  const facturesPayees = factures.filter(f => f.status === 'Payée').length
  const revenus = factures
    .filter(f => f.status === 'Payée')
    .reduce((sum, f) => sum + (f.totalTTC || f.montant || 0), 0)

  const prenom = user?.displayName?.split(' ')[0] || 'Ousmane'

  const stats = [
    { icon: FileText, label: 'Devis', value: devis.length, sub: `${enAttente} en attente`, color: '#60A5FA', bg: 'rgba(96,165,250,0.12)' },
    { icon: Receipt, label: 'Factures', value: factures.length, sub: `${facturesPayees} payées`, color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
    { icon: Clock, label: 'En attente', value: enAttente, sub: `${enAttente} en attente`, color: '#FBBF24', bg: 'rgba(251,191,36,0.12)' },
    { icon: CheckCircle2, label: 'Approuvés', value: approuves, sub: 'Devis', color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
  ]

  const actions = [
    { icon: FileText, label: 'Gérer Devis', path: '/admin/devis', color: '#60A5FA' },
    { icon: Receipt, label: 'Gérer Factures', path: '/admin/factures', color: '#34D399' },
    { icon: Users, label: 'Gérer Clients', path: '/admin/clients', color: '#FBBF24' },
    { icon: Building2, label: 'Gérer Projets', path: '/admin/projets', color: '#A78BFA' },
  ]

  const badgeStyle = (s) =>
    s === 'En attente' ? 'badge-warning' :
    s === 'Approuvé' ? 'badge-success' :
    s === 'Rejeté' ? 'badge-danger' :
    'badge-info'

  const factBadge = (s) =>
    s === 'Payée' ? 'badge-success' :
    s === 'En attente' ? 'badge-warning' :
    s === 'Brouillon' ? 'badge-info' :
    'badge-danger'

  // Skeleton loader
  const SkeletonCard = () => (
    <div className="card-dark p-5">
      <div className="skeleton-dark w-10 h-10 rounded-xl mb-3" />
      <div className="skeleton-dark w-16 h-4 mb-2" />
      <div className="skeleton-dark w-12 h-7" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* ========== HEADER ========== */}
      <div className="animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Bonjour, {prenom} <span className="inline-block animate-[float_3s_ease-in-out_infinite]">👋</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)' }} className="mt-1">
          Voici un aperçu de votre activité
        </p>
      </div>

      {/* ========== À TRAITER AUJOURD'HUI ========== */}
      <ATraiterAujourdhui />

      {/* ========== CRÉER FACTURE — Mobile Quick Action ========== */}
      <button
        onClick={() => navigate('/admin/factures')}
        className="md:hidden w-full flex items-center justify-between p-4 cta-gold animate-fade-in animation-delay-100"
        style={{ opacity: 0 }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-black/10 flex items-center justify-center">
            <Plus size={20} strokeWidth={2.5} />
          </div>
          <div className="text-left">
            <p className="font-extrabold text-sm tracking-tight">Créer une facture</p>
            <p className="text-xs opacity-60 font-medium">Générez et envoyez une nouvelle facture</p>
          </div>
        </div>
        <ChevronRight size={20} />
      </button>

      {/* ========== CLIENTS INSCRITS ========== */}
      <button
        onClick={() => navigate('/admin/clients')}
        className="w-full card-glass p-5 flex items-center gap-4 text-left animate-fade-in"
        style={{ opacity: 0, animationDelay: '80ms' }}
      >
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(96,165,250,0.14)' }}>
          <UserPlus size={26} style={{ color: '#60A5FA' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Clients inscrits sur l'app
          </p>
          <p className="text-3xl font-extrabold text-white mt-0.5" style={{ letterSpacing: '-0.02em' }}>
            {loading ? '—' : <AnimatedNumber value={inscriptions.total} />}
          </p>
          {!loading && inscriptions.ceMois > 0 && (
            <p className="text-xs font-medium mt-0.5" style={{ color: '#34D399' }}>
              +{inscriptions.ceMois} ce mois-ci
            </p>
          )}
        </div>
        <ChevronRight size={20} style={{ color: 'var(--text-muted)' }} />
      </button>

      {/* ========== RACCOURCI STORIES ========== */}
      <button
        onClick={() => navigate('/admin/stories')}
        className="w-full card-glass p-5 flex items-center gap-4 text-left animate-fade-in"
        style={{ opacity: 0, animationDelay: '120ms' }}
      >
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(246,195,68,0.14)' }}>
          <Clapperboard size={26} style={{ color: 'var(--gold)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Mes stories
          </p>
          <p className="text-lg font-extrabold text-white mt-0.5">
            {loading ? '—' : nbStories > 0 ? `${nbStories} story${nbStories > 1 ? 's' : ''} active${nbStories > 1 ? 's' : ''}` : 'Aucune story active'}
          </p>
          <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--gold)' }}>
            Publier · voir les vues et les clics
          </p>
        </div>
        <ChevronRight size={20} style={{ color: 'var(--text-muted)' }} />
      </button>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {loading ? (
          <>
            <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
          </>
        ) : stats.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <div
              key={idx}
              className="card-glass p-4 md:p-5 animate-fade-in"
              style={{ opacity: 0, animationDelay: `${idx * 80}ms` }}
            >
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: stat.bg, boxShadow: `0 4px 12px ${stat.bg}` }}>
                <Icon size={20} strokeWidth={1.8} style={{ color: stat.color }} />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
                {stat.label}
              </p>
              <p className="text-2xl md:text-3xl font-extrabold text-white" style={{ letterSpacing: '-0.03em' }}>
                <AnimatedNumber value={stat.value} />
              </p>
              <p className="text-[11px] font-medium mt-1.5" style={{ color: stat.color }}>
                {stat.sub}
              </p>
            </div>
          )
        })}
      </div>

      {/* ========== REVENUS ========== */}
      {!loading && (
        <div className="card-glass p-5 md:p-6 animate-fade-in animation-delay-300" style={{ opacity: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Revenus</p>
              <p className="text-2xl md:text-3xl font-bold text-white mt-1">
                <AnimatedNumber value={revenus} /> <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>FCFA</span>
              </p>
            </div>
            {revenus > 0 && (
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-full" style={{ background: 'rgba(52,211,153,0.12)' }}>
                <TrendingUp size={14} className="text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400">Actif</span>
              </div>
            )}
          </div>
          {/* Barre de progression des paiements */}
          <div className="mt-2">
            <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
              <span>{facturesPayees} factures payées</span>
              <span>{factures.length} total</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--dark-elevated)' }}>
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: factures.length > 0 ? `${(facturesPayees / factures.length) * 100}%` : '0%',
                  background: 'linear-gradient(90deg, #34D399, #059669)'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========== QUICK ACTIONS ========== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {actions.map((a, i) => {
          const Icon = a.icon
          return (
            <button
              key={i}
              onClick={() => navigate(a.path)}
              className="card-dark p-4 flex flex-col items-center gap-2.5 btn-press animate-fade-in"
              style={{ opacity: 0, animationDelay: `${400 + i * 60}ms` }}
            >
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: `${a.color}15` }}>
                <Icon size={20} style={{ color: a.color }} />
              </div>
              <span className="text-xs font-medium text-white">{a.label}</span>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ========== FACTURES RÉCENTES ========== */}
        <div className="card-dark p-5 md:p-6 animate-fade-in animation-delay-400" style={{ opacity: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Factures récentes</h2>
            <button onClick={() => navigate('/admin/factures')}
              className="text-xs font-medium flex items-center gap-1 btn-press" style={{ color: 'var(--gold)' }}>
              Voir tout <ChevronRight size={14} />
            </button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="skeleton-dark h-16 rounded-xl" />)}
            </div>
          ) : factures.length === 0 ? (
            <div className="text-center py-8">
              <Receipt size={32} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Aucune facture</p>
            </div>
          ) : (
            <div className="space-y-2">
              {factures.slice(0, 5).map((f, i) => (
                <div key={f.id}
                  className="flex items-center justify-between p-3 rounded-xl transition-all hover:bg-dark-700 animate-scale-in"
                  style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(52,211,153,0.12)' }}>
                      <Receipt size={16} className="text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{f.invoiceNumber || f.id?.slice(0,8)}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{f.clientEmail?.split('@')[0] || 'Client'}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-sm font-semibold" style={{ color: 'var(--gold)' }}>
                      {(f.totalTTC || f.montant || 0).toLocaleString('fr-FR')} FCFA
                    </p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${factBadge(f.status)}`}>
                      {f.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ========== DERNIERS DEVIS ========== */}
        <div className="card-dark p-5 md:p-6 animate-fade-in animation-delay-400" style={{ opacity: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">Derniers devis</h2>
            <button onClick={() => navigate('/admin/devis')}
              className="text-xs font-medium flex items-center gap-1 btn-press" style={{ color: 'var(--gold)' }}>
              Voir tout <ChevronRight size={14} />
            </button>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="skeleton-dark h-16 rounded-xl" />)}
            </div>
          ) : devis.length === 0 ? (
            <div className="text-center py-8">
              <FileText size={32} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Aucun devis</p>
            </div>
          ) : (
            <div className="space-y-2">
              {devis.slice(0, 5).map((d, i) => (
                <div key={d.id}
                  className="flex items-center justify-between p-3 rounded-xl transition-all hover:bg-dark-700 animate-scale-in"
                  style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(96,165,250,0.12)' }}>
                      <FileText size={16} className="text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{d.quoteNumber}</p>
                      <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{d.clientEmail?.split('@')[0] || d.title}</p>
                    </div>
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 ml-2 ${badgeStyle(d.status)}`}>
                    {d.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <NettoyageDemo onNettoyage={() => { setDevis([]); setFactures([]) }} />
    </div>
  )
}

// ── Nettoyage données démo — composant autonome ──────────────────────────────
function NettoyageDemo({ onNettoyage }) {
  const [etape, setEtape] = useState(0) // 0=bouton, 1=confirmation, 2=en cours, 3=done
  const [msg, setMsg] = useState('')

  const lancer = async () => {
    setEtape(2)
    try {
      const { getTousDevis, supprimerDevis } = await import('../services/quoteService')
      const { getToutesFactures, supprimerFacture } = await import('../services/invoiceService')
      const [devis, factures] = await Promise.all([getTousDevis(), getToutesFactures()])
      let supprimesCount = 0
      for (const d of devis) { try { await supprimerDevis(d.id); supprimesCount++ } catch {} }
      for (const f of factures) { try { await supprimerFacture(f.id); supprimesCount++ } catch {} }
      setMsg(`${supprimesCount} document(s) supprimé(s)`)
      setEtape(3)
      onNettoyage()
    } catch (e) {
      setMsg('Erreur : ' + e.message)
      setEtape(0)
    }
  }

  if (etape === 3) return (
    <div className="card-dark p-4 text-center" style={{ border: '1px solid rgba(52,211,153,0.2)' }}>
      <p className="text-sm font-semibold" style={{ color: '#34D399' }}>✓ {msg}</p>
      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Données supprimées. Tu peux maintenant créer tes vrais devis et factures.</p>
    </div>
  )

  return (
    <div className="card-dark p-4" style={{ border: '1px solid rgba(248,113,113,0.15)' }}>
      <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>NETTOYAGE DES DONNÉES DE DÉMONSTRATION</p>
      {etape === 0 && (
        <button onClick={() => setEtape(1)}
          className="w-full py-2.5 rounded-xl text-sm font-semibold btn-press flex items-center justify-center gap-2"
          style={{ background: 'rgba(248,113,113,0.08)', color: '#F87171', border: '1px solid rgba(248,113,113,0.2)' }}>
          🗑️ Supprimer tous les devis et factures de démo
        </button>
      )}
      {etape === 1 && (
        <div className="space-y-2">
          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>⚠️ Cette action supprimera <strong className="text-white">définitivement</strong> tous les devis et factures. Continue ?</p>
          <div className="flex gap-2">
            <button onClick={() => setEtape(0)} className="flex-1 py-2 rounded-xl text-sm font-semibold btn-press" style={{ background: 'var(--dark-elevated)', color: 'var(--text-secondary)' }}>Annuler</button>
            <button onClick={lancer} className="flex-1 py-2 rounded-xl text-sm font-semibold btn-press" style={{ background: '#F87171', color: 'white' }}>Oui, tout supprimer</button>
          </div>
        </div>
      )}
      {etape === 2 && <p className="text-sm text-center" style={{ color: 'var(--text-muted)' }}>Suppression en cours...</p>}
    </div>
  )
}
