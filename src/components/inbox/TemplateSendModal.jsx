import { useState, useEffect, useMemo } from 'react'
import { X, Search, ChevronLeft, Send, FileText, Image as ImageIcon, Video, Link2, Phone, Copy, Upload } from 'lucide-react'
import templatesApi from '../../services/templatesAPI'
import messageApi from '../../services/messageApi'

const CATEGORY_TABS = [
  { value: 'ALL', label: 'All' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'UTILITY', label: 'Utility' },
  { value: 'AUTHENTICATION', label: 'Authentication' },
]

const extractVariables = (text = '') => [...text.matchAll(/\{\{\s*(\d+)\s*\}\}/g)].map((m) => m[1])

function fillPreview(text = '', values = []) {
  return text.replace(/\{\{\s*(\d+)\s*\}\}/g, (_, n) => {
    const v = values[Number(n) - 1]
    return v && v.trim() ? v : `{{${n}}}`
  })
}

export default function TemplateSendModal({ isOpen, onClose, onSend, interactionId }) {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('ALL')
  const [selected, setSelected] = useState(null)

  // variable values keyed per component: { header: '', body: ['', '', ...], buttons: { [buttonIndex]: '' } }
  const [headerValue, setHeaderValue] = useState('')
  const [bodyValues, setBodyValues] = useState([])
  const [buttonValues, setButtonValues] = useState({})
  const [sending, setSending] = useState(false)

  // Media header (IMAGE/VIDEO/DOCUMENT) — the media handle used when the
  // template was *created* is only for Meta's review process; every actual
  // send needs its own media reference. Uploaded here (reusing the same
  // /fileUpload route messages already use), and the resulting public URL
  // gets sent as the header parameter's `link`.
  const [headerMediaUrl, setHeaderMediaUrl] = useState('')
  const [headerMediaFilename, setHeaderMediaFilename] = useState('')
  const [headerMediaUploading, setHeaderMediaUploading] = useState(false)
  const [headerMediaError, setHeaderMediaError] = useState(null)

  useEffect(() => {
    if (!isOpen) return
    setSelected(null)
    setSearch('')
    setCategory('ALL')
    setLoadError(null)
    setLoading(true)

    templatesApi
      .list({ status: 'APPROVED' })
      .then((data) => setTemplates(Array.isArray(data) ? data : data?.data || []))
      .catch(() => setLoadError('Could not load templates. Try again.'))
      .finally(() => setLoading(false))
  }, [isOpen])

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      const matchesSearch = !search || t.name.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = category === 'ALL' || t.category === category
      return matchesSearch && matchesCategory
    })
  }, [templates, search, category])

  const headerVars = selected?.components?.header?.type === 'TEXT' ? extractVariables(selected.components.header.text) : []
  const bodyVars = selected ? extractVariables(selected.components?.body?.text || '') : []
  const urlButtonsWithVars = (selected?.components?.buttons || [])
    .map((b, i) => ({ ...b, index: i }))
    .filter((b) => b.type === 'URL' && extractVariables(b.url || '').length > 0)

  const isMediaHeader = ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(selected?.components?.header?.type)

  const handleSelectTemplate = (template) => {
    setSelected(template)
    setHeaderValue('')
    setBodyValues(Array(extractVariables(template.components?.body?.text || '').length).fill(''))
    setButtonValues({})
    setHeaderMediaUrl('')
    setHeaderMediaFilename('')
    setHeaderMediaError(null)
  }

  const handleHeaderMediaChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setHeaderMediaError(null)
    setHeaderMediaUploading(true)
    try {
      const result = await messageApi.uploadFile(file, interactionId)
      const url = result?.data?.url || result?.url
      if (!url) throw new Error('No URL returned')
      setHeaderMediaUrl(url)
      setHeaderMediaFilename(result?.data?.originalName || file.name)
    } catch {
      setHeaderMediaError('Could not upload — try again.')
    } finally {
      setHeaderMediaUploading(false)
    }
  }

  const handleBack = () => setSelected(null)

  const allFilled =
    (headerVars.length === 0 || headerValue.trim()) &&
    (!isMediaHeader || (headerMediaUrl && !headerMediaUploading)) &&
    bodyValues.every((v) => v.trim()) &&
    urlButtonsWithVars.every((b) => buttonValues[b.index]?.trim())

  const handleConfirmSend = () => {
    if (!selected || !allFilled) return
    setSending(true)

    const components = []

    if (selected.components?.header?.type === 'TEXT') {
      if (headerVars.length) {
        components.push({ type: 'header', parameters: [{ type: 'text', text: headerValue }] })
      }
    }

    // Media headers need their own reference for THIS send — the
    // template-creation-time media handle is only ever used for Meta's
    // review, never reused for actual messages.
    if (isMediaHeader && headerMediaUrl) {
      const mediaType = selected.components.header.type.toLowerCase() // image | video | document
      const mediaParam = { link: headerMediaUrl }
      if (mediaType === 'document' && headerMediaFilename) mediaParam.filename = headerMediaFilename
      components.push({
        type: 'header',
        parameters: [{ type: mediaType, [mediaType]: mediaParam }],
      })
    }

    if (bodyVars.length) {
      components.push({
        type: 'body',
        parameters: bodyVars.map((_, i) => ({ type: 'text', text: bodyValues[i] })),
      })
    }

    urlButtonsWithVars.forEach((b) => {
      components.push({
        type: 'button',
        sub_type: 'url',
        index: String(b.index),
        parameters: [{ type: 'text', text: buttonValues[b.index] }],
      })
    })

    // WhatsApp shows a TEXT header as its own bold line above the body —
    // this was only being captured for Meta's `components` payload, never
    // folded into what actually gets stored/shown as the message's own
    // text, so it never appeared in the thread (MessageBubble just
    // renders `message.message` as plain text).
    const headerText =
      selected.components?.header?.type === 'TEXT'
        ? fillPreview(selected.components.header.text || '', [headerValue])
        : ''
    const bodyText = fillPreview(selected.components?.body?.text || '', bodyValues)
    const previewText = headerText ? `${headerText}\n\n${bodyText}` : bodyText

    onSend({
      name: selected?.name,
      language: selected?.language,
      category: selected?.category,
      components,
      previewText,
      // So the sent message shows the actual media in the chat thread too,
      // not just in Meta's copy — MessageBubble renders from `attachments`,
      // which `components` alone doesn't feed.
      headerMedia:
        isMediaHeader && headerMediaUrl
          ? { type: selected.components.header.type, url: headerMediaUrl, filename: headerMediaFilename }
          : null,
    })

    setSending(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-white shadow-xl dark:bg-navy-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3 dark:border-navy-800">
          <div className="flex items-center gap-1.5">
            {selected && (
              <button onClick={handleBack} className="rounded-md p-1 text-ink-400 hover:bg-ink-100 dark:hover:bg-navy-800">
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <h3 className="text-base font-semibold text-ink-800 dark:text-white">
              {selected ? selected?.name || "" : 'Send a template'}
            </h3>
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 dark:hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {!selected ? (
            <>
              {/* Search + category tabs */}
              <div className="sticky top-0 space-y-2 border-b border-ink-100 bg-white p-3 dark:border-navy-800 dark:bg-navy-900">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search templates..."
                    className="w-full rounded-lg border border-ink-200 bg-ink-50 py-1.5 pl-8 pr-3 text-sm focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-400 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
                  />
                </div>
                <div className="flex gap-1.5 overflow-x-auto">
                  {CATEGORY_TABS.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setCategory(c.value)}
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                        category === c.value
                          ? 'bg-brand-600 text-white'
                          : 'bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-navy-800 dark:text-navy-300'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Template list */}
              <div className="divide-y divide-ink-100 dark:divide-navy-800">
                {loading && <p className="p-4 text-center text-sm text-ink-400">Loading templates...</p>}
                {loadError && <p className="p-4 text-center text-sm text-red-500">{loadError}</p>}
                {!loading && !loadError && filtered.length === 0 && (
                  <p className="p-4 text-center text-sm text-ink-400">No approved templates found.</p>
                )}
                {filtered.map((t) => (
                  <button
                    key={t._id}
                    onClick={() => handleSelectTemplate(t)}
                    className="flex w-full items-start gap-2.5 px-4 py-3 text-left hover:bg-ink-50 dark:hover:bg-navy-800"
                  >
                    {t.components?.header?.type === 'IMAGE' ? (
                      <ImageIcon className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
                    ) : (
                      <FileText className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-ink-800 dark:text-white">{t.name}</p>
                        <span className="shrink-0 rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-medium capitalize text-ink-500 dark:bg-navy-700 dark:text-navy-300">
                          {t.category?.toLowerCase()}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-ink-400">{t.components?.body?.text}</p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-4 p-4">
              {/* Live preview */}
              <div className="rounded-lg bg-ink-50 p-3 dark:bg-navy-800">
                {selected.components?.header?.type === 'TEXT' && (
                  <p className="mb-1 text-sm font-bold text-ink-800 dark:text-white">
                    {fillPreview(selected.components.header.text, [headerValue])}
                  </p>
                )}
                {selected.components?.header?.type === 'IMAGE' && (
                  <div className="mb-2 flex h-20 items-center justify-center overflow-hidden rounded bg-ink-200 text-ink-400 dark:bg-navy-700">
                    {headerMediaUrl ? (
                      <img src={headerMediaUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-6 w-6" />
                    )}
                  </div>
                )}
                {selected.components?.header?.type === 'VIDEO' && (
                  <div className="mb-2 flex h-20 items-center justify-center overflow-hidden rounded bg-ink-200 text-ink-400 dark:bg-navy-700">
                    {headerMediaUrl ? (
                      <video src={headerMediaUrl} className="h-full w-full object-cover" muted />
                    ) : (
                      <Video className="h-6 w-6" />
                    )}
                  </div>
                )}
                <p className="whitespace-pre-wrap text-sm text-ink-700 dark:text-navy-100">
                  {fillPreview(selected.components?.body?.text || '', bodyValues)}
                </p>
                {selected.components?.footer?.text && (
                  <p className="mt-1 text-xs text-ink-400">{selected.components.footer.text}</p>
                )}
                {selected.components?.buttons?.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {selected.components.buttons.map((b, i) => (
                      <div key={i} className="flex items-center justify-center gap-1.5 rounded-md bg-white py-1.5 text-xs font-medium text-brand-600 shadow-sm dark:bg-navy-900">
                        {b.type === 'URL' && <Link2 className="h-3 w-3" />}
                        {b.type === 'PHONE_NUMBER' && <Phone className="h-3 w-3" />}
                        {b.type === 'COPY_CODE' && <Copy className="h-3 w-3" />}
                        {b.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Variable inputs */}
              {headerVars.length > 0 && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-600 dark:text-navy-300">Header value</label>
                  <input
                    type="text"
                    value={headerValue}
                    onChange={(e) => setHeaderValue(e.target.value)}
                    placeholder={`Value for {{${headerVars[0]}}}`}
                    className="w-full rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm dark:border-navy-700 dark:bg-navy-800 dark:text-white"
                  />
                </div>
              )}

              {isMediaHeader && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-600 dark:text-navy-300">
                    {selected.components.header.type === 'IMAGE'
                      ? 'Image'
                      : selected.components.header.type === 'VIDEO'
                        ? 'Video'
                        : 'Document'}{' '}
                    to send
                  </label>
                  <p className="mb-1.5 text-[11px] text-ink-400">
                    This is sent fresh with this message — it's separate from the sample media used when the template
                    was submitted for review.
                  </p>
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-ink-300 px-3 py-2 text-xs text-ink-500 hover:border-brand-400 hover:text-brand-600 dark:border-navy-600 dark:text-navy-400">
                    <Upload className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {headerMediaUploading
                        ? 'Uploading...'
                        : headerMediaUrl
                          ? 'Uploaded — choose a different file'
                          : 'Choose a file'}
                    </span>
                    <input
                      type="file"
                      accept={
                        selected.components.header.type === 'IMAGE'
                          ? 'image/*'
                          : selected.components.header.type === 'VIDEO'
                            ? 'video/*'
                            : undefined
                      }
                      className="hidden"
                      onChange={handleHeaderMediaChange}
                    />
                  </label>
                  {headerMediaUrl && !headerMediaUploading && (
                    <p className="mt-1 truncate text-[11px] text-emerald-600">Ready to send</p>
                  )}
                  {headerMediaError && <p className="mt-1 text-[11px] text-rose-500">{headerMediaError}</p>}
                </div>
              )}

              {bodyVars.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-ink-600 dark:text-navy-300">Body values</label>
                  {bodyVars.map((v, i) => (
                    <input
                      key={v}
                      type="text"
                      value={bodyValues[i] || ''}
                      onChange={(e) => setBodyValues((prev) => { const next = [...prev]; next[i] = e.target.value; return next })}
                      placeholder={`Value for {{${v}}}`}
                      className="w-full rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm dark:border-navy-700 dark:bg-navy-800 dark:text-white"
                    />
                  ))}
                </div>
              )}

              {urlButtonsWithVars.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-ink-600 dark:text-navy-300">Button link values</label>
                  {urlButtonsWithVars.map((b) => (
                    <input
                      key={b.index}
                      type="text"
                      value={buttonValues[b.index] || ''}
                      onChange={(e) => setButtonValues((prev) => ({ ...prev, [b.index]: e.target.value }))}
                      placeholder={`Value for "${b.text}" link`}
                      className="w-full rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-sm dark:border-navy-700 dark:bg-navy-800 dark:text-white"
                    />
                  ))}
                </div>
              )}

              {headerVars.length === 0 && bodyVars.length === 0 && urlButtonsWithVars.length === 0 && (
                <p className="text-xs text-ink-400">This template has no variables to fill in.</p>
              )}
            </div>
          )}
        </div>

        {/* Footer action */}
        {selected && (
          <div className="flex justify-end gap-2 border-t border-ink-100 px-4 py-3 dark:border-navy-800">
            <button
              onClick={handleBack}
              className="rounded-lg border border-ink-200 px-4 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-100 dark:border-navy-700 dark:text-navy-300 dark:hover:bg-navy-800"
            >
              Back
            </button>
            <button
              onClick={handleConfirmSend}
              disabled={!allFilled || sending}
              className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" /> Send template
            </button>
          </div>
        )}
      </div>
    </div>
  )
}