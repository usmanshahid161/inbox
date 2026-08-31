import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Button from '../components/common/Button'
import {
  fetchTags,
  createTag,
  updateTag,
  clearTagSaveError,
  selectTagById,
  selectTagsSaving,
  selectTagsSaveError
} from '../features/tags/tagsSlice'
import { showToast } from '../features/ui/uiSlice'
import { TAG_COLORS } from '../utils/constants'

export default function TagForm() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const editing = useSelector((state) => (isEditing ? selectTagById(state, id) : null))
  const saving = useSelector(selectTagsSaving)
  const saveError = useSelector(selectTagsSaveError)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(TAG_COLORS[0])

  // Covers direct navigation / page refresh landing straight on the edit
  // route, where the list page's own fetch never ran.
  useEffect(() => {
    dispatch(fetchTags())
  }, [dispatch])

  useEffect(() => {
    dispatch(clearTagSaveError())
    if (editing) {
      setName(editing.name || '')
      setDescription(editing.description || '')
      setColor(editing.color || TAG_COLORS[0])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, editing])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    const payload = { name: name.trim(), description: description.trim(), color }

    const action = isEditing ? updateTag({ id, payload }) : createTag(payload)
    dispatch(action).then((res) => {
      if (!res.error) {
        dispatch(showToast({ message: isEditing ? 'Tag updated' : 'Tag created', tone: 'success' }))
        navigate('/app/admin/tags')
      }
    })
  }

  return (
    <div className="h-full overflow-y-auto scroll-thin p-4 lg:p-6">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate('/app/admin/tags')}
          className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 dark:text-navy-400 dark:hover:bg-navy-800"
          aria-label="Back to tags"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-base font-semibold text-ink-900 dark:text-white">
            {isEditing ? 'Edit tag' : 'New tag'}
          </h1>
          <p className="text-xs text-ink-500 dark:text-navy-400">
            {isEditing ? 'Update this tag\'s name, color or description.' : 'Create a tag agents can apply to conversations and contacts.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-ink-600 dark:text-navy-300">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. VIP, Refund, Escalated"
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-ink-600 dark:text-navy-300">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Optional note about when to use this tag"
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-ink-600 dark:text-navy-300">Color</label>
          <div className="flex flex-wrap gap-2">
            {TAG_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={c}
                style={{ backgroundColor: c }}
                className={`h-7 w-7 rounded-full ring-offset-2 transition-shadow ${
                  color === c ? 'ring-2 ring-ink-900 dark:ring-white' : ''
                }`}
              />
            ))}
          </div>
        </div>

        {saveError && <p className="text-sm text-red-600">{saveError}</p>}

        <div className="flex gap-2 pt-2">
          <Button type="submit" isLoading={saving}>
            {isEditing ? 'Save changes' : 'Create tag'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/app/admin/tags')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
