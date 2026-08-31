import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Button from '../components/common/Button'
import {
  fetchQueues,
  createQueue,
  updateQueue,
  clearQueueSaveError,
  selectQueueById,
  selectQueuesSaving,
  selectQueuesSaveError
} from '../features/queues/queuesSlice'
import { showToast } from '../features/ui/uiSlice'

const slugify = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

export default function QueueForm() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const editing = useSelector((state) => (isEditing ? selectQueueById(state, id) : null))
  const saving = useSelector(selectQueuesSaving)
  const saveError = useSelector(selectQueuesSaveError)

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [description, setDescription] = useState('')

  useEffect(() => {
    dispatch(fetchQueues())
  }, [dispatch])

  useEffect(() => {
    dispatch(clearQueueSaveError())
    if (editing) {
      setName(editing.name || '')
      setSlug(editing.slug || '')
      setSlugTouched(true) // don't auto-overwrite an existing queue's slug from name edits
      setDescription(editing.description || '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, editing])

  const handleNameChange = (value) => {
    setName(value)
    if (!slugTouched) setSlug(slugify(value))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim() || !slug.trim()) return
    const payload = { name: name.trim(), slug: slugify(slug), description: description.trim() }

    const action = isEditing ? updateQueue({ id, payload }) : createQueue(payload)
    dispatch(action).then((res) => {
      if (!res.error) {
        dispatch(showToast({ message: isEditing ? 'Queue updated' : 'Queue created', tone: 'success' }))
        navigate('/app/admin/queues')
      }
    })
  }

  return (
    <div className="h-full overflow-y-auto scroll-thin p-4 lg:p-6">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate('/app/admin/queues')}
          className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 dark:text-navy-400 dark:hover:bg-navy-800"
          aria-label="Back to queues"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-base font-semibold text-ink-900 dark:text-white">
            {isEditing ? 'Edit queue' : 'New queue'}
          </h1>
          <p className="text-xs text-ink-500 dark:text-navy-400">
            {isEditing ? "Update this queue's name or description." : 'Queues group incoming conversations for routing.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        {isEditing && editing?.queueNumber != null && (
          <p className="text-xs text-ink-400 dark:text-navy-500">Queue #{editing.queueNumber}</p>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-ink-600 dark:text-navy-300">Name</label>
          <input
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. Billing Information, Tier 2 support"
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-ink-600 dark:text-navy-300">Identifier</label>
          <div className="flex items-center gap-2">
            <input
              value={slug}
              onChange={(e) => {
                setSlugTouched(true)
                setSlug(e.target.value)
              }}
              onBlur={() => setSlug((s) => slugify(s))}
              placeholder="billing_information"
              className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 font-mono text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
            />
          </div>
          <p className="text-[11px] text-ink-400 dark:text-navy-500">
            Machine-readable id — used to name the number's message queue (e.g. subscribing a WhatsApp number to this
            queue creates a queue named <span className="font-mono">phoneNumber_{slug || 'this_identifier'}</span>).
            {isEditing && ' Changing it after a number is already subscribed to this queue will need a re-subscribe.'}
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-ink-600 dark:text-navy-300">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Optional note about what this queue is for"
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
          />
        </div>

        {saveError && <p className="text-sm text-red-600">{saveError}</p>}

        <div className="flex gap-2 pt-2">
          <Button type="submit" isLoading={saving}>
            {isEditing ? 'Save changes' : 'Create queue'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/app/admin/queues')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
