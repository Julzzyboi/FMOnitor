export const inputClass = (hasError) =>
  `rounded-lg border px-3.5 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 ${
    hasError
      ? 'border-red-400 focus:border-red-400 focus:ring-red-200'
      : 'border-gray-200 focus:border-[#fccb35] focus:ring-[#fccb35]/30'
  }`

export function FieldError({ message }) {
  if (!message) return null
  return <p className="text-xs font-medium text-red-600">{message}</p>
}