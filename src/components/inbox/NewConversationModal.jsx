import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Modal from '../common/Modal'
import Button from '../common/Button'
import { fetchQueues, selectAllQueues } from '../../features/queues/queuesSlice'
import { startOutboundConversation } from '../../features/interactions/interactionsSlice'

export default function NewConversationModal({ open, onClose, onStarted }) {
  const dispatch = useDispatch()
  const queues = useSelector(selectAllQueues)
  const [queue, setQueue] = useState('')
  const [phone, setPhone] = useState('')
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) return
    dispatch(fetchQueues())
    setQueue('')
    setPhone('')
    setError(null)
  }, [open, dispatch])

  const handleStart = async () => {
    if (!queue || !phone.trim()) return
    setStarting(true)
    setError(null)
    try {
      const interaction = await dispatch(startOutboundConversation({ queue, phone: phone.trim() })).unwrap()
      onStarted?.(interaction._id)
      onClose()
    } catch (err) {
      setError(err)
    } finally {
      setStarting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New conversation"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleStart} isLoading={starting} disabled={!queue || !phone.trim()}>Start</Button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-600 dark:text-navy-300">Queue</label>
          <select
            value={queue}
            onChange={(e) => setQueue(e.target.value)}
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm dark:border-navy-700 dark:bg-navy-900 dark:text-ink-100"
          >
            <option value="">Select queue</option>
            {queues.map((q) => (
              <option key={q._id} value={q.slug}>{q.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-ink-600 dark:text-navy-300">WhatsApp number</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+92 300 1234567"
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm dark:border-navy-700 dark:bg-navy-900 dark:text-ink-100"
          />
          <p className="mt-1 text-[11px] text-ink-400">
            If this number already has a conversation, it'll reopen and you'll be added to it — no duplicate gets created.
          </p>
        </div>

        {error && <p className="text-xs text-rose-500">{error}</p>}
      </div>
    </Modal>
  )
}
