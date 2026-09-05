import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser } from '@fortawesome/free-solid-svg-icons'
import RowActionsMenu from './RowActionsMenu'
import { ROLE_STYLES, STATUS_STYLES, daysUntilPurge, purgeDate } from './rowStyles'

function UserCard({ user, onClick, onEdit, onDisable, onDelete, onRestore, onPermanentDelete }) {
  const roleStyle = ROLE_STYLES[user.role]
  const purgeDays = user.status === 'Deleted' ? daysUntilPurge(user.deletedAt) : null
  const purgeAt = user.status === 'Deleted' ? purgeDate(user.deletedAt) : null

  return (
    <div
      onClick={() => onClick(user)}
      className="flex cursor-pointer flex-col gap-3 border-b border-gray-100 p-4 transition-colors duration-150 last:border-0 hover:bg-gray-50/60"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-400">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              <FontAwesomeIcon icon={faUser} className="h-4 w-4 text-white" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-gray-900">{user.name}</p>
            <p className="truncate text-xs text-gray-500">{user.email}</p>
          </div>
        </div>
        <RowActionsMenu
          user={user}
          onEdit={onEdit}
          onDisable={onDisable}
          onDelete={onDelete}
          onRestore={onRestore}
          onPermanentDelete={onPermanentDelete}
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        <span className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${roleStyle.dot}`} />
          <span className={roleStyle.text}>{user.role}</span>
        </span>
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${STATUS_STYLES[user.status]}`}
        >
          {user.status}
        </span>
        {purgeDays !== null && (
          <span className="text-gray-400">
            {purgeDays === 0 ? 'Purging soon' : `${purgeDays} day${purgeDays === 1 ? '' : 's'} until purge`}
            {purgeAt ? ` (on ${purgeAt})` : ''}
          </span>
        )}
        <span className="text-gray-400">{user.dateCreated}</span>
      </div>
    </div>
  )
}

export default UserCard
