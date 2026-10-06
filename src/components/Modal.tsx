import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Icon } from './Icon'

interface ModalProps {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
  size?: 'small' | 'medium'
}

/**
 * Accessible modal built on the native `<dialog>` element, which provides
 * focus trapping, Escape-to-close, an inert background and focus
 * restoration for free. Children mount only while open, so forms reset.
 */
export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  size = 'medium',
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()
  const pressStartedOnBackdrop = useRef(false)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className={`modal modal-${size}`}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onClose={onClose}
      onMouseDown={(e) => {
        pressStartedOnBackdrop.current = e.target === e.currentTarget
      }}
      onClick={(e) => {
        // Clicking the dimmed backdrop (the dialog element itself) closes it.
        if (pressStartedOnBackdrop.current && e.target === e.currentTarget) onClose()
      }}
    >
      {open && (
        <div className="modal-body">
          <div className="modal-header">
            <h2 id={titleId}>{title}</h2>
            <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
              <Icon name="x" />
            </button>
          </div>
          {description && (
            <p id={descriptionId} className="modal-description">
              {description}
            </p>
          )}
          {children}
        </div>
      )}
    </dialog>
  )
}
