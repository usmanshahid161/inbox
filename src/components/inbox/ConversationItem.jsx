import { MessageCircle, Instagram, Facebook, Music2 } from 'lucide-react'
import Avatar from '../common/Avatar'
import { formatRelativeTime, truncate } from '../../utils/formatters'
import { INTERACTION_STATUS, CHANNEL_TYPE } from '../../utils/constants'

const CHANNEL_ICON = {
  [CHANNEL_TYPE.WHATSAPP]: { icon: MessageCircle, className: 'text-emerald-500' },
  [CHANNEL_TYPE.INSTAGRAM]: { icon: Instagram, className: 'text-fuchsia-500' },
  [CHANNEL_TYPE.MESSENGER]: { icon: Facebook, className: 'text-blue-500' },
  [CHANNEL_TYPE.TIKTOK]: { icon: Music2, className: 'text-ink-900 dark:text-white' }
}

const STATUS_DOT = {
  [INTERACTION_STATUS.OPEN]: 'bg-emerald-500',
  [INTERACTION_STATUS.PENDING]: 'bg-amber-500',
  [INTERACTION_STATUS.CLOSED]: 'bg-ink-300 dark:bg-navy-600'
}

export default function ConversationItem({ interaction, active, onClick }) {
  const { caller, channel, lastMessage, unreadCount, status, participants, connect } = interaction
  const assignedAgent = participants.length > 0 && participants.filter(participant => participant?.role !== "customer" && !!participant?.status)
  const isUnread = unreadCount > 0
  const ChannelMeta = CHANNEL_ICON[channel] || CHANNEL_ICON[CHANNEL_TYPE.WHATSAPP]
  const ChannelGlyph = ChannelMeta.icon

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-start gap-3 border-b border-ink-50 px-3 py-3 text-left transition-colors dark:border-navy-800 ${
        active ? 'bg-brand-50 dark:bg-navy-800' : 'hover:bg-ink-50 dark:hover:bg-navy-800/60'
      }`}
    >
      <Avatar name={caller.name} color="#219c89" presence={caller.online ? 'ONLINE' : undefined} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5">
            <p
              className={`truncate text-sm ${
                isUnread ? 'font-semibold text-ink-900 dark:text-white' : 'font-medium text-ink-800 dark:text-navy-100'
              }`}
            >
              {caller.name}
            </p>
            <ChannelGlyph className={`h-3.5 w-3.5 shrink-0 ${ChannelMeta.className}`} />
          </span>
          <span className="shrink-0 text-[11px] text-ink-400 dark:text-navy-400">
            {formatRelativeTime(lastMessage?.createdAt)}
          </span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className={`truncate text-xs ${isUnread ? 'font-medium text-ink-700 dark:text-navy-100' : 'text-ink-500 dark:text-navy-400'}`}>
            {lastMessage?.direction === 1 && <span className="text-ink-400 dark:text-navy-500">You: </span>}
            {truncate(lastMessage?.message, 42)}
          </p>
          {isUnread && (
            <span className="flex h-4.5 min-w-[1.125rem] shrink-0 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-semibold text-white">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} />
          <span className="text-[11px] text-ink-400 dark:text-navy-400">
            {status === INTERACTION_STATUS.OPEN ? 'Open' : status === INTERACTION_STATUS.PENDING ? 'Pending' : 'Closed'}
            {connect && assignedAgent ? `\u00b7 ${assignedAgent[0]?.name} + ${assignedAgent?.length > 1 ? " + more" : ""}` : ' \u00b7 Unassigned'}
          </span>
        </div>
      </div>
    </button>
  )
}
