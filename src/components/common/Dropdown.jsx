import { useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// Renders the menu into document.body (fixed-positioned against the
// trigger's own bounding box) instead of as an absolutely-positioned
// child. Table rows commonly sit inside a container with `overflow-hidden`
// (for rounded corners), which would otherwise clip the menu for any row
// near the bottom — a portal escapes that clipping entirely.
export default function Dropdown({ trigger, children, align = 'left', className = '' }) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)

  const close = () => setOpen(false)

  const toggle = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + 6,
        left: align === 'right' ? undefined : rect.left,
        right: align === 'right' ? window.innerWidth - rect.right : undefined
      })
    }
    setOpen((o) => !o)
  }

  useLayoutEffect(() => {
    if (!open) return undefined

    function handlePointerDown(event) {
      if (
        triggerRef.current?.contains(event.target) ||
        menuRef.current?.contains(event.target)
      ) {
        return
      }
      close()
    }

    // Position is computed once on open — rather than tracking it live,
    // just close on scroll/resize so it never renders somewhere stale.
    function handleReposition() {
      close()
    }

    document.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('scroll', handleReposition, true)
    window.addEventListener('resize', handleReposition)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('scroll', handleReposition, true)
      window.removeEventListener('resize', handleReposition)
    }
  }, [open])

  return (
    <div className="inline-block" ref={triggerRef}>
      <div onClick={toggle}>{trigger({ open })}</div>

      {open &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            style={{ position: 'fixed', top: position.top, left: position.left, right: position.right }}
            className={`z-50 min-w-[10rem] rounded-lg border border-ink-100 bg-white py-1 shadow-popover animate-slide-up dark:border-navy-700 dark:bg-navy-800 ${className}`}
            onClick={close}
          >
            {children}
          </div>,
          document.body
        )}
    </div>
  )
}

export function DropdownItem({ children, onClick, icon: Icon, danger = false }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-ink-50 dark:hover:bg-navy-700 ${
        danger ? 'text-red-600' : 'text-ink-700 dark:text-navy-200'
      }`}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
    </button>
  )
}
