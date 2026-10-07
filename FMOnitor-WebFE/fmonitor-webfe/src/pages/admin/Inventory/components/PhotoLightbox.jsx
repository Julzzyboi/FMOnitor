import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faXmark } from '@fortawesome/free-solid-svg-icons'

// Full-screen view of a photo, uncropped. Closes on Esc, the X, or a click
// outside the image.
function PhotoLightbox({ src, alt, caption, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
      className="fixed inset-0 z-[75] flex animate-[fade-in_0.2s_ease-out_forwards] flex-col items-center justify-center bg-black/90 p-4 opacity-0 sm:p-10"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close photo"
        className="absolute right-4 top-4 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/10 text-white transition-colors duration-150 hover:bg-white/20"
      >
        <FontAwesomeIcon icon={faXmark} className="h-5 w-5" />
      </button>

      <img
        src={src}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[calc(100vh-8rem)] max-w-full rounded-lg object-contain shadow-2xl"
      />

      {caption && <p className="mt-4 text-center text-sm font-semibold text-white/80">{caption}</p>}
    </div>,
    document.body,
  )
}

export default PhotoLightbox
