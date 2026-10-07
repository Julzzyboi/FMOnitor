import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPen, faTrash } from '@fortawesome/free-solid-svg-icons'
import { REPORT_STATUSES } from '../data/inventoryData'
import { ConditionTag } from '../components/InventoryTags'
import EmptyState from '../components/EmptyState'
import { formatItemId } from '../utils/itemId'
import RelativeTime from '../components/RelativeTime'
import { formatDateTime } from '../utils/timeFormat'

const STATUS_STYLES = {
  Open: 'bg-red-50 text-red-700 ring-red-200',
  'In Progress': 'bg-amber-50 text-amber-700 ring-amber-200',
  Resolved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
}

const TYPE_STYLES = {
  Damaged: 'bg-red-100 text-red-700',
  Missing: 'bg-purple-100 text-purple-700',
  'Needs Repair': 'bg-amber-100 text-amber-800',
  Other: 'bg-gray-100 text-gray-600',
}

function ReportCard({ report, item, onEdit, onDelete, onStatusChange }) {
  return (
    <li className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-colors duration-150 hover:border-gray-300">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-bold uppercase tracking-wide text-gray-400">
            {item?.location ?? 'Deleted item'}
          </p>
          <p className="truncate text-sm font-bold text-gray-900">{item?.name ?? 'Deleted item'}</p>
          <p className="text-[11px] text-gray-500">
            Item ID: <span className="font-mono font-semibold text-gray-700">{formatItemId(report.itemId)}</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {item && <ConditionTag condition={item.condition} />}
          <button
            type="button"
            onClick={onEdit}
            aria-label="Edit report"
            className="cursor-pointer rounded-md p-1.5 text-gray-400 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-700"
          >
            <FontAwesomeIcon icon={faPen} className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete report"
            className="cursor-pointer rounded-md p-1.5 text-gray-400 transition-colors duration-150 hover:bg-red-50 hover:text-red-600"
          >
            <FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${TYPE_STYLES[report.type] ?? TYPE_STYLES.Other}`}>
          {report.type}
        </span>
        <span className="text-xs text-gray-500">
          <span className="font-semibold text-gray-900">{report.quantity}</span> unit{report.quantity === 1 ? '' : 's'}
        </span>
        <select
          value={report.status}
          onChange={(e) => onStatusChange(e.target.value)}
          aria-label="Report status"
          className={`ml-auto cursor-pointer rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset focus:outline-none ${STATUS_STYLES[report.status]}`}
        >
          {REPORT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {report.description && <p className="mt-2 whitespace-pre-line text-xs text-gray-600">{report.description}</p>}

      <p className="mt-2 text-[11px] text-gray-400">
        Reported {formatDateTime(report.createdAt)}
        {report.reportedBy && <> by {report.reportedBy}</>}
        {report.resolvedAt && <> · Resolved {formatDateTime(report.resolvedAt)}</>}
        {report.updatedAt && report.updatedAt !== report.createdAt && (
          <>
            {' '}· Updated <RelativeTime value={report.updatedAt} />
          </>
        )}
      </p>
    </li>
  )
}

function ReportsView({ reports, hasAnyReports, itemsById, onNew, onEdit, onDelete, onStatusChange, onClearFilters }) {
  if (reports.length === 0) {
    return hasAnyReports ? (
      <EmptyState
        title="No matches"
        message="Nothing fits those filters. Try a different search or clear the filters."
        actionLabel="Clear filters"
        onAction={onClearFilters}
      />
    ) : (
      <EmptyState
        title="No reports yet"
        message="Damaged, missing or broken equipment will show up here once it's reported."
        actionLabel="New report"
        onAction={onNew}
      />
    )
  }

  return (
    <ul className="mt-4 flex flex-col gap-3">
      {reports.map((r) => (
        <ReportCard
          key={r.id}
          report={r}
          item={itemsById.get(r.itemId)}
          onEdit={() => onEdit(r)}
          onDelete={() => onDelete(r)}
          onStatusChange={(status) => onStatusChange(r, status)}
        />
      ))}
    </ul>
  )
}

export default ReportsView
