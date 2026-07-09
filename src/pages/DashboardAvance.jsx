import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getDevisClient } from '../services/quoteService'
import { getFacturesClient } from '../services/invoiceService'
import { getProjetsClient, ETAPES_CHANTIER } from '../services/projectService'
import { getStoriesActives } from '../services/storyService'
import StoryViewer from '../components/StoryViewer'
import AnimatedNumber from '../components/AnimatedNumber'
import { FileText, Clock, CheckCircle2, Wallet, Building2, AlertTriangle, ArrowRight, Plus, ChevronRight, Images } from 'lucide-react'

function salutationDuMoment() {
  const h = new Date().getHours()
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

export default function DashboardAvance() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ totalDevis: 0, enAttente: 0, approuves: 0, totalEngaged: 0 })
  const [projets, setProjets] = useState([])
  const [loading, setLoading] = useState(true)
  const [barsReady, setBarsReady] = useState(false)
  const [stories, setStories] = useState([])
  const [viewerOuvert, setViewerOuvert] = useState(false)

  useEffect(() => {
    let actif = true
    async function charger() {
      if (!user?.id) { setLoading(false); return }
      const [devis, factures, projetsData, storiesData] = await Promise.all([
        getDevisClient(user.id), getFacturesClient(user.id), getProjetsClient(user.id), getStoriesActives()
      ])
      if (!actif) return
      setStories(storiesData)
      const totalDevis = devis.length
      const enAttente = devis.filter(d => d.status === 'En attente').length
      const approuves = devis.filter(d => d.status === 'Approuvé').length
      const totalEngaged = factures.filter(f => f.status !== 'Payée').reduce((sum, f) => sum + (f.amount || 0), 0)
      setStats({ totalDevis, enAttente, approuves, totalEngaged })
      setProjets(projetsData.map(p => ({
        id: p.id, name: p.name,
        description: ETAPES_CHANTIER[p.etapeIndex] || '',
        status: p.etapeIndex >= ETAPES_CHANTIER.length - 1 ? 'Livré' : 'En cours',
        progress: Math.round(((p.etapeIndex + 1) / ETAPES_CHANTIER.length) * 100)
      })))
      setLoading(false)
    }
    charger()
    return () => { actif = false }
  }, [user])

  useEffect(() => {
    if (!loading) { const t = setTimeout(() => setBarsReady(true), 100); return () => clearTimeout(t) }
  }, [loading])

  const prenom = (user?.nom || '').split(' ')[0]

  const cards = [
    { icon: FileText, label: 'Devis', value: stats.totalDevis, sub: `${stats.enAttente} en attente`, color: '#60A5FA', bg: 'rgba(96,165,250,0.12)' },
    { icon: Clock, label: 'En attente', value: stats.enAttente, sub: 'devis', color: '#FBBF24', bg: 'rgba(251,191,36,0.12)' },
    { icon: CheckCircle2, label: 'Approuvés', value: stats.approuves, sub: 'devis', color: '#34D399', bg: 'rgba(52,211,153,0.12)' },
    { icon: Wallet, label: 'À payer', value: stats.totalEngaged, isMoney: true, color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
  ]

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton-dark h-20 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="skeleton-dark h-28 rounded-2xl" />)}
        </div>
        <div className="skeleton-dark h-40 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">

      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          {salutationDuMoment()}{prenom ? `, ${prenom}` : ''} <span className="inline-block animate-[float_3s_ease-in-out_infinite]">👋</span>
        </h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Voici un résumé de vos activités</p>
      </div>

      {/* Stories UniC — visibles seulement s'il y en a d'actives */}
      {stories.length > 0 && (
        <div className="animate-fade-in">
          <button onClick={() => setViewerOuvert(true)} className="flex items-center gap-3 btn-press">
            <div className="relative w-16 h-16 rounded-full p-[3px]"
              style={{ background: 'linear-gradient(135deg, #C89B2F, #F6C344)' }}>
              <div className="w-full h-full rounded-full overflow-hidden" style={{ border: '2px solid var(--dark-bg)', background: '#000' }}>
                {stories[0].mediaType === 'video'
                  ? <video src={stories[0].mediaUrl} className="w-full h-full object-cover" muted />
                  : <img src={stories[0].mediaUrl} alt="Story" className="w-full h-full object-cover" />}
              </div>
              {stories.length > 1 && (
                <span className="absolute -bottom-1 -right-1 min-w-[22px] h-[22px] px-1 rounded-full text-[11px] font-bold flex items-center justify-center"
                  style={{ background: 'var(--gold)', color: '#060D18', border: '2px solid var(--dark-bg)' }}>
                  {stories.length}
                </span>
              )}
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-white">Nouveautés UniC ✨</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {stories.length} story{stories.length > 1 ? 's' : ''} à découvrir
              </p>
            </div>
          </button>
        </div>
      )}

      {viewerOuvert && (
        <StoryViewer stories={stories} startIndex={0} onClose={() => setViewerOuvert(false)} />
      )}

      {/* Quick Action */}
      <button onClick={() => navigate('/client/devis/new')}
        className="w-full flex items-center justify-between p-4 cta-gold animate-fade-in animation-delay-100"
        style={{ opacity: 0 }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-black/10 flex items-center justify-center">
            <Plus size={20} strokeWidth={2.5} />
          </div>
          <div className="text-left">
            <p className="font-extrabold text-sm tracking-tight">Demander un devis</p>
            <p className="text-xs opacity-60 font-medium">Obtenez une estimation gratuite</p>
          </div>
        </div>
        <ChevronRight size={20} />
      </button>

      {/* Lien Portfolio */}
      <button onClick={() => navigate('/client/portfolio')}
        className="w-full flex items-center justify-between p-4 rounded-3xl btn-press animate-fade-in"
        style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)', opacity: 0 }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(242,194,0,0.1)' }}>
            <Images size={20} style={{ color: 'var(--gold)' }} />
          </div>
          <div className="text-left">
            <p className="font-bold text-sm text-white">Nos réalisations</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Voir les projets terminés</p>
          </div>
        </div>
        <ChevronRight size={20} style={{ color: 'var(--text-muted)' }} />
      </button>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {cards.map((c, i) => {
          const Icon = c.icon
          return (
            <div key={i} className="card-glass p-4 animate-fade-in" style={{ opacity: 0, animationDelay: `${(i+2) * 80}ms` }}>
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3" style={{ background: c.bg, boxShadow: `0 4px 12px ${c.bg}` }}>
                <Icon size={20} strokeWidth={1.8} style={{ color: c.color }} />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>{c.label}</p>
              <p className="text-2xl font-extrabold text-white" style={{ letterSpacing: '-0.03em' }}>
                {c.isMoney ? (
                  <>{(c.value || 0).toLocaleString('fr-FR')} <span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>FCFA</span></>
                ) : (
                  <AnimatedNumber value={c.value} />
                )}
              </p>
              {c.sub && <p className="text-[11px] font-medium mt-1.5" style={{ color: c.color }}>{c.sub}</p>}
            </div>
          )
        })}
      </div>

      {/* Alerte Paiements */}
      {stats.totalEngaged > 0 && (
        <div className="rounded-2xl p-4 flex items-start gap-3 animate-fade-in animation-delay-400"
          style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', opacity: 0 }}>
          <AlertTriangle size={18} className="mt-0.5 shrink-0" style={{ color: '#FBBF24' }} />
          <div>
            <p className="font-semibold text-sm text-white">Paiements en attente</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {stats.totalEngaged.toLocaleString('fr-FR')} FCFA à honorer
            </p>
            <button onClick={() => navigate('/client/factures')}
              className="text-xs font-semibold mt-2 inline-flex items-center gap-1 btn-press" style={{ color: 'var(--gold)' }}>
              Voir les factures <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Projets */}
      <div className="animate-fade-in animation-delay-400" style={{ opacity: 0 }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-white">Vos projets en cours</h2>
          {projets.length > 0 && (
            <button onClick={() => navigate('/client/projets')} className="text-xs font-medium flex items-center gap-1 btn-press" style={{ color: 'var(--gold)' }}>
              Voir tout <ChevronRight size={14} />
            </button>
          )}
        </div>

        {projets.length === 0 ? (
          <div className="card-dark p-8 text-center">
            <Building2 size={32} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Aucun projet en cours</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Vos projets apparaîtront ici une fois lancés.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {projets.map((p, i) => (
              <button key={p.id} onClick={() => navigate('/client/projets')}
                className="w-full text-left card-dark p-4 btn-press animate-scale-in" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-white">{p.name}</h3>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.description}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${p.status === 'En cours' ? 'badge-info' : 'badge-success'}`}>
                    {p.status}
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--dark-elevated)' }}>
                  <div className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: barsReady ? `${p.progress}%` : '0%', background: 'linear-gradient(90deg, var(--gold-dim), var(--gold))' }} />
                </div>
                <p className="text-xs mt-1.5" style={{ color: 'var(--gold)' }}>{p.progress}% complété</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
