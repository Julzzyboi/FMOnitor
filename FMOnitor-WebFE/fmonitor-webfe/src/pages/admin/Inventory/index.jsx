import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMagnifyingGlass,
  faDownload,
  faChartColumn,
  faPlus,
  faImage,
  faCheck,
} from '@fortawesome/free-solid-svg-icons'
import AdminPageShell from '../../../components/layout/AdminPageShell'
import Pagination from '../../../components/common/Pagination'
import EquipmentModal from './modals/EquipmentModal'
import EquipmentDetailsModal from './modals/EquipmentDetailsModal'
import ConfirmModal from '../Accounts/modals/ConfirmModal'
import Toast from '../Accounts/components/Toast'
import {
  STORAGE_AREAS,
  BORROWABLE_STORAGE_AREAS,
  NON_BORROWABLE_STORAGE_AREAS,
  CONDITIONS,
  AVAILABILITY_OPTIONS,
  INITIAL_EQUIPMENT,
} from './inventoryData'

// 3 rows of the xl:4-column grid - a round number that also divides evenly
// into the smaller grid widths (2/3 columns) without an awkward half-empty
// last row on most page counts.
const PAGE_SIZE = 12

// No backend inventory table/API exists yet (Storage/Venue/CampusArea all
// have real ones; this doesn't) - everything here lives in local component
// state, seeded from the real physical count sheet the user provided
// (inventoryData.js). Adds/edits/deletes only persist for this browser tab's
// session, same tradeoff as CampusMap's delivery-tickets stub. Wire this up
// to a real /api/equipment endpoint (mirroring StorageController) once
// that's ready, and this component's shape barely has to change - swap the
// useState seed for a fetch, keep everything else.

// Same flat, ring-based checkbox as CampusMap/FilterNav's (scaled down a
// notch - this sidebar now has three filter sections instead of one) - kept
// as its own copy rather than a shared import since the two live in
// unrelated features.
function Checkbox({ checked }) {
  return (
    <span
      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md transition-all duration-200 ${
        checked ? 'bg-[#fccb35] shadow-sm shadow-[#fccb35]/50' : 'bg-gray-100 ring-1 ring-inset ring-gray-200 group-hover:ring-gray-300'
      }`}
    >
      <FontAwesomeIcon
        icon={faCheck}
        className={`h-2.5 w-2.5 text-gray-900 transition-all duration-200 ${checked ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}
      />
    </span>
  )
}

// One shape shared by Location/Condition/Availability - each is just "which
// values of this one field are currently visible", so the section markup
// only needs writing once.
function FilterSection({ title, options, counts, visible, onToggle }) {
  return (
    <div className="mb-3 last:mb-0">
      <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-wide text-gray-400">{title}</p>
      <div className="flex flex-col gap-0.5">
        {options.map((option) => {
          const checked = visible.has(option)
          return (
            <button
              key={option}
              type="button"
              role="checkbox"
              aria-checked={checked}
              onClick={() => onToggle(option)}
              title={option}
              className={`group flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors duration-150 ${
                checked ? 'bg-[#fccb35]/20 text-gray-900' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Checkbox checked={checked} />
              <span className="min-w-0 flex-1 truncate">{option}</span>
              <span className="shrink-0 text-[11px] text-gray-400">{counts[option] ?? 0}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function countBy(equipment, field, options) {
  const counts = Object.fromEntries(options.map((o) => [o, 0]))
  for (const e of equipment) counts[e[field]] = (counts[e[field]] ?? 0) + 1
  return counts
}

function toggleInSet(setState, value) {
  setState((prev) => {
    const next = new Set(prev)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    return next
  })
}

function toCsv(items) {
  const header = ['Name', 'Storage Area', 'Available', 'Not Working', 'Condition', 'Availability']
  const rows = items.map((i) => [i.name, i.location, i.available, i.notWorking, i.condition, i.availability])
  return [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
}

function InventoryContent() {
  const [equipment, setEquipment] = useState(INITIAL_EQUIPMENT)
  const [search, setSearch] = useState('')
  // Every section starts with nothing ticked, and an empty section doesn't
  // filter at all - so the page opens on the full inventory, and ticking
  // boxes narrows it down to just those values.
  const [visibleLocations, setVisibleLocations] = useState(() => new Set())
  const [visibleConditions, setVisibleConditions] = useState(() => new Set())
  const [visibleAvailability, setVisibleAvailability] = useState(() => new Set())
  const [sort, setSort] = useState('location')
  const [page, setPage] = useState(1)
  const [viewingItem, setViewingItem] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [toast, setToast] = useState(null) // { message, type }

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  const locationCounts = useMemo(() => countBy(equipment, 'location', STORAGE_AREAS), [equipment])
  const conditionCounts = useMemo(() => countBy(equipment, 'condition', CONDITIONS), [equipment])
  const availabilityCounts = useMemo(() => countBy(equipment, 'availability', AVAILABILITY_OPTIONS), [equipment])

  const clearAll = () => {
    setVisibleLocations(new Set())
    setVisibleConditions(new Set())
    setVisibleAvailability(new Set())
  }

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase()
    const result = equipment.filter((e) => {
      if (visibleLocations.size && !visibleLocations.has(e.location)) return false
      if (visibleConditions.size && !visibleConditions.has(e.condition)) return false
      if (visibleAvailability.size && !visibleAvailability.has(e.availability)) return false
      if (!query) return true
      return e.name.toLowerCase().includes(query) || e.location.toLowerCase().includes(query)
    })
    // Same order as the physical count sheet: grouped by storage area in
    // STORAGE_AREAS order, then each area's rows top to bottom (seed ids
    // follow the sheet; items added later land at the end of their area).
    if (sort === 'location') {
      result.sort((a, b) => STORAGE_AREAS.indexOf(a.location) - STORAGE_AREAS.indexOf(b.location) || a.id - b.id)
    } else if (sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name))
    else result.sort((a, b) => b.id - a.id) // newest (most recently added) first
    return result
  }, [equipment, visibleLocations, visibleConditions, visibleAvailability, search, sort])

  // Any change to what's being shown jumps back to page 1 - otherwise a
  // filter/search narrowing the list can strand you on a now-nonexistent
  // page, looking at an empty grid with no obvious explanation.
  useEffect(() => {
    setPage(1)
  }, [visibleLocations, visibleConditions, visibleAvailability, search, sort])

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginatedItems = filteredItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const isLastPage = currentPage === totalPages

  const handleAdd = (payload) => {
    setEquipment((prev) => [...prev, { ...payload, id: Math.max(0, ...prev.map((e) => e.id)) + 1 }])
    setShowAddModal(false)
    setToast({ message: `${payload.name} added successfully`, type: 'success' })
  }
  // Saving drops back to the details view (now showing the updated values)
  // rather than closing everything - that's where the edit was started from.
  const handleEdit = (payload) => {
    const updated = { ...editingItem, ...payload }
    setEquipment((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
    setViewingItem(updated)
    setEditingItem(null)
    setToast({ message: 'Changes saved successfully', type: 'success' })
  }
  const handleDelete = () => {
    setEquipment((prev) => prev.filter((e) => e.id !== viewingItem.id))
    setToast({ message: `${viewingItem.name} deleted successfully`, type: 'danger' })
    setConfirmingDelete(false)
    setViewingItem(null)
  }
  const handleExportCsv = () => {
    const blob = new Blob([toCsv(filteredItems)], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'inventory.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <aside className="w-full shrink-0 lg:w-56">
        <div className="rounded-xl bg-white p-3.5 shadow-sm">
          <div className="flex items-center justify-between px-1">
            <span className="text-sm font-bold text-gray-900">Filters</span>
            <button
              type="button"
              onClick={clearAll}
              className="cursor-pointer text-[11px] font-semibold text-gray-400 transition-colors duration-150 hover:text-gray-600 hover:underline"
            >
              Clear all
            </button>
          </div>

          <div className="mt-3">
            <FilterSection
              title="Borrowable Storage"
              options={BORROWABLE_STORAGE_AREAS}
              counts={locationCounts}
              visible={visibleLocations}
              onToggle={(v) => toggleInSet(setVisibleLocations, v)}
            />
            <FilterSection
              title="Non-Borrowable Storage"
              options={NON_BORROWABLE_STORAGE_AREAS}
              counts={locationCounts}
              visible={visibleLocations}
              onToggle={(v) => toggleInSet(setVisibleLocations, v)}
            />
            <FilterSection
              title="Condition"
              options={CONDITIONS}
              counts={conditionCounts}
              visible={visibleConditions}
              onToggle={(v) => toggleInSet(setVisibleConditions, v)}
            />
            <FilterSection
              title="Availability"
              options={AVAILABILITY_OPTIONS}
              counts={availabilityCounts}
              visible={visibleAvailability}
              onToggle={(v) => toggleInSet(setVisibleAvailability, v)}
            />
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-gray-600 transition-colors duration-150 hover:border-gray-300 hover:bg-gray-50"
          >
            <FontAwesomeIcon icon={faDownload} className="h-3.5 w-3.5" />
            Export CSV
          </button>
          <button
            type="button"
            title="No reporting backend yet"
            className="flex cursor-not-allowed items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-gray-400"
          >
            <FontAwesomeIcon icon={faChartColumn} className="h-3.5 w-3.5" />
            View Reports
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#fccb35] px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-gray-900 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
          >
            <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5" />
            Add Item
          </button>
        </div>

        <div className="relative mt-4">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by item name or location…"
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-11 pr-4 text-sm text-gray-700 placeholder:text-gray-400 transition-shadow duration-150 focus:border-[#fccb35] focus:outline-none focus:ring-2 focus:ring-[#fccb35]/30"
          />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-900">{filteredItems.length}</span> items
          </p>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 focus:border-[#fccb35] focus:outline-none"
          >
            <option value="location">Storage area</option>
            <option value="newest">Newly added</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginatedItems.map((eq) => (
            <button
              key={eq.id}
              type="button"
              onClick={() => setViewingItem(eq)}
              className="group cursor-pointer rounded-xl border border-gray-200 bg-white p-3 text-left shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-[#fccb35] hover:shadow-md"
            >
              <div className="flex h-32 w-full items-center justify-center overflow-hidden rounded-lg bg-gray-100">
                {eq.photoUrl ? (
                  <img src={eq.photoUrl} alt={eq.name} className="h-full w-full object-cover" />
                ) : (
                  <FontAwesomeIcon icon={faImage} className="h-8 w-8 text-gray-300" />
                )}
              </div>
              <p className="mt-3 truncate text-[10px] font-bold uppercase tracking-wide text-gray-400">{eq.location}</p>
              <p className="mt-0.5 truncate text-sm font-bold text-gray-900">{eq.name}</p>
              <p className="mt-2 text-sm">
                <span className="font-bold text-gray-900">{eq.available}</span>{' '}
                <span className="text-xs text-gray-400">in stock</span>
              </p>
            </button>
          ))}

          {isLastPage && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="flex min-h-[196px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 transition-colors duration-150 hover:border-[#fccb35] hover:text-[#a3790f]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                <FontAwesomeIcon icon={faPlus} className="h-4 w-4" />
              </span>
              <span className="text-sm font-semibold">Add New Equipment</span>
            </button>
          )}
        </div>

        <div className="mt-4 rounded-xl bg-white shadow-sm">
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            totalItems={filteredItems.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            label="items"
          />
        </div>
      </div>

      {/* Portaled to <body> - AdminPageShell's fade-in animation makes it a
          stacking context, which otherwise traps these fixed overlays under
          the sticky Topbar/Sidebar no matter their own z-index. */}
      {createPortal(
        <>
          {showAddModal && <EquipmentModal onCancel={() => setShowAddModal(false)} onSubmit={handleAdd} />}
          {viewingItem && !editingItem && (
            <EquipmentDetailsModal
              item={viewingItem}
              onClose={() => setViewingItem(null)}
              onEdit={() => setEditingItem(viewingItem)}
              onDelete={() => setConfirmingDelete(true)}
            />
          )}
          {editingItem && (
            <EquipmentModal item={editingItem} onCancel={() => setEditingItem(null)} onSubmit={handleEdit} />
          )}
          {confirmingDelete && viewingItem && (
            <ConfirmModal
              variant="danger"
              title="Delete this item?"
              message={`${viewingItem.name} (${viewingItem.location}) will be removed from the inventory. This can't be undone.`}
              confirmLabel="Delete"
              onConfirm={handleDelete}
              onCancel={() => setConfirmingDelete(false)}
            />
          )}
          {toast && <Toast message={toast.message} type={toast.type} />}
        </>,
        document.body,
      )}
    </div>
  )
}

function Inventory() {
  return (
    <AdminPageShell>
      <InventoryContent />
    </AdminPageShell>
  )
}

export default Inventory
