// src/components/flowbuilder/nodes/index.jsx
import { Handle, Position } from 'reactflow'
import { NODE_TYPES_META, COLOR_CLASSES } from './Flowconstants.jsx'

// Shared shell every node type renders inside — handles selection ring,
// icon chip, title, and the target handle (top). Source handle(s) are
// rendered per-type below since some nodes need more than one.
function NodeShell({ type, selected, children, targetHandle = true }) {
  const meta = NODE_TYPES_META[type]
  const colors = COLOR_CLASSES[meta.color]
  const Icon = meta.icon

  return (
    <div
      className={`w-60 rounded-xl border bg-white shadow-sm transition-shadow dark:bg-navy-900 ${
        selected
          ? `border-transparent ring-2 ${colors.ring} shadow-md`
          : 'border-ink-200 hover:shadow-md dark:border-navy-700'
      }`}
    >
      {targetHandle && (
        <Handle type="target" position={Position.Top} className="!h-2.5 !w-2.5 !border-2 !border-white !bg-ink-400 dark:!border-navy-900" />
      )}

      <div className="flex items-center gap-2 border-b border-ink-100 px-3 py-2 dark:border-navy-800">
        <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${colors.bg}`}>
          <Icon className={`h-3.5 w-3.5 ${colors.text}`} />
        </div>
        <span className="truncate text-xs font-semibold text-ink-800 dark:text-white">{meta.label}</span>
      </div>

      <div className="px-3 py-2.5">{children}</div>
    </div>
  )
}

function SourceDot({ id, style }) {
  return (
    <Handle
      type="source"
      position={Position.Bottom}
      id={id}
      style={style}
      className="!h-2.5 !w-2.5 !border-2 !border-white !bg-brand-500 dark:!border-navy-900"
    />
  )
}

export function StartNode({ selected }) {
  return (
    <NodeShell type="start" selected={selected} targetHandle={false}>
      <p className="text-xs text-ink-500 dark:text-navy-300">Flow begins here</p>
      <SourceDot />
    </NodeShell>
  )
}

export function MessageNode({ data, selected }) {
  return (
    <NodeShell type="message" selected={selected}>
      <p className="line-clamp-2 text-xs text-ink-600 dark:text-navy-300">{data.text || 'No message set'}</p>
      <SourceDot />
    </NodeShell>
  )
}

export function ButtonsNode({ data, selected }) {
  const buttons = data.buttons?.length ? data.buttons : ['Option 1']
  return (
    <NodeShell type="buttons" selected={selected}>
      <p className="mb-2 line-clamp-1 text-xs text-ink-600 dark:text-navy-300">{data.text}</p>
      <div className="space-y-1">
        {buttons.map((b, i) => (
          <div key={i} className="relative rounded-md border border-ink-100 bg-ink-50 px-2 py-1 text-[11px] font-medium text-ink-700 dark:border-navy-700 dark:bg-navy-800 dark:text-navy-200">
            {b}
          </div>
        ))}
      </div>
      {/* one source handle per button, evenly spaced along the bottom edge */}
      <div className="relative">
        {buttons.map((_, i) => (
          <SourceDot key={i} id={`button-${i}`} style={{ left: `${((i + 1) / (buttons.length + 1)) * 100}%` }} />
        ))}
      </div>
    </NodeShell>
  )
}

export function ListNode({ data, selected }) {
  const items = data.items?.length ? data.items : ['Item 1']
  return (
    <NodeShell type="list" selected={selected}>
      <p className="mb-2 line-clamp-1 text-xs text-ink-600 dark:text-navy-300">{data.text}</p>
      <ul className="space-y-0.5">
        {items.slice(0, 3).map((it, i) => (
          <li key={i} className="truncate text-[11px] text-ink-500 dark:text-navy-400">• {it}</li>
        ))}
        {items.length > 3 && <li className="text-[11px] text-ink-400">+{items.length - 3} more</li>}
      </ul>
      {/* one source handle per item, evenly spaced along the bottom edge —
          same pattern as ButtonsNode. Previously this rendered a single
          generic SourceDot, so every item silently fell through the same
          one edge regardless of which item the customer actually picked. */}
      <div className="relative">
        {items.map((_, i) => (
          <SourceDot key={i} id={`item-${i}`} style={{ left: `${((i + 1) / (items.length + 1)) * 100}%` }} />
        ))}
      </div>
    </NodeShell>
  )
}

export function QuestionNode({ data, selected }) {
  return (
    <NodeShell type="question" selected={selected}>
      <p className="line-clamp-2 text-xs text-ink-600 dark:text-navy-300">{data.question}</p>
      <p className="mt-1.5 inline-block rounded bg-amber-50 px-1.5 py-0.5 font-mono text-[10px] text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
        {'{{' + (data.variable || 'answer') + '}}'}
      </p>
      <SourceDot />
    </NodeShell>
  )
}

export function ConditionNode({ data, selected }) {
  return (
    <NodeShell type="condition" selected={selected}>
      <p className="truncate font-mono text-[11px] text-ink-700 dark:text-navy-200">
        {data.variable || 'variable'} <span className="text-orange-500">{data.operator || 'equals'}</span> "{data.value || '...'}"
      </p>
      <div className="mt-2 flex justify-between text-[10px] font-medium">
        <span className="text-emerald-600">✓ True</span>
        <span className="text-rose-500">✕ False</span>
      </div>
      <SourceDot id="true" style={{ left: '30%' }} />
      <SourceDot id="false" style={{ left: '70%' }} />
    </NodeShell>
  )
}

export function ApiNode({ data, selected }) {
  return (
    <NodeShell type="api" selected={selected}>
      <div className="flex items-center gap-1.5">
        <span className="rounded bg-teal-100 px-1.5 py-0.5 text-[10px] font-bold text-teal-700 dark:bg-teal-500/10 dark:text-teal-400">
          {data.method || 'GET'}
        </span>
        <p className="truncate text-[11px] text-ink-500 dark:text-navy-400">{data.url}</p>
      </div>
      <SourceDot />
    </NodeShell>
  )
}

export function AgentNode({ data, selected }) {
  return (
    <NodeShell type="agent" selected={selected} targetHandle={true}>
      <p className="text-xs text-ink-600 dark:text-navy-300">{data.team || 'Support Team'}</p>
      <p className="mt-0.5 text-[11px] text-ink-400">{data.assignment || 'Automatic'} assignment</p>
    </NodeShell>
  )
}

export function DelayNode({ data, selected }) {
  return (
    <NodeShell type="delay" selected={selected}>
      <p className="text-xs text-ink-600 dark:text-navy-300">Wait {data.seconds ?? 3}s</p>
      <SourceDot />
    </NodeShell>
  )
}

export function EndNode({ selected }) {
  return (
    <NodeShell type="end" selected={selected} targetHandle={true}>
      <p className="text-xs text-ink-500 dark:text-navy-300">Flow ends here</p>
    </NodeShell>
  )
}

export const nodeTypes = {
  start: StartNode,
  message: MessageNode,
  buttons: ButtonsNode,
  list: ListNode,
  question: QuestionNode,
  condition: ConditionNode,
  api: ApiNode,
  agent: AgentNode,
  delay: DelayNode,
  end: EndNode,
}