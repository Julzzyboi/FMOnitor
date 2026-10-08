import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCheck, faXmark, faImage, faLock, faArrowRight, faBan } from '@fortawesome/free-solid-svg-icons'
import RelativeTime from '../components/RelativeTime'
import { ConditionTag, CriticalTag } from '../components/InventoryTags'
import { formatItemId } from '../utils/itemId'
import { CHANGE_ACTIONS, CHANGE_STATUS_STYLES } from '../data/changeRequests'

// Field order and labels for the before/after table.
const FIELDS = [
  ['photoUrl', 'Photo'],
  ['name', 'Item name'],
  ['storageId', 'Storage'],
  ['available', 'Quantity'],
  ['condition', 'Condition'],
  ['availability', 'Item type'],
  ['critical', 'Criticality'],
]

function FieldValue({ field, value, storageNames }) {
  if (value === null || value === undefined) return <span className="text-gray-300">—</span>
  switch (field) {
    case 'photoUrl':
      return value ? (
        <img src={value} alt="" className="h-14 w-20 rounded object-cover" />
      ) : (
        <span className="text-gray-400">No photo</span>
      )
    case 'storageId':
      return storageNames.get(value) ?? `Storage #${value}`
    case 'condition':
      return <ConditionTag condition={value} />
    case 'critical':
      return value ? <CriticalTag /> : 'Non-Critical'
    default:
      return String(value)
  }
}

function ChangesTable({ request, storageNames }) {
  const changes = request.changes ?? {}
  const previous = request.previous ?? {}
  const isCreate = request.action === 'Create'
  const rows = FIELDS.filter(([field]) => changes[field] !== null && changes[field] !== undefined)
  if (rows.length === 0) return null

  return (
    <table className="mt-4 w-full table-fixed text-left text-xs">
      <thead>
        <tr className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
          <th className="w-24 py-1 pr-3">Field</th>
          {!isCreate && <th className="py-1 pr-2">Before</th>}
          {!isCreate && <th className="w-5" />}
          <th className="py-1">{isCreate ? 'Value' : 'After'}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([field, label]) => (
          <tr key={field} className="border-t border-gray-100 align-middle">
            <td className="py-2 pr-3 font-semibold text-gray-500">{label}</td>
            {!isCreate && (
              <td className="break-words py-2 pr-2 text-gray-500">
                <FieldValue field={field} value={previous[field]} storageNames={storageNames} />
              </td>
            )}
            {!isCreate && (
              <td className="text-gray-300">
                <FontAwesomeIcon icon={faArrowRight} className="h-2.5 w-2.5" />
              </td>
            )}
            <td className="break-words py-2 font-semibold text-gray-900">
              <FieldValue field={field} value={changes[field]} storageNames={storageNames} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// One change request in full: what changes, who asked, and - for a
// Superadmin - Approve / Reject (or, for the Admin who asked, Cancel).
function ChangeRequestModal({ request, item, storageNames, isSuperadmin, blockedBy, onApprove, onReject, onCancel, onClose }) {
  const action = CHANGE_ACTIONS[request.action] ?? { label: request.action, style: 'bg-gray-100 text-gray-600' }
  const pending = request.status === 'Pending'
  const photo = request.changes?.photoUrl || item?.photoUrl

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-16 lg:py-20">
      <div onClick={onClose} aria-hidden="true" className="absolute inset-0 bg-black/50" />

      <div className="relative flex max-h-full w-full max-w-lg animate-[fade-in-up_0.25s_ease-out_forwards] flex-col overflow-hidden rounded-2xl bg-white opacity-0 shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="mr-1 text-base font-bold text-gray-900">Change Request</h3>
            <span className="font-mono text-[11px] font-semibold text-gray-400">#{request.id}</span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${CHANGE_STATUS_STYLES[request.status]}`}>
              {request.status}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-md p-1.5 text-gray-400 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-600"
          >
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100">
              {photo ? (
                <img src={photo} alt="" className="h-full w-full object-cover" />
              ) : (
                <FontAwesomeIcon icon={faImage} className="h-5 w-5 text-gray-300" />
              )}
            </div>
            <div className="min-w-0">
              <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${action.style}`}>{action.label}</span>
              <p className="mt-1 truncate text-base font-bold text-gray-900">{request.itemName ?? item?.name ?? 'New item'}</p>
              {request.itemId && (
                <p className="text-[11px] text-gray-500">
                  Item ID: <span className="font-mono font-semibold text-gray-700">{formatItemId(request.itemId)}</span>
                </p>
              )}
            </div>
          </div>

          <ChangesTable request={request} storageNames={storageNames} />

          <div className="mt-4 space-y-0.5 text-xs text-gray-500">
            <p>
              Requested by <span className="font-semibold text-gray-700">{request.requestedByName}</span> ·{' '}
              <RelativeTime value={request.requestedAt} />
            </p>
            {request.status === 'Approved' && (
              <p className="text-emerald-700">
                Approved by <span className="font-semibold">{request.reviewedByName}</span> ·{' '}
                <RelativeTime value={request.reviewedAt} />
              </p>
            )}
            {request.status === 'Rejected' && (
              <p className="text-red-700">
                Rejected by <span className="font-semibold">{request.reviewedByName}</span> ·{' '}
                <RelativeTime value={request.reviewedAt} />
                {request.reviewNote && <span className="mt-1 block text-gray-600">Reason: “{request.reviewNote}”</span>}
              </p>
            )}
            {request.status === 'Cancelled' && <p>Cancelled by the requester</p>}
          </div>

          {pending && isSuperadmin && blockedBy && (
            <p className="mt-4 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
              <FontAwesomeIcon icon={faLock} className="h-3 w-3" />
              Decide request #{blockedBy} for this item first - requests for the same item are reviewed in order.
            </p>
          )}
        </div>

        {pending && isSuperadmin && (
          <div className="flex shrink-0 gap-2.5 border-t border-gray-100 px-6 py-4">
            <button
              type="button"
              onClick={() => onReject(request)}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors duration-150 hover:bg-red-50"
            >
              <FontAwesomeIcon icon={faXmark} className="h-3.5 w-3.5" />
              Reject
            </button>
            <button
              type="button"
              onClick={() => onApprove(request)}
              disabled={!!blockedBy}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faCheck} className="h-3.5 w-3.5" />
              Approve
            </button>
          </div>
        )}
        {pending && !isSuperadmin && (
          <div className="flex shrink-0 items-center justify-between gap-2 border-t border-gray-100 px-6 py-4">
            <span className="text-xs text-gray-400">Waiting for a Superadmin to review</span>
            <button
              type="button"
              onClick={() => onCancel(request)}
              className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition-colors duration-150 hover:bg-gray-50"
            >
              <FontAwesomeIcon icon={faBan} className="h-3 w-3" />
              Cancel request
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChangeRequestModal
