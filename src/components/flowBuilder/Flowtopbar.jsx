// src/components/flowbuilder/FlowTopBar.jsx
import { ArrowLeft, Undo2, Redo2, PlayCircle, Loader2 } from 'lucide-react'

export default function FlowTopBar({
                                     flowName,
                                     onFlowNameChange,
                                     status,
                                     onBack,
                                     onUndo,
                                     onRedo,
                                     canUndo,
                                     canRedo,
                                     onSaveDraft,
                                     onTestFlow,
                                     onPublish,
                                     saving,
                                     extraAction,
                                   }) {
  return (
    <div className="flex h-14 shrink-0 items-center justify-between border-b border-ink-100 bg-white px-4 dark:border-navy-800 dark:bg-navy-950">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 dark:text-navy-300 dark:hover:bg-navy-800">
          <ArrowLeft className="h-4.5 w-4.5" />
        </button>

        <input
          value={flowName}
          onChange={(e) => onFlowNameChange(e.target.value)}
          className="rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-semibold text-ink-900 hover:border-ink-200 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-400 dark:text-white dark:hover:border-navy-700 dark:focus:bg-navy-800"
        />

        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
            status === 'Published'
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
              : 'bg-ink-100 text-ink-600 dark:bg-navy-800 dark:text-ink-300'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${status === 'Published' ? 'bg-emerald-500' : 'bg-ink-400'}`} />
          {status}
        </span>

        {saving && (
          <span className="flex items-center gap-1 text-xs text-ink-400">
            <Loader2 className="h-3 w-3 animate-spin" /> Saving...
          </span>
        )}

        <div className="ml-1 flex items-center gap-0.5 border-l border-ink-100 pl-2 dark:border-navy-800">
          <button onClick={onUndo} disabled={!canUndo} className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 disabled:opacity-30 dark:text-navy-300 dark:hover:bg-navy-800" title="Undo">
            <Undo2 className="h-4 w-4" />
          </button>
          <button onClick={onRedo} disabled={!canRedo} className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 disabled:opacity-30 dark:text-navy-300 dark:hover:bg-navy-800" title="Redo">
            <Redo2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {extraAction}
        <button
          onClick={onTestFlow}
          className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-sm font-medium text-ink-600 hover:bg-ink-50 dark:border-navy-700 dark:text-navy-300 dark:hover:bg-navy-800"
        >
          <PlayCircle className="h-4 w-4" /> Test Flow
        </button>
        <button
          onClick={onSaveDraft}
          disabled={saving}
          className="rounded-lg border border-ink-200 px-3 py-1.5 text-sm font-medium text-ink-600 hover:bg-ink-50 disabled:opacity-50 dark:border-navy-700 dark:text-navy-300 dark:hover:bg-navy-800"
        >
          Save Draft
        </button>
        <button
          onClick={onPublish}
          disabled={saving}
          className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          Publish
        </button>
      </div>
    </div>
  )
}