import { Plus, Trash2 } from 'lucide-react'
import { BUTTON_TYPES, LIMITS } from '../../features/templates/waConstants'

export default function ButtonsEditor({ buttons, onChange }) {
  const addButton = () => {
    if (buttons.length >= LIMITS.BUTTONS_MAX) return
    onChange([...buttons, { type: 'QUICK_REPLY', text: '' }])
  }

  const updateButton = (index, patch) => {
    const next = buttons.map((b, i) => (i === index ? { ...b, ...patch } : b))
    onChange(next)
  }

  const removeButton = (index) => {
    onChange(buttons.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      {buttons.map((button, index) => (
        <div key={index} className="flex flex-wrap items-start gap-2 rounded-lg border border-ink-100 p-2.5 dark:border-navy-800">
          <select
            value={button.type}
            onChange={(e) => updateButton(index, { type: e.target.value })}
            className="rounded-md border border-ink-200 bg-white px-2 py-1.5 text-sm dark:border-navy-700 dark:bg-navy-900 dark:text-ink-200"
          >
            {BUTTON_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={button.text}
            onChange={(e) => updateButton(index, { text: e.target.value })}
            placeholder="Button text"
            maxLength={LIMITS.BUTTON_TEXT_MAX}
            className="min-w-[140px] flex-1 rounded-md border border-ink-200 bg-white px-2 py-1.5 text-sm dark:border-navy-700 dark:bg-navy-900 dark:text-ink-200"
          />

          {button.type === 'URL' && (
            <input
              type="text"
              value={button.url || ''}
              onChange={(e) => updateButton(index, { url: e.target.value })}
              placeholder="https://example.com/{{1}}"
              className="min-w-[180px] flex-1 rounded-md border border-ink-200 bg-white px-2 py-1.5 text-sm dark:border-navy-700 dark:bg-navy-900 dark:text-ink-200"
            />
          )}

          {button.type === 'PHONE_NUMBER' && (
            <input
              type="text"
              value={button.phoneNumber || ''}
              onChange={(e) => updateButton(index, { phoneNumber: e.target.value })}
              placeholder="+92 300 1234567"
              className="min-w-[160px] flex-1 rounded-md border border-ink-200 bg-white px-2 py-1.5 text-sm dark:border-navy-700 dark:bg-navy-900 dark:text-ink-200"
            />
          )}

          <button
            type="button"
            onClick={() => removeButton(index)}
            className="rounded-md p-1.5 text-ink-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}

      {buttons.length < LIMITS.BUTTONS_MAX && (
        <button
          type="button"
          onClick={addButton}
          className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-ink-300 px-3 py-1.5 text-sm text-ink-500 hover:border-emerald-500 hover:text-emerald-600 dark:border-navy-700 dark:text-ink-400"
        >
          <Plus className="h-3.5 w-3.5" /> Add button
        </button>
      )}
      <p className="text-xs text-ink-400">
        Up to {LIMITS.QUICK_REPLY_MAX} quick replies, and up to {LIMITS.CTA_MAX} call-to-action buttons (URL / phone / copy code) combined.
      </p>
    </div>
  )
}
