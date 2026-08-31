import { useNavigate } from 'react-router-dom'
import { ChevronRight, Clock } from 'lucide-react'
import ChannelIcon, { channelLabel } from '../components/common/ChannelIcon'
import Badge from '../components/common/Badge'
import { CHANNEL_TYPE } from '../utils/constants'

// Channel types we support today, plus the ones coming later. Only WhatsApp
// has a management screen right now — the rest are shown but disabled so
// the menu doesn't need to change shape when they're switched on.
const CHANNEL_MENU = [
  { type: CHANNEL_TYPE.WHATSAPP, to: '/app/channels/whatsapp', available: true },
  { type: CHANNEL_TYPE.INSTAGRAM, available: false },
  { type: CHANNEL_TYPE.MESSENGER, available: false },
  { type: CHANNEL_TYPE.TIKTOK, available: false }
]

export default function Channels() {
  const navigate = useNavigate()

  return (
    <div className="h-full overflow-y-auto scroll-thin p-4 lg:p-6">
      <div className="mb-4">
        <h1 className="text-base font-semibold text-ink-900 dark:text-white">Channels</h1>
        <p className="text-xs text-ink-500 dark:text-navy-400">
          Pick a channel to configure the numbers or accounts connected to it.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {CHANNEL_MENU.map(({ type, to, available }) => (
          <button
            key={type}
            disabled={!available}
            onClick={() => available && navigate(to)}
            className={`flex items-center justify-between gap-3 rounded-xl border border-ink-100 bg-white p-4 text-left transition-colors dark:border-navy-800 dark:bg-navy-900 ${
              available
                ? 'hover:border-brand-300 hover:shadow-panel dark:hover:border-brand-600'
                : 'cursor-not-allowed opacity-60'
            }`}
          >
            <div className="flex items-center gap-3">
              <ChannelIcon channel={type} size="lg" />
              <div>
                <p className="text-sm font-semibold text-ink-900 dark:text-white">{channelLabel(type)}</p>
                {available ? (
                  <p className="text-xs text-ink-500 dark:text-navy-400">Manage connected numbers</p>
                ) : (
                  <Badge tone="neutral" className="mt-1">
                    <Clock className="h-3 w-3" />
                    Coming soon
                  </Badge>
                )}
              </div>
            </div>
            {available && <ChevronRight className="h-4 w-4 shrink-0 text-ink-300 dark:text-navy-600" />}
          </button>
        ))}
      </div>
    </div>
  )
}
