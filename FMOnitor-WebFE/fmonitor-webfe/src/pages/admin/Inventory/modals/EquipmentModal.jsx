import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import PhotoFileInput from '../../../../components/common/PhotoFileInput'
import {
  STORAGE_AREAS,
  BORROWABLE_STORAGE_AREAS,
  NON_BORROWABLE_STORAGE_AREAS,
  CONDITIONS,
  AVAILABILITY_OPTIONS,
} from '../data/inventoryData'
import { validateEquipment } from '../utils/equipmentValidation' 

const inputClass = (hasError) =>
  `rounded-lg border px-3.5 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 ${
    hasError
      ? 'border-red-400 focus:border-red-400 focus:ring-red-200'
      : 'border-gray-200 focus:border-[#fccb35] focus:ring-[#fccb35]/30'
  }`
  function FieldError ({ message }) {
    if (!message) return null
    return <p className ="text-xs font-medium text-red-600">{message}</p>
  }

function EquipmentModal({ item, onCancel, onSubmit }) {
  const isEdit = !!item
  const [name, setName] = useState(item?.name ?? '')
  const [location, setLocation] = useState(item?.location ?? STORAGE_AREAS[0])
  const [available, setAvailable] = useState(item?.available ?? 0)
  const [notWorking, setNotWorking] = useState(item?.notWorking ?? 0)
  const [condition, setCondition] = useState(item?.condition ?? CONDITIONS[0])
  const [availability, setAvailability] = useState(item?.availability ?? AVAILABILITY_OPTIONS[0])
  const [photoUrl, setPhotoUrl] = useState(item?.photoUrl ?? '')
  const [errors, setErrors] = useState({})

const handleSubmit = (e) => {
  e.preventDefault()
  const found = validateEquipment({ name, available, notWorking })
  setErrors(found)
  if (Object.keys(found).length > 0) return

  onSubmit({
    name: name.trim(),
    location,
    available: Number(available),
    notWorking: Number(notWorking),
    condition,
    availability,
    photoUrl,
  })
}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-16 lg:py-20">
      <div onClick={onCancel} aria-hidden="true" className="absolute inset-0 bg-black/50" />

      <form
        onSubmit={handleSubmit}
        noValidate
        className="relative flex max-h-full w-full max-w-sm animate-[fade-in-up_0.25s_ease-out_forwards] flex-col overflow-hidden rounded-2xl bg-white opacity-0 shadow-2xl"

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

        <div className="overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-3">
            <PhotoFileInput
              label="Photo"
              value={photoUrl}
              onChange={setPhotoUrl}
              previewSize="mx-auto aspect-square w-44"
              labelClassName="text-[10px] font-semibold uppercase tracking-wide text-gray-400"
            />

            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Item Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                className={inputClass(errors.name)}
                placeholder="e.g. Stackable Chairs (Black)"
              />
              <FieldError message={errors.name} />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Storage Area</span>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm text-gray-900 focus:border-[#fccb35] focus:outline-none focus:ring-2 focus:ring-[#fccb35]/30"
              >
                <optgroup label="Borrowable Storage">
                  {BORROWABLE_STORAGE_AREAS.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Non-Borrowable Storage">
                  {NON_BORROWABLE_STORAGE_AREAS.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </optgroup>
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Available</span>
                <input
                  type="number"
                  min="0"
                  value={available}
                  onChange={(e) => setAvailable(e.target.value)}
                  className={inputClass(errors.available)}
                />
                <FieldError message={errors.available} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Not Working</span>
                <input
                  type="number"
                  min="0"
                  value={notWorking}
                  onChange={(e) => setNotWorking(e.target.value)}
                  className={inputClass(errors.notWorking)}
                />
                <FieldError message={errors.notWorking} />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Condition</span>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm text-gray-900 focus:border-[#fccb35] focus:outline-none focus:ring-2 focus:ring-[#fccb35]/30"
                >
                  {CONDITIONS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Availability</span>
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm text-gray-900 focus:border-[#fccb35] focus:outline-none focus:ring-2 focus:ring-[#fccb35]/30"
                >
                  {AVAILABILITY_OPTIONS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </label>
            </div>
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
            className="flex h-10 flex-1 cursor-pointer items-center justify-center rounded-xl bg-[#fccb35] text-sm font-semibold text-gray-900 shadow-sm transition-colors duration-150 hover:bg-[#e6b82f]"
          >
            {isEdit ? 'Save Changes' : 'Add Equipment'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default EquipmentModal
