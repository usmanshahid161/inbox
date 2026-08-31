import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import { Plus, MoreVertical, Trash2, Pencil } from 'lucide-react'
import Avatar from '../components/common/Avatar'
import Badge from '../components/common/Badge'
import Modal from '../components/common/Modal'
import Button from '../components/common/Button'
import Dropdown, { DropdownItem } from '../components/common/Dropdown'
import { Skeleton } from '../components/common/Loader'
import { useAuth } from '../hooks/useAuth'
import {
  fetchAgents,
  createAgent,
  updateAgent,
  deactivateAgent,
  selectAgents,
  selectAgentsStatus
} from '../features/agents/agentsSlice'
import { openConfirmDialog, showToast } from '../features/ui/uiSlice'
import { ROLES, AGENT_STATUS } from '../utils/constants'
import { selectChannels, fetchChannels } from '../features/channels/channelsSlice'

const PRESENCE_LABEL = {
  [AGENT_STATUS.ONLINE]: 'Online',
  [AGENT_STATUS.AWAY]: 'Away',
  [AGENT_STATUS.OFFLINE]: 'Offline'
}

function AgentFormModal({ open, onClose, initial }) {
  const dispatch = useDispatch()
  const channels = useSelector(selectChannels)
  const [name, setName] = useState(initial?.name || '')
  const [email, setEmail] = useState(initial?.email || '')
  const [role, setRole] = useState(initial?.role || ROLES.AGENT)
  const [assignedChannels, setAssignedChannels] = useState(initial?.assignedChannels || [])

  const toggleChannel = (id) => {
    setAssignedChannels((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))
  }

  const handleSubmit = () => {
    if (!name.trim() || !email.trim()) return
    const payload = { name: name.trim(), email: email.trim(), role, assignedChannels }
    if (initial) {
      dispatch(updateAgent({ agentId: initial.id, changes: payload }))
      dispatch(showToast({ message: 'Agent updated', tone: 'success' }))
    } else {
      dispatch(createAgent(payload))
      dispatch(showToast({ message: 'Agent invited', tone: 'success' }))
    }
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit agent' : 'Invite agent'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>{initial ? 'Save changes' : 'Send invite'}</Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-ink-600 dark:text-navy-300">Full name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-ink-600 dark:text-navy-300">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-ink-600 dark:text-navy-300">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
          >
            <option value={ROLES.AGENT}>Agent</option>
            <option value={ROLES.ADMIN}>Admin</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-ink-600 dark:text-navy-300">Assigned channels</label>
          <div className="flex flex-wrap gap-1.5">
            {channels.map((c) => (
              <button
                key={c.id}
                onClick={() => toggleChannel(c.id)}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                  assignedChannels.includes(c.id)
                    ? 'border-brand-400 bg-brand-50 text-brand-700 dark:border-brand-600 dark:bg-brand-900/30 dark:text-brand-300'
                    : 'border-ink-200 text-ink-500 dark:border-navy-700 dark:text-navy-400'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default function Agents() {
  const dispatch = useDispatch()
  const { isAdmin } = useAuth()
  const agents = useSelector(selectAgents)
  const status = useSelector(selectAgentsStatus)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAgent, setEditingAgent] = useState(null)

  useEffect(() => {
    dispatch(fetchAgents())
    dispatch(fetchChannels())
  }, [dispatch])

  if (!isAdmin) return <Navigate to="/app/inbox" replace />

  const handleDeactivate = (agent) => {
    dispatch(
      openConfirmDialog({
        title: 'Deactivate agent',
        description: `${agent.name} will lose access to the workspace immediately. This can be reversed later.`,
        confirmLabel: 'Deactivate',
        tone: 'danger',
        onConfirm: () => {
          dispatch(deactivateAgent(agent.id))
          dispatch(showToast({ message: `${agent.name} deactivated`, tone: 'default' }))
        }
      })
    )
  }

  return (
    <div className="h-full overflow-y-auto scroll-thin p-4 lg:p-6">
      <div className="mb-4 flex justify-end">
        <Button
          icon={Plus}
          onClick={() => {
            setEditingAgent(null)
            setModalOpen(true)
          }}
        >
          Invite agent
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-ink-100 bg-white dark:border-navy-800 dark:bg-navy-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink-100 bg-ink-50 text-xs uppercase tracking-wide text-ink-500 dark:border-navy-800 dark:bg-navy-800/60 dark:text-navy-400">
            <tr>
              <th className="px-4 py-3 font-medium">Agent</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Role</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Status</th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell">Channels</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100 dark:divide-navy-800">
            {status === 'loading' &&
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3" colSpan={5}>
                    <Skeleton className="h-6 w-full" />
                  </td>
                </tr>
              ))}

            {agents.map((agent) => (
              <tr key={agent.id} className="hover:bg-ink-50 dark:hover:bg-navy-800/60">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={agent.name} color={agent.avatarColor} presence={agent.status} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink-900 dark:text-white">{agent.name}</p>
                      <p className="truncate text-xs text-ink-500 dark:text-navy-400">{agent.email}</p>
                    </div>
                  </div>
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <Badge tone={agent.role === ROLES.ADMIN ? 'brand' : 'neutral'}>{agent.role === ROLES.ADMIN ? 'Admin' : 'Agent'}</Badge>
                </td>
                <td className="hidden px-4 py-3 text-ink-600 dark:text-navy-300 md:table-cell">{PRESENCE_LABEL[agent.status]}</td>
                <td className="hidden px-4 py-3 text-ink-500 dark:text-navy-400 lg:table-cell">{agent.assignedChannels.length} channels</td>
                <td className="px-4 py-3 text-right">
                  <Dropdown
                    align="right"
                    trigger={() => (
                      <button className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 dark:text-navy-400 dark:hover:bg-navy-800">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    )}
                  >
                    <DropdownItem
                      icon={Pencil}
                      onClick={() => {
                        setEditingAgent(agent)
                        setModalOpen(true)
                      }}
                    >
                      Edit
                    </DropdownItem>
                    <DropdownItem icon={Trash2} danger onClick={() => handleDeactivate(agent)}>
                      Deactivate
                    </DropdownItem>
                  </Dropdown>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AgentFormModal open={modalOpen} onClose={() => setModalOpen(false)} initial={editingAgent} />
    </div>
  )
}
