// src/pages/FlowsList.jsx
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Workflow, Plus, Pencil, Copy, Trash2, PlayCircle, MoreVertical } from 'lucide-react'
import {
  fetchFlows,
  deleteFlow,
  duplicateFlow,
  selectFlowsList,
  selectFlowsListStatus,
} from '../../features/flows/flowsSlice.js'
import EmptyState from '../common/EmptyState.jsx'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString(undefined, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function RowMenu({ flow, onEdit, onRun, onDuplicate, onDelete }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} onBlur={() => setTimeout(() => setOpen(false), 150)} className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 dark:hover:bg-navy-800">
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-40 overflow-hidden rounded-lg border border-ink-100 bg-white py-1 shadow-lg dark:border-navy-700 dark:bg-navy-900">
          <button onClick={onEdit} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-navy-800">
            <Pencil className="h-4 w-4" /> Edit
          </button>
          <button onClick={onRun} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-navy-800">
            <PlayCircle className="h-4 w-4" /> Test run
          </button>
          <button onClick={onDuplicate} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-ink-50 dark:text-ink-200 dark:hover:bg-navy-800">
            <Copy className="h-4 w-4" /> Duplicate
          </button>
          <button onClick={onDelete} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10">
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      )}
    </div>
  )
}

export default function FlowsList() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const flows = useSelector(selectFlowsList)
  const status = useSelector(selectFlowsListStatus)

  useEffect(() => {
    if (status === 'idle') dispatch(fetchFlows())
  }, [status, dispatch])

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4 dark:border-navy-800">
        <div className="flex items-center gap-2">
          <Workflow className="h-5 w-5 text-brand-600" />
          <div>
            <h1 className="text-base font-semibold text-ink-900 dark:text-white">Bot Flows</h1>
            <p className="text-xs text-ink-400">Build and manage WhatsApp IVR / bot conversation flows</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/app/flows/new')}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> New Flow
        </button>
      </div>

      {status === 'loading' && (
        <div className="flex flex-1 items-center justify-center text-sm text-ink-400">Loading flows...</div>
      )}

      {status !== 'loading' && flows.length === 0 && (
        <EmptyState
          icon={Workflow}
          title="No flows yet"
          description="Create your first bot flow to automate WhatsApp conversations."
        />
      )}

      {status !== 'loading' && flows.length > 0 && (
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-white dark:bg-navy-950">
            <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400 dark:border-navy-800">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Created</th>
              <th className="px-5 py-3 font-medium">Updated</th>
              <th className="px-5 py-3 font-medium text-right">Actions</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 dark:divide-navy-800">
            {flows.map((f) => (
              <tr
                key={f._id}
                className="cursor-pointer hover:bg-ink-50 dark:hover:bg-navy-900/60"
                onClick={() => navigate(`/app/flows/${f._id}`)}
              >
                <td className="px-5 py-3 font-medium text-ink-900 dark:text-white">{f.name}</td>
                <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        f.status === 'PUBLISHED'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                          : 'bg-ink-100 text-ink-600 dark:bg-navy-800 dark:text-ink-300'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${f.status === 'PUBLISHED' ? 'bg-emerald-500' : 'bg-ink-400'}`} />
                      {f.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                    </span>
                </td>
                <td className="px-5 py-3 text-ink-500 dark:text-ink-400">{formatDate(f.createdAt)}</td>
                <td className="px-5 py-3 text-ink-500 dark:text-ink-400">{formatDate(f.updatedAt)}</td>
                <td className="px-5 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <RowMenu
                    flow={f}
                    onEdit={() => navigate(`/app/flows/${f._id}`)}
                    onRun={() => navigate(`/app/flows/${f._id}?test=1`)}
                    onDuplicate={() => dispatch(duplicateFlow(f._id))}
                    onDelete={() => {
                      if (confirm(`Delete flow "${f.name}"? This cannot be undone.`)) {
                        dispatch(deleteFlow(f._id))
                      }
                    }}
                  />
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