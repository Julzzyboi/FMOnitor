import { useEffect, useState } from 'react'

function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const tick = () => setNow(new Date())
    const timer = setInterval(tick, intervalMs)
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [intervalMs])

  return now
}

export default useNow
