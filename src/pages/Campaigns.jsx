import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Plus, Megaphone, Pencil, Trash2, Play } from 'lucide-react'
import Button from '../components/common/Button'
import { Skeleton } from '../components/common/Loader'
import CreateCampaignModal from '../components/campaigns/CreateCampaignModal'
import {
  fetchCampaigns,
  deleteCampaign,
  scheduleCampaign,
  selectCampaigns,
  selectCampaignsStatus
} from '../features/campaigns/campaignsSlice'

const STATUS_STYLES = {
  DRAFT: 'bg-ink-100 text-ink-600 dark:bg-navy-800 dark:text-navy-300',
  SCHEDULED: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  RUNNING: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  PAUSED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  COMPLETED: 'bg-ink-100 text-ink-600 dark:bg-navy-800 dark:text-navy-300',
  CANCELLED: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
}

const DELETABLE_STATUSES = ['DRAFT', 'CANCELLED', 'COMPLETED']

export default function Campaigns() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const campaigns = useSelector(selectCampaigns)
  const status = useSelector(selectCampaignsStatus)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState(null)

  useEffect(() => {
    dispatch(fetchCampaigns())
  }, [dispatch])

  const handleEdit = (e, campaign) => {
    e.stopPropagation()
    setEditingCampaign(campaign)
  }

  const handleDelete = (e, id) => {
    e.stopPropagation()
    if (window.confirm('Delete this campaign? This cannot be undone.')) {
      dispatch(deleteCampaign(id))
    }
  }

  const handleSchedule = (e, id) => {
    e.stopPropagation()
    dispatch(scheduleCampaign(id))
  }

  const closeModal = () => {
    setCreateOpen(false)
    setEditingCampaign(null)
  }

  return (
    <div className="h-full overflow-y-auto scroll-thin p-4 lg:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900 dark:text-white">Campaigns</h1>
          <p className="text-sm text-ink-500 dark:text-navy-400">Bulk WhatsApp template sends, scheduled and rate-limited.</p>
        </div>
        <Button icon={Plus} onClick={() => setCreateOpen(true)}>New campaign</Button>
      </div>

      {status === 'loading' && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      )}

      {status === 'succeeded' && campaigns.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <Megaphone className="mb-2 h-8 w-8 text-ink-300" />
          <p className="text-sm text-ink-400 dark:text-navy-500">No campaigns yet.</p>
        </div>
      )}

      {status === 'succeeded' && campaigns.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-ink-100 dark:border-navy-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink-50 text-xs uppercase tracking-wide text-ink-400 dark:bg-navy-900 dark:text-navy-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Starts</th>
                <th className="px-4 py-3 font-medium">Ends</th>
                <th className="px-4 py-3 font-medium">Sent / Total</th>
                <th className="px-4 py-3 font-medium">Delivered</th>
                <th className="px-4 py-3 font-medium">Read</th>
                <th className="px-4 py-3 font-medium">Failed</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100 dark:divide-navy-800">
              {campaigns.map((c) => (
                <tr
                  key={c._id}
                  onClick={() => navigate(`/app/campaigns/${c._id}`)}
                  className="cursor-pointer hover:bg-ink-50 dark:hover:bg-navy-900"
                >
                  <td className="px-4 py-3 font-medium text-ink-900 dark:text-white">{c.name}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[c.status] || ''}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-500 dark:text-navy-400">{new Date(c.startAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-ink-500 dark:text-navy-400">{new Date(c.endAt).toLocaleString()}</td>
                  <td className="px-4 py-3 text-ink-600 dark:text-navy-300">{c.stats?.sent ?? 0} / {c.stats?.total ?? 0}</td>
                  <td className="px-4 py-3 text-ink-600 dark:text-navy-300">{c.stats?.delivered ?? 0}</td>
                  <td className="px-4 py-3 text-ink-600 dark:text-navy-300">{c.stats?.read ?? 0}</td>
                  <td className="px-4 py-3 text-rose-500">{c.stats?.failed ?? 0}</td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                      {c.status === 'DRAFT' && (
                        <button
                          title="Schedule"
                          onClick={(e) => handleSchedule(e, c._id)}
                          className="text-ink-300 hover:text-emerald-600"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                      )}
                      {c.status === 'DRAFT' && (
                        <button title="Edit" onClick={(e) => handleEdit(e, c)} className="text-ink-300 hover:text-brand-600">
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                      {DELETABLE_STATUSES.includes(c.status) && (
                        <button title="Delete" onClick={(e) => handleDelete(e, c._id)} className="text-ink-300 hover:text-rose-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateCampaignModal open={createOpen || Boolean(editingCampaign)} onClose={closeModal} editingCampaign={editingCampaign} />
    </div>
  )
}
