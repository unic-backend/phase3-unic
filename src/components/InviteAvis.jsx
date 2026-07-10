import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getProjetsClient, ETAPES_CHANTIER } from '../services/projectService'
import { creerAvis, getAvisClient } from '../services/reviewService'
import { Star, X, CheckCircle2 } from 'lucide-react'

/**
 * InviteAvis — s'affiche sur le dashboard client quand un projet est "Livré"
 * et qu'aucun avis n'a encore été laissé pour ce projet.
 */
export default function InviteAvis() {
  const { user } = useAuth()
  const [projetsANoter, setProjetsANoter] = useState([])
  const [projetActif, setProjetActif] = useState(null)
  const [note, setNote] = useState(5)
  const [commentaire, setCommentaire] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [merci, setMerci] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    let actif = true
    async function charger() {
      const [projets, avisDejaLaisses] = await Promise.all([
        getProjetsClient(user.id),
        getAvisClient(user.id),
      ])
      if (!actif) return
      const indexLivre = ETAPES_CHANTIER.indexOf('Livré')
      const projetsAvecAvis = new Set(avisDejaLaisses.map(a => a.projetId))
      // Projets livrés SANS avis encore laissé
      const aNoter = projets.filter(p =>
        (p.etapeIndex ?? 0) >= indexLivre && !projetsAvecAvis.has(p.id)
      )
      setProjetsANoter(aNoter)
    }
    charger()
    return () => { actif = false }
  }, [user])

  const envoyer = async () => {
    if (!projetActif) return
    setEnvoi(true)
    const id = await creerAvis(user.id, {
      clientNom: user.nom || user.email?.split('@')[0] || 'Client',
      projetId: projetActif.id,
      projetNom: projetActif.name || '',
      note,
      commentaire,
    })
    setEnvoi(false)
    if (id) {
      setProjetsANoter(prev => prev.filter(p => p.id !== projetActif.id))
      setProjetActif(null)
      setNote(5); setCommentaire('')
      setMerci(true)
      setTimeout(() => setMerci(false), 5000)
    }
  }

  if (merci) {
    return (
      <div className="card-glass p-4 flex items-center gap-3 animate-fade-in">
        <CheckCircle2 size={22} style={{ color: '#34D399' }} />
        <p className="text-sm text-white">Merci pour votre avis ! Il sera publié après validation.</p>
      </div>
    )
  }

  if (projetsANoter.length === 0) return null

  return (
    <>
      {/* Bandeau d'invitation */}
      <div className="card-glass p-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(246,195,68,0.14)' }}>
            <Star size={20} style={{ color: 'var(--gold)' }} fill="var(--gold)" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">Votre chantier est terminé !</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Donnez votre avis sur « {projetsANoter[0].name} »
            </p>
          </div>
          <button onClick={() => { setProjetActif(projetsANoter[0]); setNote(5) }}
            className="px-3 py-2 rounded-xl text-xs font-bold btn-press shrink-0"
            style={{ background: 'var(--gold)', color: '#060D18' }}>
            Noter
          </button>
        </div>
      </div>

      {/* Modale de notation */}
      {projetActif && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)' }} onClick={() => setProjetActif(null)}>
          <div onClick={e => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl p-5 space-y-4 animate-scale-in"
            style={{ background: 'var(--dark-surface)', border: '1px solid var(--dark-border)' }}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">Votre avis</h3>
              <button onClick={() => setProjetActif(null)} style={{ color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{projetActif.name}</p>

            {/* Étoiles cliquables */}
            <div className="flex justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map(i => (
                <button key={i} onClick={() => setNote(i)} className="btn-press">
                  <Star size={36} fill={i <= note ? '#F2C200' : 'none'}
                    style={{ color: i <= note ? '#F2C200' : 'var(--text-muted)' }} />
                </button>
              ))}
            </div>

            <textarea value={commentaire} onChange={e => setCommentaire(e.target.value)}
              maxLength={500} rows={4}
              placeholder="Partagez votre expérience (facultatif)…"
              className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none resize-none"
              style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }} />

            <button onClick={envoyer} disabled={envoi}
              className="w-full py-3 rounded-xl font-bold text-sm btn-press disabled:opacity-50"
              style={{ background: 'var(--gold)', color: '#060D18' }}>
              {envoi ? 'Envoi…' : 'Envoyer mon avis'}
            </button>
            <p className="text-[11px] text-center" style={{ color: 'var(--text-muted)' }}>
              Votre avis sera publié sur notre site après validation.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
