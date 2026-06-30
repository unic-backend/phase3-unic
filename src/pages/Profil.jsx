import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { User, Mail, Phone, MapPin, Save } from 'lucide-react'

export default function Profil() {
  const { user, updateProfile } = useAuth()
  const [formData, setFormData] = useState({ nom: user?.nom || '', email: user?.email || '', telephone: user?.telephone || '', adresse: user?.adresse || '' })
  const [saved, setSaved] = useState(false)

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value})
  const handleSave = async () => { await updateProfile(formData); setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const ic = "w-full pl-11 pr-4 py-3.5 rounded-xl text-sm text-white outline-none transition-all bg-[#0C1829] border border-[rgba(255,255,255,0.06)] placeholder-[#4A5B73] focus:border-[#F6C344] focus:bg-[#111F35]"

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="animate-fade-in"><h1 className="text-2xl font-bold text-white">Mon Profil</h1><p className="mt-1" style={{ color: 'var(--text-secondary)' }}>Vos informations personnelles</p></div>

      {saved && <div className="px-4 py-2.5 rounded-xl text-sm font-semibold badge-success animate-scale-in">Profil mis à jour</div>}

      <div className="card-dark p-5 space-y-4">
        <div className="flex justify-center mb-2">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold" style={{ background: 'rgba(246,195,68,0.15)', color: 'var(--gold)' }}>
            {(user?.nom || user?.email || 'C').charAt(0).toUpperCase()}
          </div>
        </div>
        <div className="relative"><User size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} /><input type="text" name="nom" value={formData.nom} onChange={handleChange} className={ic} placeholder="Nom complet" /></div>
        <div className="relative"><Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} /><input type="email" name="email" value={formData.email} disabled className={`${ic} opacity-50 cursor-not-allowed`} /></div>
        <div className="relative"><Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} /><input type="tel" name="telephone" value={formData.telephone} onChange={handleChange} className={ic} placeholder="Téléphone" /></div>
        <div className="relative"><MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} /><input type="text" name="adresse" value={formData.adresse} onChange={handleChange} className={ic} placeholder="Adresse à Dakar" /></div>
        <button onClick={handleSave} className="w-full py-3 rounded-xl font-semibold text-sm btn-press flex items-center justify-center gap-2" style={{ background: 'var(--gold)', color: '#060D18' }}><Save size={16}/> Enregistrer</button>
      </div>
    </div>
  )
}
