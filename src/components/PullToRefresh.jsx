import { useState, useRef } from 'react'
import { RefreshCw } from 'lucide-react'

const SEUIL_DECLENCHEMENT = 70 // px à tirer avant que ça déclenche le rafraîchissement
const TIRAGE_MAX = 110         // limite visuelle (effet élastique)

// Enveloppe un conteneur scrollable et déclenche `onRefresh` quand l'utilisateur
// tire vers le bas alors qu'il est déjà tout en haut (geste tactile uniquement).
export default function PullToRefresh({ onRefresh, children, className = '' }) {
  const [pull, setPull] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const containerRef = useRef(null)
  const startY = useRef(0)
  const tirage = useRef(false)

  const handleTouchStart = (e) => {
    // On n'active le geste que si le conteneur est déjà scrollé tout en haut
    if (containerRef.current && containerRef.current.scrollTop <= 0) {
      startY.current = e.touches[0].clientY
      tirage.current = true
    } else {
      tirage.current = false
    }
  }

  const handleTouchMove = (e) => {
    if (!tirage.current || refreshing) return
    const delta = e.touches[0].clientY - startY.current
    if (delta > 0) {
      // Effet élastique: plus on tire, plus ça résiste
      setPull(Math.min(delta * 0.5, TIRAGE_MAX))
    }
  }

  const handleTouchEnd = async () => {
    if (!tirage.current) return
    tirage.current = false
    if (pull >= SEUIL_DECLENCHEMENT) {
      setRefreshing(true)
      setPull(SEUIL_DECLENCHEMENT)
      await onRefresh?.()
      setRefreshing(false)
    }
    setPull(0)
  }

  return (
    <div
      ref={containerRef}
      className={className}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ position: 'relative' }}
    >
      {/* Indicateur visuel du tirage */}
      <div
        className="flex items-center justify-center overflow-hidden transition-all"
        style={{ height: pull, opacity: pull > 0 ? 1 : 0 }}
      >
        <RefreshCw
          size={22}
          className={refreshing ? 'animate-spin text-[#1A3FA0]' : 'text-gray-400'}
          style={{ transform: refreshing ? 'none' : `rotate(${(pull / SEUIL_DECLENCHEMENT) * 360}deg)` }}
        />
      </div>
      {children}
    </div>
  )
}
