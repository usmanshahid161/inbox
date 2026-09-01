import { useSelector } from 'react-redux'
import { UserCheck, LogIn, LogOut, XCircle, ArrowRightLeft, Users, Clock } from 'lucide-react'
import { selectMessagesForInteraction } from '../../features/messages/messagesSlice'
import { formatFullDateTime } from '../../utils/formatters'

// A light keyword match on the notice text to pick a nicer icon per event
// — the backend only ever sends a plain sentence (see systemMessage.js /
// interactionRequests.js), there's no structured event type to switch on.
function iconFor(text = '') {
  const t = text.toLowerCase()
  if (t.includes('assign')) return UserCheck
  if (t.includes('join')) return LogIn
  if (t.includes('left')) return LogOut
  if (t.includes('close')) return XCircle
  if (t.includes('transfer')) return ArrowRightLeft
  if (t.includes('share')) return Users
  return Clock
}

export default function InteractionHistoryTab({ interaction }) {
  const messages = useSelector((state) => selectMessagesForInteraction(state, interaction?._id))
  const events = messages
    .filter((m) => m.messageType === 'notification')
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))

  if (events.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <p className="text-center text-xs text-ink-400 dark:text-navy-500">
          Nothing's happened on this conversation yet — assign, transfer or close events will show up here.
        </p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto scroll-thin p-4">
      <ol className="relative space-y-4 border-l border-ink-100 pl-4 dark:border-navy-800">
        {events.map((event) => {
          const Icon = iconFor(event.message)
          return (
            <li key={event._id} className="relative">
              <span className="absolute -left-[21px] flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 text-brand-600 ring-4 ring-white dark:bg-brand-900/30 dark:text-brand-300 dark:ring-navy-900">
                <Icon className="h-3 w-3" />
              </span>
              <p className="text-xs text-ink-700 dark:text-navy-200">{event.message}</p>
              <p className="mt-0.5 text-[11px] text-ink-400 dark:text-navy-500">{formatFullDateTime(event.createdAt)}</p>
            </li>
          )
        })}
      </ol>
    </div>
  )
}