import { useLayoutEffect, useRef, useState } from 'react'

const MARGIN = 8

/**
 * Positions a portaled dropdown/menu relative to its trigger button using
 * `position: fixed` viewport coordinates, so it can never be clipped by an
 * ancestor's overflow/scroll container and always paints above everything
 * else. Renders invisible for one frame while it measures the menu's real
 * size, then clamps it to stay fully inside the viewport (flips above the
 * trigger if there isn't room below).
 *
 * Usage: const { triggerRef, menuRef, style } = useFloatingPosition({ open, onClose })
 * Attach triggerRef to the button, menuRef + style to the portaled panel.
 */
function useFloatingPosition({ open, onClose, align = 'right' }) {
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const [style, setStyle] = useState({ top: 0, left: 0, visibility: 'hidden' })

  // Keep the latest onClose in a ref so the positioning effect below doesn't
  // need it as a dependency — onClose is typically a fresh arrow function on
  // every render, and including it directly would re-run the effect (and its
  // setStyle call) every render, which re-renders the caller, which creates a
  // new onClose again: an infinite loop.
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useLayoutEffect(() => {
    if (!open) return

    const place = () => {
      const trigger = triggerRef.current
      const menu = menuRef.current
      if (!trigger || !menu) return

      const triggerRect = trigger.getBoundingClientRect()
      const menuRect = menu.getBoundingClientRect()

      let left = align === 'right' ? triggerRect.right - menuRect.width : triggerRect.left
      left = Math.min(Math.max(left, MARGIN), window.innerWidth - menuRect.width - MARGIN)

      let top = triggerRect.bottom + 6
      if (top + menuRect.height > window.innerHeight - MARGIN) {
        top = triggerRect.top - menuRect.height - 6
      }
      top = Math.max(top, MARGIN)

      setStyle({ top, left, visibility: 'visible' })
    }

    place()

    const handleClose = () => onCloseRef.current?.()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', handleClose, true)

    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', handleClose, true)
    }
  }, [open, align])

  return { triggerRef, menuRef, style }
}

export default useFloatingPosition
