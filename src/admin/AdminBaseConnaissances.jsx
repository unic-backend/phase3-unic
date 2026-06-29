import { useState, useEffect } from 'react'
import {
  ajouterConnaissance,
  getConnaissances,
  modifierConnaissance,
  supprimerConnaissance,
  demanderAssistant,
} from '../services/iaService'
import { Sparkles, Plus, Trash2, Pencil, Send, Brain, X } from 'lucide-react'

const CATEGORIES = ['Tarif', 'Procédure', 'Historique projet', 'Technique', 'Général']

export default function AdminBaseConnaissances() {
  // ---------- Assistant ----------
  const [question, setQuestion] = useState('')
  const [reponse, setReponse] = useState('')
  const [erreurAssistant, setErreurAssistant] = useState('')
  const [envoiEnCours, setEnvoiEnCours] = useState(false)

  const poserQuestion = async (e) => {
    e.preventDefault()
    if (!question.trim() || envoiEnCours) return
    setEnvoiEnCours(true)
    setErreurAssistant('')
    setReponse('')
    try {
      const texte = await demanderAssistant(question.trim())
      setReponse(texte)
    } catch (err) {
      setErreurAssistant(err.message || 'Erreur inconnue')
    } finally {
      setEnvoiEnCours(false)
    }
  }

  // ---------- Base de connaissances ----------
  const [connaissances, setConnaissances] = useState([])
  const [loading, setLoading] = useState(true)
  const [formOuvert, setFormOuvert] = useState(false)
  const [enEdition, setEnEdition] = useState(null) // id en cours d'édition, ou null = nouveau
  const [titre, setTitre] = useState('')
  const [categorie, setCategorie] = useState(CATEGORIES[0])
  const [contenu, setContenu] = useState('')
  const [motsCles, setMotsCles] = useState('')

  const charger = async () => {
    setLoading(true)
    const list = await getConnaissances()
    setConnaissances(list)
    setLoading(false)
  }

  useEffect(() => { charger() }, [])

  const ouvrirNouveau = () => {
    setEnEdition(null)
    setTitre('')
    setCategorie(CATEGORIES[0])
    setContenu('')
    setMotsCles('')
    setFormOuvert(true)
  }

  const ouvrirEdition = (c) => {
    setEnEdition(c.id)
    setTitre(c.titre)
    setCategorie(c.categorie)
    setContenu(c.contenu)
    setMotsCles((c.motsCles || []).join(', '))
    setFormOuvert(true)
  }

  const enregistrer = async (e) => {
    e.preventDefault()
    if (!titre.trim() || !contenu.trim()) return
    const data = {
      titre: titre.trim(),
      categorie,
      contenu: contenu.trim(),
      motsCles: motsCles.split(',').map((m) => m.trim()).filter(Boolean),
    }
    if (enEdition) {
      await modifierConnaissance(enEdition, data)
    } else {
      await ajouterConnaissance(data)
    }
    setFormOuvert(false)
    charger()
  }

  const supprimer = async (id) => {
    if (!window.confirm('Supprimer cette connaissance ?')) return
    await supprimerConnaissance(id)
    charger()
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
          <Brain size={26} style={{ color: 'var(--gold)' }} />
          Assistant IA
        </h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          Pose une question sur ton entreprise, ou enrichis la base de connaissances ci-dessous.
        </p>
      </div>

      {/* ===== Assistant ===== */}
      <div className="card-dark p-4 md:p-5 space-y-3">
        <form onSubmit={poserQuestion} className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ex: Quel est mon tarif au m² pour un faux plafond ?"
            className="flex-1 px-4 py-3 rounded-xl text-sm text-white placeholder-[#4A5B73] outline-none"
            style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }}
          />
          <button
            type="submit"
            disabled={envoiEnCours || !question.trim()}
            className="px-4 rounded-xl font-semibold btn-press disabled:opacity-50"
            style={{ background: 'var(--gold)', color: '#060D18' }}
          >
            {envoiEnCours ? '...' : <Send size={18} />}
          </button>
        </form>

        {erreurAssistant && (
          <p className="text-sm" style={{ color: '#F87171' }}>⚠️ {erreurAssistant}</p>
        )}

        {reponse && (
          <div className="p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap text-white animate-fade-in"
            style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }}>
            <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--gold)' }}>
              <Sparkles size={14} />
              <span className="text-xs font-semibold">Assistant IA</span>
            </div>
            {reponse}
          </div>
        )}
      </div>

      {/* ===== Base de connaissances ===== */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Base de connaissances</h2>
        <button
          onClick={ouvrirNouveau}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold btn-press"
          style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)', color: 'white' }}
        >
          <Plus size={16} /> Ajouter
        </button>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton-dark h-20 rounded-2xl" />)}
        </div>
      )}

      {!loading && connaissances.length === 0 && (
        <div className="card-dark p-10 text-center">
          <Brain size={36} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-semibold text-white">Aucune connaissance enregistrée</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Ajoute tes tarifs, procédures ou projets passés pour que l'assistant puisse s'en servir.
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
                <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{c.contenu}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => ouvrirEdition(c)} className="p-2 rounded-lg hover:bg-dark-700" style={{ color: 'var(--text-muted)' }}>
                  <Pencil size={16} />
                </button>
                <button onClick={() => supprimer(c.id)} className="p-2 rounded-lg hover:bg-dark-700" style={{ color: '#F87171' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ===== Modale formulaire ===== */}
      {formOuvert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <form onSubmit={enregistrer} className="card-dark p-5 w-full max-w-md space-y-3 animate-fade-in">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-white">{enEdition ? 'Modifier' : 'Nouvelle connaissance'}</h3>
              <button type="button" onClick={() => setFormOuvert(false)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <input
              type="text" value={titre} onChange={(e) => setTitre(e.target.value)}
              placeholder="Titre (ex: Tarif faux plafond BA13)"
              className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-[#4A5B73] outline-none"
              style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }}
              required
            />

            <select
              value={categorie} onChange={(e) => setCategorie(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm text-white outline-none"
              style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }}
            >
              {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>

            <textarea
              value={contenu} onChange={(e) => setContenu(e.target.value)}
              placeholder="Contenu détaillé..."
              rows={4}
              className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-[#4A5B73] outline-none resize-none"
              style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }}
              required
            />

            <input
              type="text" value={motsCles} onChange={(e) => setMotsCles(e.target.value)}
              placeholder="Mots-clés séparés par des virgules (ex: BA13, plafond, tarif)"
              className="w-full px-3 py-2.5 rounded-lg text-sm text-white placeholder-[#4A5B73] outline-none"
              style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }}
            />

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg font-semibold btn-press"
              style={{ background: 'var(--gold)', color: '#060D18' }}
            >
              Enregistrer
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
