import { getInitials } from '../../utils/formatters'

const SIZES = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-11 w-11 text-base'
}

const PRESENCE_COLOR = {
  ONLINE: 'bg-emerald-500',
  AWAY: 'bg-amber-500',
  OFFLINE: 'bg-ink-300'
}

export default function Avatar({ name, src, color = '#279a89', size = 'md', presence, className = '' }) {
  return (
    <span className={`relative inline-flex shrink-0 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${SIZES[size]} rounded-full object-cover ring-1 ring-black/5`}
        />
      ) : (
        <span
          className={`${SIZES[size]} flex items-center justify-center rounded-full font-medium text-white ring-1 ring-black/5`}
          style={{ backgroundColor: color }}
        >
          {getInitials(name)}
        </span>
      )}
      {presence && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-navy-900 ${PRESENCE_COLOR[presence]}`}
          aria-label={presence.toLowerCase()}
        />
      )}
    </span>
  )
}
