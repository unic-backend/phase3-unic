import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Header from '../components/Header'
import InstallPrompt from '../components/InstallPrompt'
import BoutonAppFlottant from '../components/BoutonAppFlottant'
import Hero from '../components/Hero'
import Services from '../components/Services'
import Tarifs from '../components/Tarifs'
import Temoignages from '../components/Temoignages'
import Galerie from '../components/Galerie'
import FAQ from '../components/FAQ'
import Contact from '../components/Contact'
import Footer from '../components/Footer'
import Reveal from '../components/Reveal'

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
      {/* Apparition fluide des sections au défilement (pattern AOS) */}
      <Reveal><Services /></Reveal>
      <Reveal delay={60}><Tarifs /></Reveal>
      <Reveal><Galerie /></Reveal>
      <Reveal delay={60}><Temoignages /></Reveal>
      <Reveal><FAQ /></Reveal>
      <Reveal delay={60}><Contact /></Reveal>
      <Footer />
      <BoutonAppFlottant />
    </div>
  )
}
