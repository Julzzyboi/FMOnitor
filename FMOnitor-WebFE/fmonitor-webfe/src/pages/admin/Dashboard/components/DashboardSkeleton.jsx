// Placeholder shaped like the Dashboard (greeting, KPI row, tasks + activity,
// then open reports), shown until its data has loaded.

// lead: what starts each row - a time block (tasks), an avatar (activity) or nothing (reports).
const LEADS = {
  time: (
    <div className="w-16 shrink-0">
      <div className="h-2.5 w-10 rounded bg-gray-200" />
      <div className="mt-2 h-3 w-14 rounded bg-gray-200" />
    </div>
  ),
  avatar: <div className="h-8 w-8 shrink-0 rounded-full bg-gray-200" />,
  none: null,
}

function CardSkeleton({ rows, lead = 'none', className = '' }) {
  return (
    <div className={`rounded-xl bg-white p-5 shadow-lg ${className}`}>
      <div className="mb-5 flex items-center justify-between">
        <div className="h-3.5 w-32 rounded bg-gray-200" />
        <div className="h-3 w-14 rounded bg-gray-200" />
      </div>
      <div className="flex flex-col gap-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            {LEADS[lead]}
            <div className="flex-1">
              <div className="h-3 rounded bg-gray-200" style={{ width: `${75 - i * 9}%` }} />
              <div className="mt-2 h-2.5 w-1/3 rounded bg-gray-200" />
            </div>
            {lead === 'avatar' ? (
              <div className="h-2 w-2 shrink-0 rounded-full bg-gray-200" />
            ) : (
              <div className="h-5 w-16 shrink-0 rounded-full bg-gray-200" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="h-3 w-40 rounded bg-gray-200" />
          <div className="mt-2.5 h-6 w-64 rounded-md bg-gray-200" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-28 rounded-lg bg-gray-200" />
          <div className="h-10 w-32 rounded-lg bg-gray-200" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-white p-5 shadow-lg">
            <div className="h-2.5 w-24 rounded bg-gray-200" />
            <div className="mt-3 h-8 w-20 rounded bg-gray-200" />
            <div className="mt-2.5 h-2.5 w-28 rounded bg-gray-200" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <CardSkeleton rows={4} lead="time" className="lg:col-span-2" />
        <CardSkeleton rows={4} lead="avatar" />
      </div>

      <CardSkeleton rows={4} />
    </div>
  )
}

export default DashboardSkeleton
