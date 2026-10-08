import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faImage, faRotateLeft, faTrash, faHourglassHalf, faClock } from '@fortawesome/free-solid-svg-icons'
import useNow from '../../../../hooks/useNow'
import EmptyState from '../components/EmptyState'
import { ConditionTag, CriticalTag } from '../components/InventoryTags'
import RelativeTime from '../components/RelativeTime'
import { formatItemId } from '../utils/itemId'
import { formatDateTime } from '../utils/timeFormat'
import { purgeAt, timeUntilPurge } from '../utils/trash'

function PurgeCountdown({ deletedAt, now }) {
  const { label, daysLeft } = timeUntilPurge(deletedAt, now)
  // Amber in the last week, red in the last 3 days.
  const tone =
    daysLeft <= 3
      ? 'bg-red-50 text-red-700 ring-red-200'
      : daysLeft <= 7
        ? 'bg-amber-50 text-amber-800 ring-amber-200'
        : 'bg-gray-100 text-gray-600 ring-gray-200'
  return (
    <span
      title={`Permanently deleted on ${formatDateTime(purgeAt(deletedAt).toISOString())}`}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${tone}`}
    >
      <FontAwesomeIcon icon={faHourglassHalf} className="h-3 w-3" />
      Deletes in {label}
    </span>
  )
}

function TrashRow({ item, reportCount, pendingCount, canChange, now, onRestore, onPurge }) {
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-md sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-16 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
          {item.photoUrl ? (
            <img src={item.photoUrl} alt="" className="h-full w-full object-cover opacity-70 grayscale" />
          ) : (
            <FontAwesomeIcon icon={faImage} className="h-5 w-5 text-gray-300" />
          )}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[10px] font-bold uppercase tracking-wide text-gray-400">{item.location}</p>
          <p className="truncate text-sm font-bold text-gray-900">{item.name}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-500">
            <span>
              Item ID: <span className="font-mono font-semibold text-gray-700">{formatItemId(item.id)}</span>
            </span>
            <ConditionTag condition={item.condition} />
            {item.critical && <CriticalTag />}
            {reportCount > 0 && (
              <span>
                · {reportCount} report{reportCount === 1 ? '' : 's'}
              </span>
            )}
            {pendingCount > 0 && (
              <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                <FontAwesomeIcon icon={faClock} className="h-2.5 w-2.5" />
                Pending approval
              </span>
            )}
          </p>
          <p className="mt-1 text-[11px] text-gray-400">
            Deleted <RelativeTime value={item.deletedAt} />
          </p>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
        <PurgeCountdown deletedAt={item.deletedAt} now={now} />
        {canChange && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onRestore}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition-colors duration-150 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
          >
            <FontAwesomeIcon icon={faRotateLeft} className="h-3 w-3" />
            Restore
          </button>
          <button
            type="button"
            onClick={onPurge}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors duration-150 hover:bg-red-50"
          >
            <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
            Delete Forever
          </button>
        </div>
        )}
      </div>
    </li>
  )
}

function TrashView({
  items,
  hasAnyTrash,
  reportCountByItem,
  pendingCountByItem = {},
  canChange = true,
  onRestore,
  onPurge,
  onClearSearch,
}) {
  // One shared clock so every countdown ticks together.
  const now = useNow(60000)

  if (items.length === 0) {
    return hasAnyTrash ? (
      <EmptyState
        title="No matches"
        message="Nothing in the trash fits those filters. Try a different search or clear the filters."
        actionLabel="Clear filters"
        onAction={onClearSearch}
      />
    ) : (
      <EmptyState title="The trash bin is empty" message="Deleted items will show up here for 30 days." />
    )
  }

  return (
    <ul className="mt-4 flex flex-col gap-3">
      {items.map((item) => (
        <TrashRow
          key={item.id}
          item={item}
          reportCount={reportCountByItem[item.id] ?? 0}
          pendingCount={pendingCountByItem[item.id] ?? 0}
          canChange={canChange}
          now={now}
          onRestore={() => onRestore(item)}
          onPurge={() => onPurge(item)}
        />
      ))}
    </ul>
  )
}

export default TrashView
