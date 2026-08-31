import { useMemo, useRef, useState } from 'react'
import { Search, ChevronDown, X, Check } from 'lucide-react'
import { useClickOutside } from '../../hooks/useClickOutside'

// Searchable multi-select for fields that can realistically have many
// options (agents, queues, teams, groups) — a wall of toggle-pills doesn't
// scale past a handful of items, this does via a search box + checklist.
export default function SearchableMultiSelect({
  label,
  options, // [{ id, label }]
  selected = [],
  onChange,
  placeholder = 'Search...',
  emptyLabel = 'Nothing to pick from yet.'
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef(null)

  useClickOutside(ref, () => {
    setOpen(false)
    setQuery('')
  })

  const selectedOptions = useMemo(
    () => options.filter((o) => selected.includes(o.id)),
    [options, selected]
  )

  const filteredOptions = useMemo(() => {
    if (!query.trim()) return options
    const q = query.toLowerCase()
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [options, query])

  const toggle = (id) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id])
  }

  const remove = (id) => onChange(selected.filter((s) => s !== id))

  return (
    <div className="space-y-1.5" ref={ref}>
      {label && <label className="text-xs font-medium text-ink-600 dark:text-navy-300">{label}</label>}

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-lg border border-ink-200 bg-white px-3 py-2 text-left text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
        >
          <span className={selected.length ? 'text-ink-700 dark:text-navy-200' : 'text-ink-400 dark:text-navy-500'}>
            {selected.length ? `${selected.length} selected` : placeholder}
          </span>
          <ChevronDown className={`h-4 w-4 shrink-0 text-ink-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute z-40 mt-1.5 w-full rounded-lg border border-ink-100 bg-white shadow-popover animate-slide-up dark:border-navy-700 dark:bg-navy-800">
            <div className="flex items-center gap-2 border-b border-ink-100 px-2.5 py-2 dark:border-navy-700">
              <Search className="h-3.5 w-3.5 shrink-0 text-ink-400" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="w-full bg-transparent text-sm focus:outline-none dark:text-white"
              />
            </div>

            <div className="max-h-52 overflow-y-auto scroll-thin py-1">
              {filteredOptions.length === 0 ? (
                <p className="px-3 py-3 text-center text-xs text-ink-400 dark:text-navy-500">
                  {options.length === 0 ? emptyLabel : 'No matches.'}
                </p>
              ) : (
                filteredOptions.map((opt) => {
                  const checked = selected.includes(opt.id)
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => toggle(opt.id)}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-ink-50 dark:hover:bg-navy-700"
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          checked
                            ? 'border-brand-500 bg-brand-500 text-white'
                            : 'border-ink-300 dark:border-navy-600'
                        }`}
                      >
                        {checked && <Check className="h-3 w-3" />}
                      </span>
                      <span className="truncate text-ink-700 dark:text-navy-200">{opt.label}</span>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>

      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {selectedOptions.map((opt) => (
            <span
              key={opt.id}
              className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2 py-1 text-xs font-medium text-ink-700 dark:bg-navy-700 dark:text-navy-200"
            >
              {opt.label}
              <button
                type="button"
                onClick={() => remove(opt.id)}
                className="rounded-full p-0.5 hover:bg-ink-200 dark:hover:bg-navy-600"
                aria-label={`Remove ${opt.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
