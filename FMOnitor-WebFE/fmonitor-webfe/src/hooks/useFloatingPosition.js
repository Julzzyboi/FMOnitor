import { useLayoutEffect, useRef, useState } from 'react'

const MARGIN = 8

function useFloatingPosition({ open, onClose, align = 'right' }) {
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const [style, setStyle] = useState({ top: 0, left: 0, visibility: 'hidden' })

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
