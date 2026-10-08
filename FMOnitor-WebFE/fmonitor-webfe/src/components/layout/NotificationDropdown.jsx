import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell, faCircleCheck, faCircleXmark, faCircleInfo } from '@fortawesome/free-solid-svg-icons'
import useClickOutside from '../../hooks/useClickOutside'
import useFloatingPosition from '../../hooks/useFloatingPosition'
import useNow from '../../hooks/useNow'
import { formatRelativeTime } from '../../pages/admin/Inventory/utils/timeFormat'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const POLL_MS = 30000

const TYPE_STYLES = {
  success: { icon: faCircleCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  danger: { icon: faCircleXmark, color: 'text-red-600', bg: 'bg-red-50' },
  info: { icon: faCircleInfo, color: 'text-sky-600', bg: 'bg-sky-50' },
}

// The person who caused the notification: their Google profile picture, or
// their initial if there's no picture (or it fails to load). System
// notifications with no actor keep the type icon.
function NotificationAvatar({ notification }) {
  const [broken, setBroken] = useState(false)
  const { actorName, actorPictureUrl } = notification

  if (!actorName) {
    const typeStyle = TYPE_STYLES[notification.type] ?? TYPE_STYLES.info
    return (
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${typeStyle.bg}`}>
        <FontAwesomeIcon icon={typeStyle.icon} className={`h-4 w-4 ${typeStyle.color}`} />
      </span>
    )
  }
  if (actorPictureUrl && !broken) {
    return (
      <img
        src={actorPictureUrl}
        alt={actorName}
        title={actorName}
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className="h-9 w-9 shrink-0 rounded-full object-cover"
      />
    )
  }
  return (
    <span
      title={actorName}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-600"
    >
      {actorName.charAt(0).toUpperCase()}
    </span>
  )
}

function api(path, method = 'GET') {
  return fetch(`${API_BASE_URL}/api/notifications${path}`, { method, credentials: 'include' })
}

function NotificationDropdown() {
  const navigate = useNavigate()
  const now = useNow(POLL_MS)
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const close = () => setOpen(false)
  const { triggerRef, menuRef, style } = useFloatingPosition({ open, onClose: close, align: 'right' })
  useClickOutside([triggerRef, menuRef], close)

  const load = useCallback(() => {
    api('')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setNotifications(data))
      .catch(() => {})
  }, [])

  // Re-checked every 30s (and whenever useNow ticks), so new approvals and
  // rejections show up without a reload.
  useEffect(() => {
    load()
  }, [load, now])

  const unread = notifications.filter((n) => !n.readAt).length

  const openNotification = (notification) => {
    if (!notification.readAt) {
      setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, readAt: new Date().toISOString() } : n)))
      api(`/${notification.id}/read`, 'POST').catch(() => {})
    }
    close()
    if (notification.link) navigate(notification.link)
  }

  const markAllRead = () => {
    const stamp = new Date().toISOString()
    setNotifications((prev) => prev.map((n) => (n.readAt ? n : { ...n, readAt: stamp })))
    api('/read-all', 'POST').catch(() => {})
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={unread ? `Notifications, ${unread} unread` : 'Notifications'}
        className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#fccb35] transition-colors duration-150 hover:bg-white/10 lg:text-black lg:hover:bg-gray-100"
      >
        <FontAwesomeIcon icon={faBell} className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: 'fixed', top: style.top, left: style.left, visibility: style.visibility }}
            className="z-[100] w-80 max-w-[calc(100vw-2rem)] animate-[dropdown-in_0.15s_ease-out] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <p className="text-sm font-semibold text-gray-900">Notifications</p>
              {unread > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="cursor-pointer text-[11px] font-semibold text-gray-400 transition-colors duration-150 hover:text-gray-600 hover:underline"
                >
                  Mark all as read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-gray-400">You're all caught up.</p>
              ) : (
                notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => openNotification(n)}
                      className={`flex w-full cursor-pointer items-start gap-3 border-b border-gray-50 px-4 py-3 text-left transition-colors duration-150 last:border-0 hover:bg-gray-50 ${
                        n.readAt ? '' : 'bg-[#fccb35]/10'
                      }`}
                    >
                      <NotificationAvatar notification={n} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-gray-900">{n.title}</span>
                          {!n.readAt && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-red-500" aria-label="Unread" />}
                        </span>
                        <span className="mt-0.5 block text-xs leading-snug text-gray-600">{n.message}</span>
                        <span className="mt-1 block text-[11px] text-gray-400">{formatRelativeTime(n.createdAt, now)}</span>
                      </span>
                    </button>
                ))
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}

export default NotificationDropdown
