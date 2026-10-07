import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMagnifyingGlass,
  faDownload,
  faPlus,
  faBoxesStacked,
  faClipboardList,
  faTrashCan,
} from '@fortawesome/free-solid-svg-icons'
import AdminPageShell from '../../../components/layout/AdminPageShell'
import useDelayedLoading from '../../../hooks/useDelayedLoading'
import InventorySkeleton from './components/InventorySkeleton'
import Pagination from '../../../components/common/Pagination'
import EquipmentModal from './modals/EquipmentModal'
import EquipmentDetailsModal from './modals/EquipmentDetailsModal'
import ReportFormModal from './modals/ReportFormModal'
import ItemsView from './views/ItemsView'
import ReportsView from './views/ReportsView'
import TrashView from './views/TrashView'
import { TRASH_RETENTION_DAYS } from './utils/trash'
import { FilterSection, RadioSection } from './components/FilterSection'
import { countBy, toggleInSet } from './utils/filterUtils'
import { conditionDotClass } from './utils/conditionStyles'
import { formatItemId } from './utils/itemId'
import { formatDateTime } from './utils/timeFormat'
import ConfirmModal from '../Accounts/modals/ConfirmModal'
import Toast from '../Accounts/components/Toast'
import {
  apiRequest,
  ITEMS_ENDPOINT,
  REPORTS_ENDPOINT,
  STORAGES_ENDPOINT,
  FACILITIES_ENDPOINT,
} from './api/inventoryApi'
import {
  CONDITIONS,
  AVAILABILITY_OPTIONS,
  REPORT_TYPES,
  REPORT_STATUSES,
} from './data/inventoryData'

const ITEMS_PAGE_SIZE = 12
const REPORTS_PAGE_SIZE = 10

const REPORT_ORDER_OPTIONS = [
  ['newest', 'Newest first'],
  ['oldest', 'Oldest first'],
]

function downloadCsv(filename, header, rows) {
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const VIEWS = ['items', 'reports', 'trash']

const SEARCH_PLACEHOLDERS = {
  items: 'Search by item name, ID or location…',
  reports: 'Search by item, ID, location, issue or reporter…',
  trash: 'Search the trash bin by item name, ID or location…',
}
const LIST_LABELS = { items: 'items', reports: 'reports', trash: 'items in the trash' }

function ViewToggle({ view, onChange, itemCount, openReportCount, trashCount }) {
  const tabs = [
    ['items', 'Items', faBoxesStacked, itemCount],
    ['reports', 'Reports', faClipboardList, openReportCount],
    ['trash', 'Trash', faTrashCan, trashCount],
  ]
  return (
    <div role="tablist" className="inline-flex rounded-xl bg-gray-200/70 p-1">
      {tabs.map(([value, label, icon, count]) => {
        const active = view === value
        return (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(value)}
            className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all duration-150 ${
              active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FontAwesomeIcon icon={icon} className="h-3.5 w-3.5" />
            {label}
            {value === 'reports' && count > 0 ? (
              <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] leading-none text-white" title="Open reports">
                {count}
              </span>
            ) : (
              value !== 'reports' && <span className="text-[11px] font-semibold text-gray-400">{count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function InventoryContent() {
  const [searchParams, setSearchParams] = useSearchParams()
  const view = VIEWS.includes(searchParams.get('view')) ? searchParams.get('view') : 'items'
  const setView = (next) => setSearchParams(next === 'items' ? {} : { view: next }, { replace: true })

  // Items as the API returns them - `equipment` below adds the storage name.
  const [rawItems, setRawItems] = useState([])
  const [rawTrash, setRawTrash] = useState([])
  // Every report, including those of trashed items - `reports` below hides those.
  const [allReports, setReports] = useState([])
  const [storages, setStorages] = useState([])
  const [facilities, setFacilities] = useState([])
  const [loading, setLoading] = useState(true)
  const minDelayPending = useDelayedLoading()

  // Items view
  const [itemSearch, setItemSearch] = useState('')
  const [itemTypes, setItemTypes] = useState(() => new Set())
  const [itemConditions, setItemConditions] = useState(() => new Set())
  const [itemLocations, setItemLocations] = useState(() => new Set())
  const [itemSort, setItemSort] = useState('location')
  const [itemPage, setItemPage] = useState(1)

  // Reports view
  const [reportSearch, setReportSearch] = useState('')
  const [reportOrder, setReportOrder] = useState('newest')
  const [reportTypes, setReportTypes] = useState(() => new Set())
  const [reportConditions, setReportConditions] = useState(() => new Set())
  const [reportStatuses, setReportStatuses] = useState(() => new Set())
  const [reportPage, setReportPage] = useState(1)

  // Trash view
  const [trashSearch, setTrashSearch] = useState('')
  const [trashPage, setTrashPage] = useState(1)
  // { item, action: 'restore' | 'purge' } while a trash action waits for confirmation
  const [trashAction, setTrashAction] = useState(null)

  const [viewingItemId, setViewingItemId] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  // null when closed, else { report } to edit or { presetItemId } to file a new one
  const [reportForm, setReportForm] = useState(null)
  const [deletingReport, setDeletingReport] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    Promise.all([
      apiRequest('GET', ITEMS_ENDPOINT),
      apiRequest('GET', REPORTS_ENDPOINT),
      apiRequest('GET', STORAGES_ENDPOINT),
      apiRequest('GET', FACILITIES_ENDPOINT),
      apiRequest('GET', `${ITEMS_ENDPOINT}?trashed=true`),
    ])
      .then(([itemsResult, reportsResult, storagesResult, facilitiesResult, trashResult]) => {
        if (itemsResult.ok) setRawItems(itemsResult.data)
        else setToast({ message: 'Failed to load inventory', type: 'danger' })
        if (trashResult.ok) setRawTrash(trashResult.data)
        if (reportsResult.ok) setReports(reportsResult.data)
        else setToast({ message: 'Failed to load reports', type: 'danger' })
        if (storagesResult.ok) setStorages(storagesResult.data)
        if (facilitiesResult.ok) setFacilities(facilitiesResult.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const storageNames = useMemo(() => new Map(storages.map((s) => [s.id, s.name])), [storages])

  // Storage dropdown options, grouped under the Campus Map facility each storage sits in.
  const storageGroups = useMemo(() => {
    const facilityNames = new Map(facilities.map((f) => [f.id, f.name]))
    const groups = new Map()
    for (const s of storages) {
      const facilityName = facilityNames.get(s.facilityId) ?? 'Other'
      if (!groups.has(facilityName)) groups.set(facilityName, [])
      groups.get(facilityName).push(s)
    }
    for (const list of groups.values()) list.sort((a, b) => a.name.localeCompare(b.name))
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [storages, facilities])

  const storageFilterOptions = useMemo(
    () => [...new Set(storages.map((s) => s.name))].sort((a, b) => a.localeCompare(b)),
    [storages],
  )

  const equipment = useMemo(
    () => rawItems.map((e) => ({ ...e, location: storageNames.get(e.storageId) ?? 'Unknown storage' })),
    [rawItems, storageNames],
  )
  const itemsById = useMemo(() => new Map(equipment.map((e) => [e.id, e])), [equipment])
  const viewingItem = viewingItemId != null ? itemsById.get(viewingItemId) ?? null : null

  const trash = useMemo(
    () => rawTrash.map((e) => ({ ...e, location: storageNames.get(e.storageId) ?? 'Unknown storage' })),
    [rawTrash, storageNames],
  )

  // A trashed item's reports stay in the database (they come back on restore)
  // but drop out of the Reports view and every count.
  const reports = useMemo(() => allReports.filter((r) => itemsById.has(r.itemId)), [allReports, itemsById])
  const reportCountByItem = useMemo(() => {
    const counts = {}
    for (const r of allReports) counts[r.itemId] = (counts[r.itemId] ?? 0) + 1
    return counts
  }, [allReports])

  const openReportCounts = useMemo(() => {
    const counts = {}
    for (const r of reports) if (r.status !== 'Resolved') counts[r.itemId] = (counts[r.itemId] ?? 0) + 1
    return counts
  }, [reports])
  const openReportTotal = useMemo(() => reports.filter((r) => r.status === 'Open').length, [reports])

  // ---- Items: filter + sort ----
  const itemTypeCounts = useMemo(() => countBy(equipment, (e) => e.availability, AVAILABILITY_OPTIONS), [equipment])
  const itemConditionCounts = useMemo(() => countBy(equipment, (e) => e.condition, CONDITIONS), [equipment])
  const itemLocationCounts = useMemo(
    () => countBy(equipment, (e) => e.location, storageFilterOptions),
    [equipment, storageFilterOptions],
  )

  const filteredItems = useMemo(() => {
    const query = itemSearch.trim().toLowerCase()
    const result = equipment.filter((e) => {
      if (itemTypes.size && !itemTypes.has(e.availability)) return false
      if (itemConditions.size && !itemConditions.has(e.condition)) return false
      if (itemLocations.size && !itemLocations.has(e.location)) return false
      if (!query) return true
      return [e.name, e.location, formatItemId(e.id)].some((field) => field.toLowerCase().includes(query))
    })
    if (itemSort === 'location') {
      result.sort((a, b) => a.location.localeCompare(b.location) || a.id - b.id)
    } else if (itemSort === 'name') result.sort((a, b) => a.name.localeCompare(b.name))
    else if (itemSort === 'updated') result.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt) || b.id - a.id)
    else result.sort((a, b) => b.id - a.id)
    return result
  }, [equipment, itemTypes, itemConditions, itemLocations, itemSearch, itemSort])


  // ---- Reports: filter + sort ----
  const reportTypeCounts = useMemo(() => countBy(reports, (r) => r.type, REPORT_TYPES), [reports])
  const reportConditionCounts = useMemo(
    () => countBy(reports, (r) => itemsById.get(r.itemId)?.condition, CONDITIONS),
    [reports, itemsById],
  )
  const reportStatusCounts = useMemo(() => countBy(reports, (r) => r.status, REPORT_STATUSES), [reports])

  const filteredReports = useMemo(() => {
    const query = reportSearch.trim().toLowerCase()
    const result = reports.filter((r) => {
      const item = itemsById.get(r.itemId)
      if (reportTypes.size && !reportTypes.has(r.type)) return false
      if (reportConditions.size && !reportConditions.has(item?.condition)) return false
      if (reportStatuses.size && !reportStatuses.has(r.status)) return false
      if (!query) return true
      return [item?.name, item?.location, formatItemId(r.itemId), r.type, r.description, r.reportedBy]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(query))
    })
    const direction = reportOrder === 'oldest' ? 1 : -1
    result.sort((a, b) => direction * (new Date(a.createdAt) - new Date(b.createdAt) || a.id - b.id))
    return result
  }, [reports, itemsById, reportTypes, reportConditions, reportStatuses, reportSearch, reportOrder])

  // ---- Trash: search only, most recently deleted first (as the API returns it) ----
  const filteredTrash = useMemo(() => {
    const query = trashSearch.trim().toLowerCase()
    if (!query) return trash
    return trash.filter((e) => [e.name, e.location, formatItemId(e.id)].some((f) => f.toLowerCase().includes(query)))
  }, [trash, trashSearch])

  // ---- Paging ----
  const isItems = view === 'items'
  const isTrash = view === 'trash'
  const listLabel = LIST_LABELS[view]
  const pageSize = isItems ? ITEMS_PAGE_SIZE : REPORTS_PAGE_SIZE
  const visibleList = isItems ? filteredItems : isTrash ? filteredTrash : filteredReports
  const totalPages = Math.max(1, Math.ceil(visibleList.length / pageSize))
  const currentPage = Math.min(isItems ? itemPage : isTrash ? trashPage : reportPage, totalPages)
  const setCurrentViewPage = isItems ? setItemPage : isTrash ? setTrashPage : setReportPage
  const pageSlice = visibleList.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const search = isItems ? itemSearch : isTrash ? trashSearch : reportSearch
  const setSearch = isItems ? setItemSearch : isTrash ? setTrashSearch : setReportSearch

  // Any filter/search/sort change sends the current view back to page 1.
  const resetPage = () => setCurrentViewPage(1)
  const toggleFilter = (setter) => (value) => {
    toggleInSet(setter, value)
    resetPage()
  }
  const withReset = (setter) => (value) => {
    setter(value)
    resetPage()
  }

  const clearAll = () => {
    resetPage()
    if (isItems) {
      setItemTypes(new Set())
      setItemConditions(new Set())
      setItemLocations(new Set())
    } else if (!isTrash) {
      setReportOrder('newest')
      setReportTypes(new Set())
      setReportConditions(new Set())
      setReportStatuses(new Set())
    }
  }
  const clearFiltersAndSearch = () => {
    clearAll()
    setSearch('')
  }

  // ---- Item CRUD ----
  const handleAdd = async (payload) => {
    const result = await apiRequest('POST', ITEMS_ENDPOINT, payload)
    if (!result.ok) return result
    setRawItems((prev) => [...prev, result.data])
    setShowAddModal(false)
    setToast({ message: `${result.data.name} added successfully`, type: 'success' })
    return result
  }
  const handleEdit = async (payload) => {
    const result = await apiRequest('PATCH', `${ITEMS_ENDPOINT}/${editingItem.id}`, payload)
    if (!result.ok) return result
    const updated = result.data
    setRawItems((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
    setEditingItem(null)
    setToast({ message: 'Changes saved successfully', type: 'success' })
    return result
  }
  const handleDelete = async () => {
    const item = viewingItem
    const result = await apiRequest('DELETE', `${ITEMS_ENDPOINT}/${item.id}`)
    setConfirmingDelete(false)
    if (!result.ok) {
      setToast({ message: result.message, type: 'danger' })
      return
    }
    // The API returns the item with its deletedAt set - it moves to the trash bin.
    setRawItems((prev) => prev.filter((e) => e.id !== item.id))
    setRawTrash((prev) => [result.data, ...prev])
    setToast({ message: `${item.name} moved to the trash bin`, type: 'danger' })
    setViewingItemId(null)
  }

  // ---- Trash bin ----
  const handleTrashAction = async () => {
    const { item, action } = trashAction
    const result =
      action === 'restore'
        ? await apiRequest('POST', `${ITEMS_ENDPOINT}/${item.id}/restore`)
        : await apiRequest('DELETE', `${ITEMS_ENDPOINT}/${item.id}/permanent`)
    setTrashAction(null)
    if (!result.ok) {
      setToast({ message: result.message, type: 'danger' })
      return
    }
    setRawTrash((prev) => prev.filter((e) => e.id !== item.id))
    if (action === 'restore') {
      setRawItems((prev) => [...prev, result.data])
      setToast({ message: `${item.name} restored`, type: 'success' })
    } else {
      setReports((prev) => prev.filter((r) => r.itemId !== item.id))
      setToast({ message: `${item.name} permanently deleted`, type: 'danger' })
    }
  }

  // ---- Report CRUD ----
  const handleReportSubmit = async (payload) => {
    const editing = reportForm?.report
    const result = editing
      ? await apiRequest('PATCH', `${REPORTS_ENDPOINT}/${editing.id}`, payload)
      : await apiRequest('POST', REPORTS_ENDPOINT, payload)
    if (!result.ok) return result
    setReports((prev) => (editing ? prev.map((r) => (r.id === editing.id ? result.data : r)) : [result.data, ...prev]))
    setReportForm(null)
    setToast({ message: editing ? 'Report updated' : 'Report submitted', type: 'success' })
    return result
  }
  const handleReportStatusChange = async (report, status) => {
    const result = await apiRequest('PATCH', `${REPORTS_ENDPOINT}/${report.id}`, { status })
    if (!result.ok) {
      setToast({ message: result.message, type: 'danger' })
      return
    }
    setReports((prev) => prev.map((r) => (r.id === report.id ? result.data : r)))
  }
  const handleReportDelete = async () => {
    const report = deletingReport
    const result = await apiRequest('DELETE', `${REPORTS_ENDPOINT}/${report.id}`)
    setDeletingReport(null)
    if (!result.ok) {
      setToast({ message: result.message, type: 'danger' })
      return
    }
    setReports((prev) => prev.filter((r) => r.id !== report.id))
    setToast({ message: 'Report deleted', type: 'danger' })
  }

  const handleExportCsv = () => {
    if (isItems) {
      downloadCsv(
        'inventory-items.csv',
        ['Item ID', 'Name', 'Storage', 'Quantity Available', 'Condition', 'Item Type', 'Date Added', 'Last Updated'],
        filteredItems.map((i) => [
          formatItemId(i.id),
          i.name,
          i.location,
          i.available,
          i.condition,
          i.availability,
          formatDateTime(i.createdAt),
          formatDateTime(i.updatedAt),
        ]),
      )
    } else {
      downloadCsv(
        'inventory-reports.csv',
        ['Reported At', 'Item ID', 'Item', 'Storage Area', 'Item Condition', 'Issue Type', 'Quantity', 'Status', 'Reported By', 'Description'],
        filteredReports.map((r) => {
          const item = itemsById.get(r.itemId)
          return [formatDateTime(r.createdAt), formatItemId(r.itemId), item?.name, item?.location, item?.condition, r.type, r.quantity, r.status, r.reportedBy, r.description]
        }),
      )
    }
  }

  // One skeleton until both the data and the app-wide minimum delay are done,
  // then the page fades in the same way the History page does.
  if (loading || minDelayPending) {
    return (
      <>
        <InventorySkeleton view={view} />
        {toast && createPortal(<Toast message={toast.message} type={toast.type} />, document.body)}
      </>
    )
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      {/* Sections slide up one after another, same timing as the Accounts page. */}
      <aside className="w-full shrink-0 animate-[fade-in-up_0.4s_ease-out_forwards] opacity-0 lg:w-56">
        {isTrash ? (
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faTrashCan} className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-sm font-bold text-gray-900">Trash Bin</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-gray-500">
              Deleted items stay here for {TRASH_RETENTION_DAYS} days. Restore one to bring it back with its reports, or
              delete it forever now. After {TRASH_RETENTION_DAYS} days it's removed automatically.
            </p>
          </div>
        ) : (
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
            {isItems ? (
              <>
                <FilterSection
                  title="Item Type"
                  options={AVAILABILITY_OPTIONS}
                  counts={itemTypeCounts}
                  visible={itemTypes}
                  onToggle={toggleFilter(setItemTypes)}
                />
                <FilterSection
                  title="Condition"
                  options={CONDITIONS}
                  counts={itemConditionCounts}
                  visible={itemConditions}
                  onToggle={toggleFilter(setItemConditions)}
                  dotClassFor={conditionDotClass}
                />
                <FilterSection
                  title="Storage Area"
                  options={storageFilterOptions}
                  counts={itemLocationCounts}
                  visible={itemLocations}
                  onToggle={toggleFilter(setItemLocations)}
                />
              </>
            ) : (
              <>
                <RadioSection title="Order" options={REPORT_ORDER_OPTIONS} value={reportOrder} onChange={withReset(setReportOrder)} />
                <FilterSection
                  title="Issue Type"
                  options={REPORT_TYPES}
                  counts={reportTypeCounts}
                  visible={reportTypes}
                  onToggle={toggleFilter(setReportTypes)}
                />
                <FilterSection
                  title="Item Condition"
                  options={CONDITIONS}
                  counts={reportConditionCounts}
                  visible={reportConditions}
                  onToggle={toggleFilter(setReportConditions)}
                  dotClassFor={conditionDotClass}
                />
                <FilterSection
                  title="Status"
                  options={REPORT_STATUSES}
                  counts={reportStatusCounts}
                  visible={reportStatuses}
                  onToggle={toggleFilter(setReportStatuses)}
                />
              </>
            )}
          </div>
        </div>
        )}
      </aside>

      <div className="min-w-0 flex-1">
        <div className="flex animate-[fade-in-up_0.4s_ease-out_0.05s_forwards] flex-wrap items-center justify-between gap-3 opacity-0">
          <ViewToggle
            view={view}
            onChange={setView}
            itemCount={equipment.length}
            openReportCount={openReportTotal}
            trashCount={trash.length}
          />

          {!isTrash && (
          <div className="flex flex-wrap gap-3">
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
              onClick={() => (isItems ? setShowAddModal(true) : setReportForm({}))}
              className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#fccb35] px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-gray-900 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
            >
              <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5" />
              {isItems ? 'Add Item' : 'New Report'}
            </button>
          </div>
          )}
        </div>

        <div className="relative mt-4 animate-[fade-in-up_0.4s_ease-out_0.1s_forwards] opacity-0">
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => withReset(setSearch)(e.target.value)}
            placeholder={SEARCH_PLACEHOLDERS[view]}
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-11 pr-4 text-sm text-gray-700 placeholder:text-gray-400 transition-shadow duration-150 focus:border-[#fccb35] focus:outline-none focus:ring-2 focus:ring-[#fccb35]/30"
          />
        </div>

        <div className="mt-4 flex animate-[fade-in-up_0.4s_ease-out_0.12s_forwards] items-center justify-between opacity-0">
          <p className="text-sm text-gray-500">
            Showing <span className="font-semibold text-gray-900">{visibleList.length}</span> {listLabel}
          </p>
          {isItems && (
            <select
              value={itemSort}
              onChange={(e) => withReset(setItemSort)(e.target.value)}
              className="cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 focus:border-[#fccb35] focus:outline-none"
            >
              <option value="location">Storage area</option>
              <option value="newest">Newly added</option>
              <option value="updated">Recently updated</option>
              <option value="name">Name (A-Z)</option>
            </select>
          )}
        </div>

        {/* Re-keyed per view so switching tabs replays the entrance. */}
        <div key={view} className="animate-[fade-in-up_0.4s_ease-out_0.15s_forwards] opacity-0">
        {isTrash ? (
          <TrashView
            items={pageSlice}
            hasAnyTrash={trash.length > 0}
            reportCountByItem={reportCountByItem}
            onRestore={(item) => setTrashAction({ item, action: 'restore' })}
            onPurge={(item) => setTrashAction({ item, action: 'purge' })}
            onClearSearch={clearFiltersAndSearch}
          />
        ) : isItems ? (
          <ItemsView
            items={pageSlice}
            hasAnyItems={equipment.length > 0}
            onView={(item) => setViewingItemId(item.id)}
            onAdd={() => setShowAddModal(true)}
            onClearFilters={clearFiltersAndSearch}
          />
        ) : (
          <ReportsView
            reports={pageSlice}
            hasAnyReports={reports.length > 0}
            itemsById={itemsById}
            onNew={() => setReportForm({})}
            onClearFilters={clearFiltersAndSearch}
            onEdit={(report) => setReportForm({ report })}
            onDelete={setDeletingReport}
            onStatusChange={handleReportStatusChange}
          />
        )}
        </div>

        {visibleList.length > 0 && (
        <div className="mt-4 animate-[fade-in-up_0.4s_ease-out_0.18s_forwards] rounded-xl bg-white opacity-0 shadow-sm">
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            totalItems={visibleList.length}
            pageSize={pageSize}
            onPageChange={setCurrentViewPage}
            label={listLabel}
          />
        </div>
        )}
      </div>

      {createPortal(
        <>
          {showAddModal && <EquipmentModal storageGroups={storageGroups} onCancel={() => setShowAddModal(false)} onSubmit={handleAdd} />}
          {viewingItem && !editingItem && (
            <EquipmentDetailsModal
              item={viewingItem}
              openReportCount={openReportCounts[viewingItem.id] ?? 0}
              onClose={() => setViewingItemId(null)}
              onEdit={() => setEditingItem(viewingItem)}
              onDelete={() => setConfirmingDelete(true)}
              onReport={() => setReportForm({ presetItemId: viewingItem.id })}
            />
          )}
          {editingItem && (
            <EquipmentModal item={editingItem} storageGroups={storageGroups} onCancel={() => setEditingItem(null)} onSubmit={handleEdit} />
          )}
          {reportForm && (
            <ReportFormModal
              report={reportForm.report}
              presetItemId={reportForm.presetItemId}
              equipment={equipment}
              onCancel={() => setReportForm(null)}
              onSubmit={handleReportSubmit}
            />
          )}
          {confirmingDelete && viewingItem && (
            <ConfirmModal
              variant="danger"
              title="Move this item to the trash?"
              message={`${viewingItem.name} (${viewingItem.location}) will be moved to the trash bin. You can restore it within ${TRASH_RETENTION_DAYS} days; after that it's deleted for good.`}
              confirmLabel="Move to Trash"
              onConfirm={handleDelete}
              onCancel={() => setConfirmingDelete(false)}
            />
          )}
          {trashAction?.action === 'restore' && (
            <ConfirmModal
              variant="success"
              title="Restore this item?"
              message={`${trashAction.item.name} will go back to ${trashAction.item.location}, along with its reports.`}
              confirmLabel="Restore"
              onConfirm={handleTrashAction}
              onCancel={() => setTrashAction(null)}
            />
          )}
          {trashAction?.action === 'purge' && (
            <ConfirmModal
              variant="danger"
              title="Delete forever?"
              message={`${trashAction.item.name} (${formatItemId(trashAction.item.id)})${
                reportCountByItem[trashAction.item.id]
                  ? ` and its ${reportCountByItem[trashAction.item.id]} report${reportCountByItem[trashAction.item.id] === 1 ? '' : 's'}`
                  : ''
              } will be permanently deleted. This can't be undone.`}
              confirmLabel="Delete Forever"
              onConfirm={handleTrashAction}
              onCancel={() => setTrashAction(null)}
            />
          )}
          {deletingReport && (
            <ConfirmModal
              variant="danger"
              title="Delete this report?"
              message="This report will be permanently removed. This can't be undone."
              confirmLabel="Delete"
              onConfirm={handleReportDelete}
              onCancel={() => setDeletingReport(null)}
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
  // skipSkeleton: the page shows its own InventorySkeleton instead of the generic one.
  return (
    <AdminPageShell skipSkeleton>
      <InventoryContent />
    </AdminPageShell>
  )
}

export default Inventory
