import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, MoreVertical, Trash2, Pencil, TagIcon } from 'lucide-react'
import Button from '../components/common/Button'
import Dropdown, { DropdownItem } from '../components/common/Dropdown'
import EmptyState from '../components/common/EmptyState'
import { Skeleton } from '../components/common/Loader'
import { useDebounce } from '../hooks/useDebounce'
import {
  fetchTags,
  deleteTag,
  setTagSearch,
  selectFilteredTags,
  selectTagsStatus
} from '../features/tags/tagsSlice'
import { openConfirmDialog, showToast } from '../features/ui/uiSlice'

export default function Tags() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const tags = useSelector(selectFilteredTags)
  const status = useSelector(selectTagsStatus)
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 300)

  useEffect(() => {
    dispatch(fetchTags())
  }, [dispatch])

  useEffect(() => {
    dispatch(setTagSearch(debouncedSearch))
  }, [debouncedSearch, dispatch])

  const handleDelete = (tag) => {
    dispatch(
      openConfirmDialog({
        title: 'Delete tag',
        description: `"${tag.name}" will be removed from every conversation and contact it's applied to. This can't be undone.`,
        confirmLabel: 'Delete',
        tone: 'danger',
        onConfirm: () => {
          dispatch(deleteTag(tag._id)).then((res) => {
            if (!res.error) dispatch(showToast({ message: 'Tag deleted', tone: 'default' }))
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
            placeholder="Search tags..."
            className="w-full rounded-lg border border-ink-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
          />
        </div>
        <Button icon={Plus} onClick={() => navigate('/app/admin/tags/new')}>
          New tag
        </Button>
      </div>

      {status === 'loading' && tags.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      ) : tags.length === 0 ? (
        <EmptyState
          icon={TagIcon}
          title="No tags yet"
          description="Tags help agents quickly label conversations and contacts, like VIP or Refund."
          action={
            <Button icon={Plus} onClick={() => navigate('/app/admin/tags/new')}>
              New tag
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-ink-100 bg-white dark:border-navy-800 dark:bg-navy-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-xs uppercase tracking-wide text-ink-500 dark:border-navy-800 dark:bg-navy-800/60 dark:text-navy-400">
              <tr>
                <th className="px-4 py-3 font-medium">Tag</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Description</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 dark:divide-navy-800">
              {tags.map((tag) => (
                <tr key={tag._id} className="hover:bg-ink-50 dark:hover:bg-navy-800/60">
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-white"
                      style={{ backgroundColor: tag.color || '#6f6a59' }}
                    >
                      {tag.name}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-ink-500 dark:text-navy-400 sm:table-cell">
                    {tag.description || '—'}
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
                      <DropdownItem icon={Pencil} onClick={() => navigate(`/app/admin/tags/${tag._id}`)}>
                        Edit
                      </DropdownItem>
                      <DropdownItem icon={Trash2} danger onClick={() => handleDelete(tag)}>
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
