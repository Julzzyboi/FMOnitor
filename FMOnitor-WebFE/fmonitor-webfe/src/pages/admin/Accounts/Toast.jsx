import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleCheck, faTriangleExclamation, faBan } from '@fortawesome/free-solid-svg-icons'

const TOAST_STYLES = {
  success: { bg: 'bg-emerald-600', icon: faCircleCheck },
  danger: { bg: 'bg-red-600', icon: faTriangleExclamation },
  warning: { bg: 'bg-amber-500', icon: faBan },
}

function Toast({ message, type = 'success' }) {
  if (!message) return null
  const style = TOAST_STYLES[type] ?? TOAST_STYLES.success

  return (
    <div className="fixed bottom-6 left-1/2 z-[80] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 animate-[fade-in-up_0.3s_ease-out_forwards] sm:bottom-8 sm:left-auto sm:right-8 sm:w-auto sm:translate-x-0">
      <div className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-semibold text-white shadow-2xl ${style.bg}`}>
        <FontAwesomeIcon icon={style.icon} className="h-5 w-5 shrink-0 text-white" />
        {message}
      </div>
    </div>
  )
}

export default Toast
