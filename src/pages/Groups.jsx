import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, MoreVertical, Trash2, Pencil, UsersRound } from 'lucide-react'
import Button from '../components/common/Button'
import Dropdown, { DropdownItem } from '../components/common/Dropdown'
import EmptyState from '../components/common/EmptyState'
import { Skeleton } from '../components/common/Loader'
import { useDebounce } from '../hooks/useDebounce'
import {
  fetchGroups,
  deleteGroup,
  setGroupSearch,
  selectFilteredGroups,
  selectGroupsStatus
} from '../features/groups/groupsSlice'
import { openConfirmDialog, showToast } from '../features/ui/uiSlice'

export default function Groups() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const groups = useSelector(selectFilteredGroups)
  const status = useSelector(selectGroupsStatus)
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebounce(searchInput, 300)

  useEffect(() => {
    dispatch(fetchGroups())
  }, [dispatch])

  useEffect(() => {
    dispatch(setGroupSearch(debouncedSearch))
  }, [debouncedSearch, dispatch])

  const handleDelete = (group) => {
    dispatch(
      openConfirmDialog({
        title: 'Delete group',
        description: `"${group.name}" will be removed. Teams it's linked to will lose this group until reassigned.`,
        confirmLabel: 'Delete',
        tone: 'danger',
        onConfirm: () => {
          dispatch(deleteGroup(group._id)).then((res) => {
            if (!res.error) dispatch(showToast({ message: 'Group deleted', tone: 'default' }))
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
            placeholder="Search groups..."
            className="w-full rounded-lg border border-ink-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
          />
        </div>
        <Button icon={Plus} onClick={() => navigate('/app/admin/groups/new')}>
          New group
        </Button>
      </div>

      {status === 'loading' && groups.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="No groups yet"
          description="Groups bundle agents together so you can assign them to teams in one go."
          action={
            <Button icon={Plus} onClick={() => navigate('/app/admin/groups/new')}>
              New group
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-ink-100 bg-white dark:border-navy-800 dark:bg-navy-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-xs uppercase tracking-wide text-ink-500 dark:border-navy-800 dark:bg-navy-800/60 dark:text-navy-400">
              <tr>
                <th className="px-4 py-3 font-medium">Group</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Description</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Agents</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 dark:divide-navy-800">
              {groups.map((group) => (
                <tr key={group._id} className="hover:bg-ink-50 dark:hover:bg-navy-800/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300">
                        <UsersRound className="h-3.5 w-3.5" />
                      </span>
                      <p className="font-medium text-ink-900 dark:text-white">{group.name}</p>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-ink-500 dark:text-navy-400 sm:table-cell">
                    {group.description || '—'}
                  </td>
                  <td className="hidden px-4 py-3 text-ink-500 dark:text-navy-400 md:table-cell">
                    {group.agents?.length || 0} agents
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
                      <DropdownItem icon={Pencil} onClick={() => navigate(`/app/admin/groups/${group._id}`)}>
                        Edit
                      </DropdownItem>
                      <DropdownItem icon={Trash2} danger onClick={() => handleDelete(group)}>
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
