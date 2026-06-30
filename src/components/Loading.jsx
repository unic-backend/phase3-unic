import { Inbox } from 'lucide-react'

// Spinner moderne
export function Spinner({ label = 'Chargement...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4">
      <div className="spinner-modern" />
      <p className="text-gray-500 text-sm font-medium">{label}</p>
    </div>
  )
}

// Carte skeleton
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl p-5 space-y-3 shadow-sm">
      <div className="flex justify-between items-start">
        <div className="space-y-2 flex-1">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-3 w-32" />
        </div>
        <div className="skeleton h-6 w-20 rounded-full" />
      </div>
      <div className="skeleton h-3 w-full" />
      <div className="skeleton h-3 w-3/4" />
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

// État vide élégant (au lieu de juste du texte)
export function EmptyState({ icon: Icon = Inbox, title, subtitle }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-10 text-center flex flex-col items-center gap-3">
      <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center">
        <Icon size={26} strokeWidth={1.8} className="text-gray-400" />
      </div>
      <p className="text-gray-700 font-medium">{title}</p>
      {subtitle && <p className="text-gray-400 text-sm">{subtitle}</p>}
    </div>
  )
}
