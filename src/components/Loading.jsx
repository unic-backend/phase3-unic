import { Inbox } from 'lucide-react'
import logo from '../assets/logo.webp'

// Spinner moderne avec dégradé bleu/or
export function Spinner({ label = 'Chargement...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <div className="relative w-12 h-12">
        <svg className="absolute inset-0" viewBox="0 0 40 40">
          <defs>
            <linearGradient id="gradientSpin" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1A3FA0" />
              <stop offset="100%" stopColor="#F2C200" />
            </linearGradient>
          </defs>
          <circle
            className="stroke-[url(#gradientSpin)] stroke-2 animate-spinDash"
            r="18"
            cx="20"
            cy="20"
            fill="none"
          />
        </svg>
      </div>
      <p className="text-gray-500 text-sm font-medium">{label}</p>
    </div>
  )
}

// Carte skeleton avec effet shimmer
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-5 space-y-3 shadow-sm">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <div className="h-4 w-24 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded" />
          <div className="h-3 w-32 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded" />
        </div>
        <div className="h-6 w-20 rounded-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer" />
      </div>
      <div className="h-3 w-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded" />
      <div className="h-3 w-3/4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded" />
    </div>
  )
}

export function SkeletonList({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

// État vide élégant avec léger flottement
export function EmptyState({ icon: Icon = Inbox, title, subtitle }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-10 text-center flex flex-col items-center gap-3 animate-float">
      <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center">
        <Icon size={26} strokeWidth={1.8} className="text-gray-400" />
      </div>
      <p className="text-gray-700 font-medium">{title}</p>
      {subtitle && <p className="text-gray-400 text-sm">{subtitle}</p>}
    </div>
  )
}

// Logo pulsant (peut être utilisé ailleurs si besoin)
export function LogoPulse() {
  return (
    <div className="inline-flex items-center justify-center animate-pulse-slow">
      <img src={logo} alt="Unic Plaquiste" className="h-10 w-auto" />
    </div>
  )
}