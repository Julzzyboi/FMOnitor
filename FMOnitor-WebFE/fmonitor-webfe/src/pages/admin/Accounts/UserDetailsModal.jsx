import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faXmark, faPen, faBan, faTrash, faArrowRotateLeft } from '@fortawesome/free-solid-svg-icons'
import { ROLE_STYLES, STATUS_STYLES } from './rowStyles'

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-50 py-3 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  )
}

function UserDetailsModal({ user, onClose, onEdit, onDisable, onDelete, onRestore }) {
  const roleStyle = ROLE_STYLES[user.role]
  const isDeleted = user.status === 'Deleted'
  const isDisabled = user.status === 'Disabled'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={onClose} aria-hidden="true" className="absolute inset-0 bg-black/50" />

      <div className="relative w-full max-w-md animate-[fade-in-up_0.25s_ease-out_forwards] rounded-2xl bg-white p-6 opacity-0 shadow-2xl sm:p-8">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">User Details</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-md p-1.5 text-gray-400 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-600"
          >
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gray-400">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              <FontAwesomeIcon icon={faUser} className="h-8 w-8 text-white" />
            )}
          </div>
          <div className="text-center">
            <p className="text-base font-bold text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        <div className="mt-6">
          <DetailRow
            label="Role"
            value={
              <span className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${roleStyle.dot}`} />
                <span className={roleStyle.text}>{user.role}</span>
              </span>
            }
          />
          <DetailRow
            label="Status"
            value={
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${STATUS_STYLES[user.status]}`}
              >
                {user.status}
              </span>
            }
          />
          <DetailRow label="Date Created" value={user.dateCreated} />
        </div>

        <div className="mt-8 flex flex-col gap-2.5 sm:flex-row">
          {isDeleted ? (
            <button
              type="button"
              onClick={() => onRestore(user)}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-emerald-700"
            >
              <FontAwesomeIcon icon={faArrowRotateLeft} className="h-3.5 w-3.5" />
              Restore
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onEdit(user)}
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-emerald-700"
              >
                <FontAwesomeIcon icon={faPen} className="h-3.5 w-3.5" />
                Edit
              </button>
              {!isDisabled && (
                <button
                  type="button"
                  onClick={() => onDisable(user)}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-orange-600"
                >
                  <FontAwesomeIcon icon={faBan} className="h-3.5 w-3.5" />
                  Disable
                </button>
              )}
              <button
                type="button"
                onClick={() => onDelete(user)}
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-red-700"
              >
                <FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5" />
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserDetailsModal
