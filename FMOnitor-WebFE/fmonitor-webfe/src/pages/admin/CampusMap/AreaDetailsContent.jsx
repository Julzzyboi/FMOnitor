import { useState } from 'react'
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
} from '@fortawesome/free-solid-svg-icons'
import { FACILITY_TYPE_STYLES } from './rowStyles'

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-50 py-2.5 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  )
}

function EditDeleteRow({ onEdit, onDelete, deleteLabel }) {
  return (
    <div className="mt-4 flex gap-2">
      <button
        type="button"
        onClick={onEdit}
        className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-2 text-xs font-bold uppercase tracking-wide text-gray-600 transition-colors duration-150 hover:bg-gray-50"
      >
        <FontAwesomeIcon icon={faPen} className="h-3 w-3" />
        Edit
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-red-200 py-2 text-xs font-bold uppercase tracking-wide text-red-600 transition-colors duration-150 hover:bg-red-50"
      >
        <FontAwesomeIcon icon={faTrash} className="h-3 w-3" />
        {deleteLabel || 'Delete'}
      </button>
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
// onEditArea/onDeleteArea act on `area` itself; onEditItem/onDeleteItem act
// on whichever embedded storage/venue row is currently drilled into
// (`subItem`). Delete calls resolve { ok, message } same as the add/edit
// modals - a rejection (e.g. an area that still has items embedded) shows
// inline instead of silently doing nothing. onAddItem(kind) arms the map's
// placement mode for a new storage/venue already locked to this area - see
// MapCanvas's onAddEmbeddedItem prop.
function AreaDetailsContent({ area, allFacilities, onEditArea, onDeleteArea, onEditItem, onDeleteItem, onAddItem }) {
  const [activeTab, setActiveTab] = useState('Storage')
  const [subItem, setSubItem] = useState(null)
  const [deleteError, setDeleteError] = useState(null)

  const storageItems = allFacilities.filter((f) => f.type === 'Storage' && f.campusAreaId === area.id)
  const venueItems = allFacilities.filter((f) => f.type === 'Venue' && f.campusAreaId === area.id)
  const items = activeTab === 'Storage' ? storageItems : venueItems

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
      setSubItem(null)
    } else {
      setDeleteError(result?.message || 'Failed to delete this item.')
    }
  }

  if (subItem) {
    const style = FACILITY_TYPE_STYLES[subItem.type]
    return (
      <div>
        <button
          type="button"
          onClick={() => {
            setSubItem(null)
            setDeleteError(null)
          }}
          className="mb-4 flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-gray-500 transition-colors duration-150 hover:text-gray-700"
        >
          <FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3" />
          Back to {area.name}
        </button>

        <div className="flex flex-col items-center gap-2">
          {subItem.photoUrl ? (
            <img
              src={subItem.photoUrl}
              alt={subItem.name}
              className="h-24 w-full rounded-xl object-cover"
            />
          ) : (
            <div className={`flex h-12 w-12 items-center justify-center rounded-full text-white ${style.bgClass}`}>
              <FontAwesomeIcon icon={style.icon} className="h-5 w-5" />
            </div>
          )}
          <p className="text-sm font-bold text-gray-900">{subItem.name}</p>
        </div>

        <div className="mt-4">
          <DetailRow label={`${subItem.type} ID`} value={subItem.id} />
          <DetailRow label="Embedded In" value={area.name} />
        </div>

        {deleteError && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{deleteError}</p>
        )}

        <EditDeleteRow onEdit={() => onEditItem(subItem)} onDelete={handleDeleteItem} />
      </div>
    )
  }

  return (
    <>
      <div className="mb-4 flex h-32 w-full items-center justify-center overflow-hidden rounded-xl bg-gray-100">
        {area.photoUrl ? (
          <img src={area.photoUrl} alt={area.name} className="h-full w-full object-cover" />
        ) : (
          <FontAwesomeIcon icon={faImage} className="h-8 w-8 text-gray-300" />
        )}
      </div>

      <DetailRow label="Area ID" value={area.id} />
      <DetailRow label="Type" value={area.type} />

      {deleteError && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{deleteError}</p>
      )}

      <EditDeleteRow onEdit={() => onEditArea(area)} onDelete={handleDeleteArea} />

      <div className="mt-5 flex gap-2">
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
            onClick={() => setSubItem(item)}
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
    </>
  )
}

export default AreaDetailsContent
