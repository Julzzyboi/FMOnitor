import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCircleCheck, faTriangleExclamation, faBan } from '@fortawesome/free-solid-svg-icons'

const VARIANTS = {
  success: {
    icon: faCircleCheck,
    iconColor: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    button: 'bg-emerald-600 hover:bg-emerald-700',
  },
  danger: {
    icon: faTriangleExclamation,
    iconColor: 'text-red-600',
    iconBg: 'bg-red-50',
    button: 'bg-red-600 hover:bg-red-700',
  },
  warning: {
    icon: faBan,
    iconColor: 'text-amber-600',
    iconBg: 'bg-amber-50',
    button: 'bg-amber-500 hover:bg-amber-600',
  },
}

function ConfirmModal({ title, message, confirmLabel = 'OK', variant = 'success', onConfirm, onCancel }) {
  const style = VARIANTS[variant] ?? VARIANTS.success

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div onClick={onCancel} aria-hidden="true" className="absolute inset-0 bg-black/50" />

      <div className="relative w-full max-w-sm animate-[fade-in-up_0.2s_ease-out_forwards] rounded-2xl bg-white p-6 text-center opacity-0 shadow-2xl">
        <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${style.iconBg}`}>
          <FontAwesomeIcon icon={style.icon} className={`h-5 w-5 ${style.iconColor}`} />
        </div>

        <h3 className="mt-4 text-base font-bold text-gray-900">{title}</h3>
        <p className="mt-1.5 text-sm text-gray-500">{message}</p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 cursor-pointer rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition-colors duration-150 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 cursor-pointer rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-150 ${style.button}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
