import { useEffect } from 'react'

/**
 * Calls onOutside when a pointer event happens outside every element the given
 * ref(s) point to. Accepts a single ref or an array of refs — an array is
 * needed when the trigger and its menu live in different DOM subtrees (e.g. a
 * portaled dropdown), since a click on the menu shouldn't count as "outside".
 */
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
