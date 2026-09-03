// src/components/flowbuilder/NodePalette.jsx
import { NODE_TYPES_META, PALETTE_ORDER, COLOR_CLASSES } from './Flowconstants.jsx'

export default function NodePalette() {
  const onDragStart = (e, type) => {
    e.dataTransfer.setData('application/flow-node-type', type)
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <aside className="w-64 shrink-0 overflow-y-auto border-r border-ink-100 bg-white p-3 dark:border-navy-800 dark:bg-navy-950">
      <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-ink-400">Node types</p>
      <div className="space-y-1.5">
        {PALETTE_ORDER.map((type) => {
          const meta = NODE_TYPES_META[type]
          const colors = COLOR_CLASSES[meta.color]
          const Icon = meta.icon
          return (
            <div
              key={type}
              draggable
              onDragStart={(e) => onDragStart(e, type)}
              className="flex cursor-grab items-start gap-2.5 rounded-lg border border-ink-100 bg-white p-2.5 transition-colors hover:border-brand-300 hover:bg-brand-50/50 active:cursor-grabbing dark:border-navy-800 dark:bg-navy-900 dark:hover:border-brand-700 dark:hover:bg-navy-800"
            >
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colors.bg}`}>
                <Icon className={`h-4 w-4 ${colors.text}`} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink-800 dark:text-white">{meta.label}</p>
                <p className="truncate text-xs text-ink-400">{meta.description}</p>
              </div>
            </div>
          )
        })}
      </div>

      <p className="mt-4 px-1 text-[11px] leading-relaxed text-ink-400">
        Drag a node onto the canvas, then connect it by dragging from one node's dot to another.
      </p>
    </aside>
  )
}