import { useRef, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faImage, faXmark, faSpinner } from '@fortawesome/free-solid-svg-icons'

const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.82

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

function PhotoFileInput({
  label = 'Photo (optional)',
  value,
  onChange,
  previewSize = 'h-28 w-full',
  labelClassName = 'text-xs font-semibold uppercase tracking-wide text-gray-400',
}) {
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [dragging, setDragging] = useState(false)

  const processFile = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError("That file isn't an image.")
      return
    }
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

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    processFile(file)
  }

  // Dropping a file on the empty box or on the preview both work.
  const dropHandlers = {
    onDragOver: (e) => {
      e.preventDefault()
      if (!busy) setDragging(true)
    },
    onDragLeave: (e) => {
      if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false)
    },
    onDrop: (e) => {
      e.preventDefault()
      setDragging(false)
      if (!busy) processFile(e.dataTransfer.files?.[0])
    },
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className={labelClassName}>{label}</span>

      {value ? (
        <div
          {...dropHandlers}
          className={`relative ${previewSize} overflow-hidden rounded-lg border ${dragging ? 'border-[#fccb35] ring-2 ring-[#fccb35]/40' : 'border-gray-200'}`}
        >
          <img src={value} alt="" className="h-full w-full object-cover" />
          {dragging && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-semibold text-white">
              Drop to replace
            </div>
          )}
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
          {...dropHandlers}
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className={`flex ${previewSize} cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed transition-colors duration-150 disabled:cursor-not-allowed ${
            dragging
              ? 'border-[#fccb35] bg-[#fccb35]/10 text-[#a3790f]'
              : 'border-gray-300 text-gray-400 hover:border-[#fccb35] hover:text-[#a3790f]'
          }`}
        >
          <FontAwesomeIcon icon={busy ? faSpinner : faImage} className={`h-5 w-5 ${busy ? 'animate-spin' : ''}`} />
          <span className="text-xs font-semibold">
            {busy ? 'Processing…' : dragging ? 'Drop the photo here' : 'Click or drag a photo here'}
          </span>
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
