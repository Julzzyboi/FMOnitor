import { useEffect } from 'react'

/**
 * Calls onOutside when a pointer event happens outside the element ref points to.
 * Used to close dropdowns/menus when the user clicks elsewhere on the page.
 */
function useClickOutside(ref, onOutside) {
  useEffect(() => {
    function handlePointerDown(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        onOutside()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [ref, onOutside])
}

export default useClickOutside
