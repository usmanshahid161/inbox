import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Search, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  fetchContacts,
  selectContacts,
  selectContactsMeta,
  setContactsSearch,
  setContactsChannelFilter,
  setContactsPage
} from '../features/contacts/contactsSlice'
import { useDebounce } from '../hooks/useDebounce'
import Avatar from '../components/common/Avatar'
import ChannelIcon, { channelLabel } from '../components/common/ChannelIcon'
import Badge from '../components/common/Badge'
import EmptyState from '../components/common/EmptyState'
import { Skeleton } from '../components/common/Loader'
import { CHANNEL_TYPE } from '../utils/constants'
import { formatRelativeTime } from '../utils/formatters'

export default function Contacts() {
  const dispatch = useDispatch()
  const contacts = useSelector(selectContacts)
  const { search, channelFilter, page, pageSize, total, status } = useSelector(selectContactsMeta)
  const [localSearch, setLocalSearch] = useState(search)
  const debouncedSearch = useDebounce(localSearch, 300)

  useEffect(() => {
    dispatch(setContactsSearch(debouncedSearch))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch])

  useEffect(() => {
    dispatch(fetchContacts())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, channelFilter, page])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="h-full overflow-y-auto scroll-thin p-4 lg:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400 dark:text-navy-400" />
          <input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search name, email, or phone"
            className="w-full rounded-lg border border-ink-200 bg-white py-2 pl-9 pr-3 text-sm text-ink-800 placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-navy-700 dark:bg-navy-800 dark:text-white dark:placeholder:text-navy-400"
          />
        </div>
        <select
          value={channelFilter}
          onChange={(e) => dispatch(setContactsChannelFilter(e.target.value))}
          className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-700 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-100"
        >
          <option value="ALL">All channels</option>
          {Object.values(CHANNEL_TYPE).map((c) => (
            <option key={c} value={c}>
              {channelLabel(c)}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-ink-100 bg-white dark:border-navy-800 dark:bg-navy-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink-100 bg-ink-50 text-xs uppercase tracking-wide text-ink-500 dark:border-navy-800 dark:bg-navy-800/60 dark:text-navy-400">
            <tr>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Channel</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Phone</th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell">Last interaction</th>
              <th className="hidden px-4 py-3 font-medium xl:table-cell">Tags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100 dark:divide-navy-800">
            {status === 'loading' &&
              contacts.length === 0 &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3" colSpan={5}>
                    <Skeleton className="h-6 w-full" />
                  </td>
                </tr>
              ))}

            {contacts.map((contact) => (
              <tr key={contact.id} className="hover:bg-ink-50 dark:hover:bg-navy-800/60">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={contact.name} color="#219c89" size="sm" />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink-900 dark:text-white">{contact.name}</p>
                      <p className="truncate text-xs text-ink-500 dark:text-navy-400">{contact.email}</p>
                    </div>
                  </div>
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <div className="flex items-center gap-1.5 text-ink-600 dark:text-navy-300">
                    <ChannelIcon channel={contact.channel} size="sm" />
                    {channelLabel(contact.channel)}
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-ink-600 dark:text-navy-300 md:table-cell">{contact.phone}</td>
                <td className="hidden px-4 py-3 text-ink-500 dark:text-navy-400 lg:table-cell">
                  {formatRelativeTime(contact.lastInteractionAt)} ago
                </td>
                <td className="hidden px-4 py-3 xl:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {contact.tags.length === 0 && <span className="text-xs text-ink-300 dark:text-navy-600">&mdash;</span>}
                    {contact.tags.map((tag) => (
                      <Badge key={tag} tone="neutral">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {status !== 'loading' && contacts.length === 0 && (
          <EmptyState icon={Users} title="No contacts found" description="Try a different search term or channel filter." />
        )}
      </div>

      {total > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-ink-500 dark:text-navy-400">
          <span>
            Showing {(page - 1) * pageSize + 1}&ndash;{Math.min(page * pageSize, total)} of {total}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => dispatch(setContactsPage(Math.max(1, page - 1)))}
              disabled={page <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-200 text-ink-500 hover:bg-ink-50 disabled:opacity-40 dark:border-navy-700 dark:text-navy-300 dark:hover:bg-navy-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-1 text-xs">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => dispatch(setContactsPage(Math.min(totalPages, page + 1)))}
              disabled={page >= totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-200 text-ink-500 hover:bg-ink-50 disabled:opacity-40 dark:border-navy-700 dark:text-navy-300 dark:hover:bg-navy-800"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
