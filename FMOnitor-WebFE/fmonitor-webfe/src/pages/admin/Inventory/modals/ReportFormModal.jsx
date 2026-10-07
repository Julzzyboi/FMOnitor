import { useMemo, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { REPORT_TYPES, REPORT_STATUSES } from '../data/inventoryData'
import { validateReport, DESCRIPTION_MAX } from '../utils/reportValidation'

const inputClass = (hasError) =>
  `rounded-lg border bg-white px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 ${
    hasError
      ? 'border-red-400 focus:border-red-400 focus:ring-red-200'
      : 'border-gray-200 focus:border-[#fccb35] focus:ring-[#fccb35]/30'
  }`

function FieldError({ message }) {
  if (!message) return null
  return <p className="text-xs font-medium text-red-600">{message}</p>
}

// Create (no `report`) or edit a report. `presetItemId` locks the item picker
// when the report is filed from an item's details.
function ReportFormModal({ report, presetItemId, equipment, onCancel, onSubmit }) {
  const isEdit = !!report
  const [itemId, setItemId] = useState(report?.itemId ?? presetItemId ?? '')
  const [type, setType] = useState(report?.type ?? REPORT_TYPES[0])
  const [quantity, setQuantity] = useState(report?.quantity ?? 1)
  const [description, setDescription] = useState(report?.description ?? '')
  const [status, setStatus] = useState(report?.status ?? REPORT_STATUSES[0])
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const itemsByArea = useMemo(() => {
    const groups = new Map()
    for (const e of equipment) {
      if (!groups.has(e.location)) groups.set(e.location, [])
      groups.get(e.location).push(e)
    }
    return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [equipment])

  const lockedItem = presetItemId ? equipment.find((e) => e.id === presetItemId) : null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    const found = validateReport({ itemId, quantity, description })
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    setSubmitError(null)
    const result = await onSubmit({
      itemId: Number(itemId),
      type,
      quantity: Number(quantity),
      description: description.trim(),
      status,
    })
    if (!result?.ok) {
      setSubmitError(result?.message || 'Failed to save.')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-16 lg:py-20">
      <div onClick={onCancel} aria-hidden="true" className="absolute inset-0 bg-black/50" />

      <form
        onSubmit={handleSubmit}
        noValidate
        className="relative flex max-h-full w-full max-w-sm animate-[fade-in-up_0.25s_ease-out_forwards] flex-col overflow-hidden rounded-2xl bg-white opacity-0 shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="text-base font-bold text-gray-900">{isEdit ? 'Edit Report' : 'Report an Issue'}</h3>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="cursor-pointer rounded-md p-1.5 text-gray-400 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-600"
          >
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Item</span>
              {lockedItem ? (
                <p className="rounded-lg bg-gray-50 px-3.5 py-2 text-sm text-gray-900">
                  {lockedItem.name} <span className="text-gray-400">· {lockedItem.location}</span>
                </p>
              ) : (
                <select
                  value={itemId}
                  onChange={(e) => setItemId(e.target.value)}
                  className={inputClass(errors.itemId)}
                >
                  <option value="">Select an item…</option>
                  {itemsByArea.map(([area, items]) => (
                    <optgroup key={area} label={area}>
                      {items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              )}
              <FieldError message={errors.itemId} />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Issue Type</span>
                <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass(false)}>
                  {REPORT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Quantity</span>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className={inputClass(errors.quantity)}
                />
                <FieldError message={errors.quantity} />
              </label>
            </div>

            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass(false)}>
                {REPORT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                maxLength={DESCRIPTION_MAX}
                placeholder="What happened? e.g. 3 chairs have broken legs after the Sept 30 event"
                className={`resize-none ${inputClass(errors.description)}`}
              />
              <FieldError message={errors.description} />
            </label>

            {submitError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{submitError}</p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2.5 border-t border-gray-100 px-5 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex h-10 flex-1 cursor-pointer items-center justify-center rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 transition-colors duration-150 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex h-10 flex-1 cursor-pointer items-center justify-center rounded-xl bg-[#fccb35] text-sm font-semibold text-gray-900 shadow-sm transition-colors duration-150 hover:bg-[#e6b82f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Submit Report'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ReportFormModal
