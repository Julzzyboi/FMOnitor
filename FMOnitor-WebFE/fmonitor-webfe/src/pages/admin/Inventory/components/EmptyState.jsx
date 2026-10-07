import logo from '../../../../assets/logo.png'

// Empty list placeholder with the FMOnitor hard hat as the mascot.
function EmptyState({ title, message, actionLabel, onAction }) {
  return (
    <div className="mt-4 flex flex-col items-center rounded-xl bg-white px-6 py-14 text-center shadow-sm">
      <div className="relative">
        {/* logo.png has an opaque off-white background; multiply blends it into the white card. */}
        <img src={logo} alt="" className="mascot-bob relative h-24 w-24 mix-blend-multiply" />
        <span className="mascot-shadow absolute -bottom-3 left-1/2 h-2.5 w-16 -translate-x-1/2 rounded-full bg-gray-900" />
      </div>

      <h3 className="mt-8 text-base font-bold text-gray-900">{title}</h3>
      <p className="mt-1 max-w-xs text-sm text-gray-500">{message}</p>

      {actionLabel && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 cursor-pointer rounded-lg bg-[#fccb35] px-4 py-2 text-xs font-bold uppercase tracking-wide text-gray-900 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export default EmptyState
