function getPageNumbers(current, total) {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)

  const pages = new Set([1, 2, total - 1, total, current - 1, current, current + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)

  const withGaps = []
  sorted.forEach((page, i) => {
    if (i > 0 && page - sorted[i - 1] > 1) withGaps.push('...')
    withGaps.push(page)
  })
  return withGaps
}

function Pagination({ page, totalPages, totalItems, pageSize, onPageChange }) {
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, totalItems)

  return (
    <div className="flex flex-col items-center justify-between gap-3 px-6 py-4 sm:flex-row">
      <p className="text-xs text-gray-500">
        Showing <span className="font-semibold text-gray-700">{start}-{end}</span> of{' '}
        <span className="font-semibold text-gray-700">{totalItems}</span> users
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className="cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold text-gray-500 transition-colors duration-150 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        >
          Prev
        </button>

        {getPageNumbers(page, totalPages).map((p, i) =>
          p === '...' ? (
            <span key={`gap-${i}`} className="px-2 text-xs text-gray-400">
              ...
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`h-7 w-7 cursor-pointer rounded-md text-xs font-semibold transition-colors duration-150 ${
                p === page
                  ? 'bg-[#fccb35] text-gray-900'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          disabled={page === totalPages || totalPages === 0}
          onClick={() => onPageChange(page + 1)}
          className="cursor-pointer rounded-md px-3 py-1.5 text-xs font-semibold text-gray-500 transition-colors duration-150 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        >
          Next
        </button>
      </div>
    </div>
  )
}

export default Pagination
