import { useEffect, useState } from 'react'

/**
 * Simulates a brief loading state so admin pages (currently placeholders)
 * show a skeleton before their content appears. Swap this out once pages
 * fetch real data — return the actual fetch/query loading state instead.
 */
function useDelayedLoading(delay = 700) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => setLoading(false), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return loading
}

export default useDelayedLoading
