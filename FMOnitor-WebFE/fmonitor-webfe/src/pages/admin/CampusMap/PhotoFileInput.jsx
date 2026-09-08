import { useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faImage, faXmark, faSpinner } from '@fortawesome/free-solid-svg-icons'

const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.82

// Downscales/re-compresses the chosen image to a max-1600px-edge JPEG before
// handing back its base64 data URL - a straight-off-a-phone photo can be
// several MB, and that would otherwise go straight into the request body and
// the database row (photoUrl columns) uncompressed.
function resizeImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read that file.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error("That file doesn't look like a valid image."))
      img.onload = () => {
        let { width, height } = img
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width >= height) {
            height = Math.round((height / width) * MAX_DIMENSION)
            width = MAX_DIMENSION
          } else {
            width = Math.round((width / height) * MAX_DIMENSION)
            height = MAX_DIMENSION
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

// A file-picker that stores the chosen image as a base64 data URL - same
// convention as Accounts/AvatarPicker.jsx, just laid out as a labeled form
// field (with a preview + remove/change controls) instead of a circular
// avatar. `value` is either a data URL, an empty string (explicitly
// removed), or null/undefined (never set).
function PhotoFileInput({ label = 'Photo (optional)', value, onChange }) {
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-picking the exact same file again later
    if (!file) return
    setError(null)
    setBusy(true)
    try {
      const dataUrl = await resizeImageFile(file)
      onChange(dataUrl)
    } catch (err) {
      setError(err.message || 'Failed to process that image.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</span>

      {value ? (
        <div className="relative h-28 w-full overflow-hidden rounded-lg border border-gray-200">
          <img src={value} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Remove photo"
            className="absolute right-1.5 top-1.5 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-colors duration-150 hover:bg-black/80"
          >
            <FontAwesomeIcon icon={faXmark} className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex h-28 w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 text-gray-400 transition-colors duration-150 hover:border-[#fccb35] hover:text-[#a3790f] disabled:cursor-not-allowed"
        >
          <FontAwesomeIcon icon={busy ? faSpinner : faImage} className={`h-5 w-5 ${busy ? 'animate-spin' : ''}`} />
          <span className="text-xs font-semibold">{busy ? 'Processing…' : 'Click to upload a photo'}</span>
        </button>
      )}

      {value && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="cursor-pointer self-start text-xs font-semibold text-[#a3790f] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? 'Processing…' : 'Change photo'}
        </button>
      )}

      <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} className="sr-only" />

      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  )
}

export default PhotoFileInput
