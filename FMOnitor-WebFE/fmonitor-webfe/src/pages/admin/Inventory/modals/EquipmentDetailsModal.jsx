import { useCallback, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark, faImage, faPen, faTrash, faFlag, faExpand, faQrcode, faClock } from '@fortawesome/free-solid-svg-icons'
import QrStickerModal from './QrStickerModal'
import { AvailabilityTag, ConditionTag, CriticalTag } from '../components/InventoryTags'
import PhotoLightbox from '../components/PhotoLightbox'
import RelativeTime from '../components/RelativeTime'
import { formatDateTime } from '../utils/timeFormat'
import { formatItemId } from '../utils/itemId'

function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-50 py-3 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  )
}

function EquipmentDetailsModal({
  item,
  openReportCount = 0,
  pendingCount = 0,
  canChange = true,
  onClose,
  onEdit,
  onDelete,
  onReport,
}) {
  const [photoExpanded, setPhotoExpanded] = useState(false)
  const [showQr, setShowQr] = useState(false)
  const closePhoto = useCallback(() => setPhotoExpanded(false), [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-16 lg:py-20">
      <div onClick={onClose} aria-hidden="true" className="absolute inset-0 bg-black/50" />

      <div className="relative flex max-h-full w-full max-w-md animate-[fade-in-up_0.25s_ease-out_forwards] flex-col overflow-hidden rounded-2xl bg-white opacity-0 shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-base font-bold text-gray-900">Equipment Details</h3>
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
          <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl bg-gray-100">
            {item.photoUrl ? (
              <>
                <img src={item.photoUrl} alt={item.name} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotoExpanded(true)}
                  aria-label="View full photo"
                  title="View full photo"
                  className="absolute right-2.5 top-2.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-black/55 text-white shadow-sm transition-colors duration-150 hover:bg-black/75"
                >
                  <FontAwesomeIcon icon={faExpand} className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <FontAwesomeIcon icon={faImage} className="h-10 w-10 text-gray-300" />
            )}
          </div>

          {photoExpanded && (
            <PhotoLightbox
              src={item.photoUrl}
              alt={item.name}
              caption={`${item.name} · ${formatItemId(item.id)}`}
              onClose={closePhoto}
            />
          )}

          <p className="mt-4 text-[10px] font-bold uppercase tracking-wide text-gray-400">{item.location}</p>
          <p className="mt-0.5 text-lg font-bold text-gray-900">{item.name}</p>

          {pendingCount > 0 && (
            <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
              <FontAwesomeIcon icon={faClock} className="h-3 w-3" />
              {pendingCount} change{pendingCount === 1 ? '' : 's'} to this item waiting for Superadmin approval
            </p>
          )}

          <div className="mt-3">
            <DetailRow
              label="Item ID"
              value={<span className="font-mono font-semibold">{formatItemId(item.id)}</span>}
            />
            <DetailRow label="Storage" value={item.location} />
            <DetailRow label="Quantity Available" value={item.available} />
            <DetailRow label="Condition" value={<ConditionTag condition={item.condition} />} />
            <DetailRow label="Type" value={<AvailabilityTag availability={item.availability} />} />
            <DetailRow
              label="Criticality"
              value={item.critical ? <CriticalTag /> : <span className="text-gray-500">Non-Critical</span>}
            />
            <DetailRow label="Open Reports" value={openReportCount} />
            <DetailRow label="Date Added" value={formatDateTime(item.createdAt)} />
            <DetailRow
              label="Last Updated"
              value={
                <span className="text-right">
                  <RelativeTime value={item.updatedAt} className="font-semibold" />
                  <span className="block text-[11px] text-gray-400">{formatDateTime(item.updatedAt)}</span>
                </span>
              }
            />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setShowQr(true)}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-700 transition-colors duration-150 hover:border-[#fccb35] hover:bg-[#fccb35]/10"
            >
              <FontAwesomeIcon icon={faQrcode} className="h-3.5 w-3.5" />
              QR Sticker
            </button>
            <button
              type="button"
              onClick={onReport}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2 text-xs font-semibold text-gray-500 transition-colors duration-150 hover:border-[#fccb35] hover:text-[#a3790f]"
            >
              <FontAwesomeIcon icon={faFlag} className="h-3 w-3" />
              Report an Issue
            </button>
          </div>

          {showQr && <QrStickerModal item={item} onClose={() => setShowQr(false)} />}
        </div>

        {canChange && (
        <div className="flex shrink-0 gap-2.5 border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onDelete}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition-colors duration-150 hover:bg-red-50"
          >
            <FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5" />
            Delete
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#fccb35] px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm transition-colors duration-150 hover:bg-[#e6b82f]"
          >
            <FontAwesomeIcon icon={faPen} className="h-3.5 w-3.5" />
            Edit
          </button>
        </div>
        )}
      </div>
    </div>
  )
}

export default EquipmentDetailsModal
