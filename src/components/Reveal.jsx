import { useEffect, useRef, useState } from 'react'

/**
 * Reveal — apparition fluide des sections au défilement.
 *
 * Technique du standard AOS (github.com/michalsnik/aos, 28 000+ étoiles),
 * implémentée sans dépendance : IntersectionObserver + classes CSS.
 *
 * Sécurités intégrées (rien ne peut rester invisible) :
 *  - Navigateur sans IntersectionObserver → contenu affiché immédiatement.
 *  - L'animation ne joue qu'une fois (pas de re-disparition au remontage).
 *  - "prefers-reduced-motion" → transitions neutralisées par le CSS global.
 *
 * Props :
 *  - delay : décalage en ms pour un effet cascade entre sections voisines.
 */
export default function Reveal({ children, delay = 0 }) {
  const ref = useRef(null)
  // Si pas d'observer disponible, on affiche direct (sécurité).
  const [visible, setVisible] = useState(
    typeof IntersectionObserver === 'undefined'
  )

  useEffect(() => {
    if (visible) return
    const el = ref.current
    if (!el) { setVisible(true); return }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      // Déclenche un peu avant l'entrée à l'écran pour un rendu naturel
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [visible])

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? 'reveal-visible' : ''}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
