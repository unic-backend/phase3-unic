import { useState, useEffect, useMemo } from 'react'
import { getTousDevis } from '../services/quoteService'
import SearchBar from '../components/SearchBar'
import { Users, Mail, FileText, Wallet } from 'lucide-react'

export default function AdminClients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let actif = true
    async function charger() {
      const devis = await getTousDevis()
      if (!actif) return
      const map = {}
      devis.forEach(d => {
        const cle = d.clientEmail || d.clientId || 'inconnu'
        if (!map[cle]) map[cle] = { email: cle, nbDevis: 0, montantApprouve: 0 }
        map[cle].nbDevis += 1
        if (d.status === 'Approuvé') map[cle].montantApprouve += (d.totalTTC || 0)
      })
      setClients(Object.values(map))
      setLoading(false)
    }
    charger()
    return () => { actif = false }
  }, [])

  const filteredClients = useMemo(() => {
    if (!search.trim()) return clients
    const q = search.trim().toLowerCase()
    return clients.filter(c => c.email.toLowerCase().includes(q))
  }, [clients, search])

  return (
    <div className="space-y-5 max-w-5xl mx-auto">
      <div className="animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-bold text-white">Gérer Clients</h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Clients ayant fait une demande</p>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="skeleton-dark h-24 rounded-2xl" />)}
        </div>
      )}

      {!loading && clients.length === 0 && (
        <div className="card-dark p-10 text-center">
          <Users size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-semibold text-white">Aucun client</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Les clients apparaîtront ici après leur premier devis.</p>
        </div>
      )}

      {!loading && clients.length > 0 && (
        <>
          <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un client par email..." dark />

          {filteredClients.length === 0 && (
            <div className="card-dark p-8 text-center" style={{ color: 'var(--text-muted)' }}>
              Aucun résultat pour cette recherche.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredClients.map((c, i) => (
              <div key={i} className="card-dark p-4 animate-fade-in" style={{ opacity: 0, animationDelay: `${i * 50}ms` }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ background: 'rgba(96,165,250,0.15)', color: '#60A5FA' }}>
                    {c.email.charAt(0).toUpperCase()}
                  </div>
                  <p className="font-medium text-white text-sm break-all">{c.email}</p>
                </div>
                <div className="flex gap-3" style={{ borderTop: '1px solid var(--dark-border)', paddingTop: '10px' }}>
                  <div className="flex-1 flex items-center gap-2">
                    <FileText size={14} style={{ color: 'var(--text-muted)' }} />
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Devis</span>
                    <span className="text-sm font-semibold text-white ml-auto">{c.nbDevis}</span>
                  </div>
                  <div className="flex-1 flex items-center gap-2">
                    <Wallet size={14} style={{ color: 'var(--text-muted)' }} />
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Approuvé</span>
                    <span className="text-sm font-semibold ml-auto" style={{ color: 'var(--gold)' }}>{c.montantApprouve.toLocaleString('fr-FR')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
