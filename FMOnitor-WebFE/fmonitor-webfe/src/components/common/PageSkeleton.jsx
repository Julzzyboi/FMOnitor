function PageSkeleton() {
  return (
    <div className="animate-pulse p-4 sm:p-6 lg:p-8">
      <div className="h-7 w-40 rounded-md bg-gray-200" />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-gray-200" />
        ))}
      </div>

      <div className="mt-6 h-64 rounded-xl bg-gray-200" />

      <div className="mt-6 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-4 rounded bg-gray-200" style={{ width: `${90 - i * 12}%` }} />
        ))}
      </div>
    </div>
  )
}

export default PageSkeleton
