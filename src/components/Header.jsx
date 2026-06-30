import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import logo from '../assets/logo.webp'

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="bg-[#1A3FA0] text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center hover:opacity-80 transition">
          <img src={logo} alt="UNIC PLAQUISTE" className="h-12 w-auto" />
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex gap-8 items-center">
          <Link to="/" className="hover:text-[#F2C200] transition font-bold">Accueil</Link>
          <Link to="/" className="hover:text-[#F2C200] transition">Services</Link>
          <Link to="/" className="hover:text-[#F2C200] transition">Tarifs</Link>
          <Link to="/" className="hover:text-[#F2C200] transition">Galerie</Link>
          <Link to="/" className="hover:text-[#F2C200] transition">Contact</Link>
        </nav>

        {/* Auth Buttons */}
        <div className="flex gap-4 items-center">
          {user ? (
            <>
              <span className="text-sm font-bold">{user.nom || 'Utilisateur'}</span>
              <button
                onClick={handleLogout}
                className="bg-[#F2C200] text-[#1A3FA0] px-4 py-2 rounded-lg font-bold hover:bg-yellow-400 transition"
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-[#F2C200] transition font-bold">
                Connexion
              </Link>
              <Link to="/signup" className="bg-[#F2C200] text-[#1A3FA0] px-4 py-2 rounded-lg font-bold hover:bg-yellow-400 transition">
                S'inscrire
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
