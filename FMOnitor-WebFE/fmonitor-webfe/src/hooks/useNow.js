import { useEffect, useState } from 'react'

/**
 * The current time, re-read every `intervalMs` (and whenever the tab comes
 * back into view, since background tabs throttle timers). Lets a page keep
 * "today", live clocks and overdue states correct across midnight or a long
 * idle tab without a reload. Always the browser's own local time zone.
 */
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
