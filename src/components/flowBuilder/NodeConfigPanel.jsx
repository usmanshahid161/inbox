// src/components/flowbuilder/NodeConfigPanel.jsx
import { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import { NODE_TYPES_META, COLOR_CLASSES } from './Flowconstants.jsx'

const inputClass =
  'w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-navy-700 dark:bg-navy-800 dark:text-white'
const labelClass = 'mb-1 block text-xs font-medium text-ink-600 dark:text-navy-300'

export default function NodeConfigPanel({ node, onChange, onClose, onDelete, onDuplicate }) {
  const [local, setLocal] = useState(node?.data || {})

  useEffect(() => setLocal(node?.data || {}), [node?.id])

  if (!node) {
    return (
      <aside className="w-80 shrink-0 border-l border-ink-100 bg-white p-6 dark:border-navy-800 dark:bg-navy-950">
        <div className="flex h-full flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-ink-600 dark:text-navy-300">No node selected</p>
          <p className="mt-1 text-xs text-ink-400">Click a node on the canvas to configure it.</p>
        </div>
      </aside>
    )
  }

  const meta = NODE_TYPES_META[node.type]
  const colors = COLOR_CLASSES[meta.color]
  const Icon = meta.icon

  const update = (patch) => {
    const next = { ...local, ...patch }
    setLocal(next)
    onChange(node.id, next)
  }

  return (
    <aside className="flex w-80 shrink-0 flex-col overflow-hidden border-l border-ink-100 bg-white dark:border-navy-800 dark:bg-navy-950">
      <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3 dark:border-navy-800">
        <div className="flex items-center gap-2">
          <div className={`flex h-7 w-7 items-center justify-center rounded-md ${colors.bg}`}>
            <Icon className={`h-4 w-4 ${colors.text}`} />
          </div>
          <h3 className="text-sm font-semibold text-ink-800 dark:text-white">{meta.label}</h3>
        </div>
        <button onClick={onClose} className="rounded-md p-1 text-ink-400 hover:bg-ink-100 dark:hover:bg-navy-800">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {node.type === 'start' && (
          <p className="text-xs text-ink-400">The start node has no configurable options — it just marks the entry point.</p>
        )}

        {node.type === 'message' && (
          <div>
            <label className={labelClass}>Message text</label>
            <textarea
              rows={4}
              value={local.text || ''}
              onChange={(e) => update({ text: e.target.value })}
              placeholder="Welcome to ABC 👋"
              className={inputClass}
            />
            <p className="mt-1.5 text-[11px] text-ink-400">Use variables like <code className="rounded bg-ink-100 px-1 dark:bg-navy-800">{'{{name}}'}</code> to personalize.</p>
          </div>
        )}

        {node.type === 'buttons' && (
          <>
            <div>
              <label className={labelClass}>Message</label>
              <textarea
                rows={2}
                value={local.text || ''}
                onChange={(e) => update({ text: e.target.value })}
                placeholder="Choose an option:"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Buttons</label>
              <div className="space-y-2">
                {(local.buttons || []).map((b, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={b}
                      onChange={(e) => {
                        const next = [...local.buttons]
                        next[i] = e.target.value
                        update({ buttons: next })
                      }}
                      className={inputClass}
                    />
                    <button
                      onClick={() => update({ buttons: local.buttons.filter((_, idx) => idx !== i) })}
                      className="shrink-0 rounded-md p-1.5 text-ink-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              {(local.buttons?.length || 0) < 3 && (
                <button
                  onClick={() => update({ buttons: [...(local.buttons || []), `Option ${(local.buttons?.length || 0) + 1}`] })}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-dashed border-ink-300 px-3 py-1.5 text-xs text-ink-500 hover:border-brand-500 hover:text-brand-600 dark:border-navy-700"
                >
                  <Plus className="h-3.5 w-3.5" /> Add button
                </button>
              )}
              <p className="mt-1.5 text-[11px] text-ink-400">WhatsApp allows up to 3 quick-reply buttons.</p>
            </div>
          </>
        )}

        {node.type === 'list' && (
          <>
            <div>
              <label className={labelClass}>Message</label>
              <textarea
                rows={2}
                value={local.text || ''}
                onChange={(e) => update({ text: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>List items</label>
              <div className="space-y-2">
                {(local.items || []).map((it, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={it}
                      onChange={(e) => {
                        const next = [...local.items]
                        next[i] = e.target.value
                        update({ items: next })
                      }}
                      className={inputClass}
                    />
                    <button
                      onClick={() => update({ items: local.items.filter((_, idx) => idx !== i) })}
                      className="shrink-0 rounded-md p-1.5 text-ink-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => update({ items: [...(local.items || []), `Item ${(local.items?.length || 0) + 1}`] })}
                className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-dashed border-ink-300 px-3 py-1.5 text-xs text-ink-500 hover:border-brand-500 hover:text-brand-600 dark:border-navy-700"
              >
                <Plus className="h-3.5 w-3.5" /> Add item
              </button>
            </div>
          </>
        )}

        {node.type === 'question' && (
          <>
            <div>
              <label className={labelClass}>Question</label>
              <textarea
                rows={2}
                value={local.question || ''}
                onChange={(e) => update({ question: e.target.value })}
                placeholder="What is your name?"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Save answer as</label>
              <input
                type="text"
                value={local.variable || ''}
                onChange={(e) => update({ variable: e.target.value.replace(/\s+/g, '_') })}
                placeholder="customerName"
                className={inputClass}
              />
            </div>
          </>
        )}

        {node.type === 'condition' && (
          <>
            <div>
              <label className={labelClass}>Variable</label>
              <input
                type="text"
                value={local.variable || ''}
                onChange={(e) => update({ variable: e.target.value })}
                placeholder="customerType"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Operator</label>
              <select value={local.operator || 'equals'} onChange={(e) => update({ operator: e.target.value })} className={inputClass}>
                <option value="equals">equals</option>
                <option value="not_equals">not equals</option>
                <option value="contains">contains</option>
                <option value="greater_than">greater than</option>
                <option value="less_than">less than</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Value</label>
              <input
                type="text"
                value={local.value || ''}
                onChange={(e) => update({ value: e.target.value })}
                placeholder="premium"
                className={inputClass}
              />
            </div>
          </>
        )}

        {node.type === 'api' && (
          <>
            <div>
              <label className={labelClass}>Method</label>
              <select value={local.method || 'GET'} onChange={(e) => update({ method: e.target.value })} className={inputClass}>
                {['GET', 'POST', 'PUT', 'DELETE'].map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>URL</label>
              <input
                type="text"
                value={local.url || ''}
                onChange={(e) => update({ url: e.target.value })}
                placeholder="https://api.example.com/..."
                className={inputClass}
              />
            </div>
          </>
        )}

        {node.type === 'agent' && (
          <>
            <div>
              <label className={labelClass}>Team</label>
              <select value={local.team || 'Support Team'} onChange={(e) => update({ team: e.target.value })} className={inputClass}>
                {['Support Team', 'Sales Team', 'Billing Team'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Assignment</label>
              <select value={local.assignment || 'Automatic'} onChange={(e) => update({ assignment: e.target.value })} className={inputClass}>
                <option value="Automatic">Automatic</option>
                <option value="Round robin">Round robin</option>
                <option value="Manual">Manual</option>
              </select>
            </div>
          </>
        )}

        {node.type === 'delay' && (
          <div>
            <label className={labelClass}>Wait duration (seconds)</label>
            <input
              type="number"
              min={1}
              value={local.seconds ?? 3}
              onChange={(e) => update({ seconds: Number(e.target.value) })}
              className={inputClass}
            />
          </div>
        )}

        {node.type === 'end' && (
          <p className="text-xs text-ink-400">The end node has no configurable options — it just terminates this branch.</p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-ink-100 px-4 py-3 dark:border-navy-800">
        <button
          onClick={() => onDuplicate(node.id)}
          className="rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-50 dark:border-navy-700 dark:text-navy-300 dark:hover:bg-navy-800"
        >
          Duplicate
        </button>
        <button
          onClick={() => onDelete(node.id)}
          className="flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:border-rose-500/30 dark:hover:bg-rose-500/10"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete node
        </button>
      </div>
    </aside>
  )
}