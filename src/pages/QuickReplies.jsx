import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, MoreVertical, Trash2, Pencil, MessageSquareText } from 'lucide-react'
import Button from '../components/common/Button'
import Dropdown, { DropdownItem } from '../components/common/Dropdown'
import EmptyState from '../components/common/EmptyState'
import { Skeleton } from '../components/common/Loader'
import { useDebounce } from '../hooks/useDebounce'
import {
  fetchQuickReplies,
  deleteQuickReply,
  setQuickReplySearch,
  selectFilteredQuickReplies,
  selectQuickRepliesStatus
} from '../features/quickReplies/quickRepliesSlice'
import { openConfirmDialog, showToast } from '../features/ui/uiSlice'

export default function QuickReplies() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const replies = useSelector(selectFilteredQuickReplies)
  const status = useSelector(selectQuickRepliesStatus)
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 300)

  useEffect(() => {
    dispatch(fetchQuickReplies())
  }, [dispatch])

  useEffect(() => {
    dispatch(setQuickReplySearch(debouncedSearch))
  }, [debouncedSearch, dispatch])

  const handleDelete = (reply) => {
    dispatch(
      openConfirmDialog({
        title: 'Delete quick reply',
        description: `"${reply.title}" will no longer be available to agents in the composer.`,
        confirmLabel: 'Delete',
        tone: 'danger',
        onConfirm: () => {
          dispatch(deleteQuickReply(reply._id)).then((res) => {
            if (!res.error) dispatch(showToast({ message: 'Quick reply deleted', tone: 'default' }))
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
            placeholder="Search quick replies..."
            className="w-full rounded-lg border border-ink-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
          />
        </div>
        <Button icon={Plus} onClick={() => navigate('/app/admin/quick-replies/new')}>
          New quick reply
        </Button>
      </div>

      {status === 'loading' && replies.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : replies.length === 0 ? (
        <EmptyState
          icon={MessageSquareText}
          title="No quick replies yet"
          description="Quick replies let agents insert a pre-written message into the composer with a shortcut, like /refund or /hours."
          action={
            <Button icon={Plus} onClick={() => navigate('/app/admin/quick-replies/new')}>
              New quick reply
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-ink-100 bg-white dark:border-navy-800 dark:bg-navy-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-xs uppercase tracking-wide text-ink-500 dark:border-navy-800 dark:bg-navy-800/60 dark:text-navy-400">
              <tr>
                <th className="px-4 py-3 font-medium">Shortcut</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Message</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 dark:divide-navy-800">
              {replies.map((reply) => (
                <tr key={reply._id} className="hover:bg-ink-50 dark:hover:bg-navy-800/60">
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-ink-100 px-2 py-1 font-mono text-xs text-ink-600 dark:bg-navy-800 dark:text-navy-300">
                      /{reply.shortcut}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-ink-900 dark:text-white">{reply.title}</td>
                  <td className="hidden max-w-xs truncate px-4 py-3 text-ink-500 dark:text-navy-400 sm:table-cell">
                    {reply.message}
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
                      <DropdownItem icon={Pencil} onClick={() => navigate(`/app/admin/quick-replies/${reply._id}`)}>
                        Edit
                      </DropdownItem>
                      <DropdownItem icon={Trash2} danger onClick={() => handleDelete(reply)}>
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
