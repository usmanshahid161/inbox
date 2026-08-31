import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ArrowRightLeft, Users, Circle } from 'lucide-react'
import Dropdown, { DropdownItem } from '../common/Dropdown'
import { selectCurrentUser } from '../../features/auth/authSlice'
import { fetchManagedAgents, selectAllManagedAgents } from '../../features/manageAgents/manageAgentsSlice'
import { fetchPresence, selectPresenceByAgentId } from '../../features/presence/presenceSlice'
import { transferInteraction, shareInteraction } from '../../features/interactionRequests/interactionRequestsSlice'
import { showToast } from '../../features/ui/uiSlice'

export default function TransferShareControl({ interaction }) {
  const dispatch = useDispatch()
  const currentUser = useSelector(selectCurrentUser)
  const allAgents = useSelector(selectAllManagedAgents)
  const presenceByAgent = useSelector(selectPresenceByAgentId)

  // Only agents assigned to this conversation's queue are relevant —
  // handing off to someone outside the queue wouldn't make sense (they
  // wouldn't otherwise see this conversation at all).
  const queueAgents = useMemo(
    () =>
      allAgents.filter(
        (a) => a._id !== currentUser?._id && a.role === 'AGENT' && a.queues?.includes(interaction?.queue)
      ),
    [allAgents, currentUser?._id, interaction?.queue]
  )

  useEffect(() => {
    dispatch(fetchManagedAgents())
  }, [dispatch])

  useEffect(() => {
    if (queueAgents.length > 0) {
      dispatch(fetchPresence(queueAgents.map((a) => a._id)))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, queueAgents.length])

  const sortedAgents = useMemo(
    () =>
      [...queueAgents].sort((a, b) => {
        const aOnline = presenceByAgent[a._id]?.status === 'ONLINE' ? 0 : 1
        const bOnline = presenceByAgent[b._id]?.status === 'ONLINE' ? 0 : 1
        return aOnline - bOnline
      }),
    [queueAgents, presenceByAgent]
  )

  const handlePick = (type, agent) => {
    const action = type === 'TRANSFER' ? transferInteraction : shareInteraction
    dispatch(
      action({ interactionId: interaction._id, toAgentId: agent._id, fromAgentName: currentUser?.name })
    ).then((res) => {
      if (!res.error) {
        dispatch(showToast({ message: `${type === 'TRANSFER' ? 'Transfer' : 'Share'} request sent to ${agent.name}`, tone: 'default' }))
      } else {
        dispatch(showToast({ message: res.payload || 'Could not send request', tone: 'danger' }))
      }
    })
  }

  const AgentList = ({ type }) =>
    sortedAgents.length === 0 ? (
      <p className="px-3 py-4 text-center text-xs text-ink-400 dark:text-navy-500">
        No other agents in this queue yet.
      </p>
    ) : (
      sortedAgents.map((agent) => {
        const online = presenceByAgent[agent._id]?.status === 'ONLINE'
        return (
          <DropdownItem key={agent._id} onClick={() => handlePick(type, agent)}>
            <Circle className={`h-2 w-2 shrink-0 ${online ? 'fill-emerald-500 text-emerald-500' : 'fill-ink-300 text-ink-300 dark:fill-navy-600 dark:text-navy-600'}`} />
            <span className="flex-1 truncate text-left">{agent.name}</span>
            {!online && <span className="text-[10px] text-ink-400 dark:text-navy-500">Offline</span>}
          </DropdownItem>
        )
      })
    )

  if (!interaction?.queue) return null

  return (
    <div className="hidden items-center gap-1 sm:flex">
      <Dropdown
        align="right"
        trigger={() => (
          <button
            className="rounded-full p-1.5 text-ink-500 hover:bg-ink-100 dark:text-navy-300 dark:hover:bg-navy-800"
            title="Transfer conversation"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </button>
        )}
      >
        <p className="border-b border-ink-100 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-ink-400 dark:border-navy-700 dark:text-navy-500">
          Transfer to
        </p>
        <AgentList type="TRANSFER" />
      </Dropdown>

      <Dropdown
        align="right"
        trigger={() => (
          <button
            className="rounded-full p-1.5 text-ink-500 hover:bg-ink-100 dark:text-navy-300 dark:hover:bg-navy-800"
            title="Share conversation"
          >
            <Users className="h-4 w-4" />
          </button>
        )}
      >
        <p className="border-b border-ink-100 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-ink-400 dark:border-navy-700 dark:text-navy-500">
          Share with
        </p>
        <AgentList type="SHARE" />
      </Dropdown>
    </div>
  )
}
