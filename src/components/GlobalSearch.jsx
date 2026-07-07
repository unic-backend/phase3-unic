/**
 * GlobalSearch — palette de recherche transverse admin.
 *
 * Cherche simultanément dans clients, devis, factures, projets, prospects
 * et navigue directement vers l'élément trouvé. Raccourci Ctrl/Cmd+K.
 *
 * Les collections sont chargées à la première ouverture puis mises en cache
 * pour la session (rafraîchies à chaque nouvelle ouverture pour éviter les
 * données périmées après création/suppression).
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, User, FileText, Receipt, Building2, Users2, ArrowRight } from 'lucide-react'
import { getUsersForSelect } from '../services/userService'
import { getTousDevis } from '../services/quoteService'
import { getToutesFactures } from '../services/invoiceService'
import { getTousProspects } from '../services/prospectService'
import { getTousProjets } from '../services/projectService'

// Normalise pour comparaison : minuscule + sans accents
const norm = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const KIND = {
  client:   { icon: User,      label: 'Client',   color: '#60A5FA', bg: 'rgba(96,165,250,0.12)',  route: '/admin/clients'   },
  devis:    { icon: FileText,  label: 'Devis',    color: '#F6C344', bg: 'rgba(246,195,68,0.12)',  route: '/admin/devis'     },
  facture:  { icon: Receipt,   label: 'Facture',  color: '#34D399', bg: 'rgba(52,211,153,0.12)',  route: '/admin/factures'  },
  projet:   { icon: Building2, label: 'Projet',   color: '#A78BFA', bg: 'rgba(167,139,250,0.12)', route: '/admin/projets'   },
  prospect: { icon: Users2,    label: 'Prospect', color: '#F87171', bg: 'rgba(248,113,113,0.12)', route: '/admin/prospects' },
}

export default function GlobalSearch({ isOpen, onClose }) {
  const [query, setQuery] = useState('')
  const [data, setData] = useState({ clients: [], devis: [], factures: [], projets: [], prospects: [] })
  const [loading, setLoading] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  // Charger les 5 collections à l'ouverture
  useEffect(() => {
    if (!isOpen) return
    setQuery('')
    setActiveIdx(0)
    setLoading(true)
    Promise.all([
      getUsersForSelect().catch(() => []),
      getTousDevis().catch(() => []),
      getToutesFactures().catch(() => []),
      getTousProjets().catch(() => []),
      getTousProspects().catch(() => []),
    ]).then(([clients, devis, factures, projets, prospects]) => {
      setData({ clients, devis, factures, projets, prospects })
      setLoading(false)
    })
    // Focus après ouverture (délai pour laisser l'animation se lancer)
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [isOpen])

  // Résultats filtrés (max 5 par catégorie pour rester lisible)
  const results = useMemo(() => {
    const q = norm(query)
    if (!q) return []
    const list = []
    data.clients.forEach((c) => {
      if (norm(c.nom).includes(q) || norm(c.email).includes(q)) {
        list.push({ kind: 'client', id: c.id, title: c.nom, sub: c.email })
      }
    })
    data.devis.forEach((d) => {
      const hay = norm(d.quoteNumber) + ' ' + norm(d.clientEmail) + ' ' + norm(d.clientNom) + ' ' + norm(d.designation)
      if (hay.includes(q)) {
        list.push({
          kind: 'devis', id: d.id,
          title: d.quoteNumber || 'Devis',
          sub: `${d.clientNom || d.clientEmail || '—'} · ${(d.amount || d.totalTTC || 0).toLocaleString('fr-FR')} FCFA · ${d.status || ''}`,
        })
      }
    })
    data.factures.forEach((f) => {
      const hay = norm(f.invoiceNumber) + ' ' + norm(f.clientEmail) + ' ' + norm(f.clientNom) + ' ' + norm(f.designation)
      if (hay.includes(q)) {
        list.push({
          kind: 'facture', id: f.id,
          title: f.invoiceNumber || 'Facture',
          sub: `${f.clientNom || f.clientEmail || '—'} · ${(f.amount || 0).toLocaleString('fr-FR')} FCFA · ${f.status || ''}`,
        })
      }
    })
    data.projets.forEach((p) => {
      const hay = norm(p.nom) + ' ' + norm(p.titre) + ' ' + norm(p.clientEmail) + ' ' + norm(p.adresse) + ' ' + norm(p.description)
      if (hay.includes(q)) {
        list.push({
          kind: 'projet', id: p.id,
          title: p.nom || p.titre || 'Projet',
          sub: `${p.clientEmail || ''}${p.status ? ' · ' + p.status : ''}`,
        })
      }
    })
    data.prospects.forEach((p) => {
      const nom = p.infosCollectees?.nom || ''
      const tel = p.infosCollectees?.telephone || ''
      const projet = p.infosCollectees?.typeProjet || ''
      if (norm(nom).includes(q) || norm(tel).includes(q) || norm(projet).includes(q)) {
        list.push({ kind: 'prospect', id: p.id, title: nom || 'Prospect', sub: `${projet}${tel ? ' · ' + tel : ''}` })
      }
    })
    // Regrouper par type et cap à 5 par type
    const grouped = { client: [], devis: [], facture: [], projet: [], prospect: [] }
    list.forEach((r) => { if (grouped[r.kind].length < 5) grouped[r.kind].push(r) })
    return Object.entries(grouped).flatMap(([k, arr]) => arr).slice(0, 25)
  }, [query, data])

  useEffect(() => { setActiveIdx(0) }, [query])

  const selectResult = useCallback((r) => {
    onClose()
    navigate(KIND[r.kind].route)
  }, [navigate, onClose])

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose() }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && results[activeIdx]) { e.preventDefault(); selectResult(results[activeIdx]) }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--dark-surface)', border: '1px solid var(--dark-border)' }}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--dark-border)' }}>
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher un client, devis, facture, projet, prospect…"
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder-[#4A5B73]"
          />
          <span className="hidden sm:inline text-[10px] font-mono px-2 py-1 rounded"
            style={{ background: 'var(--dark-elevated)', color: 'var(--text-muted)', border: '1px solid var(--dark-border)' }}>
            ESC
          </span>
          <button onClick={onClose} className="sm:hidden p-1 rounded" style={{ color: 'var(--text-muted)' }} aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        {/* Résultats */}
        <div className="max-h-[60vh] overflow-y-auto dark-scrollbar">
          {loading && (
            <div className="p-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>Chargement…</div>
          )}
          {!loading && !query && (
            <div className="p-8 text-center">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Tape pour rechercher dans toute l'application.</p>
              <p className="text-[11px] mt-2" style={{ color: 'var(--text-muted)' }}>Clients · Devis · Factures · Projets · Prospects</p>
            </div>
          )}
          {!loading && query && results.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Aucun résultat pour « {query} »</p>
            </div>
          )}
          {!loading && results.map((r, i) => {
            const meta = KIND[r.kind]
            const Icon = meta.icon
            const active = i === activeIdx
            return (
              <button
                key={`${r.kind}-${r.id}`}
                onClick={() => selectResult(r)}
                onMouseEnter={() => setActiveIdx(i)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition"
                style={{
                  background: active ? 'rgba(246,195,68,0.06)' : 'transparent',
                  borderLeft: `3px solid ${active ? 'var(--gold)' : 'transparent'}`,
                }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: meta.bg }}>
                  <Icon size={16} style={{ color: meta.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{r.title}</p>
                  <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>{r.sub || meta.label}</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0"
                  style={{ background: meta.bg, color: meta.color }}>
                  {meta.label}
                </span>
                {active && <ArrowRight size={14} style={{ color: 'var(--gold)' }} className="shrink-0" />}
              </button>
            )
          })}
        </div>

        {/* Footer raccourcis */}
        {!loading && results.length > 0 && (
          <div className="hidden sm:flex items-center justify-between px-4 py-2 text-[10px]"
            style={{ borderTop: '1px solid var(--dark-border)', color: 'var(--text-muted)' }}>
            <span>{results.length} résultat{results.length > 1 ? 's' : ''}</span>
            <span className="flex items-center gap-3">
              <span>↑↓ Naviguer</span>
              <span>↵ Ouvrir</span>
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
