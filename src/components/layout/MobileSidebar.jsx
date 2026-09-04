import { NavLink } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Inbox, Users, Radio, Headphones, BarChart3, Settings, LogOut, X, MessageSquare, LayoutTemplate, Workflow, TagIcon, ListOrdered, UsersRound, Network, UserCog, MessageSquareText, Coffee, Megaphone, Contact2 } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { closeMobileSidebar, selectIsMobileSidebarOpen } from '../../features/ui/uiSlice'
import Avatar from '../common/Avatar'

const NAV_ITEMS = [
  { to: '/app/inbox', label: 'Inbox', icon: Inbox, agentOnly: true },
  { to: '/app/contacts', label: 'Contacts', icon: Users },
  { to: '/app/channels', label: 'Channels', icon: Radio, adminOnly: true },
  { to: '/app/agents', label: 'Agents', icon: Headphones, adminOnly: true },
  { to: '/app/analytics', label: 'Analytics', icon: BarChart3, adminOnly: true },
  { to: '/app/templates', label: 'Templates', icon: LayoutTemplate, adminOnly: true },
  { to: '/app/campaigns', label: 'Campaigns', icon: Megaphone, adminOnly: true },
  { to: '/app/contact-lists', label: 'Contact Lists', icon: Contact2, adminOnly: true },
  { to: '/app/flows', label: 'Flow Builder', icon: Workflow, adminOnly: true },
  { to: '/app/admin/tags', label: 'Tags', icon: TagIcon, adminOnly: true },
  { to: '/app/admin/queues', label: 'Queues', icon: ListOrdered, adminOnly: true },
  { to: '/app/admin/groups', label: 'Groups', icon: UsersRound, adminOnly: true },
  { to: '/app/admin/teams', label: 'Teams', icon: Network, adminOnly: true },
  { to: '/app/admin/agents', label: 'Manage Agents', icon: UserCog, adminOnly: true },
  { to: '/app/admin/quick-replies', label: 'Quick Replies', icon: MessageSquareText, adminOnly: true },
  { to: '/app/admin/break-types', label: 'Break Types', icon: Coffee, adminOnly: true },
  { to: '/app/settings', label: 'Settings', icon: Settings }
]

export default function MobileSidebar() {
  const dispatch = useDispatch()
  const open = useSelector(selectIsMobileSidebarOpen)
  const { user, tenant, isAdmin, logout } = useAuth()
  const items = NAV_ITEMS.filter((item) => {
    if (item.adminOnly && !isAdmin) return false
    if (item.agentOnly && isAdmin) return false
    return true
  })

  if (!open) return null

  const close = () => dispatch(closeMobileSidebar())

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={close} />
      <div className="relative flex h-full w-72 flex-col bg-navy-950 shadow-popover animate-slide-up">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white">
              <MessageSquare className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{tenant?.name}</p>
              <p className="truncate text-xs text-navy-300">Omnichannel desk</p>
            </div>
          </div>
          <button onClick={close} className="rounded-md p-1.5 text-navy-300 hover:bg-navy-800" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={close}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${
                  isActive ? 'bg-navy-700/60 text-white' : 'text-navy-300 hover:bg-navy-800 hover:text-white'
                }`
              }
            >
              <Icon className="h-4.5 w-4.5" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-navy-800 p-3">
          <div className="flex items-center gap-2.5 px-1 py-1.5">
            <Avatar name={user?.name} color="#219c89" size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user?.name}</p>
              <p className="truncate text-[11px] font-medium uppercase tracking-wide text-navy-400">
                {user?.role === 'ADMIN' ? 'Admin' : 'Agent'}
              </p>
            </div>
            <button onClick={logout} className="rounded-md p-1.5 text-navy-400 hover:bg-navy-800 hover:text-white" aria-label="Log out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}