import { useEffect } from 'react'

function useClickOutside(refs, onOutside) {
  useEffect(() => {
    function handlePointerDown(event) {
      const refList = Array.isArray(refs) ? refs : [refs]
      const isInside = refList.some((r) => r.current && r.current.contains(event.target))
      if (!isInside) onOutside()
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [refs, onOutside])
}

export default useClickOutside
