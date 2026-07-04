/**
 * AdminBaseConnaissances — Page admin : Assistant IA + Base de connaissances
 *
 * Deux onglets :
 *  1. "Assistant IA"       → composant AIChat partagé (conversation premium)
 *  2. "Base de connaissances" → CRUD entrées (logique inchangée)
 *
 * La logique de gestion de la base (ajouterConnaissance, getConnaissances,
 * modifierConnaissance, supprimerConnaissance) est IDENTIQUE à avant.
 * Seul le chat IA a été remplacé par le composant AIChat.
 */
import { useState, useEffect } from 'react'
import {
  ajouterConnaissance,
  getConnaissances,
  modifierConnaissance,
  supprimerConnaissance,
} from '../services/iaService'
import { getTousDevis } from '../services/quoteService'
import { getToutesFactures } from '../services/invoiceService'
import { getTousProspects } from '../services/prospectService'
import { getConversationsAdmin } from '../services/messageService'
import AIChat from '../components/AIChat'
import { Plus, Trash2, Pencil, Brain, X, Database, MessageCircle } from 'lucide-react'

const CATEGORIES = ['Tarif', 'Procédure', 'Historique projet', 'Technique', 'Général']

const ADMIN_SUGGESTIONS = [
  '📊 Quel est notre tarif BA13 avec peinture ?',
  '📁 Résume nos projets récents',
  '🔧 Quelles sont nos procédures de pose ?',
  '💬 Comment répondre à un client qui hésite ?',
]

export default function AdminBaseConnaissances() {
  // ── Onglet actif ───────────────────────────────────────────────────────────
  const [onglet, setOnglet] = useState('assistant') // 'assistant' | 'base'

  // ── Notifications admin — résumé du jour ───────────────────────────────────
  const [notifs, setNotifs] = useState([])

  useEffect(() => {
    (async () => {
      try {
        const [devis, factures, prospects, convs] = await Promise.all([
          getTousDevis().catch(() => []),
          getToutesFactures().catch(() => []),
          getTousProspects().catch(() => []),
          getConversationsAdmin().catch(() => []),
        ])
        const n = []
        const devisEnAttente = devis.filter(d => d.status === 'En attente').length
        const devisApprouves = devis.filter(d => d.status === 'Approuvé').length
        const devisSignes = devis.filter(d => d.status === 'Signé').length
        const facturesImpayees = factures.filter(f => f.status !== 'Payée').length
        const msgsNonLus = convs.reduce((sum, c) => sum + (c.unreadAdmin || 0), 0)
        const nbProspects = prospects.length

        if (devisEnAttente > 0) n.push({ text: `${devisEnAttente} devis en attente de traitement`, color: '#FBBF24' })
        if (devisApprouves > 0) n.push({ text: `${devisApprouves} devis approuvé(s) — prêts à signer`, color: '#34D399' })
        if (devisSignes > 0)    n.push({ text: `${devisSignes} devis signé(s) ✓`, color: '#34D399' })
        if (facturesImpayees > 0) n.push({ text: `${facturesImpayees} facture(s) en attente de paiement`, color: '#F87171' })
        if (msgsNonLus > 0)     n.push({ text: `${msgsNonLus} message(s) non lu(s)`, color: '#60A5FA' })
        if (nbProspects > 0)    n.push({ text: `${nbProspects} prospect(s) dans le pipeline`, color: '#A78BFA' })
        if (n.length === 0)     n.push({ text: 'Tout est à jour — rien en attente 👍', color: '#34D399' })

        setNotifs(n)
      } catch { /* silencieux */ }
    })()
  }, [])

  // ── Base de connaissances (logique INCHANGÉE) ──────────────────────────────
  const [connaissances, setConnaissances] = useState([])
  const [loading,       setLoading]       = useState(true)
  const [formOuvert,    setFormOuvert]    = useState(false)
  const [enEdition,     setEnEdition]     = useState(null)
  const [titre,         setTitre]         = useState('')
  const [categorie,     setCategorie]     = useState(CATEGORIES[0])
  const [contenu,       setContenu]       = useState('')
  const [motsCles,      setMotsCles]      = useState('')

  const charger = async () => {
    setLoading(true)
    const list = await getConnaissances()
    setConnaissances(list)
    setLoading(false)
  }

  useEffect(() => { charger() }, [])

  const ouvrirNouveau = () => {
    setEnEdition(null); setTitre(''); setCategorie(CATEGORIES[0])
    setContenu(''); setMotsCles(''); setFormOuvert(true)
  }

  const ouvrirEdition = (c) => {
    setEnEdition(c.id); setTitre(c.titre); setCategorie(c.categorie)
    setContenu(c.contenu); setMotsCles((c.motsCles || []).join(', ')); setFormOuvert(true)
  }

  const enregistrer = async (e) => {
    e.preventDefault()
    if (!titre.trim() || !contenu.trim()) return
    const data = {
      titre:    titre.trim(),
      categorie,
      contenu:  contenu.trim(),
      motsCles: motsCles.split(',').map((m) => m.trim()).filter(Boolean),
    }
    if (enEdition) { await modifierConnaissance(enEdition, data) }
    else            { await ajouterConnaissance(data) }
    setFormOuvert(false)
    charger()
  }

  const supprimer = async (id) => {
    if (!window.confirm('Supprimer cette connaissance ?')) return
    await supprimerConnaissance(id)
    charger()
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">

      {/* En-tête */}
      <div className="animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
          <Brain size={26} style={{ color: 'var(--gold)' }} />
          Assistant IA
        </h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          Posez vos questions ou enrichissez la base de connaissances.
        </p>
      </div>

      {/* Onglets */}
      <div className="flex gap-2">
        {[
          { id: 'assistant', label: 'Assistant IA',                          Icon: MessageCircle },
          { id: 'base',      label: `Base (${connaissances.length})`,         Icon: Database },
        ].map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setOnglet(id)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all btn-press"
            style={onglet === id
              ? { background: 'var(--gold)', color: '#060D18' }
              : { background: 'var(--dark-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--dark-border)' }
            }>
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Onglet Assistant IA ── */}
      {onglet === 'assistant' && (
        <AIChat
          storageKey="unic-ia-admin"
          welcomeTitle="Bonjour"
          welcomeText="Je suis ton assistant personnel. Dis-moi ce que tu veux faire — chiffrage, message client, analyse, planning..."
          placeholder="Pose ta question ou demande quelque chose..."
          userName="Ousmane"
          isAdmin={true}
          notifications={notifs}
        />
      )}

      {/* ── Onglet Base de connaissances ── */}
      {onglet === 'base' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {connaissances.length} entrée(s) — utilisées par l'assistant pour répondre.
            </p>
            <button onClick={ouvrirNouveau}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold btn-press"
              style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)', color: 'white' }}>
              <Plus size={16} /> Ajouter
            </button>
          </div>

          {loading && (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="skeleton-dark h-20 rounded-2xl" />)}
            </div>
          )}

          {!loading && connaissances.length === 0 && (
            <div className="card-dark p-10 text-center">
              <Brain size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
              <p className="font-semibold text-white">Base vide</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Ajoutez vos tarifs, procédures ou projets passés pour enrichir l'assistant.
              </p>
            </div>
          )}

          <div className="space-y-3">
            {connaissances.map((c) => (
              <div key={c.id} className="card-dark p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(246,195,68,0.15)', color: 'var(--gold)' }}>
                      {c.categorie}
                    </span>
                    <p className="font-semibold text-white mt-2">{c.titre}</p>
                    <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                      {c.contenu}
                    </p>
                    {(c.motsCles || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {c.motsCles.map((m) => (
                          <span key={m} className="text-[10px] px-2 py-0.5 rounded-full"
                            style={{ background: 'var(--dark-elevated)', color: 'var(--text-muted)' }}>
                            {m}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => ouvrirEdition(c)} className="p-2 rounded-lg" style={{ color: 'var(--text-muted)' }}>
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => supprimer(c.id)} className="p-2 rounded-lg" style={{ color: '#F87171' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modale formulaire (INCHANGÉE) ── */}
      {formOuvert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}>
          <form onSubmit={enregistrer} className="card-dark p-5 w-full max-w-md space-y-3 animate-fade-in">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-white">
                {enEdition ? 'Modifier la connaissance' : 'Nouvelle connaissance'}
              </h3>
              <button type="button" onClick={() => setFormOuvert(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <input type="text" value={titre} onChange={e => setTitre(e.target.value)}
              placeholder="Titre (ex : Tarif faux plafond BA13)"
              className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-[#4A5B73] outline-none"
              style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }} required />

            <select value={categorie} onChange={e => setCategorie(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none"
              style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }}>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>

            <textarea value={contenu} onChange={e => setContenu(e.target.value)}
              placeholder="Contenu détaillé…" rows={4}
              className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-[#4A5B73] outline-none resize-none"
              style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }} required />

            <input type="text" value={motsCles} onChange={e => setMotsCles(e.target.value)}
              placeholder="Mots-clés séparés par des virgules (ex : BA13, plafond, tarif)"
              className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-[#4A5B73] outline-none"
              style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }} />

            <button type="submit" className="w-full py-2.5 rounded-lg font-semibold btn-press"
              style={{ background: 'var(--gold)', color: '#060D18' }}>
              Enregistrer
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
