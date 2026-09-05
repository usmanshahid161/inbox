import { Search } from 'lucide-react'

const ASSIGNMENT_TABS = [
  { value: 'ALL', label: 'All' },
  { value: 'MINE', label: 'Mine' },
  { value: 'UNASSIGNED', label: 'Unassigned' }
]

export default function InboxFilters({
  search,
  onSearchChange,
  assignmentFilter,
  onAssignmentChange,
  statusFilter,
  onStatusChange,
  sort,
  onSortChange,
  unreadOnly,
  onUnreadOnlyChange
}) {
  return (
    <div className="space-y-3 border-b border-ink-100 px-3 pb-3 pt-3 dark:border-navy-800">
      {/* Search temporarily disabled — see ConversationList.jsx / New
          conversation button work. Commenting out rather than deleting
          so it's easy to bring back later.
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400 dark:text-navy-400" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search conversations"
          className="w-full rounded-lg border border-ink-200 bg-white py-2 pl-9 pr-3 text-sm text-ink-800 placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-navy-700 dark:bg-navy-800 dark:text-white dark:placeholder:text-navy-400"
        />
      </div>
      */}

      <div className="flex rounded-lg bg-ink-100 p-0.5 dark:bg-navy-800">
        {ASSIGNMENT_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onAssignmentChange(tab.value)}
            className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
              assignmentFilter === tab.value
                ? 'bg-white text-ink-900 shadow-sm dark:bg-navy-600 dark:text-white'
                : 'text-ink-500 hover:text-ink-800 dark:text-navy-300 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="flex-1 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-medium text-ink-700 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100"
        >
          <option value="ALL">All status</option>
          <option value="OPEN">Open</option>
          <option value="CLOSED">Closed</option>
        </select>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="flex-1 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-xs font-medium text-ink-700 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
        <label className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-ink-600 dark:text-navy-300">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => onUnreadOnlyChange(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-ink-300 text-brand-600 focus:ring-brand-400"
          />
          Unread
        </label>
      </div>
    </div>
  )
}
