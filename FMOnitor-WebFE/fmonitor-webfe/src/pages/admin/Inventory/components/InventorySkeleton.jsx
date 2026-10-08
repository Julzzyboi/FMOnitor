// Placeholder shaped like the Inventory page (filters, toolbar, then the item
// grid or the report list), shown until the inventory has loaded.

function FilterGroupSkeleton({ rows }) {
  return (
    <div className="mb-4 last:mb-0">
      <div className="mb-2 h-2.5 w-20 rounded bg-gray-200" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-2 px-1">
            <div className="h-4 w-4 shrink-0 rounded-md bg-gray-200" />
            <div className="h-3 rounded bg-gray-200" style={{ width: `${70 - i * 8}%` }} />
          </div>
        ))}
      </div>
    </div>
  )
}

function ItemCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-md">
      <div className="h-32 w-full rounded-lg bg-gray-200" />
      <div className="mt-3 h-2.5 w-1/2 rounded bg-gray-200" />
      <div className="mt-2 h-3.5 w-3/4 rounded bg-gray-200" />
      <div className="mt-3 h-3 w-1/3 rounded bg-gray-200" />
    </div>
  )
}

function ReportCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="h-2.5 w-24 rounded bg-gray-200" />
          <div className="mt-2 h-3.5 w-48 rounded bg-gray-200" />
        </div>
        <div className="h-5 w-16 rounded-full bg-gray-200" />
      </div>
      <div className="mt-3 flex gap-2">
        <div className="h-5 w-20 rounded-md bg-gray-200" />
        <div className="h-5 w-14 rounded-md bg-gray-200" />
        <div className="ml-auto h-5 w-20 rounded-full bg-gray-200" />
      </div>
      <div className="mt-3 h-3 w-2/3 rounded bg-gray-200" />
    </div>
  )
}

function InventorySkeleton({ view }) {
  // Reports and Trash are both lists; only Items is a card grid.
  const isItems = view === 'items'

  return (
    <div className="flex animate-pulse flex-col gap-6 lg:flex-row lg:items-start" aria-busy="true" aria-label="Loading inventory">
      <aside className="w-full shrink-0 lg:w-64">
        <div className="rounded-xl bg-white p-3.5 shadow-lg">
          <div className="mb-4 flex items-center justify-between px-1">
            <div className="h-3.5 w-14 rounded bg-gray-200" />
            <div className="h-2.5 w-10 rounded bg-gray-200" />
          </div>
          {isItems ? (
            <>
              <FilterGroupSkeleton rows={2} />
              <FilterGroupSkeleton rows={4} />
              <FilterGroupSkeleton rows={5} />
            </>
          ) : (
            <>
              <FilterGroupSkeleton rows={2} />
              <FilterGroupSkeleton rows={4} />
              <FilterGroupSkeleton rows={4} />
              <FilterGroupSkeleton rows={3} />
            </>
          )}
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="h-10 w-56 rounded-xl bg-gray-200" />
          <div className="flex gap-3">
            <div className="h-10 w-32 rounded-lg bg-gray-200" />
            <div className="h-10 w-28 rounded-lg bg-gray-200" />
          </div>
        </div>

        <div className="mt-4 h-10 w-full rounded-lg bg-gray-200" />

        <div className="mt-4 flex items-center justify-between">
          <div className="h-3.5 w-28 rounded bg-gray-200" />
          {isItems && <div className="h-7 w-28 rounded-lg bg-gray-200" />}
        </div>

        {isItems ? (
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ItemCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <ReportCardSkeleton key={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default InventorySkeleton
