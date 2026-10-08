import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faImage, faClock } from '@fortawesome/free-solid-svg-icons'
import { AvailabilityTag, ConditionTag, CriticalTag } from '../components/InventoryTags'
import EmptyState from '../components/EmptyState'
import { formatItemId } from '../utils/itemId'
import RelativeTime from '../components/RelativeTime'

function PendingBadge({ count, className = '' }) {
  return (
    <span
      title={`${count} change${count === 1 ? '' : 's'} waiting for Superadmin approval`}
      className={`inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white ${className}`}
    >
      <FontAwesomeIcon icon={faClock} className="h-2.5 w-2.5" />
      Pending
    </span>
  )
}

function ItemCard({ item, pendingCount, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      // No hover lift (translate): moving the card makes the browser re-draw the
      // photo at lower quality, so hover only changes the border and shadow.
      className="group cursor-pointer rounded-xl border border-gray-200 bg-white p-3 text-left shadow-sm transition-[border-color,box-shadow] duration-150 hover:border-[#fccb35] hover:shadow-lg hover:ring-1 hover:ring-[#fccb35]/40"
    >
      <div className="relative flex h-32 w-full items-center justify-center overflow-hidden rounded-lg bg-gray-100">
        {item.photoUrl ? (
          <img src={item.photoUrl} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <FontAwesomeIcon icon={faImage} className="h-8 w-8 text-gray-300" />
        )}
        <AvailabilityTag availability={item.availability} className="absolute left-2 top-2 shadow-sm" />
        <ConditionTag condition={item.condition} className="absolute right-2 top-2 shadow-sm" />
        {item.critical && <CriticalTag className="absolute bottom-2 left-2 shadow-sm" />}
        {pendingCount > 0 && <PendingBadge count={pendingCount} className="absolute bottom-2 right-2 shadow-sm" />}
      </div>
      <p className="mt-3 truncate text-[10px] font-bold uppercase tracking-wide text-gray-400">{item.location}</p>
      <p className="mt-0.5 truncate text-sm font-bold text-gray-900">{item.name}</p>
      <p className="mt-0.5 text-[11px] text-gray-500">
        Item ID: <span className="font-mono font-semibold text-gray-700">{formatItemId(item.id)}</span>
      </p>
      <p className="mt-2 text-sm">
        <span className="font-bold text-gray-900">{item.available}</span>{' '}
        <span className="text-xs text-gray-400">available</span>
      </p>
      <p className="mt-1 text-[11px] text-gray-400">
        Updated <RelativeTime value={item.updatedAt} />
      </p>
    </button>
  )
}

function ItemsView({ items, hasAnyItems, pendingCountByItem = {}, canAdd = true, onView, onAdd, onClearFilters }) {
  if (items.length === 0) {
    return hasAnyItems ? (
      <EmptyState
        title="No matches"
        message="Nothing fits those filters. Try a different search or clear the filters."
        actionLabel="Clear filters"
        onAction={onClearFilters}
      />
    ) : (
      <EmptyState
        title="The inventory is empty"
        message="No equipment has been added yet."
        actionLabel={canAdd ? 'Add item' : null}
        onAction={onAdd}
      />
    )
  }

  return (
    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} pendingCount={pendingCountByItem[item.id] ?? 0} onClick={() => onView(item)} />
      ))}
    </div>
  )
}

export default ItemsView
