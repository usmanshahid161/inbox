import { useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Menu, Wifi, WifiOff, Loader2, Moon, Sun } from 'lucide-react'
import { openMobileSidebar, selectConnectionState, selectTheme, toggleTheme } from '../../features/ui/uiSlice'
import { useAuth } from '../../hooks/useAuth'
import Avatar from '../common/Avatar'
import BreakControl from './BreakControl'

const TITLES = {
  '/app/inbox': { title: 'Inbox', subtitle: 'All customer conversations' },
  '/app/contacts': { title: 'Contacts', subtitle: 'Everyone who has messaged you' },
  '/app/channels': { title: 'Channels', subtitle: 'Connected messaging channels' },
  '/app/agents': { title: 'Agents', subtitle: 'Manage your support team' },
  '/app/analytics': { title: 'Analytics', subtitle: 'Team performance at a glance' },
  '/app/settings': { title: 'Settings', subtitle: 'Workspace and account preferences' }
}

function ConnectionPill() {
  const state = useSelector(selectConnectionState)

  const styles = {
    connected: { icon: Wifi, label: 'Live', className: 'border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400' },
    connecting: { icon: Loader2, label: 'Reconnecting', className: 'border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-400' },
    disconnected: { icon: WifiOff, label: 'Offline', className: 'border-ink-200 text-ink-500 dark:border-navy-700 dark:text-navy-300' }
  }
  const { icon: Icon, label, className } = styles[state] || styles.disconnected

  return (
    <span className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium sm:flex ${className}`}>
      <Icon className={`h-3.5 w-3.5 ${state === 'connecting' ? 'animate-spin' : ''}`} />
      {label}
    </span>
  )
}

export default function Header({ title, subtitle }) {
  const dispatch = useDispatch()
  const location = useLocation()
  const theme = useSelector(selectTheme)
  const { user } = useAuth()
  const resolved = TITLES[location.pathname] || { title: title || 'Threadline', subtitle }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-ink-100 bg-white px-4 dark:border-navy-800 dark:bg-navy-900 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => dispatch(openMobileSidebar())}
          className="rounded-md p-1.5 text-ink-500 hover:bg-ink-100 dark:text-navy-300 dark:hover:bg-navy-800 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-ink-900 dark:text-white">{resolved.title}</h1>
          {resolved.subtitle && <p className="text-xs text-ink-500 dark:text-navy-300">{resolved.subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          onClick={() => dispatch(toggleTheme())}
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-500 hover:bg-ink-100 dark:text-navy-300 dark:hover:bg-navy-800"
          aria-label="Toggle dark mode"
          title="Toggle dark mode"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <ConnectionPill />
        <BreakControl />
        <Avatar name={user?.name} color="#219c89" size="sm" />
      </div>
    </header>
  )
}
