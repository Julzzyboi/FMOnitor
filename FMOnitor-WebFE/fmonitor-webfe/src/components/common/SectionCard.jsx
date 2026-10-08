import { Link } from 'react-router-dom'

// White card with a title row. `action` is { label, to } for a "View all" link;
// `toolbar` is any custom control (e.g. a segmented toggle) on the right.
function SectionCard({ title, subtitle, action, toolbar, children, className = '' }) {
  return (
    <section className={`flex flex-col rounded-xl bg-white p-5 shadow-lg ${className}`}>
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>}
        </div>
        {toolbar}
        {action && (
          <Link
            to={action.to}
            className="shrink-0 text-xs font-semibold text-gray-500 underline decoration-transparent decoration-2 underline-offset-4 transition-colors duration-150 hover:text-gray-900 hover:decoration-[#fccb35]"
          >
            {action.label}
          </Link>
        )}
      </header>
      <div className="flex-1">{children}</div>
    </section>
  )
}

export function SectionEmpty({ message }) {
  return (
    <div className="flex h-full min-h-28 items-center justify-center rounded-lg border border-dashed border-gray-200 px-4 py-8 text-center text-sm text-gray-400">
      {message}
    </div>
  )
}

export default SectionCard
