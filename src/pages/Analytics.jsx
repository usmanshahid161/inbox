import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { MessagesSquare, Inbox as InboxIcon, CheckCircle2, MailWarning, Headphones, Send } from 'lucide-react'
import { fetchAnalytics, selectAnalyticsData, selectAnalyticsStatus } from '../features/analytics/analyticsSlice'
import { Skeleton } from '../components/common/Loader'
import { channelLabel } from '../components/common/ChannelIcon'

const STAT_CARDS = [
  { key: 'totalConversations', label: 'Total conversations', icon: MessagesSquare },
  { key: 'openConversations', label: 'Open conversations', icon: InboxIcon },
  { key: 'closedConversations', label: 'Closed conversations', icon: CheckCircle2 },
  { key: 'unreadMessages', label: 'Unread messages', icon: MailWarning },
  { key: 'activeAgents', label: 'Active agents', icon: Headphones },
  { key: 'messagesToday', label: 'Messages today', icon: Send }
]

function BarChart({ items, valueKey, labelKey, tone = 'bg-brand-500' }) {
  const max = Math.max(...items.map((i) => i[valueKey]), 1)
  return (
    <div className="flex h-40 items-end gap-3">
      {items.map((item) => (
        <div key={item[labelKey]} className="flex flex-1 flex-col items-center gap-1.5">
          <span className="text-xs font-medium text-ink-500 dark:text-navy-400">{item[valueKey]}</span>
          <div className="flex h-28 w-full items-end rounded-md bg-ink-100 dark:bg-navy-800">
            <div
              className={`w-full rounded-md ${tone}`}
              style={{ height: `${Math.max(6, (item[valueKey] / max) * 100)}%` }}
            />
          </div>
          <span className="text-[11px] text-ink-400 dark:text-navy-500">{item[labelKey]}</span>
        </div>
      ))}
    </div>
  )
}

export default function Analytics() {
  const dispatch = useDispatch()
  const data = useSelector(selectAnalyticsData)
  const status = useSelector(selectAnalyticsStatus)

  useEffect(() => {
    dispatch(fetchAnalytics())
  }, [dispatch])

  if (status === 'loading' && !data) {
    return (
      <div className="grid grid-cols-2 gap-4 p-4 lg:grid-cols-3 lg:p-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="h-full overflow-y-auto scroll-thin p-4 lg:p-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {STAT_CARDS.map(({ key, label, icon: Icon }) => (
          <div key={key} className="rounded-xl border border-ink-100 bg-white p-4 dark:border-navy-800 dark:bg-navy-900">
            <Icon className="h-4 w-4 text-brand-500" />
            <p className="mt-2 text-2xl font-semibold text-ink-900 dark:text-white">{data[key]}</p>
            <p className="text-xs text-ink-500 dark:text-navy-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-ink-100 bg-white p-5 dark:border-navy-800 dark:bg-navy-900">
          <h3 className="mb-4 text-sm font-semibold text-ink-900 dark:text-white">Messages this week</h3>
          <BarChart items={data.volumeByDay} valueKey="count" labelKey="day" />
        </div>
        <div className="rounded-xl border border-ink-100 bg-white p-5 dark:border-navy-800 dark:bg-navy-900">
          <h3 className="mb-4 text-sm font-semibold text-ink-900 dark:text-white">Conversations by channel</h3>
          <BarChart
            items={data.channelBreakdown.map((c) => ({ ...c, label: channelLabel(c.channel) }))}
            valueKey="count"
            labelKey="label"
            tone="bg-brand-400"
          />
        </div>
      </div>
    </div>
  )
}
