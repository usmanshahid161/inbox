import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Upload, CheckCircle2, AlertCircle } from 'lucide-react'
import Modal from '../common/Modal'
import Button from '../common/Button'
import messageApi from '../../services/messageApi'
import campaignApi from '../../services/campaignApi'
import { fetchContactLists, selectContactLists, createCampaign, updateCampaign, scheduleCampaign, selectSaving, selectSaveError } from '../../features/campaigns/campaignsSlice'
import { fetchQueues, selectAllQueues } from '../../features/queues/queuesSlice'
import { fetchFlows, selectFlowsList } from '../../features/flows/flowsSlice'
import { fetchWhatsappNumbers, selectWhatsappNumbers } from '../../features/whatsappChannel/whatsappNumbersSlice'
import { fetchTemplates, selectAllTemplates } from '../../features/templates/templatesSlice'

const inputClass =
  'w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm dark:border-navy-700 dark:bg-navy-900 dark:text-ink-100'
const labelClass = 'mb-1 block text-xs font-medium text-ink-600 dark:text-navy-300'

function extractPositions(text) {
  const matches = [...(text || '').matchAll(/\{\{\s*(\d+)\s*\}\}/g)].map((m) => m[1])
  return [...new Set(matches)].sort((a, b) => Number(a) - Number(b))
}

function extractTemplateVariables(template) {
  const variables = []
  const headerType = template?.components?.header?.type
  if (headerType === 'TEXT') {
    const positions = extractPositions(template.components.header.text)
    if (positions.length) {
      variables.push({ component: 'header', position: positions[0], name: template.components.header.variableName || 'header_1' })
    }
  }
  const bodyPositions = extractPositions(template?.components?.body?.text)
  bodyPositions.forEach((pos) => {
    variables.push({ component: 'body', position: pos, name: template.components?.body?.variableNames?.[Number(pos) - 1] || `body_${pos}` })
  })
  return variables
}

function needsMedia(template) {
  return ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(template?.components?.header?.type)
}

function toLocalInputValue(isoString) {
  if (!isoString) return ''
  const d = new Date(isoString)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function CreateCampaignModal({ open, onClose, editingCampaign }) {
  const dispatch = useDispatch()
  const contactLists = useSelector(selectContactLists)
  const queues = useSelector(selectAllQueues)
  const flows = useSelector(selectFlowsList)
  const numbers = useSelector(selectWhatsappNumbers)
  const templates = useSelector(selectAllTemplates)
  const saving = useSelector(selectSaving)
  const saveError = useSelector(selectSaveError)

  const approvedTemplates = useMemo(() => (templates || []).filter((t) => t.status === 'APPROVED'), [templates])

  const [form, setForm] = useState({
    name: '', contactListId: '', templateId: '', queue: '', extension: '', flowId: '',
    rateLimitPerMinute: 20, startAt: '', endAt: ''
  })
  // { [variableName]: { mode: 'per_contact'|'shared', value: '' } }
  const [variableChoices, setVariableChoices] = useState({})
  const [mediaChoice, setMediaChoice] = useState({ mode: 'shared', sharedUrl: '' })
  const [coverage, setCoverage] = useState(null) // { variables: [{name,total,covered,complete}], media: {...} }
  const [coverageLoading, setCoverageLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (!open) return
    dispatch(fetchContactLists())
    dispatch(fetchQueues())
    dispatch(fetchFlows())
    dispatch(fetchWhatsappNumbers())
    dispatch(fetchTemplates())

    if (editingCampaign) {
      setForm({
        name: editingCampaign.name || '',
        contactListId: editingCampaign.contactListId || '',
        templateId: editingCampaign.template?.templateId || '',
        queue: editingCampaign.queue || '',
        extension: editingCampaign.extension || '',
        flowId: editingCampaign.flowId || '',
        rateLimitPerMinute: editingCampaign.rateLimitPerMinute || 20,
        startAt: toLocalInputValue(editingCampaign.startAt),
        endAt: toLocalInputValue(editingCampaign.endAt)
      })
      const choices = {}
      ;(editingCampaign.resolvedVariables || []).forEach((v) => {
        choices[v.name] = { mode: v.mode, value: v.value || '' }
      })
      setVariableChoices(choices)
      setMediaChoice(editingCampaign.resolvedMedia?.mode ? { mode: editingCampaign.resolvedMedia.mode, sharedUrl: editingCampaign.resolvedMedia.sharedUrl || '' } : { mode: 'shared', sharedUrl: '' })
    } else {
      setForm({ name: '', contactListId: '', templateId: '', queue: '', extension: '', flowId: '', rateLimitPerMinute: 20, startAt: '', endAt: '' })
      setVariableChoices({})
      setMediaChoice({ mode: 'shared', sharedUrl: '' })
    }
  }, [open, editingCampaign, dispatch])

  const selectedTemplate = approvedTemplates.find((t) => t._id === form.templateId)
  const templateVars = selectedTemplate ? extractTemplateVariables(selectedTemplate) : []
  const templateNeedsMedia = selectedTemplate ? needsMedia(selectedTemplate) : false

  // Whenever both a list and a template are picked, check how much of
  // this list's data already covers what the template needs — and
  // default each variable to "per contact" only when every contact
  // actually has it, "shared" otherwise (so nobody accidentally launches
  // a campaign with half its recipients missing a value).
  useEffect(() => {
    if (!form.contactListId || !selectedTemplate) {
      setCoverage(null)
      return
    }
    const columnNames = templateVars.map((v) => v.name)
    setCoverageLoading(true)
    campaignApi
      .getListCoverage(form.contactListId, columnNames)
      .then((result) => {
        setCoverage(result)
        setVariableChoices((prev) => {
          const next = { ...prev }
          result.variables.forEach((cov) => {
            if (!next[cov.name]) {
              next[cov.name] = { mode: cov.complete ? 'per_contact' : 'shared', value: '' }
            }
          })
          return next
        })
        if (templateNeedsMedia) {
          setMediaChoice((prev) => (prev.mode ? prev : { mode: result.media.complete ? 'per_contact' : 'shared', sharedUrl: '' }))
        }
      })
      .finally(() => setCoverageLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.contactListId, form.templateId])

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  const handleMediaUpload = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      const result = await messageApi.uploadFile(file)
      setMediaChoice((prev) => ({ ...prev, sharedUrl: result?.data?.url || '' }))
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (saveAsDraft) => {
    const variableConfig = templateVars.map((v) => ({
      component: v.component,
      position: v.position,
      name: v.name,
      mode: variableChoices[v.name]?.mode || 'per_contact',
      value: variableChoices[v.name]?.mode === 'shared' ? variableChoices[v.name]?.value : undefined
    }))

    const payload = {
      ...form,
      rateLimitPerMinute: Number(form.rateLimitPerMinute),
      flowId: form.flowId || undefined,
      variableConfig,
      mediaConfig: templateNeedsMedia ? mediaChoice : undefined,
      saveAsDraft
    }
    try {
      if (editingCampaign) {
        await dispatch(updateCampaign({ id: editingCampaign._id, payload })).unwrap()
        if (!saveAsDraft) await dispatch(scheduleCampaign(editingCampaign._id)).unwrap()
      } else {
        await dispatch(createCampaign(payload)).unwrap()
      }
      onClose()
    } catch {
      // saveError already reflects this in state
    }
  }

  const coverageFor = (name) => coverage?.variables?.find((c) => c.name === name)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingCampaign ? 'Edit campaign' : 'New campaign'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="secondary" onClick={() => handleSubmit(true)} isLoading={saving}>
            {editingCampaign ? 'Save changes' : 'Save as draft'}
          </Button>
          <Button onClick={() => handleSubmit(false)} isLoading={saving}>
            {editingCampaign ? 'Save & schedule' : 'Schedule campaign'}
          </Button>
        </>
      }
    >
      <div className="max-h-[65vh] space-y-4 overflow-y-auto scroll-thin pr-1">
        <div>
          <label className={labelClass}>Campaign name</label>
          <input value={form.name} onChange={(e) => update('name', e.target.value)} className={inputClass} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Contact list</label>
            <select value={form.contactListId} onChange={(e) => update('contactListId', e.target.value)} className={inputClass}>
              <option value="">Select list</option>
              {contactLists.map((l) => (
                <option key={l._id} value={l._id}>{l.name} ({l.contactCount})</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Template (approved only)</label>
            <select value={form.templateId} onChange={(e) => update('templateId', e.target.value)} className={inputClass}>
              <option value="">Select template</option>
              {approvedTemplates.map((t) => (
                <option key={t._id} value={t._id}>{t.name} ({t.language})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Send from (WhatsApp number)</label>
            <select value={form.extension} onChange={(e) => update('extension', e.target.value)} className={inputClass}>
              <option value="">Select number</option>
              {numbers.map((n) => (
                <option key={n._id} value={n.phoneNumber}>{n.displayName || n.phoneNumber}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Queue (required — routes replies)</label>
            <select value={form.queue} onChange={(e) => update('queue', e.target.value)} className={inputClass}>
              <option value="">Select queue</option>
              {queues.map((q) => (
                <option key={q._id} value={q.slug}>{q.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Flow on reply (optional)</label>
          <select value={form.flowId} onChange={(e) => update('flowId', e.target.value)} className={inputClass}>
            <option value="">None — straight to queue</option>
            {flows.map((f) => (
              <option key={f._id} value={f._id}>{f.name}</option>
            ))}
          </select>
        </div>

        {selectedTemplate && (
          <div className="rounded-lg border border-ink-100 bg-ink-50/50 p-3 dark:border-navy-800 dark:bg-navy-900/40">
            {selectedTemplate.components?.header?.type === 'TEXT' && (
              <p className="mb-1 text-xs font-medium text-ink-700 dark:text-navy-200">{selectedTemplate.components.header.text}</p>
            )}
            <p className="mb-2 whitespace-pre-wrap text-xs text-ink-600 dark:text-navy-300">{selectedTemplate.components?.body?.text}</p>

            {!form.contactListId && (
              <p className="text-[11px] text-ink-400">Pick a contact list to see which variables it already covers.</p>
            )}

            {form.contactListId && coverageLoading && <p className="text-[11px] text-ink-400">Checking list coverage...</p>}

            {form.contactListId && !coverageLoading && templateVars.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-ink-400">Variables</p>
                {templateVars.map((v) => {
                  const cov = coverageFor(v.name)
                  const choice = variableChoices[v.name] || { mode: 'per_contact', value: '' }
                  return (
                    <div key={v.name} className="rounded-md border border-ink-100 bg-white p-2 dark:border-navy-800 dark:bg-navy-950">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-xs font-medium text-ink-700 dark:text-navy-200">{v.name}</span>
                        {cov && (
                          <span className={`flex items-center gap-1 text-[10px] ${cov.complete ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {cov.complete ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                            {cov.covered}/{cov.total} contacts have this
                          </span>
                        )}
                      </div>
                      <div className="flex gap-3 text-xs">
                        <label className="flex items-center gap-1.5">
                          <input
                            type="radio"
                            checked={choice.mode === 'per_contact'}
                            onChange={() => setVariableChoices((prev) => ({ ...prev, [v.name]: { ...choice, mode: 'per_contact' } }))}
                          />
                          Use list data {cov && !cov.complete && <span className="text-amber-600">(incomplete)</span>}
                        </label>
                        <label className="flex items-center gap-1.5">
                          <input
                            type="radio"
                            checked={choice.mode === 'shared'}
                            onChange={() => setVariableChoices((prev) => ({ ...prev, [v.name]: { ...choice, mode: 'shared' } }))}
                          />
                          Same for everyone
                        </label>
                      </div>
                      {choice.mode === 'shared' && (
                        <input
                          value={choice.value}
                          onChange={(e) => setVariableChoices((prev) => ({ ...prev, [v.name]: { ...choice, value: e.target.value } }))}
                          placeholder={`Value for ${v.name}`}
                          className="mt-1.5 w-full rounded-md border border-ink-200 bg-white px-2 py-1 text-xs dark:border-navy-700 dark:bg-navy-900"
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {form.contactListId && !coverageLoading && templateNeedsMedia && (
              <div className="mt-2 rounded-md border border-ink-100 bg-white p-2 dark:border-navy-800 dark:bg-navy-950">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-medium text-ink-700 dark:text-navy-200">Media ({selectedTemplate.components.header.type})</span>
                  {coverage?.media && (
                    <span className={`flex items-center gap-1 text-[10px] ${coverage.media.complete ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {coverage.media.complete ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                      {coverage.media.covered}/{coverage.media.total} contacts have this
                    </span>
                  )}
                </div>
                <div className="flex gap-3 text-xs">
                  <label className="flex items-center gap-1.5">
                    <input type="radio" checked={mediaChoice.mode === 'per_contact'} onChange={() => setMediaChoice((prev) => ({ ...prev, mode: 'per_contact' }))} />
                    Use list data
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="radio" checked={mediaChoice.mode === 'shared'} onChange={() => setMediaChoice((prev) => ({ ...prev, mode: 'shared' }))} />
                    Same file for everyone
                  </label>
                </div>
                {mediaChoice.mode === 'shared' && (
                  <label className="mt-1.5 flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-ink-300 px-3 py-1.5 text-xs text-ink-500 hover:border-brand-400 dark:border-navy-600">
                    <Upload className="h-3.5 w-3.5" />
                    {uploading ? 'Uploading...' : mediaChoice.sharedUrl ? 'Uploaded — choose different file' : 'Choose a file'}
                    <input type="file" className="hidden" onChange={handleMediaUpload} disabled={uploading} />
                  </label>
                )}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelClass}>Rate (messages/min)</label>
            <input type="number" min={1} value={form.rateLimitPerMinute} onChange={(e) => update('rateLimitPerMinute', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Start at</label>
            <input type="datetime-local" value={form.startAt} onChange={(e) => update('startAt', e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>End at</label>
            <input type="datetime-local" value={form.endAt} onChange={(e) => update('endAt', e.target.value)} className={inputClass} />
          </div>
        </div>

        {saveError && <p className="text-xs text-rose-500">{typeof saveError === 'string' ? saveError : saveError?.message}</p>}
      </div>
    </Modal>
  )
}
