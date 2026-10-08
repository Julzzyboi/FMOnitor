const SIZES = {
  sm: 'h-8 w-8 text-[11px]',
  lg: 'h-20 w-20 text-2xl',
}

function initials(name) {
  const parts = (name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

// Google photo when there is one, otherwise the person's initials.
function Avatar({ src, name, size = 'sm', className = '' }) {
  const sizeClass = SIZES[size] ?? SIZES.sm

  if (src) {
    return (
      <img
        src={src}
        alt={name || ''}
        referrerPolicy="no-referrer"
        className={`shrink-0 rounded-full object-cover ${sizeClass} ${className}`}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-gray-900 font-bold text-[#fccb35] ${sizeClass} ${className}`}
    >
      {initials(name)}
    </span>
  )
}

export default Avatar
