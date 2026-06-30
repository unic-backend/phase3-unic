import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Toast from '../components/Toast'
import { LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import logo from '../assets/logo.webp'

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [toast, setToast] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { login, user } = useAuth()

  useEffect(() => { if (user) navigate('/client/dashboard', { replace: true }) }, [user, navigate])

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.email || !formData.password) { setToast({ message: 'Veuillez remplir tous les champs', type: 'error' }); return }
    setLoading(true)
    const result = await login(formData.email, formData.password)
    if (result.success) {
      setToast({ message: 'Connexion réussie!', type: 'success' })
    } else {
      const msg = result.error.includes('user-not-found') ? 'Email non trouvé'
        : result.error.includes('wrong-password') ? 'Mot de passe incorrect' : result.error
      setToast({ message: `Erreur: ${msg}`, type: 'error' })
      setLoading(false)
    }
  }

  const inputClass = "w-full pl-11 pr-4 py-3.5 rounded-xl text-sm text-white outline-none transition-all bg-[#0C1829] border border-[rgba(255,255,255,0.06)] placeholder-[#4A5B73] focus:border-[#F6C344] focus:bg-[#111F35]"

  return (
    <div className="min-h-screen flex items-center justify-center p-5"
      style={{ background: 'linear-gradient(135deg, #060D18 0%, #0C1829 50%, #08182A 100%)', paddingTop: 'max(1.25rem, env(safe-area-inset-top))', paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>

      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src={logo} alt="UniC Plaquiste" className="h-16 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Bon retour</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Connectez-vous à votre espace</p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl p-6 space-y-5"
          style={{ background: 'var(--dark-surface)', border: '1px solid var(--dark-border)' }}>

          <div className="space-y-4">
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input type="email" name="email" value={formData.email} onChange={handleChange}
                className={inputClass} placeholder="votre@email.com" required autoComplete="email" inputMode="email" disabled={loading} />
            </div>

            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange}
                className={`${inputClass} pr-11`} placeholder="Votre mot de passe" required autoComplete="current-password" disabled={loading} />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="text-right">
            <a href="/forgot-password" className="text-xs font-medium" style={{ color: 'var(--gold)' }}>Mot de passe oublié ?</a>
          </div>

          <button onClick={handleSubmit} disabled={loading}
            className="w-full py-3.5 rounded-xl font-semibold text-sm btn-press disabled:opacity-50 flex items-center justify-center gap-2 transition"
            style={{ background: 'var(--gold)', color: '#060D18' }}>
            {loading ? (
              <><div className="animate-spin h-4 w-4 border-2 border-[#060D18] border-t-transparent rounded-full" /> Connexion...</>
            ) : (
              <><LogIn size={16} /> Se connecter</>
            )}
          </button>
        </div>

        {/* Signup link */}
        <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
          Pas de compte ?{' '}
          <a href="/signup" className="font-semibold" style={{ color: 'var(--gold)' }}>S'inscrire</a>
        </p>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
