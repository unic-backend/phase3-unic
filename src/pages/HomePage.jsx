import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Header from '../components/Header'
import InstallPrompt from '../components/InstallPrompt'
import Hero from '../components/Hero'
import Services from '../components/Services'
import Tarifs from '../components/Tarifs'
import Galerie from '../components/Galerie'
import FAQ from '../components/FAQ'
import Contact from '../components/Contact'
import Footer from '../components/Footer'

export default function HomePage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  // Si déjà connecté → aller directement dans l'app
  useEffect(() => {
    if (user && !loading) {
      navigate('/client/dashboard', { replace: true })
    }
  }, [user, loading, navigate])

  return (
    <div>
      <Header />
      <InstallPrompt />
      <Hero />
      <Services />
      <Tarifs />
      <Galerie />
      <FAQ />
      <Contact />
      <Footer />
    </div>
  )
}
