import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Button from '../components/common/Button'
import SearchableMultiSelect from '../components/common/SearchableMultiSelect'
import {
  fetchTeams,
  createTeam,
  updateTeam,
  clearTeamSaveError,
  selectTeamById,
  selectTeamsSaving,
  selectTeamsSaveError
} from '../features/teams/teamsSlice'
import { fetchManagedAgents, selectManagedAgentOptions } from '../features/manageAgents/manageAgentsSlice'
import { fetchQueues, selectQueueOptions } from '../features/queues/queuesSlice'
import { fetchGroups, selectGroupOptions } from '../features/groups/groupsSlice'
import { showToast } from '../features/ui/uiSlice'

export default function TeamForm() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const editing = useSelector((state) => (isEditing ? selectTeamById(state, id) : null))
  const saving = useSelector(selectTeamsSaving)
  const saveError = useSelector(selectTeamsSaveError)
  const agentOptions = useSelector(selectManagedAgentOptions)
  const queueOptions = useSelector(selectQueueOptions)
  const groupOptions = useSelector(selectGroupOptions)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [agents, setAgents] = useState([])
  const [queues, setQueues] = useState([])
  const [groups, setGroups] = useState([])

  useEffect(() => {
    dispatch(fetchTeams())
    dispatch(fetchManagedAgents())
    dispatch(fetchQueues())
    dispatch(fetchGroups())
  }, [dispatch])

  useEffect(() => {
    dispatch(clearTeamSaveError())
    if (editing) {
      setName(editing.name || '')
      setDescription(editing.description || '')
      setAgents(editing.agents || [])
      setQueues(editing.queues || [])
      setGroups(editing.groups || [])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, editing])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return
    const payload = { name: name.trim(), description: description.trim(), agents, queues, groups }

    const action = isEditing ? updateTeam({ id, payload }) : createTeam(payload)
    dispatch(action).then((res) => {
      if (!res.error) {
        dispatch(showToast({ message: isEditing ? 'Team updated' : 'Team created', tone: 'success' }))
        navigate('/app/admin/teams')
      }
    })
  }

  return (
    <div className="h-full overflow-y-auto scroll-thin p-4 lg:p-6">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate('/app/admin/teams')}
          className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 dark:text-navy-400 dark:hover:bg-navy-800"
          aria-label="Back to teams"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-base font-semibold text-ink-900 dark:text-white">
            {isEditing ? 'Edit team' : 'New team'}
          </h1>
          <p className="text-xs text-ink-500 dark:text-navy-400">
            {isEditing ? "Update this team's members and routing." : 'Group agents, queues and agent-groups together.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-ink-600 dark:text-navy-300">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Billing team, Tier 2"
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-ink-600 dark:text-navy-300">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Optional note about this team"
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
          />
        </div>

        <SearchableMultiSelect
          label="Agents"
          options={agentOptions}
          selected={agents}
          onChange={setAgents}
          placeholder="Search and add agents..."
          emptyLabel="No agents created yet — add agents first from Manage Agents."
        />

        <SearchableMultiSelect
          label="Queues"
          options={queueOptions}
          selected={queues}
          onChange={setQueues}
          placeholder="Search and add queues..."
          emptyLabel="No queues created yet — add queues first."
        />

        <SearchableMultiSelect
          label="Groups"
          options={groupOptions}
          selected={groups}
          onChange={setGroups}
          placeholder="Search and add groups..."
          emptyLabel="No groups created yet — add groups first."
        />

        {saveError && <p className="text-sm text-red-600">{saveError}</p>}

        <div className="flex gap-2 pt-2">
          <Button type="submit" isLoading={saving}>
            {isEditing ? 'Save changes' : 'Create team'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/app/admin/teams')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
