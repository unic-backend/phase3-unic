import { useState, useEffect, useRef } from 'react'
import { demarrerSession, ecouterConversation, envoyerMessageProspect, soumettreFormulaireProspect, MAX_MESSAGES } from '../services/prospectService'
import { uploadImagePublique } from '../utils/imageUpload'
import { Send, Sparkles, AlertCircle, Layers, DoorOpen, Paintbrush, Hammer, Camera, X, Check } from 'lucide-react'
import logo from '../assets/logo.webp'

const TYPES = [
  { id: 'faux-plafond', label: 'Faux plafond BA13', icon: Layers },
  { id: 'cloison', label: 'Cloison sèche', icon: DoorOpen },
  { id: 'peinture', label: 'Peinture décoration', icon: Paintbrush },
  { id: 'doublage', label: 'Doublage mural', icon: Layers },
  { id: 'corniche', label: 'Corniches décoratives', icon: Sparkles },
  { id: 'renovation', label: 'Rénovation complète', icon: Hammer },
]

const ic = "w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-all bg-[#0C1829] border border-[rgba(255,255,255,0.06)] placeholder-[#4A5B73] focus:border-[#F6C344]"

export default function Discussion() {
  const [uid, setUid] = useState(null)
  const [prospect, setProspect] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [erreurDemarrage, setErreurDemarrage] = useState('')

  useEffect(() => {
    let unsubscribe = () => {}
    let actif = true
    demarrerSession()
      .then((idSession) => {
        if (!actif) return
        setUid(idSession)
        unsubscribe = ecouterConversation(idSession, (data) => { setProspect(data); setChargement(false) })
      })
      .catch((e) => {
        console.error('Erreur démarrage session:', e)
        setErreurDemarrage(e.message || 'Impossible de demarrer la page. Recharge-la.')
        setChargement(false)
      })
    return () => { actif = false; unsubscribe() }
  }, [])

  if (chargement) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--dark-bg)' }}>
      <Sparkles size={24} className="animate-pulse" style={{ color: 'var(--gold)' }} />
    </div>
  }

  if (erreurDemarrage) {
    return <div className="min-h-screen flex items-center justify-center p-6 text-center" style={{ background: 'var(--dark-bg)', color: '#F87171' }}>{erreurDemarrage}</div>
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--dark-bg)' }}>
      <div className="px-4 py-3 flex items-center gap-3 shrink-0 glass-dark"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))', borderBottom: '1px solid var(--dark-border)' }}>
        <img src={logo} alt="UniC Plaquiste" className="h-9 w-auto" />
        <div>
          <p className="text-sm font-bold text-white">UniC Plaquiste</p>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Demande de devis</p>
        </div>
      </div>

      {!prospect?.formulaireComplete
        ? <div className="flex-1 overflow-y-auto"><Formulaire uid={uid} /></div>
        : <Chat uid={uid} prospect={prospect} />}
    </div>
  )
}

function Formulaire({ uid }) {
  const [type, setType] = useState('')
  const [nom, setNom] = useState('')
  const [telephone, setTelephone] = useState('')
  const [surface, setSurface] = useState('')
  const [avecPeinture, setAvecPeinture] = useState(true)
  const [localisation, setLocalisation] = useState('Dakar')
  const [budget, setBudget] = useState('')
  const [delai, setDelai] = useState('ASAP')
  const [description, setDescription] = useState('')
  const [photos, setPhotos] = useState([])
  const [uploadEnCours, setUploadEnCours] = useState(false)
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const [erreur, setErreur] = useState('')

  const ajouterPhotos = async (e) => {
    const fichiers = Array.from(e.target.files || [])
    if (fichiers.length === 0) return
    setUploadEnCours(true)
    setErreur('')
    try {
      const urls = []
      for (const f of fichiers.slice(0, 5 - photos.length)) {
        const url = await uploadImagePublique(f)
        if (url) urls.push(url)
      }
      setPhotos((prev) => [...prev, ...urls])
    } catch (err) {
      setErreur('Échec de l\'envoi d\'une photo. Réessaie.')
    } finally {
      setUploadEnCours(false)
    }
  }

  const retirerPhoto = (url) => setPhotos((prev) => prev.filter((p) => p !== url))

  const envoyer = async (e) => {
    e.preventDefault()
    if (!nom.trim() || !telephone.trim() || !type) {
      setErreur('Merci de remplir au moins ton nom, ton téléphone et le type de projet.')
      return
    }
    setEnvoiEnCours(true)
    setErreur('')
    try {
      await soumettreFormulaireProspect(uid, {
        nom: nom.trim(), telephone: telephone.trim(), typeProjet: type,
        surfaceM2: surface, avecPeinture: type === 'faux-plafond' ? avecPeinture : null,
        localisation, budgetIndicatif: budget, delaiSouhaite: delai,
        exigencesParticulieres: description, photos,
      })
    } catch (err) {
      setErreur('Erreur lors de l\'envoi. Réessaie.')
      setEnvoiEnCours(false)
    }
  }

  return (
    <form onSubmit={envoyer} className="px-4 py-5 space-y-4 max-w-lg w-full mx-auto pb-10">
      <div className="animate-fade-in">
        <h1 className="text-xl font-bold text-white">Décris ton projet</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Ousmane te recontactera avec un devis personnalisé.</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {TYPES.map((t) => {
          const Icon = t.icon; const actif = type === t.id
          return (
            <button key={t.id} type="button" onClick={() => setType(t.id)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl text-center transition-all"
              style={actif ? { background: 'rgba(246,195,68,0.1)', border: '1px solid rgba(246,195,68,0.3)' } : { background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }}>
              <Icon size={20} style={{ color: actif ? 'var(--gold)' : 'var(--text-muted)' }} />
              <span className="text-xs font-medium" style={{ color: actif ? 'white' : 'var(--text-secondary)' }}>{t.label}</span>
            </button>
          )
        })}
      </div>

      <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ton nom complet" className={ic} required />
      <input value={telephone} onChange={(e) => setTelephone(e.target.value)} type="tel" placeholder="Ton numéro WhatsApp" className={ic} required />

      <div className="grid grid-cols-2 gap-2.5">
        <input value={surface} onChange={(e) => setSurface(e.target.value)} type="number" inputMode="numeric" placeholder="Surface (m²)" className={ic} />
        <input value={localisation} onChange={(e) => setLocalisation(e.target.value)} placeholder="Localisation" className={ic} />
      </div>

      {type === 'faux-plafond' && (
        <div className="flex gap-2.5">
          <button type="button" onClick={() => setAvecPeinture(true)}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={avecPeinture ? { background: 'rgba(246,195,68,0.1)', border: '1px solid rgba(246,195,68,0.3)', color: 'white' } : { background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)', color: 'var(--text-secondary)' }}>
            Avec peinture
          </button>
          <button type="button" onClick={() => setAvecPeinture(false)}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={!avecPeinture ? { background: 'rgba(246,195,68,0.1)', border: '1px solid rgba(246,195,68,0.3)', color: 'white' } : { background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)', color: 'var(--text-secondary)' }}>
            Sans peinture
          </button>
        </div>
      )}

      <input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="Budget indicatif (optionnel)" className={ic} />

      <select value={delai} onChange={(e) => setDelai(e.target.value)} className={ic}>
        <option value="ASAP">Délai : ASAP</option>
        <option value="1 semaine">Délai : 1 semaine</option>
        <option value="2 semaines">Délai : 2 semaines</option>
        <option value="Pas pressé">Délai : pas pressé</option>
      </select>

      <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Décris ton projet, tes exigences..." className={ic} />

      <div>
        <label className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium cursor-pointer transition"
          style={{ background: 'var(--dark-elevated)', border: '1px dashed var(--dark-border-strong)', color: 'var(--text-secondary)' }}>
          <Camera size={16} /> {uploadEnCours ? 'Envoi en cours...' : 'Ajouter des photos (max 5)'}
          <input type="file" accept="image/*" multiple className="hidden" onChange={ajouterPhotos} disabled={uploadEnCours || photos.length >= 5} />
        </label>
        {photos.length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {photos.map((url) => (
              <div key={url} className="relative w-16 h-16 rounded-lg overflow-hidden">
                <img src={url} alt="Photo à envoyer" className="w-full h-full object-cover" />
                <button type="button" onClick={() => retirerPhoto(url)} aria-label="Retirer cette photo" className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
                  <X size={11} color="white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {erreur && (
        <div className="rounded-xl p-3 text-sm flex items-start gap-2" style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171' }}>
          <AlertCircle size={16} className="shrink-0 mt-0.5" /> {erreur}
        </div>
      )}

      <button type="submit" disabled={envoiEnCours || uploadEnCours}
        className="w-full py-3.5 rounded-xl font-semibold btn-press disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ background: 'var(--gold)', color: '#060D18' }}>
        {envoiEnCours ? 'Envoi...' : <><Check size={18} /> Envoyer ma demande</>}
      </button>
    </form>
  )
}

function Chat({ uid, prospect }) {
  const [texte, setTexte] = useState('')
  const [envoiEnCours, setEnvoiEnCours] = useState(false)
  const [erreur, setErreur] = useState('')
  const finDesMessages = useRef(null)
  const messages = prospect?.messages || []
  const limiteAtteinte = messages.length >= MAX_MESSAGES

  useEffect(() => {
    finDesMessages.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const envoyer = async (e) => {
    e.preventDefault()
    if (!texte.trim() || envoiEnCours || limiteAtteinte) return
    setErreur('')
    setEnvoiEnCours(true)
    const contenu = texte.trim()
    setTexte('')
    try {
      await envoyerMessageProspect(uid, contenu)
    } catch (err) {
      setErreur(err.message || 'Erreur lors de l\'envoi.')
    } finally {
      setEnvoiEnCours(false)
    }
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-w-lg w-full mx-auto">
        {messages.map((m, i) => (
          <div key={`${m.timestamp?.seconds ?? i}-${m.timestamp?.nanoseconds ?? i}-${m.role}`} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap"
              style={m.role === 'user' ? { background: 'var(--gold)', color: '#060D18' } : { background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)', color: 'white' }}>
              {m.content}
            </div>
          </div>
        ))}

        {envoiEnCours && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-4 py-2.5 text-sm flex items-center gap-2" style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)', color: 'var(--text-muted)' }}>
              <Sparkles size={14} className="animate-pulse" /> en train d'écrire...
            </div>
          </div>
        )}

        {erreur && (
          <div className="rounded-xl p-3 text-sm flex items-start gap-2" style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171' }}>
            <AlertCircle size={16} className="shrink-0 mt-0.5" /> {erreur}
          </div>
        )}

        {limiteAtteinte && (
          <div className="rounded-xl p-4 text-sm text-center" style={{ background: 'rgba(246,195,68,0.08)', border: '1px solid rgba(246,195,68,0.2)', color: 'var(--text-secondary)' }}>
            Continue directement avec Ousmane sur{' '}
            <a href="https://wa.me/221777085092" className="font-semibold" style={{ color: 'var(--gold)' }}>WhatsApp</a>.
          </div>
        )}
        <div ref={finDesMessages} />
      </div>

      <form onSubmit={envoyer} className="p-3 flex gap-2 shrink-0" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))', borderTop: '1px solid var(--dark-border)', background: 'var(--dark-bg)' }}>
        <input
          type="text" value={texte} onChange={(e) => setTexte(e.target.value)}
          placeholder={limiteAtteinte ? 'Discussion terminée' : 'Ajouter une précision...'}
          disabled={envoiEnCours || limiteAtteinte}
          className="flex-1 max-w-lg mx-auto px-4 py-3 rounded-xl text-sm text-white placeholder-[#4A5B73] outline-none disabled:opacity-50"
          style={{ background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }}
        />
        <button type="submit" disabled={envoiEnCours || !texte.trim() || limiteAtteinte}
          className="px-4 rounded-xl font-semibold btn-press disabled:opacity-50" style={{ background: 'var(--gold)', color: '#060D18' }}>
          <Send size={18} />
        </button>
      </form>
    </>
  )
}
