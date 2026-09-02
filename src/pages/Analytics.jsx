import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  MessagesSquare,
  CheckCircle2,
  UserX,
  UserCheck,
  ArrowDownToLine,
  ArrowUpFromLine,
  MessageSquareText,
  Circle
} from 'lucide-react'
import Modal from '../components/common/Modal'
import { Skeleton } from '../components/common/Loader'
import { channelLabel } from '../components/common/ChannelIcon'
import Avatar from '../components/common/Avatar'
import { formatFullDateTime } from '../utils/formatters'
import { CHANNEL_TYPE } from '../utils/constants'
import { fetchQueues, selectAllQueues } from '../features/queues/queuesSlice'
import { selectRealtimeSignal } from '../features/ui/uiSlice'
import { selectPresenceByAgentId } from '../features/presence/presenceSlice'
import {
  fetchDashboard,
  fetchUnassigned,
  setDateRange,
  setChannelFilter,
  setQueueFilter,
  setAgentFilter,
  openUnassignedModal,
  closeUnassignedModal,
  selectDashboardFilters,
  selectDashboardStats,
  selectDashboardAgents,
  selectDashboardStatus,
  selectUnassignedModal
} from '../features/dashboard/dashboardSlice'
const inputClass =
  'rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-xs focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-navy-700 dark:bg-navy-800 dark:text-white'

const STAT_CARDS = [
  { key: 'newInteractions', label: 'New conversations', icon: MessagesSquare, tone: 'text-brand-600' },
  { key: 'assignedInteractions', label: 'Assigned', icon: UserCheck, tone: 'text-teal-600' },
  { key: 'unassignedInteractions', label: 'Unassigned', icon: UserX, tone: 'text-amber-600', clickable: true },
  { key: 'closedInteractions', label: 'Closed', icon: CheckCircle2, tone: 'text-emerald-600' },
  { key: 'inboundMessages', label: 'Inbound messages', icon: ArrowDownToLine, tone: 'text-sky-600' },
  { key: 'outboundMessages', label: 'Outbound messages', icon: ArrowUpFromLine, tone: 'text-violet-600' },
  { key: 'totalMessages', label: 'Total messages', icon: MessageSquareText, tone: 'text-ink-600' }
]

function FilterBar() {
  const dispatch = useDispatch()
  const filters = useSelector(selectDashboardFilters)
  const queues = useSelector(selectAllQueues)
  const agents = useSelector(selectDashboardAgents)

  useEffect(() => {
    dispatch(fetchQueues())
  }, [dispatch])

  // Queues are matched/stored by slug now (e.g. "billing_information"),
  // not _id — same convention as Interaction.queue, User.queues etc.
  const toggleQueue = (slug) => {
    const next = filters.queues.includes(slug)
      ? filters.queues.filter((q) => q !== slug)
      : [...filters.queues, slug]
    dispatch(setQueueFilter(next))
  }

  return (
    <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-ink-100 bg-white p-3 dark:border-navy-800 dark:bg-navy-900">
      <div className="space-y-1">
        <label className="text-[11px] font-medium text-ink-400 dark:text-navy-500">From</label>
        <input
          type="date"
          value={filters.from}
          onChange={(e) => dispatch(setDateRange({ from: e.target.value, to: filters.to }))}
          className={inputClass}
        />
      </div>
      <div className="space-y-1">
        <label className="text-[11px] font-medium text-ink-400 dark:text-navy-500">To</label>
        <input
          type="date"
          value={filters.to}
          onChange={(e) => dispatch(setDateRange({ from: filters.from, to: e.target.value }))}
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-medium text-ink-400 dark:text-navy-500">Channel</label>
        <select value={filters.channel} onChange={(e) => dispatch(setChannelFilter(e.target.value))} className={inputClass}>
          <option value="">All channels</option>
          {Object.values(CHANNEL_TYPE).map((c) => (
            <option key={c.toLowerCase()} value={c.toLowerCase()}>
              {channelLabel(c)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-medium text-ink-400 dark:text-navy-500">
          Queues {filters.queues.length > 0 && `(${filters.queues.length})`}
        </label>
        <div className="flex max-w-xs flex-wrap gap-1">
          <button
            onClick={() => dispatch(setQueueFilter([]))}
            className={`rounded-md border px-2 py-1 text-[11px] ${
              filters.queues.length === 0
                ? 'border-brand-400 bg-brand-50 text-brand-700 dark:border-brand-600 dark:bg-brand-900/20 dark:text-brand-300'
                : 'border-ink-200 text-ink-500 dark:border-navy-700 dark:text-navy-400'
            }`}
          >
            All
          </button>
          {queues.map((q) => (
            <button
              key={q._id}
              onClick={() => toggleQueue(q.slug)}
              className={`rounded-md border px-2 py-1 text-[11px] ${
                filters.queues.includes(q.slug)
                  ? 'border-brand-400 bg-brand-50 text-brand-700 dark:border-brand-600 dark:bg-brand-900/20 dark:text-brand-300'
                  : 'border-ink-200 text-ink-500 dark:border-navy-700 dark:text-navy-400'
              }`}
            >
              {q.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-[11px] font-medium text-ink-400 dark:text-navy-500">Agent</label>
        <select value={filters.agentId} onChange={(e) => dispatch(setAgentFilter(e.target.value))} className={inputClass}>
          <option value="">All agents</option>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

function QueueBreakdownWidget() {
  const stats = useSelector(selectDashboardStats)
  const queues = useSelector(selectAllQueues)
  const breakdown = stats?.queueBreakdown || []

  // stats.queueBreakdown keys by slug (Interaction.queue is a slug now,
  // not _id) — resolved back to a display name here.
  const nameFor = (slug) => queues.find((q) => q.slug === slug)?.name || slug || 'No queue'
  const max = Math.max(...breakdown.map((b) => b.count), 1)

  return (
    <div className="rounded-xl border border-ink-100 bg-white p-4 dark:border-navy-800 dark:bg-navy-900 lg:col-span-2">
      <h3 className="mb-3 text-sm font-semibold text-ink-900 dark:text-white">New conversations by queue</h3>
      {breakdown.length === 0 ? (
        <p className="text-xs text-ink-400 dark:text-navy-500">Nothing in this range yet.</p>
      ) : (
        <div className="space-y-2">
          {breakdown.map((row) => (
            <div key={row.queue || 'none'} className="flex items-center gap-2.5">
              <span className="w-32 shrink-0 truncate text-xs text-ink-600 dark:text-navy-300">{nameFor(row.queue)}</span>
              <div className="h-2 flex-1 rounded-full bg-ink-100 dark:bg-navy-800">
                <div
                  className="h-2 rounded-full bg-brand-500"
                  style={{ width: `${Math.max(4, (row.count / max) * 100)}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right text-xs font-medium text-ink-700 dark:text-navy-200">
                {row.count}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function OnlineAgentsWidget() {
  const agents = useSelector(selectDashboardAgents)
  const presenceByAgent = useSelector(selectPresenceByAgentId)

  // Roster (names, ids) comes from the dashboard fetch and barely changes,
  // but status/breaks come from the already-subscribed presence channel
  // (see useCentrifugeSubscription.js) — merging live here means this
  // widget updates instantly on a status change, no refetch needed at all.
  const withLiveStatus = agents.map((agent) => {
    const live = presenceByAgent[agent.id]
    return live ? { ...agent, status: live.status, breaks: live.breaks } : agent
  })
  const sorted = [...withLiveStatus].sort((a, b) => (a.status === 'ONLINE' ? -1 : 1) - (b.status === 'ONLINE' ? -1 : 1))
  const onlineCount = withLiveStatus.filter((a) => a.status === 'ONLINE').length

  return (
    <div className="rounded-xl border border-ink-100 bg-white p-4 dark:border-navy-800 dark:bg-navy-900">
      <h3 className="mb-3 flex items-center justify-between text-sm font-semibold text-ink-900 dark:text-white">
        Agents
        <span className="text-xs font-normal text-ink-400 dark:text-navy-500">
          {onlineCount} of {withLiveStatus.length} online
        </span>
      </h3>
      {withLiveStatus.length === 0 ? (
        <p className="text-xs text-ink-400 dark:text-navy-500">No agents yet.</p>
      ) : (
        <div className="max-h-72 space-y-1 overflow-y-auto scroll-thin">
          {sorted.map((agent) => {
            const online = agent.status === 'ONLINE'
            const onBreak = agent.breaks?.length > 0
            return (
              <div key={agent.id} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
                <Avatar name={agent.name} color="#219c89" size="sm" presence={online ? 'online' : 'offline'} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink-800 dark:text-navy-100">{agent.name}</p>
                  {onBreak && <p className="text-[11px] text-amber-500">On break</p>}
                </div>
                <Circle
                  className={`h-2 w-2 shrink-0 ${
                    online
                      ? onBreak
                        ? 'fill-amber-500 text-amber-500'
                        : 'fill-emerald-500 text-emerald-500'
                      : 'fill-ink-300 text-ink-300 dark:fill-navy-600 dark:text-navy-600'
                  }`}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function UnassignedModal() {
  const dispatch = useDispatch()
  const modal = useSelector(selectUnassignedModal)
  const realtimeSignal = useSelector(selectRealtimeSignal)

  useEffect(() => {
    if (modal.open) dispatch(fetchUnassigned(1))
  }, [modal.open, dispatch])

  // Keep the open modal's list current too — e.g. an agent picks up one of
  // the listed conversations while the admin has this open.
  useEffect(() => {
    if (modal.open) dispatch(fetchUnassigned(modal.page))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realtimeSignal])

  const totalPages = Math.max(1, Math.ceil(modal.total / modal.limit))

  return (
    <Modal open={modal.open} onClose={() => dispatch(closeUnassignedModal())} title="Unassigned conversations" size="lg">
      <div className="space-y-2">
        {modal.status === 'loading' && modal.items.length === 0 ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)
        ) : modal.items.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-400 dark:text-navy-500">
            Nothing unassigned in this range — nice.
          </p>
        ) : (
          modal.items.map((item) => (
            <div
              key={item._id}
              className="flex items-center justify-between rounded-lg border border-ink-100 px-3 py-2.5 dark:border-navy-800"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink-800 dark:text-navy-100">
                  {item.caller?.name || item.extension}
                </p>
                <p className="text-[11px] text-ink-400 dark:text-navy-500">
                  {channelLabel(item.channel?.toUpperCase?.())} · {formatFullDateTime(item.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}

        {modal.total > modal.limit && (
          <div className="flex items-center justify-between pt-2 text-xs text-ink-500 dark:text-navy-400">
            <span>
              Page {modal.page} of {totalPages}
            </span>
            <div className="flex gap-1.5">
              <button
                disabled={modal.page <= 1}
                onClick={() => dispatch(fetchUnassigned(modal.page - 1))}
                className="rounded-md border border-ink-200 px-2 py-1 disabled:opacity-40 dark:border-navy-700"
              >
                Prev
              </button>
              <button
                disabled={modal.page >= totalPages}
                onClick={() => dispatch(fetchUnassigned(modal.page + 1))}
                className="rounded-md border border-ink-200 px-2 py-1 disabled:opacity-40 dark:border-navy-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default function Analytics() {
  const dispatch = useDispatch()
  const filters = useSelector(selectDashboardFilters)
  const stats = useSelector(selectDashboardStats)
  const status = useSelector(selectDashboardStatus)
  const realtimeSignal = useSelector(selectRealtimeSignal)
  const debounceRef = useRef(null)

  useEffect(() => {
    dispatch(fetchDashboard())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, filters.from, filters.to, filters.channel, filters.queues, filters.agentId])

  // Live stat cards — any interaction/message event bumps this signal (see
  // useCentrifugeSubscription.js). Debounced so a burst of activity (a busy
  // few seconds) triggers one refetch, not one per event.
  useEffect(() => {
    if (realtimeSignal === 0) return undefined
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => dispatch(fetchDashboard()), 2500)
    return () => clearTimeout(debounceRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [realtimeSignal])

  return (
    <div className="h-full overflow-y-auto scroll-thin p-4 lg:p-6">
      <FilterBar />

      {status === 'loading' && !stats ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {STAT_CARDS.map(({ key, label, icon: Icon, tone, clickable }) => (
            <button
              key={key}
              onClick={() => clickable && dispatch(openUnassignedModal())}
              disabled={!clickable}
              className={`rounded-xl border border-ink-100 bg-white p-4 text-left dark:border-navy-800 dark:bg-navy-900 ${
                clickable ? 'cursor-pointer hover:border-ink-200 hover:shadow-sm dark:hover:border-navy-700' : ''
              }`}
            >
              <Icon className={`h-4 w-4 ${tone}`} />
              <p className="mt-2 text-2xl font-semibold text-ink-900 dark:text-white">{stats?.[key] ?? 0}</p>
              <p className="text-xs text-ink-500 dark:text-navy-400">{label}</p>
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <QueueBreakdownWidget />
        <OnlineAgentsWidget />
      </div>

      <UnassignedModal />
    </div>
  )
}