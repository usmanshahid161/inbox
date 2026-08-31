import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Button from '../components/common/Button'
import {
  fetchQuickReplies,
  createQuickReply,
  updateQuickReply,
  clearQuickReplySaveError,
  selectQuickReplyById,
  selectQuickRepliesSaving,
  selectQuickRepliesSaveError
} from '../features/quickReplies/quickRepliesSlice'
import { showToast } from '../features/ui/uiSlice'

const inputClass =
  'w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-navy-700 dark:bg-navy-800 dark:text-white'
const labelClass = 'text-xs font-medium text-ink-600 dark:text-navy-300'

export default function QuickReplyForm() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const editing = useSelector((state) => (isEditing ? selectQuickReplyById(state, id) : null))
  const saving = useSelector(selectQuickRepliesSaving)
  const saveError = useSelector(selectQuickRepliesSaveError)

  const [shortcut, setShortcut] = useState('')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    dispatch(fetchQuickReplies())
  }, [dispatch])

  useEffect(() => {
    dispatch(clearQuickReplySaveError())
    if (editing) {
      setShortcut(editing.shortcut || '')
      setTitle(editing.title || '')
      setMessage(editing.message || '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, editing])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!shortcut.trim() || !title.trim() || !message.trim()) return
    const payload = {
      shortcut: shortcut.trim().toLowerCase().replace(/\s+/g, '-'),
      title: title.trim(),
      message: message.trim()
    }

    const action = isEditing ? updateQuickReply({ id, payload }) : createQuickReply(payload)
    dispatch(action).then((res) => {
      if (!res.error) {
        dispatch(showToast({ message: isEditing ? 'Quick reply updated' : 'Quick reply created', tone: 'success' }))
        navigate('/app/admin/quick-replies')
      }
    })
  }

  return (
    <div className="h-full overflow-y-auto scroll-thin p-4 lg:p-6">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate('/app/admin/quick-replies')}
          className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 dark:text-navy-400 dark:hover:bg-navy-800"
          aria-label="Back to quick replies"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-base font-semibold text-ink-900 dark:text-white">
            {isEditing ? 'Edit quick reply' : 'New quick reply'}
          </h1>
          <p className="text-xs text-ink-500 dark:text-navy-400">
            {isEditing ? 'Update this canned response.' : 'Agents type "/" in the composer to find and insert this.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        <div className="space-y-1.5">
          <label className={labelClass}>Shortcut</label>
          <div className="flex items-center gap-2">
            <span className="text-ink-400">/</span>
            <input
              value={shortcut}
              onChange={(e) => setShortcut(e.target.value)}
              placeholder="e.g. refund, hours, greeting"
              className={inputClass}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Refund policy"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder="The exact text that gets inserted into the composer"
            className={inputClass}
          />
        </div>

        {saveError && <p className="text-sm text-red-600">{saveError}</p>}

        <div className="flex gap-2 pt-2">
          <Button type="submit" isLoading={saving}>
            {isEditing ? 'Save changes' : 'Create quick reply'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/app/admin/quick-replies')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
