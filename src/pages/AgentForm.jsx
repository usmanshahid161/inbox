import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ShieldCheck, Headphones } from 'lucide-react'
import Button from '../components/common/Button'
import Badge from '../components/common/Badge'
import SearchableMultiSelect from '../components/common/SearchableMultiSelect'
import {
  fetchManagedAgents,
  createManagedAgent,
  updateManagedAgent,
  clearAgentSaveError,
  selectManagedAgentById,
  selectManagedAgentsSaving,
  selectManagedAgentsSaveError
} from '../features/manageAgents/manageAgentsSlice'
import { fetchQueues, selectQueueOptions } from '../features/queues/queuesSlice'
import { fetchTeams, selectTeamOptions } from '../features/teams/teamsSlice'
import { fetchGroups, selectGroupOptions } from '../features/groups/groupsSlice'
import { showToast } from '../features/ui/uiSlice'

const inputClass =
  'w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-navy-700 dark:bg-navy-800 dark:text-white'
const labelClass = 'text-xs font-medium text-ink-600 dark:text-navy-300'

const ROLE_OPTIONS = [
  { value: 'AGENT', label: 'Agent', icon: Headphones, hint: 'Handles conversations — can be assigned queues, teams and groups.' },
  { value: 'ADMIN', label: 'Admin', icon: ShieldCheck, hint: 'Manages the workspace — never routed conversations, so no queue/team/group assignment.' }
]

export default function AgentForm() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const editing = useSelector((state) => (isEditing ? selectManagedAgentById(state, id) : null))
  const saving = useSelector(selectManagedAgentsSaving)
  const saveError = useSelector(selectManagedAgentsSaveError)
  const queueOptions = useSelector(selectQueueOptions)
  const teamOptions = useSelector(selectTeamOptions)
  const groupOptions = useSelector(selectGroupOptions)

  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('AGENT')
  const [queues, setQueues] = useState([])
  const [teams, setTeams] = useState([])
  const [groups, setGroups] = useState([])

  useEffect(() => {
    dispatch(fetchManagedAgents())
    dispatch(fetchQueues())
    dispatch(fetchTeams())
    dispatch(fetchGroups())
  }, [dispatch])

  useEffect(() => {
    dispatch(clearAgentSaveError())
    if (editing) {
      setName(editing.name || '')
      setUsername(editing.username || '')
      setEmail(editing.email || '')
      setRole(editing.role || 'AGENT')
      setQueues(editing.queues || [])
      setTeams(editing.teams || [])
      setGroups(editing.groups || [])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, editing])

  const isAgentRole = role === 'AGENT'

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim() || !username.trim() || !email.trim()) return
    if (!isEditing && !password.trim()) return

    if (isEditing) {
      const payload = {
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
        // Admins never carry assignments — send empty arrays regardless of
        // whatever was selected before the role was ADMIN.
        queues: isAgentRole ? queues : [],
        teams: isAgentRole ? teams : [],
        groups: isAgentRole ? groups : []
      }
      dispatch(updateManagedAgent({ id, payload })).then((res) => {
        if (!res.error) {
          dispatch(showToast({ message: 'Agent updated', tone: 'success' }))
          navigate('/app/admin/agents')
        }
      })
    } else {
      const payload = {
        name: name.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
        role,
        queues: isAgentRole ? queues : [],
        teams: isAgentRole ? teams : [],
        groups: isAgentRole ? groups : []
      }
      dispatch(createManagedAgent(payload)).then((res) => {
        if (!res.error) {
          dispatch(showToast({ message: 'Agent created', tone: 'success' }))
          navigate('/app/admin/agents')
        }
      })
    }
  }

  return (
    <div className="h-full overflow-y-auto scroll-thin p-4 lg:p-6">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate('/app/admin/agents')}
          className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 dark:text-navy-400 dark:hover:bg-navy-800"
          aria-label="Back to agents"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-base font-semibold text-ink-900 dark:text-white">
            {isEditing ? 'Edit agent' : 'New agent'}
          </h1>
          <p className="text-xs text-ink-500 dark:text-navy-400">
            {isEditing ? "Update this agent's details and assignments." : 'Create a login account and set what it can be assigned.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className={labelClass}>Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className={inputClass} />
          </div>
          <div className="space-y-1.5">
            <label className={labelClass}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </div>
          {!isEditing && (
            <div className="space-y-1.5">
              <label className={labelClass}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </div>
          )}
        </div>

        {isEditing && (
          <p className="text-xs text-ink-400 dark:text-navy-500">
            Use "Reset password" from the agents list to change this agent's password.
          </p>
        )}

        {/* Role */}
        <div className="space-y-1.5">
          <label className={labelClass}>Role</label>

          {isEditing ? (
            // Role isn't changed after creation — keeps the assignment
            // rules below unambiguous. Delete and recreate the account to
            // change it.
            <Badge tone={role === 'ADMIN' ? 'brand' : 'neutral'}>{role === 'ADMIN' ? 'Admin' : 'Agent'}</Badge>
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ROLE_OPTIONS.map((opt) => {
                const Icon = opt.icon
                const active = role === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRole(opt.value)}
                    className={`flex items-start gap-2.5 rounded-lg border p-3 text-left transition-colors ${
                      active
                        ? 'border-brand-400 bg-brand-50 dark:border-brand-600 dark:bg-brand-900/20'
                        : 'border-ink-200 hover:border-ink-300 dark:border-navy-700 dark:hover:border-navy-600'
                    }`}
                  >
                    <Icon
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        active ? 'text-brand-600 dark:text-brand-400' : 'text-ink-400 dark:text-navy-500'
                      }`}
                    />
                    <span>
                      <span
                        className={`block text-sm font-medium ${
                          active ? 'text-brand-700 dark:text-brand-300' : 'text-ink-800 dark:text-navy-200'
                        }`}
                      >
                        {opt.label}
                      </span>
                      <span className="mt-0.5 block text-xs text-ink-500 dark:text-navy-400">{opt.hint}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Assignments — agents only; admins never get queues/teams/groups */}
        {isAgentRole ? (
          <div className="space-y-4 rounded-lg border border-ink-100 p-4 dark:border-navy-800">
            <SearchableMultiSelect
              label="Queues"
              options={queueOptions}
              selected={queues}
              onChange={setQueues}
              placeholder="Search and add queues..."
              emptyLabel="No queues created yet — add queues first."
            />
            <SearchableMultiSelect
              label="Teams"
              options={teamOptions}
              selected={teams}
              onChange={setTeams}
              placeholder="Search and add teams..."
              emptyLabel="No teams created yet — add teams first."
            />
            <SearchableMultiSelect
              label="Groups"
              options={groupOptions}
              selected={groups}
              onChange={setGroups}
              placeholder="Search and add groups..."
              emptyLabel="No groups created yet — add groups first."
            />
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-ink-200 p-3 text-xs text-ink-500 dark:border-navy-700 dark:text-navy-400">
            Admins manage the workspace and aren't routed conversations, so they can't be assigned queues, teams or
            groups.
          </p>
        )}

        {saveError && <p className="text-sm text-red-600">{saveError}</p>}

        <div className="flex gap-2 pt-2">
          <Button type="submit" isLoading={saving}>
            {isEditing ? 'Save changes' : 'Create agent'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/app/admin/agents')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
