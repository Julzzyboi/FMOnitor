// Placeholder shaped like the Analytics page (KPI row, trend + condition row,
// then three breakdown cards), shown until its data has loaded.

function CardHeader() {
  return (
    <div className="mb-5">
      <div className="h-3.5 w-36 rounded bg-gray-200" />
      <div className="mt-2 h-2.5 w-48 rounded bg-gray-200" />
    </div>
  )
}

function BarRowsSkeleton({ rows }) {
  return (
    <div className="flex flex-col gap-3.5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i}>
          <div className="mb-1.5 flex justify-between">
            <div className="h-2.5 w-24 rounded bg-gray-200" />
            <div className="h-2.5 w-6 rounded bg-gray-200" />
          </div>
          <div className="h-2 rounded-full bg-gray-200" style={{ width: `${95 - i * 12}%` }} />
        </div>
      ))}
    </div>
  )
}

function AnalyticsSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6" aria-busy="true" aria-label="Loading analytics">
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
        <div className="rounded-xl bg-white p-5 shadow-lg lg:col-span-2">
          <div className="flex items-start justify-between">
            <CardHeader />
            <div className="h-8 w-36 rounded-lg bg-gray-200" />
          </div>
          <div className="flex h-[220px] items-end gap-3 pl-6">
            {[40, 65, 30, 80, 55, 90, 45, 70].map((h, i) => (
              <div key={i} className="flex-1 rounded-t bg-gray-200" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-lg">
          <CardHeader />
          <div className="h-3 w-full rounded-full bg-gray-200" />
          <div className="mt-5 flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="h-2.5 w-2.5 rounded-full bg-gray-200" />
                <div className="h-3 flex-1 rounded bg-gray-200" />
                <div className="h-3 w-10 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {[6, 4, 5].map((rows, i) => (
          <div key={i} className="rounded-xl bg-white p-5 shadow-lg">
            <CardHeader />
            <BarRowsSkeleton rows={rows} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default AnalyticsSkeleton
