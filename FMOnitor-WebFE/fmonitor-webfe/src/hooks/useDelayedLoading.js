import { useEffect, useState } from 'react'

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
