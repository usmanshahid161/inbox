import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Button from '../components/common/Button'
import SearchableMultiSelect from '../components/common/SearchableMultiSelect'
import {
  fetchGroups,
  createGroup,
  updateGroup,
  clearGroupSaveError,
  selectGroupById,
  selectGroupsSaving,
  selectGroupsSaveError
} from '../features/groups/groupsSlice'
import { fetchManagedAgents, selectManagedAgentOptions } from '../features/manageAgents/manageAgentsSlice'
import { showToast } from '../features/ui/uiSlice'

export default function GroupForm() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const editing = useSelector((state) => (isEditing ? selectGroupById(state, id) : null))
  const saving = useSelector(selectGroupsSaving)
  const saveError = useSelector(selectGroupsSaveError)
  const agentOptions = useSelector(selectManagedAgentOptions)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [agents, setAgents] = useState([])

  useEffect(() => {
    dispatch(fetchGroups())
    dispatch(fetchManagedAgents())
  }, [dispatch])

  useEffect(() => {
    dispatch(clearGroupSaveError())
    if (editing) {
      setName(editing.name || '')
      setDescription(editing.description || '')
      setAgents(editing.agents || [])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, editing])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    const payload = { name: name.trim(), description: description.trim(), agents }

    const action = isEditing ? updateGroup({ id, payload }) : createGroup(payload)
    dispatch(action).then((res) => {
      if (!res.error) {
        dispatch(showToast({ message: isEditing ? 'Group updated' : 'Group created', tone: 'success' }))
        navigate('/app/admin/groups')
      }
    })
  }

  return (
    <div className="h-full overflow-y-auto scroll-thin p-4 lg:p-6">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate('/app/admin/groups')}
          className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 dark:text-navy-400 dark:hover:bg-navy-800"
          aria-label="Back to groups"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-base font-semibold text-ink-900 dark:text-white">
            {isEditing ? 'Edit group' : 'New group'}
          </h1>
          <p className="text-xs text-ink-500 dark:text-navy-400">
            {isEditing ? "Update this group's members." : 'Bundle agents together to assign them to teams in one go.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-ink-600 dark:text-navy-300">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Night shift, Spanish speakers"
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-ink-600 dark:text-navy-300">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Optional note about this group"
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
          />
        </div>

        <SearchableMultiSelect
          label="Agents in this group"
          options={agentOptions}
          selected={agents}
          onChange={setAgents}
          placeholder="Search and add agents..."
          emptyLabel="No agents created yet — add agents first from Manage Agents."
        />

        {saveError && <p className="text-sm text-red-600">{saveError}</p>}

        <div className="flex gap-2 pt-2">
          <Button type="submit" isLoading={saving}>
            {isEditing ? 'Save changes' : 'Create group'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/app/admin/groups')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
