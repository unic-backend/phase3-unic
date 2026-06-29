import { useEffect, useState, useRef } from 'react'

/**
 * Anime un nombre de 0 jusqu'à `value` (ex: 0 -> 12).
 * Si `decimals` > 0, anime aussi les décimales (ex: pour "3.4M").
 * Respecte prefers-reduced-motion (saute directement à la valeur finale).
 */
export default function AnimatedNumber({ value, duration = 800, decimals = 0, suffix = '' }) {
  const [display, setDisplay] = useState(0)
  const rafRef = useRef(null)

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const target = Number(value) || 0

    if (reduceMotion) {
      setDisplay(target)
      return
    }

    const start = performance.now()
    const from = 0

    function tick(now) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // easing "ease-out" pour un effet plus naturel en fin de course
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(from + (target - from) * eased)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setDisplay(target)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value, duration])

  return <span>{display.toFixed(decimals)}{suffix}</span>
}
