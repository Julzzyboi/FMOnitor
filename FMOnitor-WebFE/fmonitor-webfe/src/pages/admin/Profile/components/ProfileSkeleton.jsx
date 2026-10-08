// Placeholder shaped like the Profile page (identity banner, account details,
// sign-in history), shown until the sign-in log has loaded.

function ProfileSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6" aria-busy="true" aria-label="Loading profile">
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="h-24 bg-gray-200 sm:h-28" />
        <div className="flex flex-col gap-4 px-5 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="-mt-10 h-20 w-20 shrink-0 rounded-full bg-gray-300 ring-4 ring-white" />
            <div className="pb-1">
              <div className="h-5 w-40 rounded bg-gray-200" />
              <div className="mt-2 h-3 w-52 rounded bg-gray-200" />
            </div>
          </div>
          <div className="flex gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i}>
                <div className="h-2.5 w-16 rounded bg-gray-200" />
                <div className="mt-2 h-4 w-20 rounded bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-5 h-3.5 w-32 rounded bg-gray-200" />
          <div className="flex flex-col gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <div className="h-2.5 w-16 rounded bg-gray-200" />
                <div className="mt-2 h-3.5 rounded bg-gray-200" style={{ width: `${80 - i * 10}%` }} />
              </div>
            ))}
          </div>
          <div className="mt-6 h-10 w-full rounded-lg bg-gray-200" />
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-5 flex justify-between">
            <div className="h-3.5 w-36 rounded bg-gray-200" />
            <div className="h-3 w-16 rounded bg-gray-200" />
          </div>
          <div className="flex flex-col gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-2 w-2 shrink-0 rounded-full bg-gray-200" />
                <div className="flex-1">
                  <div className="h-3 w-1/3 rounded bg-gray-200" />
                  <div className="mt-2 h-2.5 w-1/4 rounded bg-gray-200" />
                </div>
                <div className="h-5 w-20 rounded-full bg-gray-200" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileSkeleton
