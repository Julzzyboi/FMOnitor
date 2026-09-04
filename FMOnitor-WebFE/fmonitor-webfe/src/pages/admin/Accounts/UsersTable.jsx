import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser } from '@fortawesome/free-solid-svg-icons'
import RowActionsMenu from './RowActionsMenu'
import UserCard from './UserCard'
import { ROLE_STYLES, STATUS_STYLES, daysUntilPurge, purgeDate } from './rowStyles'

const COLUMNS = ['Image', 'Name', 'Email', 'Role', 'Status', 'Date Created', 'Action']

function UsersTable({ users, onRowClick, onEdit, onDisable, onDelete, onRestore, onPermanentDelete }) {
  if (users.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-sm text-gray-400">
        No users match your search or filters.
      </div>
    )
  }

  return (
    <>
      {/* mobile: stacked cards */}
      <div className="md:hidden">
        {users.map((user) => (
          <UserCard
            key={user.id}
            user={user}
            onClick={onRowClick}
            onEdit={onEdit}
            onDisable={onDisable}
            onDelete={onDelete}
            onRestore={onRestore}
            onPermanentDelete={onPermanentDelete}
          />
        ))}
      </div>

      {/* desktop: table */}
      <div className="hidden overflow-x-auto rounded-t-xl md:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {COLUMNS.map((col) => (
                <th
                  key={col}
                  className="px-6 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-400"
                >
                  {col === 'Action' ? <span className="sr-only">{col}</span> : col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              const roleStyle = ROLE_STYLES[user.role]
              const purgeDays = user.status === 'Deleted' ? daysUntilPurge(user.deletedAt) : null
              const purgeAt = user.status === 'Deleted' ? purgeDate(user.deletedAt) : null
              return (
                <tr
                  key={user.id}
                  onClick={() => onRowClick(user)}
                  className="cursor-pointer border-b border-gray-50 last:border-0 hover:bg-gray-50/60"
                >
                  <td className="px-6 py-3.5">
                    <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gray-400">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                      ) : (
                        <FontAwesomeIcon icon={faUser} className="h-4 w-4 text-white" />
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-3.5 font-medium text-gray-900">{user.name}</td>
                  <td className="whitespace-nowrap px-6 py-3.5 text-gray-500">{user.email}</td>
                  <td className="whitespace-nowrap px-6 py-3.5">
                    <span className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${roleStyle.dot}`} />
                      <span className={`text-sm ${roleStyle.text}`}>{user.role}</span>
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-3.5">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${STATUS_STYLES[user.status]}`}
                    >
                      {user.status}
                    </span>
                    {purgeDays !== null && (
                      <p className="mt-1 text-[11px] text-gray-400">
                        {purgeDays === 0 ? 'Purging soon' : `${purgeDays} day${purgeDays === 1 ? '' : 's'} until purge`}
                      </p>
                    )}
                    {purgeAt && <p className="text-[11px] text-gray-400">on {purgeAt}</p>}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3.5 text-gray-500">{user.dateCreated}</td>
                  <td className="whitespace-nowrap px-6 py-3.5 text-right">
                    <RowActionsMenu
                      user={user}
                      onEdit={onEdit}
                      onDisable={onDisable}
                      onDelete={onDelete}
                      onRestore={onRestore}
                      onPermanentDelete={onPermanentDelete}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default UsersTable
