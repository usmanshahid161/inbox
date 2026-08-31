import { useSelector } from 'react-redux'
import { Users, ListOrdered, Clock, Phone, Hash, Info } from 'lucide-react'
import Dropdown from '../common/Dropdown'
import { selectQueueById } from '../../features/queues/queuesSlice'
import { channelLabel } from '../common/ChannelIcon'
import { formatFullDateTime } from '../../utils/formatters'

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5 px-3 py-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400 dark:text-navy-500" />
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-ink-400 dark:text-navy-500">{label}</p>
        <p className="truncate text-sm text-ink-800 dark:text-navy-100">{value}</p>
      </div>
    </div>
  )
}

export default function ConversationInfoPopover({ interaction }) {
  const queue = useSelector((state) => selectQueueById(state, interaction?.queue))
  const activeParticipants = (interaction?.participants || []).filter((p) => p.status)

  // Participants mix the customer (added as the first participant when the
  // interaction is created) and agents (added on assign/transfer/share) —
  // labeled here so it's obvious who's who at a glance, not just names.
  const roleLabel = (p) => {
    if (interaction?.caller?.id && String(p.id) === String(interaction.caller.id)) return 'Customer'
    if (p.isAdmin) return 'Admin'
    if (p.role) return p.role.charAt(0).toUpperCase() + p.role.slice(1).toLowerCase()
    return 'Agent'
  }

  return (
    <Dropdown
      align="right"
      className="w-72 py-1"
      trigger={() => (
        <button
          className="rounded-full p-1.5 text-ink-500 hover:bg-ink-100 dark:text-navy-300 dark:hover:bg-navy-800"
          title="Conversation info"
        >
          <Info className="h-4 w-4" />
        </button>
      )}
    >
      <p className="border-b border-ink-100 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-ink-400 dark:border-navy-700 dark:text-navy-500">
        Conversation info
      </p>

      <div className="divide-y divide-ink-100 dark:divide-navy-700">
        <div className="px-3 py-2">
          <p className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-wide text-ink-400 dark:text-navy-500">
            <Users className="h-3.5 w-3.5" />
            Active participants
          </p>
          {activeParticipants.length === 0 ? (
            <p className="text-sm text-ink-400 dark:text-navy-500">No agent assigned yet</p>
          ) : (
            <ul className="space-y-1">
              {activeParticipants.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 text-sm text-ink-800 dark:text-navy-100">
                  <span className="truncate">{p.name || p.id}</span>
                  <span
                    className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                      roleLabel(p) === 'Customer'
                        ? 'bg-ink-100 text-ink-600 dark:bg-navy-700 dark:text-navy-300'
                        : roleLabel(p) === 'Admin'
                        ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                    }`}
                  >
                    {roleLabel(p)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Row icon={ListOrdered} label="Queue" value={queue?.name || '—'} />
        <Row
          icon={Phone}
          label={`${channelLabel(interaction?.channel?.toUpperCase?.())} number`}
          value={interaction?.extension || '—'}
        />
        <Row
          icon={Clock}
          label="Interaction created"
          value={interaction?.createdAt ? formatFullDateTime(interaction.createdAt) : '—'}
        />
        {interaction?._id && <Row icon={Hash} label="Interaction ID" value={interaction._id} />}
      </div>
    </Dropdown>
  )
}
