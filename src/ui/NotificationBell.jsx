import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, X, Package, Tag, Info, Store, AlertTriangle, Megaphone } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { timeAgo } from '../lib/notifications'

function NotifPanel({ onClose }) {
  const { notifications, markAllNotificationsRead, markNotificationRead } = useApp()
  // Force un re-rendu périodique pour rafraîchir les libellés "il y a x min"
  const [, forceTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => forceTick(t => t + 1), 30000)
    return () => clearInterval(id)
  }, [])

  // Mappage des types d'icônes
  const getIcon = (type) => {
    switch (type) {
      case 'order':   return { icon: Package, color: '#2FA761' }
      case 'promo':   return { icon: Tag, color: '#E77E23' }
      case 'product': return { icon: Package, color: '#8B5CF6' }
      case 'vendor':  return { icon: Store, color: '#E77E23' }
      case 'report':  return { icon: AlertTriangle, color: '#EF4444' }
      case 'admin':   return { icon: Megaphone, color: '#6366F1' }
      default:        return { icon: Info, color: '#6366F1' }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ type: 'spring', damping: 26, stiffness: 320 }}
      className="absolute top-full -right-12 sm:right-0 mt-2 z-50 flex flex-col origin-top-right"
      style={{
        width: 'min(92vw, 340px)',
        background: 'var(--card)',
        borderRadius: '1.25rem',
        boxShadow: '0 12px 48px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <p className="font-heading font-bold text-sm">Notifications</p>
        <div className="flex items-center gap-2">
          <button
            onClick={markAllNotificationsRead}
            className="text-xs font-semibold"
            style={{ color: 'var(--primary)' }}>
            Tout lire
          </button>
          <button onClick={onClose}
            className="w-7 h-7 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--muted)' }}>
            <X className="w-3.5 h-3.5" style={{ color: 'var(--muted-fg)' }} />
          </button>
        </div>
      </div>

      {/* Liste */}
      <div className="flex flex-col divide-y max-h-[320px] overflow-y-auto" style={{ divideColor: 'var(--border)' }}>
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-xs text-[var(--muted-fg)]">
            Aucune notification pour le moment.
          </div>
        ) : (
          notifications.map(n => {
            const cfg = getIcon(n.type)
            return (
              <motion.button
                key={n.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => markNotificationRead(n.id)}
                className="flex items-start gap-3 px-4 py-3 w-full text-left transition-colors"
                style={{ background: n.unread ? 'rgba(231,126,35,0.04)' : 'transparent' }}
              >
                {/* Icône */}
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: `${cfg.color}18` }}>
                  <cfg.icon className="w-4 h-4" style={{ color: cfg.color }} />
                </div>
                {/* Texte */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">{n.title}</p>
                    {n.unread && (
                      <span className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: 'var(--primary)' }} />
                    )}
                  </div>
                  <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--muted-fg)' }}>
                    {n.desc}
                  </p>
                  <p className="text-[.65rem] mt-1 font-medium" style={{ color: 'var(--muted-fg)' }}>
                    {timeAgo(n.createdAt)}
                  </p>
                </div>
              </motion.button>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 text-center" style={{ borderTop: '1px solid var(--border)' }}>
        <button onClick={onClose} className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>
          Fermer le volet
        </button>
      </div>
    </motion.div>
  )
}

/** Cloche de notifications + volet déroulant.
 * Utilisée dans l'en-tête des trois espaces (client, vendeur, admin) afin
 * que chaque rôle puisse effectivement consulter les notifications qui lui
 * sont adressées (commandes, modération, demandes vendeur, signalements,
 * diffusions admin...), et pas seulement les recevoir en toast/Firestore. */
export function NotificationBell({ id = 'notif-btn' }) {
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef(null)
  const { notifications } = useApp()

  // Fermer le panel au clic en dehors
  useEffect(() => {
    if (!notifOpen) return
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false)
      }
    }
    // Capture phase pour attraper les clics partout dans le shell
    document.addEventListener('mousedown', handler, true)
    document.addEventListener('touchstart', handler, true)
    return () => {
      document.removeEventListener('mousedown', handler, true)
      document.removeEventListener('touchstart', handler, true)
    }
  }, [notifOpen])

  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <div className="relative" ref={notifRef}>
      <motion.button
        id={id}
        whileTap={{ scale: 0.88 }}
        onClick={() => setNotifOpen(o => !o)}
        className="w-10 h-10 rounded-2xl flex items-center justify-center relative"
        style={{
          background: notifOpen
            ? 'rgba(47,167,97,0.18)'
            : 'rgba(47,167,97,0.10)',
        }}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" style={{ color: 'var(--secondary)' }} />
        {unreadCount > 0 && (
          <span
            className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full border-2 border-white"
            style={{ background: 'var(--primary)' }}
          />
        )}
      </motion.button>

      {/* Panel notifications */}
      <AnimatePresence>
        {notifOpen && (
          <NotifPanel onClose={() => setNotifOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
