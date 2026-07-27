import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { isAdminEmail } from '../config/admins'
import {
  X, User, Headphones, Phone, ShieldCheck, UserCircle, LogOut, Brain, Users2, PenTool,
  TrendingUp, Receipt, Images, Calendar, Search, Clapperboard, Star
} from 'lucide-react'

// Menu latéral premium (style Revolut / Notion)
// S'ouvre depuis le bouton hamburger en haut à droite
export default function SideDrawer({ open, onClose, mode = 'client' }) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const showAdmin = isAdminEmail(user?.email)

  const go = (path) => {
    onClose()
    navigate(path)
  }

  const handleLogout = async () => {
    onClose()
    await logout()
    navigate('/')
  }

  // Items du menu selon le contexte (client ou admin)
  const items = []

  if (mode === 'client') {
    items.push({ icon: UserCircle, label: 'Mon profil', action: () => go('/client/profil') })
    items.push({ icon: Images, label: 'Nos réalisations', action: () => go('/client/portfolio') })
    items.push({ icon: Brain, label: 'Assistant IA', action: () => go('/client/assistant') })
    if (showAdmin) {
      items.push({ icon: ShieldCheck, label: 'Passer en Admin', action: () => go('/admin/dashboard'), highlight: true })
    }
  } else {
    items.push({ icon: User, label: 'Espace Client', action: () => go('/client/dashboard') })
    items.push({ icon: Brain, label: 'Assistant IA', action: () => go('/admin/connaissances') })
    items.push({ icon: Users2, label: 'Prospects', action: () => go('/admin/prospects') })
    items.push({ icon: PenTool, label: 'Ma signature', action: () => go('/admin/signature') })
    items.push({ icon: TrendingUp, label: 'Finances', action: () => go('/admin/finances') })
    items.push({ icon: Receipt, label: 'Dépenses', action: () => go('/admin/depenses') })
    items.push({ icon: Calendar, label: 'Calendrier', action: () => go('/admin/calendrier') })
    items.push({ icon: Images, label: 'Portfolio', action: () => go('/admin/portfolio') })
    items.push({ icon: Clapperboard, label: 'Stories', action: () => go('/admin/stories') })
    items.push({ icon: Star, label: 'Avis clients', action: () => go('/admin/avis') })
    items.push({ icon: Search, label: 'Appels d\'offres', action: () => go('/admin/opportunites') })
  }

  items.push({ icon: Headphones, label: 'Support', action: () => go('/client/chat') })
  items.push({ icon: Phone, label: 'Contact', action: () => { window.location.href = 'https://wa.me/221777085092' } })

  return (
    <>
      {/* Overlay sombre */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 z-[70] transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Panneau latéral */}
      <div
        className={`fixed top-0 right-0 h-full w-[80%] max-w-xs bg-white z-[80] shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* En-tête du panneau */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-full bg-[#1A3FA0] flex items-center justify-center text-white font-bold shrink-0">
              {(user?.nom || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-gray-800 truncate">{user?.nom || 'Utilisateur'}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="p-2.5 -m-2.5 text-gray-400 hover:text-gray-600 active:scale-90 transition">
            <X size={24} />
          </button>
        </div>

        {/* Items */}
        <nav className="flex-1 overflow-y-auto py-3">
          {items.map((item, i) => {
            const Icon = item.icon
            return (
              <button
                key={i}
                onClick={item.action}
                className={`w-full px-5 py-4 flex items-center gap-4 transition active:bg-gray-50 ${
                  item.highlight ? 'text-[#1A3FA0] font-bold' : 'text-gray-700'
                }`}
              >
                <Icon size={21} strokeWidth={2} className={item.highlight ? 'text-[#1A3FA0]' : 'text-gray-400'} />
                <span className="font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Déconnexion en bas */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-3.5 rounded-2xl font-bold active:scale-[0.98] transition"
          >
            <LogOut size={19} strokeWidth={2.2} />
            Déconnexion
          </button>
        </div>
      </div>
    </>
  )
}
