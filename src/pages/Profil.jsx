import { useState, useRef } from 'react'
import { useAuth } from '../hooks/useAuth'
import { uploadImagePublique } from '../utils/imageUpload'
import { User, Mail, Phone, MapPin, Save, Camera, CheckCircle2, Shield, LogOut, Edit3 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const ic = "w-full pl-11 pr-4 py-3.5 rounded-xl text-sm text-white outline-none transition-all bg-[#0C1829] border border-[rgba(255,255,255,0.06)] placeholder-[#4A5B73] focus:border-[#F6C344] focus:bg-[#111F35]"

export default function Profil() {
  const { user, updateProfile, logout } = useAuth()
  const navigate = useNavigate()
  const fileRef = useRef(null)
  const [formData, setFormData] = useState({
    nom: user?.nom || '',
    email: user?.email || '',
    telephone: user?.telephone || '',
    adresse: user?.adresse || '',
    bio: user?.bio || '',
  })
  const [photoUrl, setPhotoUrl] = useState(user?.photoUrl || null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [erreur, setErreur] = useState('')

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value })

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    setErreur('')
    try {
      const url = await uploadImagePublique(file)
      if (url) {
        setPhotoUrl(url)
        await updateProfile({ ...formData, photoUrl: url })
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      }
    } catch {
      setErreur('Erreur lors du chargement de la photo')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setErreur('')
    const result = await updateProfile({ ...formData, photoUrl })
    setSaving(false)
    if (result?.success !== false) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } else {
      setErreur('Erreur lors de la sauvegarde')
    }
  }

  const handleLogout = () => { logout(); navigate('/') }

  const initiales = (user?.nom || user?.email || 'U').charAt(0).toUpperCase()
  const isAdmin = user?.isAdmin

  return (
    <div className="space-y-5 max-w-lg mx-auto pb-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold text-white">Mon Profil</h1>
        <p className="mt-1" style={{ color: 'var(--text-secondary)' }}>
          {isAdmin ? 'Administrateur UniC Plaquiste' : 'Vos informations personnelles'}
        </p>
      </div>

      {saved && (
        <div className="px-4 py-2.5 rounded-2xl text-sm font-semibold badge-success animate-scale-in flex items-center gap-2">
          <CheckCircle2 size={16} /> Profil mis à jour
        </div>
      )}
      {erreur && (
        <div className="px-4 py-2.5 rounded-2xl text-sm font-semibold animate-fade-in"
          style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171' }}>
          {erreur}
        </div>
      )}

      {/* Avatar + nom */}
      <div className="card-dark p-5">
        <div className="flex flex-col items-center gap-3 mb-5">
          <div className="relative">
            {photoUrl ? (
              <img src={photoUrl} alt="Photo de profil"
                className="w-24 h-24 rounded-full object-cover"
                style={{ border: '3px solid var(--gold)' }} />
            ) : (
              <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold"
                style={{ background: 'rgba(242,194,0,0.15)', color: 'var(--gold)', border: '3px solid rgba(242,194,0,0.3)' }}>
                {initiales}
              </div>
            )}
            <button onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center transition active:scale-90 disabled:opacity-50"
              style={{ background: 'var(--gold)', color: '#060D18', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
              {uploading ? <span className="text-xs">...</span> : <Camera size={15} strokeWidth={2.5} />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </div>
          <div className="text-center">
            <p className="font-bold text-white text-lg">{user?.nom || user?.email || 'Utilisateur'}</p>
            <div className="flex items-center justify-center gap-1.5 mt-1">
              {isAdmin
                ? <><Shield size={13} style={{ color: 'var(--gold)' }} /><span className="text-xs font-semibold" style={{ color: 'var(--gold)' }}>Administrateur</span></>
                : <><User size={13} style={{ color: 'var(--text-muted)' }} /><span className="text-xs" style={{ color: 'var(--text-muted)' }}>Client</span></>
              }
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <div className="space-y-3">
          <div className="relative">
            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input type="text" name="nom" value={formData.nom} onChange={handleChange} className={ic} placeholder="Nom complet" />
          </div>
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input type="email" name="email" value={formData.email} disabled className={`${ic} opacity-50 cursor-not-allowed`} />
          </div>
          <div className="relative">
            <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input type="tel" name="telephone" value={formData.telephone} onChange={handleChange} className={ic} placeholder="Téléphone WhatsApp" />
          </div>
          <div className="relative">
            <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input type="text" name="adresse" value={formData.adresse} onChange={handleChange} className={ic} placeholder="Adresse à Dakar" />
          </div>
          <div className="relative">
            <Edit3 size={16} className="absolute left-4 top-4" style={{ color: 'var(--text-muted)' }} />
            <textarea name="bio" value={formData.bio} onChange={handleChange} rows={2}
              className={`${ic} pl-11 resize-none pt-3.5`}
              placeholder={isAdmin ? 'Description courte (visible dans l\'app)' : 'Note personnelle (optionnel)'} />
          </div>
        </div>

        <button onClick={handleSave} disabled={saving}
          className="w-full py-3 rounded-xl font-semibold text-sm btn-press disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
          style={{ background: 'var(--gold)', color: '#060D18' }}>
          <Save size={16} /> {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </button>
      </div>

      {/* Déconnexion */}
      <div className="card-dark p-4">
        <button onClick={handleLogout}
          className="w-full py-3 rounded-xl font-semibold text-sm btn-press flex items-center justify-center gap-2"
          style={{ background: 'rgba(248,113,113,0.1)', color: '#F87171', border: '1px solid rgba(248,113,113,0.2)' }}>
          <LogOut size={16} /> Se déconnecter
        </button>
      </div>
    </div>
  )
}
