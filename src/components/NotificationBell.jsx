import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, X, Trash2 } from 'lucide-react'
import { getNotificationsClient, getNotificationsAdmin, marquerNotificationLue, marquerToutesLues, supprimerNotification, supprimerToutesNotifications } from '../services/notificationService'

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

  // Titre d'onglet dynamique : affiche le compteur de notifications non lues
  // pour attirer l'œil quand l'utilisateur est sur un autre onglet.
  useEffect(() => {
    const baseTitle = 'UniC Plaquiste'
    document.title = nonLues > 0 ? `(${nonLues}) ${baseTitle}` : baseTitle
    return () => { document.title = baseTitle }
  }, [nonLues])

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
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] rounded-2xl shadow-2xl z-50 max-h-[70vh] overflow-y-auto animate-scale-in"
          style={{ background: 'var(--dark-surface)', border: '1px solid var(--dark-border)' }}>
          <div className="flex justify-between items-center p-4 gap-2" style={{ borderBottom: '1px solid var(--dark-border)' }}>
            <h3 className="font-bold text-white">Notifications</h3>
            <div className="flex items-center gap-3">
              {nonLues > 0 && (
                <button
                  onClick={handleMarquerToutesLues}
                  className="text-xs font-bold hover:underline btn-press whitespace-nowrap"
                  style={{ color: 'var(--gold)' }}
                >
                  Tout marquer comme lu
                </button>
              )}
              <button onClick={() => setOpen(false)} aria-label="Fermer" className="p-2.5 -m-2.5 hover:text-white btn-press" style={{ color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>
          </div>

          {loading && (
            <p className="text-center text-sm py-8" style={{ color: 'var(--text-muted)' }}>Chargement...</p>
          )}

          {!loading && notifs.length === 0 && (
            <p className="text-center text-sm py-8" style={{ color: 'var(--text-muted)' }}>Aucune notification pour le moment.</p>
          )}

          {!loading && notifs.map(n => (
            <div key={n.id} className="w-full flex gap-2 items-start transition"
              style={{ borderBottom: '1px solid var(--dark-border)', background: !n.read ? 'rgba(246,195,68,0.06)' : 'transparent' }}>
              <button
                onClick={() => handleClickNotif(n)}
                className="flex-1 text-left p-4 flex gap-3 items-start min-w-0"
              >
                {!n.read && <span className="w-2 h-2 rounded-full bg-[#F2C200] mt-1.5 shrink-0" />}
                <div className={n.read ? 'pl-5' : ''}>
                  <p className="font-bold text-sm text-white">{n.title}</p>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{n.message}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{tempsRelatif(n.createdAt)}</p>
                </div>
              </button>
              <button
                onClick={async (e) => {
                  e.stopPropagation()
                  if (await supprimerNotification(n.id)) {
                    setNotifs(prev => prev.filter(x => x.id !== n.id))
                  }
                }}
                className="p-2 mt-3 mr-2 rounded-lg shrink-0 hover:text-red-400 transition btn-press"
                style={{ color: 'var(--text-muted)' }}
                aria-label="Supprimer cette notification"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          {/* Tout effacer — en bas de liste */}
          {!loading && notifs.length > 0 && (
            <button
              onClick={async () => {
                if (!window.confirm('Effacer toutes les notifications ?')) return
                if (await supprimerToutesNotifications(notifs.map(n => n.id))) {
                  setNotifs([])
                }
              }}
              className="w-full py-3 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition flex items-center justify-center gap-1.5"
            >
              <Trash2 size={13} /> Tout effacer
            </button>
          )}
        </div>
      )}
    </div>
  )
}
