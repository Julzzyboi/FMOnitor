import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { Link } from 'react-router-dom'
import PhotoFileInput from '../../../../components/common/PhotoFileInput'
import { CONDITIONS, AVAILABILITY_OPTIONS } from '../data/inventoryData'
import { validateEquipment } from '../utils/equipmentValidation'
import StorageSearchSelect from '../components/StorageSearchSelect'

const labelClass = 'text-[10px] font-semibold uppercase tracking-wide text-gray-400'

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

// `storageGroups` is [[facilityName, [{ id, name }, ...]], ...] from the Campus Map.
function EquipmentModal({ item, storageGroups, onCancel, onSubmit }) {
  const isEdit = !!item
  const [photoUrl, setPhotoUrl] = useState(item?.photoUrl ?? '')
  const [name, setName] = useState(item?.name ?? '')
  const [storageId, setStorageId] = useState(item?.storageId ?? '')
  const [available, setAvailable] = useState(item?.available ?? 0)
  const [condition, setCondition] = useState(item?.condition ?? CONDITIONS[0])
  const [availability, setAvailability] = useState(item?.availability ?? AVAILABILITY_OPTIONS[0])
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const hasStorages = storageGroups.length > 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    const found = validateEquipment({ name, storageId, available })
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    setSubmitError(null)
    const result = await onSubmit({
      photoUrl,
      name: name.trim(),
      storageId: Number(storageId),
      available: Number(available),
      condition,
      availability,
    })
    if (!result?.ok) {
      setSubmitError(result?.message || 'Failed to save.')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-16 lg:py-20">
      <div onClick={onCancel} aria-hidden="true" className="absolute inset-0 bg-black/50" />

      <form
        onSubmit={handleSubmit}
        noValidate
        className="relative flex max-h-full w-full max-w-2xl animate-[fade-in-up_0.25s_ease-out_forwards] flex-col overflow-hidden rounded-2xl bg-white opacity-0 shadow-2xl"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="text-base font-bold text-gray-900">{isEdit ? 'Edit Equipment' : 'Add New Equipment'}</h3>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="cursor-pointer rounded-md p-1.5 text-gray-400 transition-colors duration-150 hover:bg-gray-100 hover:text-gray-600"
          >
            <FontAwesomeIcon icon={faXmark} className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          {/* Photo on the left, fields on the right; stacked on narrow screens. */}
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="sm:w-64 sm:shrink-0">
            <PhotoFileInput
              label="Photo"
              value={photoUrl}
              onChange={setPhotoUrl}
              previewSize="aspect-[4/3] w-full"
              labelClassName={labelClass}
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-3.5">
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Item Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className={inputClass(errors.name)}
                placeholder="e.g. Stackable Chairs (Black)"
              />
              <FieldError message={errors.name} />
            </label>

            {/* A div, not a label: the picker holds buttons that a label would hijack. */}
            <div className="flex flex-col gap-1">
              <span className={labelClass}>Storage</span>
              {hasStorages ? (
                <StorageSearchSelect
                  groups={storageGroups}
                  value={storageId}
                  onChange={setStorageId}
                  hasError={!!errors.storageId}
                />
              ) : (
                <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  No storages yet. Add one on the{' '}
                  <Link to="/campus-map" className="font-semibold underline">
                    Campus Map
                  </Link>{' '}
                  first.
                </p>
              )}
              <FieldError message={errors.storageId} />
            </div>

            <label className="flex flex-col gap-1">
              <span className={labelClass}>Quantity Available</span>
              <input
                type="number"
                min="0"
                value={available}
                onChange={(e) => setAvailable(e.target.value)}
                className={inputClass(errors.available)}
              />
              <FieldError message={errors.available} />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className={labelClass}>Condition</span>
                <select value={condition} onChange={(e) => setCondition(e.target.value)} className={inputClass(false)}>
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className={labelClass}>Item Type</span>
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className={inputClass(false)}
                >
                  {AVAILABILITY_OPTIONS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {submitError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{submitError}</p>
            )}
          </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2.5 border-t border-gray-100 px-5 py-4 sm:justify-end sm:px-6 sm:[&>button]:w-40 sm:[&>button]:flex-none">
          <button
            type="button"
            onClick={onCancel}
            className="flex h-10 flex-1 cursor-pointer items-center justify-center rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 transition-colors duration-150 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !hasStorages}
            className="flex h-10 flex-1 cursor-pointer items-center justify-center rounded-xl bg-[#fccb35] text-sm font-semibold text-gray-900 shadow-sm transition-colors duration-150 hover:bg-[#e6b82f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Equipment'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default EquipmentModal
