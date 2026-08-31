import { MessageCircle, Instagram, Facebook, Music2 } from 'lucide-react'
import { CHANNEL_TYPE, CHANNEL_LABELS } from '../../utils/constants'

// Generic, non-trademarked glyphs stand in for each channel's brand mark —
// this keeps the UI legible without reproducing any platform's logo.
const CHANNEL_META = {
  [CHANNEL_TYPE.WHATSAPP]: { icon: MessageCircle, bg: 'bg-emerald-500' },
  [CHANNEL_TYPE.INSTAGRAM]: { icon: Instagram, bg: 'bg-fuchsia-500' },
  [CHANNEL_TYPE.MESSENGER]: { icon: Facebook, bg: 'bg-blue-500' },
  [CHANNEL_TYPE.TIKTOK]: { icon: Music2, bg: 'bg-ink-900' }
}

export default function ChannelIcon({ channel, size = 'md', className = '' }) {
  const meta = CHANNEL_META[channel] || { icon: MessageCircle, bg: 'bg-ink-400' }
  const Icon = meta.icon
  const sizes = { sm: 'h-4 w-4 p-0.5', md: 'h-5 w-5 p-1', lg: 'h-7 w-7 p-1.5' }
  const iconSizes = { sm: 'h-3 w-3', md: 'h-3 w-3', lg: 'h-4 w-4' }

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full text-white ring-2 ring-white ${meta.bg} ${sizes[size]} ${className}`}
      title={CHANNEL_LABELS[channel] || channel}
    >
      <Icon className={iconSizes[size]} />
    </span>
  )
}

export function channelLabel(channel) {
  return CHANNEL_LABELS[channel] || channel
}
