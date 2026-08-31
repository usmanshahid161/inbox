import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Plus, MoreVertical, Trash2, Pencil, Coffee } from 'lucide-react'
import Button from '../components/common/Button'
import Dropdown, { DropdownItem } from '../components/common/Dropdown'
import EmptyState from '../components/common/EmptyState'
import { Skeleton } from '../components/common/Loader'
import {
  fetchBreakTypes,
  deleteBreakType,
  selectAllBreakTypes,
  selectBreakTypesStatus
} from '../features/breakTypes/breakTypesSlice'
import { openConfirmDialog, showToast } from '../features/ui/uiSlice'

export default function BreakTypes() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const breakTypes = useSelector(selectAllBreakTypes)
  const status = useSelector(selectBreakTypesStatus)

  useEffect(() => {
    dispatch(fetchBreakTypes())
  }, [dispatch])

  const handleDelete = (breakType) => {
    dispatch(
      openConfirmDialog({
        title: 'Delete break type',
        description: `"${breakType.name}" will no longer be available for agents to select.`,
        confirmLabel: 'Delete',
        tone: 'danger',
        onConfirm: () => {
          dispatch(deleteBreakType(breakType._id)).then((res) => {
            if (!res.error) dispatch(showToast({ message: 'Break type deleted', tone: 'default' }))
          })
        }
      })
    )
  }

  return (
    <div className="h-full overflow-y-auto scroll-thin p-4 lg:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base font-semibold text-ink-900 dark:text-white">Break types</h1>
          <p className="text-xs text-ink-500 dark:text-navy-400">Reasons agents can select when going on break.</p>
        </div>
        <Button icon={Plus} onClick={() => navigate('/app/admin/break-types/new')}>
          New break type
        </Button>
      </div>

      {status === 'loading' && breakTypes.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-xl" />
          ))}
        </div>
      ) : breakTypes.length === 0 ? (
        <EmptyState
          icon={Coffee}
          title="No break types yet"
          description="Add reasons like Lunch or Bathroom that agents can pick when stepping away."
          action={
            <Button icon={Plus} onClick={() => navigate('/app/admin/break-types/new')}>
              New break type
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-ink-100 bg-white dark:border-navy-800 dark:bg-navy-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-100 bg-ink-50 text-xs uppercase tracking-wide text-ink-500 dark:border-navy-800 dark:bg-navy-800/60 dark:text-navy-400">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Description</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 dark:divide-navy-800">
              {breakTypes.map((breakType) => (
                <tr key={breakType._id} className="hover:bg-ink-50 dark:hover:bg-navy-800/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300">
                        <Coffee className="h-3.5 w-3.5" />
                      </span>
                      <p className="font-medium text-ink-900 dark:text-white">{breakType.name}</p>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-ink-500 dark:text-navy-400 sm:table-cell">
                    {breakType.description || '—'}
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
                      <DropdownItem icon={Pencil} onClick={() => navigate(`/app/admin/break-types/${breakType._id}`)}>
                        Edit
                      </DropdownItem>
                      <DropdownItem icon={Trash2} danger onClick={() => handleDelete(breakType)}>
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
