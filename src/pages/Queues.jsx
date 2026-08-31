import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, MoreVertical, Trash2, Pencil, ListOrdered } from 'lucide-react'
import Button from '../components/common/Button'
import Dropdown, { DropdownItem } from '../components/common/Dropdown'
import EmptyState from '../components/common/EmptyState'
import { Skeleton } from '../components/common/Loader'
import { useDebounce } from '../hooks/useDebounce'
import {
  fetchQueues,
  deleteQueue,
  setQueueSearch,
  selectFilteredQueues,
  selectQueuesStatus
} from '../features/queues/queuesSlice'
import { openConfirmDialog, showToast } from '../features/ui/uiSlice'

export default function Queues() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const queues = useSelector(selectFilteredQueues)
  const status = useSelector(selectQueuesStatus)
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 300)

  useEffect(() => {
    dispatch(fetchQueues())
  }, [dispatch])

  useEffect(() => {
    dispatch(setQueueSearch(debouncedSearch))
  }, [debouncedSearch, dispatch])

  const handleDelete = (queue) => {
    dispatch(
      openConfirmDialog({
        title: 'Delete queue',
        description: `"${queue.name}" will be removed. Agents and teams assigned to it will lose that routing until reassigned.`,
        confirmLabel: 'Delete',
        tone: 'danger',
        onConfirm: () => {
          dispatch(deleteQueue(queue._id)).then((res) => {
            if (!res.error) dispatch(showToast({ message: 'Queue deleted', tone: 'default' }))
          })
        }
      })
    )
  }

  return (
    <div className="h-full overflow-y-auto scroll-thin p-4 lg:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search queues..."
            className="w-full rounded-lg border border-ink-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
          />
        </div>
        <Button icon={Plus} onClick={() => navigate('/app/admin/queues/new')}>
          New queue
        </Button>
      </div>

      {status === 'loading' && queues.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      ) : queues.length === 0 ? (
        <EmptyState
          icon={ListOrdered}
          title="No queues yet"
          description="Queues group incoming conversations for routing to teams and agents."
          action={
            <Button icon={Plus} onClick={() => navigate('/app/admin/queues/new')}>
              New queue
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-ink-100 bg-white dark:border-navy-800 dark:bg-navy-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-xs uppercase tracking-wide text-ink-500 dark:border-navy-800 dark:bg-navy-800/60 dark:text-navy-400">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Queue</th>
                <th className="px-4 py-3 font-medium">Identifier</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Description</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 dark:divide-navy-800">
              {queues.map((queue) => (
                <tr key={queue._id} className="hover:bg-ink-50 dark:hover:bg-navy-800/60">
                  <td className="px-4 py-3 text-ink-400 dark:text-navy-500">{queue.queueNumber ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
                        <ListOrdered className="h-3.5 w-3.5" />
                      </span>
                      <p className="font-medium text-ink-900 dark:text-white">{queue.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-ink-100 px-2 py-1 font-mono text-xs text-ink-600 dark:bg-navy-800 dark:text-navy-300">
                      {queue.slug}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-ink-500 dark:text-navy-400 sm:table-cell">
                    {queue.description || '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Dropdown
                      align="right"
                      trigger={() => (
                        <button className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 dark:text-navy-400 dark:hover:bg-navy-800">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      )}
                    >
                      <DropdownItem icon={Pencil} onClick={() => navigate(`/app/admin/queues/${queue._id}`)}>
                        Edit
                      </DropdownItem>
                      <DropdownItem icon={Trash2} danger onClick={() => handleDelete(queue)}>
                        Delete
                      </DropdownItem>
                    </Dropdown>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
