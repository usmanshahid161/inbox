import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Button from '../components/common/Button'
import {
  fetchBreakTypes,
  createBreakType,
  updateBreakType,
  clearBreakTypeSaveError,
  selectBreakTypeById,
  selectBreakTypesSaving,
  selectBreakTypesSaveError
} from '../features/breakTypes/breakTypesSlice'
import { showToast } from '../features/ui/uiSlice'

export default function BreakTypeForm() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const editing = useSelector((state) => (isEditing ? selectBreakTypeById(state, id) : null))
  const saving = useSelector(selectBreakTypesSaving)
  const saveError = useSelector(selectBreakTypesSaveError)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    dispatch(fetchBreakTypes())
  }, [dispatch])

  useEffect(() => {
    dispatch(clearBreakTypeSaveError())
    if (editing) {
      setName(editing.name || '')
      setDescription(editing.description || '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, editing])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    const payload = { name: name.trim(), description: description.trim() }

    const action = isEditing ? updateBreakType({ id, payload }) : createBreakType(payload)
    dispatch(action).then((res) => {
      if (!res.error) {
        dispatch(showToast({ message: isEditing ? 'Break type updated' : 'Break type created', tone: 'success' }))
        navigate('/app/admin/break-types')
      }
    })
  }

  return (
    <div className="h-full overflow-y-auto scroll-thin p-4 lg:p-6">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate('/app/admin/break-types')}
          className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 dark:text-navy-400 dark:hover:bg-navy-800"
          aria-label="Back to break types"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-base font-semibold text-ink-900 dark:text-white">
            {isEditing ? 'Edit break type' : 'New break type'}
          </h1>
          <p className="text-xs text-ink-500 dark:text-navy-400">Ended manually by the agent — no fixed duration yet.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-ink-600 dark:text-navy-300">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Lunch, Bathroom, Training"
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-ink-600 dark:text-navy-300">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Optional note about this break type"
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
          />
        </div>

        {saveError && <p className="text-sm text-red-600">{saveError}</p>}

        <div className="flex gap-2 pt-2">
          <Button type="submit" isLoading={saving}>
            {isEditing ? 'Save changes' : 'Create break type'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/app/admin/break-types')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
