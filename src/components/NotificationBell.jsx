import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, X } from 'lucide-react'
import { getNotificationsClient, getNotificationsAdmin, marquerNotificationLue, marquerToutesLues } from '../services/notificationService'

function tempsRelatif(timestamp) {
  if (!timestamp?.seconds) return ''
  const diffMs = Date.now() - timestamp.seconds * 1000
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return 'à l\'instant'
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h} h`
  const j = Math.floor(h / 24)
  return `il y a ${j} j`
}

// mode = 'client' | 'admin' — détermine quelle source de notifications charger.
export default function NotificationBell({ mode, userId }) {
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)
  const panelRef = useRef(null)
  const navigate = useNavigate()

  const charger = async () => {
    setLoading(true)
    const list = mode === 'admin' ? await getNotificationsAdmin() : await getNotificationsClient(userId)
    setNotifs(list)
    setLoading(false)
  }

  useEffect(() => {
    charger()
    // Rafraîchir périodiquement pour voir les nouvelles notifications sans recharger la page
    const interval = setInterval(charger, 30000)
    return () => clearInterval(interval)
  }, [mode, userId])

  // Fermer le panneau si on clique en dehors
  useEffect(() => {
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const nonLues = notifs.filter(n => !n.read).length

  const handleClickNotif = async (n) => {
    if (!n.read) {
      await marquerNotificationLue(n.id)
      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
    }
    if (n.link) {
      navigate(n.link)
      setOpen(false)
    }
  }

  const handleMarquerToutesLues = async () => {
    const idsNonLus = notifs.filter(n => !n.read).map(n => n.id)
    if (idsNonLus.length === 0) return
    // Mise à jour visuelle immédiate, puis confirmation Firebase en arrière-plan
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
    await marquerToutesLues(idsNonLus)
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative text-[#1A3FA0] hover:opacity-70 active:scale-90 transition p-1"
        aria-label="Notifications"
      >
        <Bell size={24} strokeWidth={2.1} />
        {nonLues > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {nonLues > 9 ? '9+' : nonLues}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 max-h-[70vh] overflow-y-auto animate-scale-in">
          <div className="flex justify-between items-center p-4 border-b border-gray-100 gap-2">
            <h3 className="font-bold text-[#1A3FA0]">Notifications</h3>
            <div className="flex items-center gap-3">
              {nonLues > 0 && (
                <button
                  onClick={handleMarquerToutesLues}
                  className="text-xs font-bold text-[#1A3FA0] hover:underline btn-press whitespace-nowrap"
                >
                  Tout marquer comme lu
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 btn-press">
                <X size={18} />
              </button>
            </div>
          </div>

          {loading && (
            <p className="text-center text-gray-400 text-sm py-8">Chargement...</p>
          )}

          {!loading && notifs.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">Aucune notification pour le moment.</p>
          )}

          {!loading && notifs.map(n => (
            <button
              key={n.id}
              onClick={() => handleClickNotif(n)}
              className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition flex gap-3 items-start ${!n.read ? 'bg-blue-50/50' : ''}`}
            >
              {!n.read && <span className="w-2 h-2 rounded-full bg-[#F2C200] mt-1.5 shrink-0" />}
              <div className={n.read ? 'pl-5' : ''}>
                <p className="font-bold text-sm text-gray-800">{n.title}</p>
                <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{tempsRelatif(n.createdAt)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
