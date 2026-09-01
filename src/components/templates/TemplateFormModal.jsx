import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { X, AlertTriangle, Save, Send } from 'lucide-react'
import {
  selectIsFormOpen,
  selectEditingTemplate,
  selectSaving,
  selectSaveError,
  closeForm,
  createTemplate,
  updateTemplate,
} from '../../features/templates/templatesSlice'
import {
  CATEGORIES,
  LANGUAGES,
  HEADER_TYPES,
  OTP_TYPES,
  LIMITS,
  sanitizeTemplateName,
  extractVariables,
  validateTemplate,
} from '../../features/templates/waConstants'
import ButtonsEditor from './ButtonsEditor'
import TemplatePreview from './TemplatePreview'

const emptyTemplate = {
  name: '',
  category: 'MARKETING',
  language: 'en_US',
  components: {
    header: { type: 'NONE', text: '', example: '', exampleUrl: '' },
    body: { text: '', examples: [] },
    footer: { text: '' },
    buttons: [],
    // AUTHENTICATION only — ignored/unused for other categories.
    authentication: { addSecurityRecommendation: false, codeExpirationMinutes: null },
  },
}

export default function TemplateFormModal() {
  const dispatch = useDispatch()
  const isOpen = useSelector(selectIsFormOpen)
  const editingTemplate = useSelector(selectEditingTemplate)
  const saving = useSelector(selectSaving)
  const saveError = useSelector(selectSaveError)

  const [form, setForm] = useState(emptyTemplate)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setForm(editingTemplate ? structuredClone(editingTemplate) : structuredClone(emptyTemplate))
      setErrors({})
      setTouched(false)
    }
  }, [isOpen, editingTemplate])

  const bodyVariables = useMemo(() => extractVariables(form.components.body.text), [form.components.body.text])

  if (!isOpen) return null

  const updateField = (path, value) => {
    setForm((prev) => {
      const next = structuredClone(prev)
      const keys = path.split('.')
      let obj = next
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]]
      obj[keys[keys.length - 1]] = value
      return next
    })
  }

  const handleBodyExampleChange = (index, value) => {
    setForm((prev) => {
      const next = structuredClone(prev)
      const examples = next.components.body.examples || []
      examples[index] = value
      next.components.body.examples = examples
      return next
    })
  }

  const runValidation = () => {
    const found = validateTemplate(form)
    setErrors(found)
    return found
  }

  const handleSave = (asDraft) => {
    setTouched(true)
    const found = runValidation()
    const blocking = Object.keys(found).filter((k) => !k.endsWith('Warning'))
    if (blocking.length) return

    const payload = { ...form, status: asDraft ? 'DRAFT' : 'PENDING' }

    if (editingTemplate) {
      dispatch(updateTemplate({ id: editingTemplate._id, payload }))
    } else {
      dispatch(createTemplate(payload))
    }
  }

  const headerType = form.components.header.type
  const isAuthentication = form.category === 'AUTHENTICATION'
  const otpButton = form.components.buttons?.[0] || { type: 'OTP', text: 'Copy Code', otpType: 'COPY_CODE' }

  const handleCategoryChange = (category) => {
    setForm((prev) => {
      const next = structuredClone(prev)
      next.category = category
      // Switching to/from AUTHENTICATION changes what's even valid to send —
      // reset the shape-specific fields so stale data from the other mode
      // can't slip through (e.g. a header left over from MARKETING).
      if (category === 'AUTHENTICATION') {
        next.components.header = { type: 'NONE', text: '', example: '', exampleUrl: '' }
        next.components.body = { text: '', examples: [] }
        next.components.footer = { text: '' }
        next.components.buttons = [{ type: 'OTP', text: 'Copy Code', otpType: 'COPY_CODE' }]
      } else if (prev.category === 'AUTHENTICATION') {
        next.components.buttons = []
      }
      return next
    })
  }

  const updateOtpButton = (patch) => {
    setForm((prev) => {
      const next = structuredClone(prev)
      next.components.buttons = [{ ...otpButton, ...patch }]
      return next
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-navy-950">
        {/* Form column */}
        <div className="flex w-full flex-col overflow-hidden md:w-3/5">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4 dark:border-navy-800">
            <h2 className="text-base font-semibold text-ink-900 dark:text-ink-50">
              {editingTemplate ? 'Edit template' : 'New template'}
            </h2>
            <button
              onClick={() => dispatch(closeForm())}
              className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100 dark:hover:bg-navy-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
            {saveError && (
              <div className="flex items-start gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-600 dark:bg-rose-500/10">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {saveError}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700 dark:text-ink-200">Template name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => updateField('name', sanitizeTemplateName(e.target.value))}
                placeholder="order_confirmation"
                maxLength={LIMITS.NAME_MAX}
                className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm dark:border-navy-700 dark:bg-navy-900 dark:text-ink-100"
              />
              <p className="mt-1 text-xs text-ink-400">Lowercase letters, numbers and underscores only. Cannot be changed after approval.</p>
              {touched && errors.name && <p className="mt-1 text-xs text-rose-500">{errors.name}</p>}
            </div>

            {/* Category + Language */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700 dark:text-ink-200">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm dark:border-navy-700 dark:bg-navy-900 dark:text-ink-100"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-ink-400">{CATEGORIES.find((c) => c.value === form.category)?.hint}</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700 dark:text-ink-200">Language</label>
                <select
                  value={form.language}
                  onChange={(e) => updateField('language', e.target.value)}
                  className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm dark:border-navy-700 dark:bg-navy-900 dark:text-ink-100"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Header */}
            {!isAuthentication && (
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700 dark:text-ink-200">Header (optional)</label>
                <select
                  value={headerType}
                  onChange={(e) => updateField('components.header', { type: e.target.value, text: '', example: '', exampleUrl: '' })}
                  className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm dark:border-navy-700 dark:bg-navy-900 dark:text-ink-100"
                >
                  {HEADER_TYPES.map((h) => (
                    <option key={h} value={h}>
                      {h === 'NONE' ? 'No header' : h.charAt(0) + h.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>

                {headerType === 'TEXT' && (
                  <div className="mt-2 space-y-2">
                    <input
                      type="text"
                      value={form.components.header.text}
                      onChange={(e) => updateField('components.header.text', e.target.value)}
                      placeholder="Your order {{1}} has shipped"
                      maxLength={LIMITS.HEADER_TEXT_MAX}
                      className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm dark:border-navy-700 dark:bg-navy-900 dark:text-ink-100"
                    />
                    {extractVariables(form.components.header.text).length > 0 && (
                      <input
                        type="text"
                        value={form.components.header.example}
                        onChange={(e) => updateField('components.header.example', e.target.value)}
                        placeholder="Example value for {{1}}, e.g. #48291"
                        className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm dark:border-navy-700 dark:bg-navy-900 dark:text-ink-100"
                      />
                    )}
                  </div>
                )}

                {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(headerType) && (
                  <input
                    type="text"
                    value={form.components.header.exampleUrl}
                    onChange={(e) => updateField('components.header.exampleUrl', e.target.value)}
                    placeholder="Publicly accessible sample media URL (required)"
                    className="mt-2 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm dark:border-navy-700 dark:bg-navy-900 dark:text-ink-100"
                  />
                )}
                {touched && errors.header && <p className="mt-1 text-xs text-rose-500">{errors.header}</p>}
                {touched && errors.headerMedia && <p className="mt-1 text-xs text-rose-500">{errors.headerMedia}</p>}
              </div>
            )}

            {/* Body */}
            {!isAuthentication && (
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-sm font-medium text-ink-700 dark:text-ink-200">Body</label>
                  <span className="text-xs text-ink-400">{form.components.body.text.length}/{LIMITS.BODY_TEXT_MAX}</span>
                </div>
                <textarea
                  value={form.components.body.text}
                  onChange={(e) => updateField('components.body.text', e.target.value)}
                  placeholder={'Hi {{1}}, your order #{{2}} has been confirmed!'}
                  maxLength={LIMITS.BODY_TEXT_MAX}
                  rows={4}
                  className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm dark:border-navy-700 dark:bg-navy-900 dark:text-ink-100"
                />
                <p className="mt-1 text-xs text-ink-400">Use {'{{1}}'}, {'{{2}}'} for variables, numbered in order.</p>
                {touched && errors.body && <p className="mt-1 text-xs text-rose-500">{errors.body}</p>}
                {touched && errors.bodyWarning && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-amber-600">
                    <AlertTriangle className="h-3.5 w-3.5" /> {errors.bodyWarning}
                  </p>
                )}

                {bodyVariables.length > 0 && (
                  <div className="mt-2 space-y-2 rounded-lg bg-ink-50 p-3 dark:bg-navy-900">
                    <p className="text-xs font-medium text-ink-500 dark:text-ink-400">Example values (needed for review)</p>
                    {bodyVariables.map((v, i) => (
                      <input
                        key={v}
                        type="text"
                        value={form.components.body.examples?.[i] || ''}
                        onChange={(e) => handleBodyExampleChange(i, e.target.value)}
                        placeholder={`Example for {{${v}}}`}
                        className="w-full rounded-md border border-ink-200 bg-white px-2.5 py-1.5 text-sm dark:border-navy-700 dark:bg-navy-950 dark:text-ink-100"
                      />
                    ))}
                    {touched && errors.bodyExamples && <p className="text-xs text-rose-500">{errors.bodyExamples}</p>}
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            {!isAuthentication && (
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700 dark:text-ink-200">Footer (optional)</label>
                <input
                  type="text"
                  value={form.components.footer.text}
                  onChange={(e) => updateField('components.footer.text', e.target.value)}
                  placeholder="Reply STOP to unsubscribe"
                  maxLength={LIMITS.FOOTER_TEXT_MAX}
                  className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm dark:border-navy-700 dark:bg-navy-900 dark:text-ink-100"
                />
                {touched && errors.footer && <p className="mt-1 text-xs text-rose-500">{errors.footer}</p>}
              </div>
            )}

            {/* Buttons */}
            {!isAuthentication && (
              <div>
                <label className="mb-1 block text-sm font-medium text-ink-700 dark:text-ink-200">Buttons (optional)</label>
                <ButtonsEditor
                  buttons={form.components.buttons}
                  onChange={(buttons) => updateField('components.buttons', buttons)}
                />
                {touched && errors.buttons && <p className="mt-1 text-xs text-rose-500">{errors.buttons}</p>}
              </div>
            )}

            {/* Authentication — Meta generates the actual message text;
             this only configures the pieces it fills in. No header, no
             custom body/footer text, no regular buttons for this
             category — see waConstants.js validateAuthenticationTemplate. */}
            {isAuthentication && (
              <div className="space-y-4 rounded-lg border border-ink-100 bg-ink-50/60 p-3 dark:border-navy-800 dark:bg-navy-900/40">
                <p className="text-xs text-ink-500 dark:text-ink-400">
                  Authentication templates use WhatsApp's fixed verification-code format — there's no header, and body/footer
                  text is generated by Meta, so only the options below apply.
                </p>

                <label className="flex items-center gap-2 text-sm text-ink-700 dark:text-ink-200">
                  <input
                    type="checkbox"
                    checked={form.components.authentication?.addSecurityRecommendation || false}
                    onChange={(e) => updateField('components.authentication.addSecurityRecommendation', e.target.checked)}
                    className="h-4 w-4 rounded border-ink-300"
                  />
                  Add security recommendation ("For your security, do not share this code")
                </label>

                <div>
                  <label className="mb-1 block text-sm font-medium text-ink-700 dark:text-ink-200">
                    Code expiration (minutes, optional)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={form.components.authentication?.codeExpirationMinutes || ''}
                    onChange={(e) =>
                      updateField(
                        'components.authentication.codeExpirationMinutes',
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                    placeholder="e.g. 5"
                    className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm dark:border-navy-700 dark:bg-navy-900 dark:text-ink-100"
                  />
                  <p className="mt-1 text-xs text-ink-400">Adds "This code expires in N minutes" to the footer.</p>
                  {touched && errors.authExpiration && <p className="mt-1 text-xs text-rose-500">{errors.authExpiration}</p>}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-ink-700 dark:text-ink-200">OTP delivery method</label>
                  <select
                    value={otpButton.otpType}
                    onChange={(e) => updateOtpButton({ otpType: e.target.value })}
                    className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm dark:border-navy-700 dark:bg-navy-900 dark:text-ink-100"
                  >
                    {OTP_TYPES.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>

                  {['ONE_TAP', 'ZERO_TAP'].includes(otpButton.otpType) && (
                    <div className="mt-2 space-y-2">
                      <input
                        type="text"
                        value={otpButton.packageName || ''}
                        onChange={(e) => updateOtpButton({ packageName: e.target.value })}
                        placeholder="Android package name (e.g. com.yourapp)"
                        className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm dark:border-navy-700 dark:bg-navy-900 dark:text-ink-100"
                      />
                      <input
                        type="text"
                        value={otpButton.signatureHash || ''}
                        onChange={(e) => updateOtpButton({ signatureHash: e.target.value })}
                        placeholder="App signing signature hash"
                        className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm dark:border-navy-700 dark:bg-navy-900 dark:text-ink-100"
                      />
                    </div>
                  )}
                  {touched && errors.authOtp && <p className="mt-1 text-xs text-rose-500">{errors.authOtp}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2 border-t border-ink-100 px-5 py-3 dark:border-navy-800">
            <button
              onClick={() => dispatch(closeForm())}
              className="rounded-lg px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-navy-800"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-50 disabled:opacity-50 dark:border-navy-700 dark:text-ink-200 dark:hover:bg-navy-800"
            >
              <Save className="h-4 w-4" /> Save as draft
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" /> {saving ? 'Submitting...' : 'Submit for review'}
            </button>
          </div>
        </div>

        {/* Live preview column */}
        <div className="hidden w-2/5 border-l border-ink-100 dark:border-navy-800 md:block">
          <TemplatePreview template={form} />
        </div>
      </div>
    </div>
  )
}