import { useEffect } from 'react'
import { CheckCircle2, XCircle, Info, AlertTriangle } from 'lucide-react'

export default function Toast({ message, type = 'success', duration = 3000, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose && onClose()
    }, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  const bgColor = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
    warning: 'bg-yellow-500'
  }[type]

  const Icon = {
    success: CheckCircle2,
    error: XCircle,
    info: Info,
    warning: AlertTriangle
  }[type]

  return (
    <div
      className={`${bgColor} text-white px-5 py-4 rounded-2xl shadow-lg flex items-center gap-3 animate-slide-up fixed left-4 right-4 md:left-auto md:right-6 bottom-20 md:bottom-6 z-[60] md:max-w-sm`}
      style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
    >
      <Icon size={20} strokeWidth={2.2} className="shrink-0" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  )
}
