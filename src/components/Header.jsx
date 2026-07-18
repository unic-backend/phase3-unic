import { useState, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Menu, X } from 'lucide-react'
import logo from '../assets/logo.webp'

// Sections ancrees de la page d'accueil. 'accueil' = haut de page.
const SECTIONS = [
  { id: 'accueil', label: 'Accueil' },
  { id: 'services', label: 'Services' },
  { id: 'tarifs', label: 'Tarifs' },
  { id: 'realisations', label: 'Galerie' },
  { id: 'contact', label: 'Contact' },
]

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOuvert, setMenuOuvert] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
    setMenuOuvert(false)
  }

  // Defilement fluide vers une section. Si on n'est pas sur la home,
  // on y navigue d'abord, puis on scrolle une fois le DOM rendu.
  const allerVersSection = useCallback((id) => {
    setMenuOuvert(false)
    const scroller = () => {
      if (id === 'accueil') { window.scrollTo({ top: 0, behavior: 'smooth' }); return }
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    if (location.pathname !== '/') {
      navigate('/')
      requestAnimationFrame(() => requestAnimationFrame(scroller))
    } else {
      scroller()
    }
  }, [location.pathname, navigate])

  return (
    <header className="bg-[#1A3FA0] text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <button onClick={() => allerVersSection('accueil')} className="flex items-center hover:opacity-80 transition shrink-0" aria-label="Accueil UniC Plaquiste">
          <img src={logo} alt="UNIC PLAQUISTE" className="h-11 sm:h-12 w-auto" />
        </button>

        {/* Navigation desktop */}
        <nav className="hidden md:flex gap-7 items-center">
          {SECTIONS.map((s) => (
            <button key={s.id} onClick={() => allerVersSection(s.id)} className="hover:text-[#F2C200] transition font-semibold text-sm">
              {s.label}
            </button>
          ))}
        </nav>

        {/* Auth desktop */}
        <div className="hidden md:flex gap-3 items-center shrink-0">
          {user ? (
            <>
              <span className="text-sm font-bold max-w-[120px] truncate">{user.nom || 'Utilisateur'}</span>
              <button onClick={handleLogout} className="bg-[#F2C200] text-[#1A3FA0] px-4 py-2 rounded-lg font-bold hover:bg-yellow-400 transition">
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-[#F2C200] transition font-bold text-sm">Connexion</Link>
              <Link to="/signup" className="bg-[#F2C200] text-[#1A3FA0] px-4 py-2 rounded-lg font-bold hover:bg-yellow-400 transition text-sm">S'inscrire</Link>
            </>
          )}
        </div>

        {/* Mobile : Connexion + S'inscrire TOUJOURS visibles + menu hamburger */}
        <div className="md:hidden flex items-center gap-1.5">
          {user ? (
            <Link to="/client/dashboard"
              className="bg-[#F2C200] text-[#1A3FA0] px-3 py-2 rounded-lg font-bold text-xs whitespace-nowrap active:scale-95 transition">
              Mon espace
            </Link>
          ) : (
            <>
              <Link to="/login"
                className="px-2.5 py-2 rounded-lg font-bold text-xs whitespace-nowrap active:scale-95 transition border border-[#F2C200] text-[#F2C200]">
                Connexion
              </Link>
              <Link to="/signup"
                className="bg-[#F2C200] text-[#1A3FA0] px-2.5 py-2 rounded-lg font-bold text-xs whitespace-nowrap active:scale-95 transition">
                S'inscrire
              </Link>
            </>
          )}
          <button onClick={() => setMenuOuvert((v) => !v)} className="p-2 rounded-lg hover:bg-white/10 transition"
            aria-label={menuOuvert ? 'Fermer le menu' : 'Ouvrir le menu'} aria-expanded={menuOuvert}>
            {menuOuvert ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {menuOuvert && (
        <>
          <div className="md:hidden fixed inset-0 top-0 bg-black/40 z-40" onClick={() => setMenuOuvert(false)} />
          <nav className="md:hidden relative z-50 bg-[#1A3FA0] border-t border-white/10 px-4 py-3 space-y-1 shadow-xl">
            {SECTIONS.map((s) => (
              <button key={s.id} onClick={() => allerVersSection(s.id)}
                className="block w-full text-left px-4 py-3 rounded-lg font-semibold hover:bg-white/10 hover:text-[#F2C200] transition">
                {s.label}
              </button>
            ))}
            <div className="pt-2 mt-2 border-t border-white/10 space-y-2">
              {user ? (
                <>
                  <p className="px-4 py-1 text-sm font-bold text-white/80 truncate">{user.nom || 'Utilisateur'}</p>
                  <button onClick={handleLogout} className="w-full bg-[#F2C200] text-[#1A3FA0] px-4 py-3 rounded-lg font-bold hover:bg-yellow-400 transition">Déconnexion</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMenuOuvert(false)} className="block w-full text-center px-4 py-3 rounded-lg font-bold border border-[#F2C200] text-[#F2C200] hover:bg-[#F2C200] hover:text-[#1A3FA0] transition">Connexion</Link>
                  <Link to="/signup" onClick={() => setMenuOuvert(false)} className="block w-full text-center bg-[#F2C200] text-[#1A3FA0] px-4 py-3 rounded-lg font-bold hover:bg-yellow-400 transition">S'inscrire</Link>
                </>
              )}
            </div>
          </nav>
        </>
      )}
    </header>
  )
}
