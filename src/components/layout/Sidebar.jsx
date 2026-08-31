import { NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Inbox, Users, Radio, Headphones, BarChart3, Settings, LogOut, MessageSquare, LayoutTemplate, Workflow, TagIcon, ListOrdered, UsersRound, Network, UserCog, MessageSquareText, Coffee } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { selectTotalUnreadCount } from '../../features/interactions/interactionsSlice'
import Avatar from '../common/Avatar'

const NAV_ITEMS = [
  // Agent-only — admins don't work conversations, so Inbox is hidden from
  // them entirely (matches the route guard on /app/inbox — see RoleRoute).
  { to: '/app/inbox', label: 'Inbox', icon: Inbox, showUnread: true, agentOnly: true },
  { to: '/app/contacts', label: 'Contacts', icon: Users },
  { to: '/app/channels', label: 'Channels', icon: Radio, adminOnly: true },
  { to: '/app/agents', label: 'Agents', icon: Headphones, adminOnly: true },
  { to: '/app/analytics', label: 'Analytics', icon: BarChart3, adminOnly: true },
  { to: '/app/templates', label: 'Templates', icon: LayoutTemplate, adminOnly: true },
  { to: '/app/flows', label: 'Flow Builder', icon: Workflow, adminOnly: true },
  { to: '/app/admin/tags', label: 'Tags', icon: TagIcon, adminOnly: true },
  { to: '/app/admin/queues', label: 'Queues', icon: ListOrdered, adminOnly: true },
  { to: '/app/admin/groups', label: 'Groups', icon: UsersRound, adminOnly: true },
  { to: '/app/admin/teams', label: 'Teams', icon: Network, adminOnly: true },
  { to: '/app/admin/agents', label: 'Manage Agents', icon: UserCog, adminOnly: true },
  { to: '/app/admin/quick-replies', label: 'Quick Replies', icon: MessageSquareText, adminOnly: true },
  { to: '/app/admin/break-types', label: 'Break Types', icon: Coffee, adminOnly: true },
  { to: '/app/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const { user, tenant, isAdmin, logout } = useAuth()
  const unreadCount = useSelector(selectTotalUnreadCount)
  const items = NAV_ITEMS.filter((item) => {
    if (item.adminOnly && !isAdmin) return false
    if (item.agentOnly && isAdmin) return false
    return true
  })

  return (
    <aside className="hidden w-60 shrink-0 flex-col bg-navy-950 lg:flex">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white shadow-panel">
          <MessageSquare className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{tenant?.name || 'Workspace'}</p>
          <p className="truncate text-xs text-navy-300">Omnichannel desk</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto scroll-thin px-3 py-2">
        {items.map(({ to, label, icon: Icon, showUnread }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive ? 'bg-navy-700/60 text-white' : 'text-navy-300 hover:bg-navy-800 hover:text-white'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            <span className="flex-1">{label}</span>
            {showUnread && unreadCount > 0 && (
              <span className="rounded-full bg-brand-500 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-navy-800 p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-1 py-1.5">
          <Avatar name={user?.name} color="#219c89" size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{user?.name}</p>
            <p className="truncate text-[11px] font-medium uppercase tracking-wide text-navy-400">
              {user?.role === 'ADMIN' ? 'Admin' : 'Agent'}
            </p>
          </div>
          <button
            onClick={logout}
            className="rounded-md p-1.5 text-navy-400 hover:bg-navy-800 hover:text-white"
            title="Log out"
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}