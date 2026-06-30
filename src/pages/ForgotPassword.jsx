import { useState } from 'react'
import { Link } from 'react-router-dom'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../firebase/init'
import { CheckCircle2, Mail, ArrowLeft } from 'lucide-react'
import Toast from '../components/Toast'
import logo from '../assets/logo.webp'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [toast, setToast] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try { await sendPasswordResetEmail(auth, email); setSubmitted(true) }
    catch (err) {
      const msg = err.code?.includes('user-not-found') ? 'Aucun compte avec cet email' : err.code?.includes('invalid-email') ? 'Email invalide' : 'Erreur. Réessayez.'
      setToast({ message: msg, type: 'error' })
    } finally { setLoading(false) }
  }

  const bg = { background: 'linear-gradient(135deg, #060D18 0%, #0C1829 50%, #08182A 100%)', paddingTop: 'max(1.25rem, env(safe-area-inset-top))', paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center p-5" style={bg}>
      <div className="w-full max-w-sm text-center animate-fade-in">
        <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-400" />
        <h2 className="text-xl font-bold text-white mb-2">Email envoyé !</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Vérifiez votre boîte email.</p>
        <Link to="/login" className="text-sm font-semibold" style={{ color: 'var(--gold)' }}>Retour à la connexion</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-5" style={bg}>
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <img src={logo} alt="UniC" className="h-14 w-auto mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Mot de passe oublié</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Entrez votre email pour réinitialiser</p>
        </div>
        <div className="rounded-2xl p-6 space-y-5" style={{ background: 'var(--dark-surface)', border: '1px solid var(--dark-border)' }}>
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm text-white outline-none bg-[#0C1829] border border-[rgba(255,255,255,0.06)] placeholder-[#4A5B73] focus:border-[#F6C344]"
              placeholder="votre@email.com" required autoComplete="email" disabled={loading} />
          </div>
          <button onClick={handleSubmit} disabled={loading} className="w-full py-3.5 rounded-xl font-semibold text-sm btn-press disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: 'var(--gold)', color: '#060D18' }}>{loading ? 'Envoi...' : 'Envoyer les instructions'}</button>
        </div>
        <p className="text-center mt-6 text-sm"><Link to="/login" className="font-semibold flex items-center justify-center gap-1" style={{ color: 'var(--gold)' }}><ArrowLeft size={14}/> Retour connexion</Link></p>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
