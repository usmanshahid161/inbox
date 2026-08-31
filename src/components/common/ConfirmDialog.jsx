import { useDispatch, useSelector } from 'react-redux'
import Modal from './Modal'
import Button from './Button'
import { closeConfirmDialog, selectConfirmDialog } from '../../features/ui/uiSlice'

// Global confirmation dialog for destructive actions (deactivating an agent,
// disconnecting a channel, etc). Trigger it with:
//   dispatch(openConfirmDialog({ title, description, confirmLabel, tone, onConfirm }))
export default function ConfirmDialog() {
  const dispatch = useDispatch()
  const dialog = useSelector(selectConfirmDialog)

  if (!dialog) return null

  const handleConfirm = () => {
    dialog.onConfirm?.()
    dispatch(closeConfirmDialog())
  }

  return (
    <Modal open onClose={() => dispatch(closeConfirmDialog())} title={dialog.title} size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={() => dispatch(closeConfirmDialog())}>
            Cancel
          </Button>
          <Button variant={dialog.tone === 'danger' ? 'danger' : 'primary'} onClick={handleConfirm}>
            {dialog.confirmLabel || 'Confirm'}
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-600">{dialog.description}</p>
    </Modal>
  )
}
