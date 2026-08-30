import { useEffect, useRef } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

let openDialogCount = 0

function unlockPage() {
  openDialogCount = Math.max(0, openDialogCount - 1)
  if (!openDialogCount) document.body.classList.remove('tw-dialog-open')
}

export default function useAccessibleDialog(open, dialogRef, onClose) {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open || typeof document === 'undefined') return undefined

    const previouslyFocused = document.activeElement
    openDialogCount += 1
    document.body.classList.add('tw-dialog-open')

    const focusFrame = window.requestAnimationFrame(() => {
      const dialog = dialogRef.current
      const preferred = dialog?.querySelector('[data-dialog-autofocus]')
      const fallback = dialog?.querySelector(FOCUSABLE)
      ;(preferred || fallback || dialog)?.focus({ preventScroll: true })
    })

    const handleKeyDown = (event) => {
      const dialog = dialogRef.current
      if (!dialog) return
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current?.()
        return
      }
      if (event.key !== 'Tab') return

      const items = [...dialog.querySelectorAll(FOCUSABLE)]
        .filter((element) => !element.hasAttribute('hidden') && element.getAttribute('aria-hidden') !== 'true')
      if (!items.length) {
        event.preventDefault()
        dialog.focus()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.removeEventListener('keydown', handleKeyDown, true)
      unlockPage()
      if (previouslyFocused instanceof HTMLElement && document.contains(previouslyFocused)) {
        previouslyFocused.focus({ preventScroll: true })
      }
    }
  }, [dialogRef, open])
}
