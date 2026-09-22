import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faImage,
  faChevronLeft,
  faChevronRight,
  faBoxesStacked,
  faLandmark,
  faPen,
  faTrash,
  faPlus,
  faBoxOpen,
} from '@fortawesome/free-solid-svg-icons'
import { CAMPUS_AREA_TYPES, mockItemCount } from './rowStyles'

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-50 py-2.5 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  )
}

// One "Location Details" layout for whatever's currently being viewed -
// the area itself, or a storage/venue row drilled into from it - matching
// the same reference design for both instead of two different panel styles.
// `onEdit`/`onDelete` act on whichever of those two `item` actually is.
function LocationDetailsBody({ item, description, onEdit, onDelete, deleteError }) {
  const available = mockItemCount(item.id)
  return (
    <div>
      <div className="-mx-5 -mt-1 mb-4 flex h-40 w-[calc(100%+2.5rem)] items-center justify-center overflow-hidden bg-gray-100">
        {item.photoUrl ? (
          <img src={item.photoUrl} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <FontAwesomeIcon icon={faImage} className="h-8 w-8 text-gray-300" />
        )}
      </div>

      <p className="text-lg font-bold text-gray-900">{item.name}</p>

      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-gray-400">Description</p>
      <p className="mt-1 text-sm text-gray-500">{description}</p>

      {/* No inventory backend yet - see mockItemCount in rowStyles.js. */}
      <div className="mt-4">
        <DetailRow label="Items Available" value={available} />
        <DetailRow label="Items Not Available" value={0} />
        <DetailRow label="Total Items" value={available} />
      </div>

      <Link
        to="/inventory"
        className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#fccb35] py-2.5 text-sm font-bold text-gray-900 shadow-sm transition-colors duration-150 hover:bg-[#e6b82f]"
      >
        <FontAwesomeIcon icon={faBoxOpen} className="h-3.5 w-3.5" />
        View Inventory
      </Link>

      {deleteError && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{deleteError}</p>
      )}

      <div className="mt-5 flex gap-2 border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={onEdit}
          className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2.5 text-xs font-bold uppercase tracking-wide text-gray-600 transition-colors duration-150 hover:bg-gray-50"
        >
          <FontAwesomeIcon icon={faPen} className="h-3 w-3" />
          Edit Location
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete"
          className="flex w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-red-200 text-red-600 transition-colors duration-150 hover:bg-red-50"
        >
          <FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

// The only kind of thing markers can trigger anymore - storage/venue markers
// aren't independently interactive, so there's no separate "facility
// details" panel design; their details only ever show here, nested inside
// whichever campus area they're embedded in. `allFacilities` is the full,
// UNFILTERED list (not whatever the map's type filter currently shows) so
// the embedded counts/lists here stay correct even if Storage/Venue are
// unchecked in that filter.
//
// `subItem`/`onSubItemChange` are lifted up to MapCanvas (not local state
// here), only so MapCanvas can key its remount correctly - both this
// component's own area view and its subItem view now share one "Location
// Details" header, so MapCanvas's own DetailsSidebar header no longer needs
// to know which is active.
//
// onEditArea/onDeleteArea act on `area` itself; onEditItem/onDeleteItem act
// on whichever embedded storage/venue row is currently drilled into
// (`subItem`). Delete calls resolve { ok, message } same as the add/edit
// modals - a rejection (e.g. an area that still has items embedded) shows
// inline instead of silently doing nothing. onAddItem(kind) arms the map's
// placement mode for a new storage/venue already locked to this area - see
// MapCanvas's onAddEmbeddedItem prop.
function AreaDetailsContent({
  area,
  allFacilities,
  subItem,
  onSubItemChange,
  onEditArea,
  onDeleteArea,
  onEditItem,
  onDeleteItem,
  onAddItem,
}) {
  const [activeTab, setActiveTab] = useState('Storage')
  const [deleteError, setDeleteError] = useState(null)

  const storageItems = allFacilities.filter((f) => f.type === 'Storage' && f.campusAreaId === area.id)
  const venueItems = allFacilities.filter((f) => f.type === 'Venue' && f.campusAreaId === area.id)
  const items = activeTab === 'Storage' ? storageItems : venueItems
  const isArea = CAMPUS_AREA_TYPES.includes(area.type)

  const handleDeleteArea = async () => {
    if (!window.confirm(`Delete "${area.name}"? This can't be undone.`)) return
    setDeleteError(null)
    const result = await onDeleteArea(area.id)
    if (!result?.ok) {
      setDeleteError(result?.message || 'Failed to delete this area.')
    }
  }

  const handleDeleteItem = async () => {
    if (!window.confirm(`Delete "${subItem.name}"? This can't be undone.`)) return
    setDeleteError(null)
    const result = await onDeleteItem(subItem)
    if (result?.ok) {
      onSubItemChange(null)
    } else {
      setDeleteError(result?.message || 'Failed to delete this item.')
    }
  }

  if (subItem) {
    return (
      <div>
        <button
          type="button"
          onClick={() => {
            onSubItemChange(null)
            setDeleteError(null)
          }}
          className="mb-3 flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-gray-500 transition-colors duration-150 hover:text-gray-700"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3" />
          Back to {area.name}
        </button>

        <LocationDetailsBody
          item={subItem}
          description={`${subItem.type} area located within ${area.name}.`}
          onEdit={() => onEditItem(subItem)}
          onDelete={handleDeleteItem}
          deleteError={deleteError}
        />
      </div>
    )
  }

  return (
    <div>
      <LocationDetailsBody
        item={area}
        description={`${area.type} on campus.`}
        onEdit={() => onEditArea(area)}
        onDelete={handleDeleteArea}
        deleteError={deleteError}
      />

      {isArea && (
        <div className="mt-5 border-t border-gray-100 pt-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('Storage')}
              className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-bold uppercase tracking-wide transition-colors duration-150 ${
                activeTab === 'Storage'
                  ? 'border-orange-500 bg-orange-50 text-orange-600'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              <FontAwesomeIcon icon={faBoxesStacked} className="h-3 w-3" />
              Storage ({storageItems.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('Venue')}
              className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-bold uppercase tracking-wide transition-colors duration-150 ${
                activeTab === 'Venue'
                  ? 'border-purple-500 bg-purple-50 text-purple-600'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              <FontAwesomeIcon icon={faLandmark} className="h-3 w-3" />
              Venues ({venueItems.length})
            </button>
          </div>

          <div className="mt-3 flex flex-col gap-0.5">
            {items.length === 0 && (
              <p className="py-4 text-center text-xs text-gray-400">
                No {activeTab.toLowerCase()} areas embedded here yet.
              </p>
            )}
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSubItemChange(item)}
                className="flex cursor-pointer items-center justify-between rounded-lg px-2 py-2 text-left text-sm text-gray-700 transition-colors duration-150 hover:bg-gray-50"
              >
                {item.name}
                <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3 text-gray-300" />
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onAddItem(activeTab === 'Storage' ? 'storage' : 'venue')}
            className="mt-2 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-2 text-xs font-bold uppercase tracking-wide text-gray-500 transition-colors duration-150 hover:border-[#fccb35] hover:text-[#a3790f]"
          >
            <FontAwesomeIcon icon={faPlus} className="h-3 w-3" />
            Add {activeTab === 'Storage' ? 'Storage' : 'Venue'}
          </button>
        </div>
      )}
    </div>
  )
}

export default AreaDetailsContent
