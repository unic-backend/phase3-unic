import { useState, useEffect, useMemo } from 'react'
import { getToutesFactures } from '../services/invoiceService'
import { getTousDevis } from '../services/quoteService'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, DollarSign, FileText, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

const MOIS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
const COULEURS = ['#F2C200', '#60A5FA', '#34D399', '#F87171', '#A78BFA', '#FB923C']

function fmtFCFA(n) {
  return Math.round(Number(n)||0).toString().replace(/\B(?=(\d{3})+(?!\d))/g,' ') + ' FCFA'
}

function Kpi({ icon: Icon, label, valeur, sous, couleur }) {
  return (
    <div className="card-dark p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${couleur}18` }}>
        <Icon size={20} style={{ color: couleur }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <p className="text-lg font-bold text-white truncate">{valeur}</p>
        {sous && <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{sous}</p>}
      </div>
    </div>
  )
}

const TooltipCustom = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 text-xs" style={{ background: '#0D1B4B', border: '1px solid var(--dark-border)' }}>
      <p className="font-semibold text-white mb-1">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{p.name} : {fmtFCFA(p.value)}</p>)}
    </div>
  )
}

export default function AdminDashboardFinancier() {
  const [factures, setFactures] = useState([])
  const [devis, setDevis] = useState([])
  const [loading, setLoading] = useState(true)
  const [annee, setAnnee] = useState(new Date().getFullYear())

  useEffect(() => {
    Promise.all([getToutesFactures(), getTousDevis()]).then(([f, d]) => {
      setFactures(f); setDevis(d); setLoading(false)
    })
  }, [])

  const stats = useMemo(() => {
    const facturesAnnee = factures.filter(f => {
      const d = f.issueDate ? new Date(f.issueDate) : f.createdAt?.seconds ? new Date(f.createdAt.seconds*1000) : null
      return d && d.getFullYear() === annee
    })
    const revenuMensuel = Array.from({ length: 12 }, (_, m) => {
      const payees = facturesAnnee.filter(f => f.status === 'Payée' && (f.issueDate ? new Date(f.issueDate).getMonth() : new Date((f.createdAt?.seconds||0)*1000).getMonth()) === m)
      const enAttente = facturesAnnee.filter(f => f.status !== 'Payée' && (f.issueDate ? new Date(f.issueDate).getMonth() : new Date((f.createdAt?.seconds||0)*1000).getMonth()) === m)
      return {
        mois: MOIS[m],
        'Encaissé': payees.reduce((s,f) => s+(f.amount||0), 0),
        'En attente': enAttente.reduce((s,f) => s+(f.amount||0), 0),
      }
    })
    const totalEncaisse = facturesAnnee.filter(f => f.status === 'Payée').reduce((s,f) => s+(f.amount||0), 0)
    const totalEnAttente = facturesAnnee.filter(f => f.status !== 'Payée').reduce((s,f) => s+(f.amount||0), 0)
    const nbDevisApprouves = devis.filter(d => ['Approuvé','Signé'].includes(d.status)).length
    const nbDevisEnAttente = devis.filter(d => d.status === 'En attente').length
    const txConversion = devis.length ? Math.round((nbDevisApprouves/devis.length)*100) : 0

    const pieData = [
      { name: 'Encaissé', value: totalEncaisse },
      { name: 'En attente', value: totalEnAttente },
    ].filter(d => d.value > 0)

    const typeDevis = {}
    devis.forEach(d => { const t = d.type||'Autre'; typeDevis[t] = (typeDevis[t]||0)+1 })
    const pieDevis = Object.entries(typeDevis).map(([name, value]) => ({ name, value }))

    return { revenuMensuel, totalEncaisse, totalEnAttente, nbDevisApprouves, nbDevisEnAttente, txConversion, pieData, pieDevis, nbFactures: facturesAnnee.length }
  }, [factures, devis, annee])

  const annees = useMemo(() => {
    const set = new Set()
    factures.forEach(f => { const d = f.issueDate ? new Date(f.issueDate) : f.createdAt?.seconds ? new Date(f.createdAt.seconds*1000) : null; if(d) set.add(d.getFullYear()) })
    const a = [...set].sort((a,b) => b-a)
    if (!a.includes(new Date().getFullYear())) a.unshift(new Date().getFullYear())
    return a
  }, [factures])

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      {[1,2,3].map(i => <div key={i} className="skeleton-dark h-24 rounded-2xl" />)}
    </div>
  )

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
            <TrendingUp size={26} style={{ color: 'var(--gold)' }} /> Dashboard Financier
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Vue d'ensemble de la santé financière de UniC Plaquiste</p>
        </div>
        <select value={annee} onChange={e => setAnnee(Number(e.target.value))}
          className="px-3 py-2 rounded-xl text-sm font-semibold text-white outline-none"
          style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }}>
          {annees.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={CheckCircle2} label="Encaissé" valeur={fmtFCFA(stats.totalEncaisse)} couleur="#34D399" />
        <Kpi icon={Clock} label="En attente" valeur={fmtFCFA(stats.totalEnAttente)} couleur="#FACC15" />
        <Kpi icon={FileText} label="Devis acceptés" valeur={stats.nbDevisApprouves} sous={`${stats.txConversion}% de conversion`} couleur="#F2C200" />
        <Kpi icon={AlertCircle} label="Devis en attente" valeur={stats.nbDevisEnAttente} couleur="#60A5FA" />
      </div>

      {/* Graphique revenus mensuels */}
      <div className="card-dark p-4">
        <p className="text-sm font-bold text-white mb-4">Revenus mensuels {annee}</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={stats.revenuMensuel} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="mois" tick={{ fill: '#4A5B73', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#4A5B73', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
            <Tooltip content={<TooltipCustom />} />
            <Bar dataKey="Encaissé" fill="#34D399" radius={[4,4,0,0]} />
            <Bar dataKey="En attente" fill="#FACC15" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Répartition factures */}
        {stats.pieData.length > 0 && (
          <div className="card-dark p-4">
            <p className="text-sm font-bold text-white mb-3">Répartition des factures</p>
            <div className="flex items-center gap-4">
              <PieChart width={100} height={100}>
                <Pie data={stats.pieData} cx={45} cy={45} innerRadius={28} outerRadius={45} dataKey="value" strokeWidth={0}>
                  {stats.pieData.map((_, i) => <Cell key={i} fill={['#34D399','#FACC15'][i]} />)}
                </Pie>
              </PieChart>
              <div className="space-y-2 flex-1">
                {stats.pieData.map((d, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: ['#34D399','#FACC15'][i] }} />
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-white">{fmtFCFA(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Types de devis */}
        {stats.pieDevis.length > 0 && (
          <div className="card-dark p-4">
            <p className="text-sm font-bold text-white mb-3">Types de projets</p>
            <div className="flex items-center gap-4">
              <PieChart width={100} height={100}>
                <Pie data={stats.pieDevis} cx={45} cy={45} innerRadius={28} outerRadius={45} dataKey="value" strokeWidth={0}>
                  {stats.pieDevis.map((_, i) => <Cell key={i} fill={COULEURS[i % COULEURS.length]} />)}
                </Pie>
              </PieChart>
              <div className="space-y-2 flex-1">
                {stats.pieDevis.map((d, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: COULEURS[i % COULEURS.length] }} />
                      <span className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-white">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {!stats.nbFactures && !devis.length && (
        <div className="card-dark p-10 text-center">
          <TrendingUp size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-semibold text-white">Pas encore de données pour {annee}</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Les statistiques apparaîtront dès que tu auras des devis et factures.</p>
        </div>
      )}
    </div>
  )
}
