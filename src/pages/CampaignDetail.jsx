import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Pause, Play, XCircle, Send, CheckCheck, Eye, AlertTriangle, Users, UserX, FlaskConical, Pencil, Trash2 } from 'lucide-react'
import Modal from '../components/common/Modal'
import Button from '../components/common/Button'
import { Skeleton } from '../components/common/Loader'
import campaignApi from '../services/campaignApi'
import {
  fetchCampaign,
  fetchRecipients,
  pauseCampaign,
  resumeCampaign,
  cancelCampaign,
  scheduleCampaign,
  deleteCampaign,
  clearCurrentCampaign,
  selectCurrentCampaign,
  selectCurrentCampaignStatus,
  selectRecipients,
  selectRecipientsStatus
} from '../features/campaigns/campaignsSlice'
import CreateCampaignModal from '../components/campaigns/CreateCampaignModal'

const STAT_CARDS = [
  { key: 'total', label: 'Total recipients', icon: Users, tone: 'text-brand-600' },
  { key: 'sent', label: 'Sent', icon: Send, tone: 'text-sky-600' },
  { key: 'delivered', label: 'Delivered', icon: CheckCheck, tone: 'text-emerald-600' },
  { key: 'read', label: 'Read', icon: Eye, tone: 'text-violet-600' },
  { key: 'failed', label: 'Failed', icon: AlertTriangle, tone: 'text-rose-600' },
  { key: 'skipped', label: 'Skipped (opted out)', icon: UserX, tone: 'text-ink-500' }
]

const RECIPIENT_STATUS_FILTERS = ['ALL', 'PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'SKIPPED_OPTOUT']

function TestSendModal({ campaign, open, onClose }) {
  const [phone, setPhone] = useState('')
  const [values, setValues] = useState({})
  const [mediaUrl, setMediaUrl] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState(null)

  const perContactVars = campaign?.resolvedVariables?.filter((v) => v.mode === 'per_contact') || []
  const isPerContactMedia = campaign?.resolvedMedia?.mode === 'per_contact'

  const handleSend = async () => {
    if (!phone.trim()) return
    setSending(true)
    setResult(null)
    try {
      await campaignApi.sendTest(campaign._id, {
        phone: phone.trim(),
        testValues: values,
        testMediaUrl: isPerContactMedia ? mediaUrl : undefined
      })
      setResult({ ok: true })
    } catch (err) {
      setResult({ ok: false, message: err?.response?.data?.message || 'Could not send test message.' })
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Send test message"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Close</Button>
          <Button onClick={handleSend} isLoading={sending}>Send test</Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-xs text-ink-500 dark:text-navy-400">
          Sends the real template to one number right now — doesn't count toward this campaign's stats or recipient list.
        </p>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-600 dark:text-navy-300">Your WhatsApp number</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+92 300 1234567"
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm dark:border-navy-700 dark:bg-navy-900 dark:text-ink-100"
          />
        </div>

        {perContactVars.map((v) => (
          <div key={`${v.component}-${v.position}`}>
            <label className="mb-1 block text-xs font-medium text-ink-600 dark:text-navy-300">
              Value for "{v.name}"
            </label>
            <input
              value={values[v.name] || ''}
              onChange={(e) => setValues((prev) => ({ ...prev, [v.name]: e.target.value }))}
              className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm dark:border-navy-700 dark:bg-navy-900 dark:text-ink-100"
            />
          </div>
        ))}

        {isPerContactMedia && (
          <div>
            <label className="mb-1 block text-xs font-medium text-ink-600 dark:text-navy-300">Test media URL</label>
            <input
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm dark:border-navy-700 dark:bg-navy-900 dark:text-ink-100"
            />
          </div>
        )}

        {result?.ok && <p className="text-xs text-emerald-600">Sent — check your WhatsApp.</p>}
        {result && !result.ok && <p className="text-xs text-rose-500">{result.message}</p>}
      </div>
    </Modal>
  )
}

export default function CampaignDetail() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const campaign = useSelector(selectCurrentCampaign)
  const status = useSelector(selectCurrentCampaignStatus)
  const recipients = useSelector(selectRecipients)
  const recipientsStatus = useSelector(selectRecipientsStatus)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [actionLoading, setActionLoading] = useState(false)
  const [testModalOpen, setTestModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)

  useEffect(() => {
    dispatch(fetchCampaign(id))
    dispatch(fetchRecipients({ id }))
    return () => dispatch(clearCurrentCampaign())
  }, [dispatch, id])

  // Simple polling while the campaign is actively sending — good enough
  // freshness for a dashboard without the complexity of wiring a
  // dedicated real-time channel just for this page. See the earlier
  // Analytics dashboard discussion for why polling was chosen there too.
  useEffect(() => {
    if (campaign?.status !== 'RUNNING') return undefined
    const interval = setInterval(() => {
      dispatch(fetchCampaign(id))
      dispatch(fetchRecipients({ id, status: statusFilter === 'ALL' ? undefined : statusFilter }))
    }, 15000)
    return () => clearInterval(interval)
  }, [campaign?.status, dispatch, id, statusFilter])

  const handleFilterChange = (value) => {
    setStatusFilter(value)
    dispatch(fetchRecipients({ id, status: value === 'ALL' ? undefined : value }))
  }

  const runAction = async (thunk) => {
    setActionLoading(true)
    try {
      await dispatch(thunk(id)).unwrap()
    } finally {
      setActionLoading(false)
    }
  }

  if (status === 'loading' && !campaign) {
    return (
      <div className="p-6">
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    )
  }

  if (!campaign) return null

  return (
    <div className="h-full overflow-y-auto scroll-thin p-4 lg:p-6">
      <button
        onClick={() => navigate('/app/campaigns')}
        className="mb-4 flex items-center gap-1.5 text-xs text-ink-500 hover:text-ink-700 dark:text-navy-400"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to campaigns
      </button>

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900 dark:text-white">{campaign.name}</h1>
          <p className="text-sm text-ink-500 dark:text-navy-400">{campaign.status} · Template: {campaign.template?.name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={FlaskConical} onClick={() => setTestModalOpen(true)}>
            Send test
          </Button>
          {campaign.status === 'DRAFT' && (
            <Button variant="secondary" icon={Pencil} onClick={() => setEditModalOpen(true)}>
              Edit
            </Button>
          )}
          {campaign.status === 'DRAFT' && (
            <Button icon={Play} onClick={() => runAction(scheduleCampaign)} isLoading={actionLoading}>
              Schedule
            </Button>
          )}
          {campaign.status === 'RUNNING' && (
            <Button variant="secondary" icon={Pause} onClick={() => runAction(pauseCampaign)} isLoading={actionLoading}>
              Pause
            </Button>
          )}
          {campaign.status === 'PAUSED' && (
            <Button icon={Play} onClick={() => runAction(resumeCampaign)} isLoading={actionLoading}>
              Resume
            </Button>
          )}
          {['SCHEDULED', 'RUNNING', 'PAUSED'].includes(campaign.status) && (
            <Button variant="secondary" icon={XCircle} onClick={() => runAction(cancelCampaign)} isLoading={actionLoading}>
              Cancel
            </Button>
          )}
          {['DRAFT', 'CANCELLED', 'COMPLETED'].includes(campaign.status) && (
            <Button
              variant="secondary"
              icon={Trash2}
              onClick={async () => {
                if (window.confirm('Delete this campaign? This cannot be undone.')) {
                  await dispatch(deleteCampaign(campaign._id)).unwrap()
                  navigate('/app/campaigns')
                }
              }}
            >
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Schedule */}
      <div className="mb-4 grid grid-cols-2 gap-3 rounded-xl border border-ink-100 bg-white p-3 text-sm dark:border-navy-800 dark:bg-navy-900 sm:grid-cols-4">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-ink-400">Starts</p>
          <p className="text-ink-800 dark:text-navy-200">{new Date(campaign.startAt).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-ink-400">Ends</p>
          <p className="text-ink-800 dark:text-navy-200">{new Date(campaign.endAt).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-ink-400">Rate</p>
          <p className="text-ink-800 dark:text-navy-200">{campaign.rateLimitPerMinute}/min</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-ink-400">Queue</p>
          <p className="text-ink-800 dark:text-navy-200">{campaign.queue}</p>
        </div>
      </div>

      {/* Template + variable mapping */}
      <div className="mb-4 rounded-xl border border-ink-100 bg-white p-3 dark:border-navy-800 dark:bg-navy-900">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-ink-400">Template</p>

        {campaign.template?.header?.type && campaign.template.header.type !== 'NONE' && (
          <p className="mb-1 text-xs text-ink-500 dark:text-navy-400">
            Header ({campaign.template.header.type}):{' '}
            {campaign.template.header.type === 'TEXT'
              ? campaign.template.header.text
              : <em>media — resolved per recipient at send time</em>}
          </p>
        )}
        <p className="whitespace-pre-wrap text-sm text-ink-800 dark:text-navy-200">{campaign.template?.body?.text}</p>

        {campaign.resolvedVariables?.length > 0 && (
          <div className="mt-3 border-t border-ink-100 pt-2 dark:border-navy-800">
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-ink-400">Variables</p>
            <div className="flex flex-wrap gap-3 text-xs">
              {campaign.resolvedVariables.map((v) => (
                <span key={`${v.component}-${v.position}`} className="rounded-md bg-ink-50 px-2 py-1 text-ink-600 dark:bg-navy-800 dark:text-navy-300">
                  {v.name} →{' '}
                  <span className="font-medium">{v.mode === 'per_contact' ? 'per contact' : v.value}</span>
                </span>
              ))}
              {campaign.resolvedMedia?.mode && (
                <span className="rounded-md bg-ink-50 px-2 py-1 text-ink-600 dark:bg-navy-800 dark:text-navy-300">
                  media →{' '}
                  <span className="font-medium">
                    {campaign.resolvedMedia.mode === 'per_contact' ? 'per contact' : 'shared file'}
                  </span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {STAT_CARDS.map(({ key, label, icon: Icon, tone }) => (
          <div key={key} className="rounded-xl border border-ink-100 bg-white p-3 dark:border-navy-800 dark:bg-navy-900">
            <Icon className={`h-4 w-4 ${tone}`} />
            <p className="mt-1.5 text-xl font-semibold text-ink-900 dark:text-white">{campaign.stats?.[key] ?? 0}</p>
            <p className="text-[11px] text-ink-500 dark:text-navy-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-5">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {RECIPIENT_STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => handleFilterChange(s)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                statusFilter === s
                  ? 'bg-brand-600 text-white'
                  : 'bg-ink-100 text-ink-600 dark:bg-navy-800 dark:text-navy-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {recipientsStatus === 'loading' ? (
          <div className="space-y-1.5">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9 w-full rounded-md" />)}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-ink-100 dark:border-navy-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-ink-50 text-[11px] uppercase tracking-wide text-ink-400 dark:bg-navy-900 dark:text-navy-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Phone</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Sent at</th>
                  <th className="px-3 py-2 font-medium">Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 dark:divide-navy-800">
                {recipients.items.map((r) => (
                  <tr key={r._id}>
                    <td className="px-3 py-2 text-ink-700 dark:text-navy-200">{r.phone}</td>
                    <td className="px-3 py-2">{r.status}</td>
                    <td className="px-3 py-2 text-ink-400">{r.sentAt ? new Date(r.sentAt).toLocaleString() : '—'}</td>
                    <td className="px-3 py-2 text-rose-500">{r.error || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recipients.items.length === 0 && (
              <p className="py-8 text-center text-xs text-ink-400">No recipients in this status.</p>
            )}
          </div>
        )}
      </div>

      <TestSendModal campaign={campaign} open={testModalOpen} onClose={() => setTestModalOpen(false)} />
      <CreateCampaignModal open={editModalOpen} onClose={() => setEditModalOpen(false)} editingCampaign={editModalOpen ? campaign : null} />
    </div>
  )
}
