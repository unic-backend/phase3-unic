import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { creerDevis } from '../services/quoteService'
import { creerProspectDepuisClient } from '../services/prospectService'
import { calculerPrixUnitaire, calculerMontant, estSurDevis } from '../utils/pricing'
import Toast from '../components/Toast'
import { Layers, DoorOpen, Paintbrush, Sparkles, Hammer, ArrowLeft, ArrowRight, Check } from 'lucide-react'

const TYPES_VALIDES = ['faux-plafond', 'cloison', 'peinture', 'doublage', 'corniche', 'renovation']

export default function NewDevis() {
  const [searchParams] = useSearchParams()
  // Type pré-sélectionné depuis une story ("Je veux ça")
  const typeInitial = TYPES_VALIDES.includes(searchParams.get('type')) ? searchParams.get('type') : ''
  const [step, setStep] = useState(1)
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({ type: typeInitial, surface: '', description: '', localisation: 'Dakar', urgence: 'ASAP', budget: '', photos: [], avecPeinture: true })
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })
  const selectType = (id) => setFormData({ ...formData, type: id })

  const handleSubmit = async () => {
    if (!formData.type || !formData.surface || !formData.description) { setToast({ message: 'Remplissez tous les champs', type: 'error' }); return }
    if (formData.description.length < 20) { setToast({ message: 'Description min. 20 caractères', type: 'error' }); return }
    setLoading(true)
    try {
      const devis = await creerDevis(user?.id, user?.email, formData)
      // Créer le prospect en background — non bloquant, ne doit jamais faire échouer le flux principal
      creerProspectDepuisClient(user, formData, devis?.id, devis?.quoteNumber).catch(() => {})
      setToast({ message: 'Demande envoyée !', type: 'success' })
      setTimeout(() => navigate('/client/devis'), 1500)
    }
    catch { setToast({ message: "Erreur. Réessayez.", type: 'error' }); setLoading(false) }
  }

  const surDevis = estSurDevis(formData.type)
  const prixUnitaire = calculerPrixUnitaire(formData.type, formData.avecPeinture)
  const montantEstime = calculerMontant(formData.type, formData.surface, formData.avecPeinture)

  const types = [
    { id: 'faux-plafond', label: 'Faux plafond BA13', icon: Layers },
    { id: 'cloison', label: 'Cloison sèche', icon: DoorOpen },
    { id: 'peinture', label: 'Peinture décoration', icon: Paintbrush },
    { id: 'doublage', label: 'Doublage mural', icon: Layers },
    { id: 'corniche', label: 'Corniches décoratives', icon: Sparkles },
    { id: 'renovation', label: 'Rénovation complète', icon: Hammer },
  ]

  const stepTitles = ['Type de projet', 'Détails', 'Infos', 'Confirmation']
  const canNext = () => { if (step === 1) return !!formData.type; if (step === 2) return formData.surface && formData.description.length >= 20; return true }
  const ic = "w-full px-4 py-3.5 rounded-xl text-sm text-white outline-none transition-all bg-[#0C1829] border border-[rgba(255,255,255,0.06)] placeholder-[#4A5B73] focus:border-[#F6C344] focus:bg-[#111F35]"

  return (
    <div className="max-w-lg mx-auto pb-4">
      <div className="mb-5 animate-fade-in">
        <h1 className="text-2xl font-bold text-white">Demander un devis</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{stepTitles[step - 1]}</p>
      </div>

      <div className="flex items-center gap-2 mb-6">
        {[1,2,3,4].map(s => (
          <div key={s} className="flex-1">
            <div className="h-1 rounded-full transition-all duration-300" style={{ background: s <= step ? 'var(--gold)' : 'var(--dark-elevated)' }} />
          </div>
        ))}
      </div>

      <div className="card-dark p-5">
        {step === 1 && (
          <div className="space-y-2.5 animate-fade-in" style={{ animationDuration: '0.2s' }}>
            {types.map(type => {
              const Icon = type.icon; const active = formData.type === type.id
              return (
                <button key={type.id} onClick={() => selectType(type.id)}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl transition-all active:scale-[0.98]"
                  style={active ? { background: 'rgba(246,195,68,0.1)', border: '1px solid rgba(246,195,68,0.3)' } : { background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: active ? 'var(--gold)' : 'var(--dark-surface)' }}>
                    <Icon size={20} strokeWidth={2} style={{ color: active ? '#060D18' : 'var(--text-muted)' }} />
                  </div>
                  <span className={`font-medium text-sm flex-1 text-left ${active ? 'text-white' : ''}`} style={active ? {} : { color: 'var(--text-secondary)' }}>{type.label}</span>
                  {active && <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'var(--gold)' }}><Check size={13} strokeWidth={3} color="#060D18" /></div>}
                </button>
              )
            })}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-fade-in" style={{ animationDuration: '0.2s' }}>
            <div><label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Surface (m²)</label>
              <input type="number" name="surface" value={formData.surface} onChange={handleChange} className={ic} placeholder="Exemple : 25" inputMode="numeric" required /></div>
            <div><label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Description du projet</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows="4" className={ic} placeholder="Décrivez votre projet..." required />
              <p className="text-[11px] mt-1" style={{ color: formData.description.length >= 20 ? '#34D399' : 'var(--text-muted)' }}>{formData.description.length}/20 min.</p></div>
            <div><label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Localisation</label>
              <select name="localisation" value={formData.localisation} onChange={handleChange} className={ic}><option value="Dakar">Dakar</option><option value="Hors-Dakar">Hors Dakar (+15%)</option></select></div>
            {formData.type === 'faux-plafond' && (
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Finition</label>
                <div className="flex gap-2.5">
                  <button type="button" onClick={() => setFormData({ ...formData, avecPeinture: true })}
                    className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
                    style={formData.avecPeinture ? { background: 'rgba(246,195,68,0.1)', border: '1px solid rgba(246,195,68,0.3)', color: 'white' } : { background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)', color: 'var(--text-secondary)' }}>
                    Avec peinture<br /><span className="text-xs" style={{ color: 'var(--gold)' }}>15 000 FCFA/m²</span>
                  </button>
                  <button type="button" onClick={() => setFormData({ ...formData, avecPeinture: false })}
                    className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
                    style={!formData.avecPeinture ? { background: 'rgba(246,195,68,0.1)', border: '1px solid rgba(246,195,68,0.3)', color: 'white' } : { background: 'var(--dark-elevated)', border: '1px solid var(--dark-border)', color: 'var(--text-secondary)' }}>
                    Sans peinture<br /><span className="text-xs" style={{ color: 'var(--gold)' }}>11 000 FCFA/m²</span>
                  </button>
                </div>
                <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-muted)' }}>Le prix peut augmenter selon la complexité du design demandé.</p>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-fade-in" style={{ animationDuration: '0.2s' }}>
            <div><label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Délai souhaité</label>
              <select name="urgence" value={formData.urgence} onChange={handleChange} className={ic}><option value="ASAP">ASAP</option><option value="1 semaine">1 semaine</option><option value="2 semaines">2 semaines</option><option value="Pas pressé">Pas pressé</option></select></div>
            <div><label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>Budget indicatif (optionnel)</label>
              <input type="number" name="budget" value={formData.budget} onChange={handleChange} className={ic} placeholder="Ex: 1000000" inputMode="numeric" /></div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 animate-fade-in" style={{ animationDuration: '0.2s' }}>
            <div className="rounded-xl p-4 space-y-2" style={{ background: 'var(--dark-elevated)' }}>
              <Row label="Type" value={types.find(t => t.id === formData.type)?.label || formData.type} />
              <Row label="Surface" value={`${formData.surface} m²`} />
              <Row label="Localisation" value={formData.localisation} />
              <Row label="Délai" value={formData.urgence} />
            </div>
            {surDevis ? (
              <div className="rounded-xl p-4" style={{ background: 'rgba(96,165,250,0.08)', borderLeft: '3px solid #60A5FA' }}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Tarification</p>
                <p className="text-lg font-bold text-white">Sur devis personnalisé</p>
                <p className="text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>Ousmane vous proposera un prix adapté après étude de votre demande.</p>
              </div>
            ) : (
              <>
                <div className="rounded-xl p-4" style={{ background: 'rgba(96,165,250,0.08)', borderLeft: '3px solid #60A5FA' }}>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Prix unitaire</p>
                  <p className="text-xl font-bold text-white">{prixUnitaire.toLocaleString('fr-FR')} FCFA/m²</p>
                </div>
                <div className="rounded-xl p-4" style={{ background: 'rgba(246,195,68,0.08)', borderLeft: '3px solid var(--gold)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total estimé</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--gold)' }}>{montantEstime.toLocaleString('fr-FR')} FCFA</p>
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <button onClick={() => setStep(step - 1)} className="flex-1 py-3 rounded-xl font-semibold text-sm btn-press flex items-center justify-center gap-1.5"
              style={{ background: 'var(--dark-elevated)', color: 'var(--text-secondary)' }}><ArrowLeft size={16}/> Retour</button>
          )}
          {step < 4 ? (
            <button onClick={() => canNext() ? setStep(step + 1) : setToast({ message: 'Complétez cette étape', type: 'error' })}
              className="flex-1 py-3 rounded-xl font-semibold text-sm btn-press flex items-center justify-center gap-1.5 transition"
              style={canNext() ? { background: 'var(--gold)', color: '#060D18' } : { background: 'var(--dark-elevated)', color: 'var(--text-muted)' }}>
              Continuer <ArrowRight size={16}/>
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className="flex-1 py-3 rounded-xl font-semibold text-sm btn-press disabled:opacity-50 flex items-center justify-center gap-1.5"
              style={{ background: 'var(--gold)', color: '#060D18' }}>
              {loading ? 'Envoi...' : <><Check size={16}/> Envoyer</>}
            </button>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

function Row({ label, value }) {
  return <div className="flex justify-between items-center"><span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span><span className="text-sm font-medium text-white">{value}</span></div>
}
