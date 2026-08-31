import { useDispatch, useSelector } from 'react-redux'
import { Search, RefreshCw, Plus } from 'lucide-react'
import {
  selectTemplatesFilters,
  selectTemplateCounts,
  setSearchFilter,
  setStatusFilter,
  setCategoryFilter,
  openCreateForm,
  syncTemplateStatuses,
} from '../../features/templates/templatesSlice'
import { CATEGORIES, STATUS_LIST } from '../../features/templates/waConstants'

export default function TemplateFilters() {
  const dispatch = useDispatch()
  const filters = useSelector(selectTemplatesFilters)
  const counts = useSelector(selectTemplateCounts)

  return (
    <div className="flex flex-col gap-3 border-b border-ink-100 p-4 dark:border-navy-800 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            value={filters?.search}
            onChange={(e) => dispatch(setSearchFilter(e.target.value))}
            placeholder="Search templates..."
            className="w-full rounded-lg border border-ink-200 bg-white py-2 pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-navy-700 dark:bg-navy-900 dark:text-ink-50"
          />
        </div>

        <select
          value={filters?.status}
          onChange={(e) => dispatch(setStatusFilter(e?.target?.value))}
          className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-navy-700 dark:bg-navy-900 dark:text-ink-200"
        >
          <option value="ALL">All statuses ({counts?.ALL || 0})</option>
          {STATUS_LIST?.length > 0 && STATUS_LIST?.map((s) => (
            <option key={s?.value} value={s?.value}>
              {s?.label} ({ counts && counts[s?.value] || 0})
            </option>
          ))}
        </select>

        {/*<select*/}
        {/*  value={filters?.category}*/}
        {/*  onChange={(e) => dispatch(setCategoryFilter(e.target.value))}*/}
        {/*  className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-700 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-navy-700 dark:bg-navy-900 dark:text-ink-200"*/}
        {/*>*/}
        {/*  <option value="ALL">All categories</option>*/}
        {/*  {CATEGORIES?.map((c) => (*/}
        {/*    <option key={c.value} value={c.value}>*/}
        {/*      {c.label}*/}
        {/*    </option>*/}
        {/*  ))}*/}
        {/*</select>*/}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => dispatch(syncTemplateStatuses())}
          className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50 dark:border-navy-700 dark:text-ink-300 dark:hover:bg-navy-800"
          title="Refresh statuses from WhatsApp"
        >
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Sync</span>
        </button>
        <button
          onClick={() => dispatch(openCreateForm())}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          New template
        </button>
      </div>
    </div>
  )
}
