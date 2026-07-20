import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Toast from '../components/Toast'
import { UserPlus, User, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react'
import logo from '../assets/logo.webp'

export default function Signup() {
  const [formData, setFormData] = useState({ nom: '', email: '', telephone: '', password: '', confirmPassword: '' })
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const navigate = useNavigate()
  const { signup, user } = useAuth()

  useEffect(() => { if (user) navigate('/client/dashboard', { replace: true }) }, [user, navigate])

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.nom || !formData.email || !formData.telephone || !formData.password) { setToast({ message: 'Veuillez remplir tous les champs', type: 'error' }); return }
    if (formData.password !== formData.confirmPassword) { setToast({ message: 'Les mots de passe ne correspondent pas', type: 'error' }); return }
    if (formData.password.length < 6) { setToast({ message: 'Min. 6 caractères pour le mot de passe', type: 'error' }); return }
    setLoading(true)
    const result = await signup(formData.nom, formData.email, formData.telephone, formData.password)
    if (result.success) {
      setToast({ message: 'Compte créé!', type: 'success' })
    } else {
      const msg = result.error.includes('email-already-in-use') ? 'Cet email est déjà utilisé'
        : result.error.includes('invalid-email') ? 'Email invalide' : result.error
      setToast({ message: `Erreur: ${msg}`, type: 'error' }); setLoading(false)
    }
  }

  const ic = "w-full pl-11 pr-4 py-3.5 rounded-xl text-sm text-white outline-none transition-all bg-[#0C1829] border border-[rgba(255,255,255,0.06)] placeholder-[#4A5B73] focus:border-[#F6C344] focus:bg-[#111F35]"

  return (
    <div className="min-h-screen flex items-center justify-center p-5"
      style={{ background: 'linear-gradient(135deg, #060D18 0%, #0C1829 50%, #08182A 100%)', paddingTop: 'max(1.25rem, env(safe-area-inset-top))', paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>

      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-6">
          <img src={logo} alt="UniC" className="h-14 w-auto mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-white">Créer un compte</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Rejoignez UniC Plaquiste</p>
        </div>

        <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--dark-surface)', border: '1px solid var(--dark-border)' }}>
          <div className="space-y-3">
            <div className="relative">
              <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input type="text" name="nom" value={formData.nom} onChange={handleChange} className={ic} placeholder="Votre nom complet" required autoComplete="name" disabled={loading} />
            </div>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input type="email" name="email" value={formData.email} onChange={handleChange} className={ic} placeholder="votre@email.com" required autoComplete="email" inputMode="email" disabled={loading} />
            </div>
            <div className="relative">
              <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input type="tel" name="telephone" value={formData.telephone} onChange={handleChange} className={ic} placeholder="+221 77 000 00 00" required autoComplete="tel" inputMode="tel" disabled={loading} />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input type={showPass ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} className={`${ic} pr-11`} placeholder="Mot de passe (min. 6)" required autoComplete="new-password" disabled={loading} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                aria-label={showPass ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center" style={{ color: 'var(--text-muted)' }}>
                {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className={ic} placeholder="Confirmer le mot de passe" required autoComplete="new-password" disabled={loading} />
            </div>
          </div>

          <button onClick={handleSubmit} disabled={loading}
            className="w-full py-3.5 rounded-xl font-semibold text-sm btn-press disabled:opacity-50 flex items-center justify-center gap-2 transition"
            style={{ background: 'var(--gold)', color: '#060D18' }}>
            {loading ? (
              <><div className="animate-spin h-4 w-4 border-2 border-[#060D18] border-t-transparent rounded-full" /> Création...</>
            ) : (
              <><UserPlus size={16} /> Créer mon compte</>
            )}
          </button>
        </div>

        <div className="mt-6 pt-5 text-center" style={{ borderTop: '1px solid var(--dark-border)' }}>
          <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
            Vous avez déjà un compte ?
          </p>
          <a href="/login"
            className="block w-full py-3 rounded-xl font-bold text-sm text-center btn-press transition"
            style={{ border: '2px solid var(--gold)', color: 'var(--gold)' }}>
            Se connecter
          </a>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
