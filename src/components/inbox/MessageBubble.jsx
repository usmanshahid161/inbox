import { Clock, Check, CheckCheck, AlertCircle, Link2, Reply, List as ListIcon } from 'lucide-react'
import AttachmentPreview from './AttachmentPreview'
import { formatClockTime } from '../../utils/formatters'
import { MESSAGE_STATUS } from '../../utils/constants'

const URL_REGEX = /(https?:\/\/[^\s]+)/

function StatusTick({ status }) {
  if (status === MESSAGE_STATUS.SENDING) return <Clock className="h-3 w-3 text-white/70" />
  if (status === MESSAGE_STATUS.FAILED) return <AlertCircle className="h-3 w-3 text-red-200" />
  if (status === MESSAGE_STATUS.READ) return <CheckCheck className="h-3 w-3 text-sky-200" />
  if (status === MESSAGE_STATUS.DELIVERED) return <CheckCheck className="h-3 w-3 text-white/70" />
  return <Check className="h-3 w-3 text-white/70" />
}

function LinkPreview({ url }) {
  let host = url
  try {
    host = new URL(url).hostname
  } catch {
    // leave as-is if not a valid absolute URL
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="mt-1.5 flex items-center gap-1.5 rounded-md bg-black/10 px-2.5 py-1.5 text-xs underline underline-offset-2"
    >
      <Link2 className="h-3 w-3 shrink-0" />
      <span className="truncate">{host}</span>
    </a>
  )
}

// Read-only rendering of the options a Buttons/List bot message offered —
// the agent is looking at history here, not tapping anything, so these are
// just labeled rows (WhatsApp's own look for reply buttons: a light footer
// strip under the body text, options divided by hairlines).
function InteractiveOptions({ messageType, options, isOutbound }) {
  if (!options?.length) return null
  const Icon = messageType === 'LIST' ? ListIcon : Reply

  return (
    <div
      className={`w-full ${
        isOutbound ? 'border-white/20 bg-white/10' : 'border-ink-100 bg-ink-50 dark:border-navy-700 dark:bg-navy-800/60'
      }`}
    >
      {options.map((opt, i) => (
        <div
          key={opt.id || i}
          className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium ${
            i > 0 ? `border-t ${isOutbound ? 'border-white/15' : 'border-ink-100 dark:border-navy-700'}` : ''
          } ${isOutbound ? 'text-white' : 'text-brand-600 dark:text-brand-400'}`}
        >
          <Icon className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{opt.title || opt}</span>
        </div>
      ))}
    </div>
  )
}

export default function MessageBubble({ message }) {
  const isOutbound = message.direction === 1
  const linkMatch = message.message?.match(URL_REGEX)
  const status = message?.status?.message

  const isInteractive = message.messageType === 'BUTTONS' || message.messageType === 'LIST'
  const options = message.messageType === 'BUTTONS' ? message.extraPayload?.buttons : message.extraPayload?.items

  return (
    <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[78%] flex-col gap-1 sm:max-w-[65%] ${isOutbound ? 'items-end' : 'items-start'}`}>
        {message.attachments?.map((att, idx) => (
          <div
            key={idx}
            className={`overflow-hidden rounded-2xl ${isOutbound ? 'rounded-br-md bg-brand-600 text-white' : 'rounded-bl-md bg-white text-ink-900 ring-1 ring-ink-100 dark:bg-navy-800 dark:text-white dark:ring-navy-700'} p-1`}
          >
            <AttachmentPreview attachment={att} />
          </div>
        ))}

        {message.message && (
          <div
            className={`overflow-hidden rounded-2xl text-sm leading-relaxed ${
              isOutbound
                ? 'rounded-br-md bg-brand-600 text-white'
                : 'rounded-bl-md bg-white text-ink-900 ring-1 ring-ink-100 dark:bg-navy-800 dark:text-white dark:ring-navy-700'
            } ${message.status === MESSAGE_STATUS.FAILED ? 'opacity-70' : ''}`}
          >
            <div className="px-3.5 py-2.5">
              <p className="whitespace-pre-wrap break-words">{message.message}</p>
              {linkMatch && <LinkPreview url={linkMatch[0]} />}
            </div>
            {isInteractive && (
              <InteractiveOptions messageType={message.messageType} options={options} isOutbound={isOutbound} />
            )}
          </div>
        )}

        <div className={`flex items-center gap-1 px-1 text-[11px] text-ink-400 dark:text-navy-400`}>
          <span>{formatClockTime(message.createdAt)}</span>
          {isOutbound && <StatusTickWrapper status={status} />}
          {status === MESSAGE_STATUS.FAILED && <span className="text-red-500">Failed to send</span>}
        </div>
      </div>
    </div>
  )
}

// Ticks render inline with the timestamp, which sits on light background —
// give them ink coloring there instead of the white used inside the bubble.
function StatusTickWrapper({ status }) {
  const icon =
    status === MESSAGE_STATUS.SENDING ? (
      <Clock className="h-3 w-3" />
    ) : status === MESSAGE_STATUS.FAILED ? (
      <AlertCircle className="h-3 w-3 text-red-500" />
    ) : status === MESSAGE_STATUS.READ ? (
      <CheckCheck className="h-3 w-3 text-brand-600" />
    ) : status === MESSAGE_STATUS.DELIVERED ? (
      <CheckCheck className="h-3 w-3" />
    ) : (
      <Check className="h-3 w-3" />
    )
  return icon
}
