import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, MoreVertical, Trash2, Pencil, KeyRound, UserCog } from 'lucide-react'
import Avatar from '../components/common/Avatar'
import Badge from '../components/common/Badge'
import Button from '../components/common/Button'
import Modal from '../components/common/Modal'
import Dropdown, { DropdownItem } from '../components/common/Dropdown'
import EmptyState from '../components/common/EmptyState'
import { Skeleton } from '../components/common/Loader'
import { useDebounce } from '../hooks/useDebounce'
import {
  fetchManagedAgents,
  updateManagedAgentPassword,
  deleteManagedAgent,
  openPasswordForm,
  closePasswordForm,
  setManagedAgentSearch,
  selectFilteredManagedAgents,
  selectManagedAgentsStatus,
  selectIsPasswordFormOpen,
  selectPasswordAgentId,
  selectPasswordSaving,
  selectPasswordSaveError
} from '../features/manageAgents/manageAgentsSlice'
import { openConfirmDialog, showToast } from '../features/ui/uiSlice'

const labelClass = 'text-xs font-medium text-ink-600 dark:text-navy-300'
const inputClass =
  'w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-navy-700 dark:bg-navy-800 dark:text-white'

function PasswordFormModal() {
  const dispatch = useDispatch()
  const open = useSelector(selectIsPasswordFormOpen)
  const agentId = useSelector(selectPasswordAgentId)
  const agents = useSelector(selectFilteredManagedAgents)
  const saving = useSelector(selectPasswordSaving)
  const saveError = useSelector(selectPasswordSaveError)
  const agent = agents.find((a) => a._id === agentId)

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (open) {
      setPassword('')
      setConfirmPassword('')
    }
  }, [open])

  const mismatch = confirmPassword.length > 0 && password !== confirmPassword

  const handleSubmit = () => {
    if (!password.trim() || mismatch) return
    dispatch(updateManagedAgentPassword({ id: agentId, password })).then((res) => {
      if (!res.error) dispatch(showToast({ message: 'Password updated', tone: 'success' }))
    })
  }

  return (
    <Modal
      open={open}
      onClose={() => dispatch(closePasswordForm())}
      title={agent ? `Reset password — ${agent.name}` : 'Reset password'}
      footer={
        <>
          <Button variant="secondary" onClick={() => dispatch(closePasswordForm())}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} isLoading={saving} disabled={mismatch}>
            Update password
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className={labelClass}>New password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label className={labelClass}>Confirm password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClass}
          />
          {mismatch && <p className="text-xs text-red-600">Passwords don't match.</p>}
        </div>
        {saveError && <p className="text-xs text-red-600">{saveError}</p>}
      </div>
    </Modal>
  )
}

export default function ManageAgents() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const agents = useSelector(selectFilteredManagedAgents)
  const status = useSelector(selectManagedAgentsStatus)
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 300)

  useEffect(() => {
    dispatch(fetchManagedAgents())
  }, [dispatch])

  useEffect(() => {
    dispatch(setManagedAgentSearch(debouncedSearch))
  }, [debouncedSearch, dispatch])

  const handleDelete = (agent) => {
    dispatch(
      openConfirmDialog({
        title: 'Delete agent',
        description: `${agent.name} will lose access to the workspace immediately. This can't be undone.`,
        confirmLabel: 'Delete',
        tone: 'danger',
        onConfirm: () => {
          dispatch(deleteManagedAgent(agent._id)).then((res) => {
            if (!res.error) dispatch(showToast({ message: 'Agent deleted', tone: 'default' }))
          })
        }
      })
    )
  }

  return (
    <div className="h-full overflow-y-auto scroll-thin p-4 lg:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search agents..."
            className="w-full rounded-lg border border-ink-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
          />
        </div>
        <Button icon={Plus} onClick={() => navigate('/app/admin/agents/new')}>
          New agent
        </Button>
      </div>

      {status === 'loading' && agents.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      ) : agents.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="No agents yet"
          description="Create login accounts for agents and assign them queues, teams and groups."
          action={
            <Button icon={Plus} onClick={() => navigate('/app/admin/agents/new')}>
              New agent
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-ink-100 bg-white dark:border-navy-800 dark:bg-navy-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-xs uppercase tracking-wide text-ink-500 dark:border-navy-800 dark:bg-navy-800/60 dark:text-navy-400">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Agent</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Username</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Role</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Queues</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">Teams</th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">Groups</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 dark:divide-navy-800">
              {agents.map((agent) => (
                <tr key={agent._id} className="hover:bg-ink-50 dark:hover:bg-navy-800/60">
                  <td className="px-4 py-3 text-ink-400 dark:text-navy-500">{agent.agentNumber ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={agent.name} color={agent.avatarColor || '#219c89'} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink-900 dark:text-white">{agent.name}</p>
                        <p className="truncate text-xs text-ink-500 dark:text-navy-400">{agent.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-ink-600 dark:text-navy-300 sm:table-cell">{agent.username}</td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <Badge tone={agent.role === 'ADMIN' ? 'brand' : 'neutral'}>
                      {agent.role === 'ADMIN' ? 'Admin' : 'Agent'}
                    </Badge>
                  </td>
                  <td className="hidden px-4 py-3 text-ink-500 dark:text-navy-400 md:table-cell">
                    {agent.role === 'ADMIN' ? '—' : agent.queues?.length || 0}
                  </td>
                  <td className="hidden px-4 py-3 text-ink-500 dark:text-navy-400 lg:table-cell">
                    {agent.role === 'ADMIN' ? '—' : agent.teams?.length || 0}
                  </td>
                  <td className="hidden px-4 py-3 text-ink-500 dark:text-navy-400 lg:table-cell">
                    {agent.role === 'ADMIN' ? '—' : agent.groups?.length || 0}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Dropdown
                      align="right"
                      trigger={() => (
                        <button className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 dark:text-navy-400 dark:hover:bg-navy-800">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      )}
                    >
                      <DropdownItem icon={Pencil} onClick={() => navigate(`/app/admin/agents/${agent._id}`)}>
                        Edit
                      </DropdownItem>
                      <DropdownItem icon={KeyRound} onClick={() => dispatch(openPasswordForm(agent._id))}>
                        Reset password
                      </DropdownItem>
                      <DropdownItem icon={Trash2} danger onClick={() => handleDelete(agent)}>
                        Delete
                      </DropdownItem>
                    </Dropdown>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PasswordFormModal />
    </div>
  )
}
