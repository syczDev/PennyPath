import { Modal } from './Modal'

export interface ConfirmRequest {
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
}

interface ConfirmDialogProps {
  request: ConfirmRequest | null
  onClose: () => void
}

export function ConfirmDialog({ request, onClose }: ConfirmDialogProps) {
  return (
    <Modal
      open={request !== null}
      title={request?.title ?? ''}
      description={request?.message}
      onClose={onClose}
      size="small"
    >
      <div className="form-actions">
        {/* Cancel is first in DOM order so the dialog's initial focus lands on the safe choice. */}
        <button type="button" className="button button-secondary" onClick={onClose} autoFocus>
          Cancel
        </button>
        <button
          type="button"
          className="button button-danger"
          onClick={() => {
            request?.onConfirm()
            onClose()
          }}
        >
          {request?.confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
