import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faUser, faCamera } from '@fortawesome/free-solid-svg-icons'

/**
 * A clickable avatar: the whole circle (not just the camera badge) opens the
 * file picker and previews the chosen image immediately.
 */
function AvatarPicker({ avatarUrl, name, onChange }) {
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onChange(reader.result)
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <label className="group relative block h-20 w-20 cursor-pointer">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gray-400 transition-all duration-150 group-hover:brightness-90">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name || 'Avatar'} className="h-full w-full object-cover" />
          ) : (
            <FontAwesomeIcon icon={faUser} className="h-8 w-8 text-white" />
          )}
        </div>
        <span className="pointer-events-none absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-[#fccb35] text-gray-900 shadow-sm">
          <FontAwesomeIcon icon={faCamera} className="h-3.5 w-3.5" />
        </span>
        <input type="file" accept="image/*" onChange={handleFileChange} className="sr-only" />
      </label>
      <p className="text-xs text-gray-400">Click the photo to change it</p>
    </div>
  )
}

export default AvatarPicker
