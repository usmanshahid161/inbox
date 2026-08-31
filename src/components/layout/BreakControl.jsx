import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Coffee, Check, X } from 'lucide-react'
import Dropdown, { DropdownItem } from '../common/Dropdown'
import { useAuth } from '../../hooks/useAuth'
import {
  fetchMyActiveBreaks,
  startBreak,
  endBreak,
  selectMyActiveBreaks,
  selectStartingBreak,
  selectStartBreakError,
  clearStartBreakError
} from '../../features/presence/presenceSlice'
import { fetchBreakTypes, selectAllBreakTypes } from '../../features/breakTypes/breakTypesSlice'
import { selectAllQueues } from '../../features/queues/queuesSlice'
import { showToast } from '../../features/ui/uiSlice'

const inputClass =
  'w-full rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-xs focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-navy-700 dark:bg-navy-800 dark:text-white'

export default function BreakControl() {
  const dispatch = useDispatch()
  const { user } = useAuth()
  const myBreaks = useSelector(selectMyActiveBreaks)
  const breakTypes = useSelector(selectAllBreakTypes)
  const allQueues = useSelector(selectAllQueues)
  const starting = useSelector(selectStartingBreak)
  const startError = useSelector(selectStartBreakError)

  const [breakTypeId, setBreakTypeId] = useState('')
  const [scope, setScope] = useState('overall') // 'overall' | 'scoped'
  const [queueId, setQueueId] = useState('')

  // Only queues this agent is actually assigned to make sense as a scoped
  // break — no point letting them pause a queue they don't work.
  const myQueues = allQueues.filter((q) => user?.queues?.includes(q._id))

  useEffect(() => {
    dispatch(fetchMyActiveBreaks())
    dispatch(fetchBreakTypes())
  }, [dispatch])

  const isOnBreak = myBreaks.length > 0
  const overallBreak = myBreaks.find((b) => b.overall)

  const handleStart = () => {
    if (!breakTypeId) return
    if (scope === 'scoped' && !queueId) return

    dispatch(
      startBreak({
        breakType: breakTypeId,
        overall: scope === 'overall',
        channel: scope === 'scoped' ? 'whatsapp' : undefined,
        queue: scope === 'scoped' ? queueId : undefined
      })
    ).then((res) => {
      if (!res.error) {
        dispatch(showToast({ message: 'Break started', tone: 'default' }))
        setBreakTypeId('')
        setQueueId('')
      }
    })
  }

  const handleEnd = (breakId) => {
    dispatch(endBreak(breakId)).then((res) => {
      if (!res.error) dispatch(showToast({ message: 'Break ended', tone: 'success' }))
    })
  }

  return (
    <Dropdown
      trigger={() => (
        <button
          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
            isOnBreak
              ? 'border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-400'
              : 'border-ink-200 text-ink-600 dark:border-navy-700 dark:text-navy-300'
          }`}
        >
          <Coffee className="h-3.5 w-3.5" />
          {isOnBreak ? `On break${myBreaks.length > 1 ? ` (${myBreaks.length})` : ''}` : 'Available'}
        </button>
      )}
      align="right"
      className="w-72 p-3"
    >
      <div onClick={(e) => e.stopPropagation()} className="space-y-3">
        {myBreaks.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-ink-600 dark:text-navy-300">Active breaks</p>
            {myBreaks.map((b) => {
              const bt = breakTypes.find((t) => t._id === b.breakType)
              const q = allQueues.find((q2) => q2._id === b.queue)
              return (
                <div
                  key={b._id}
                  className="flex items-center justify-between rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300"
                >
                  <span>{bt?.name || 'Break'}{b.overall ? ' (overall)' : q ? ` — ${q.name}` : ''}</span>
                  <button onClick={() => handleEnd(b._id)} className="rounded p-0.5 hover:bg-amber-100 dark:hover:bg-amber-500/20">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {!overallBreak && (
          <div className="space-y-2 border-t border-ink-100 pt-2.5 dark:border-navy-700">
            <p className="text-xs font-medium text-ink-600 dark:text-navy-300">Start a break</p>

            <select value={breakTypeId} onChange={(e) => setBreakTypeId(e.target.value)} className={inputClass}>
              <option value="">Select a reason...</option>
              {breakTypes.map((bt) => (
                <option key={bt._id} value={bt._id}>
                  {bt.name}
                </option>
              ))}
            </select>

            <div className="flex gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setScope('overall')}
                className={`flex-1 rounded-md border px-2 py-1 ${scope === 'overall' ? 'border-brand-400 bg-brand-50 text-brand-700 dark:border-brand-600 dark:bg-brand-900/20 dark:text-brand-300' : 'border-ink-200 text-ink-500 dark:border-navy-700 dark:text-navy-400'}`}
              >
                Everywhere
              </button>
              <button
                type="button"
                onClick={() => setScope('scoped')}
                className={`flex-1 rounded-md border px-2 py-1 ${scope === 'scoped' ? 'border-brand-400 bg-brand-50 text-brand-700 dark:border-brand-600 dark:bg-brand-900/20 dark:text-brand-300' : 'border-ink-200 text-ink-500 dark:border-navy-700 dark:text-navy-400'}`}
              >
                One queue
              </button>
            </div>

            {scope === 'scoped' && (
              <select value={queueId} onChange={(e) => setQueueId(e.target.value)} className={inputClass}>
                <option value="">Select a queue...</option>
                {myQueues.map((q) => (
                  <option key={q._id} value={q._id}>
                    {q.name}
                  </option>
                ))}
              </select>
            )}

            {startError && <p className="text-[11px] text-red-600">{startError}</p>}

            <button
              onClick={handleStart}
              disabled={starting || !breakTypeId || (scope === 'scoped' && !queueId)}
              className="flex w-full items-center justify-center gap-1.5 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              Start break
            </button>
          </div>
        )}
      </div>
    </Dropdown>
  )
}
