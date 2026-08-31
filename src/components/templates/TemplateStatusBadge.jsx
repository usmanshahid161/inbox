import { Clock, CheckCircle2, XCircle, FileEdit, PauseCircle, Ban } from 'lucide-react'

const STATUS_STYLES = {
  DRAFT: {
    label: 'Draft',
    icon: FileEdit,
    classes: 'bg-ink-100 text-ink-600 dark:bg-navy-800 dark:text-ink-300',
  },
  PENDING: {
    label: 'Pending',
    icon: Clock,
    classes: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  },
  APPROVED: {
    label: 'Approved',
    icon: CheckCircle2,
    classes: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  },
  REJECTED: {
    label: 'Rejected',
    icon: XCircle,
    classes: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
  },
  PAUSED: {
    label: 'Paused',
    icon: PauseCircle,
    classes: 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400',
  },
  DISABLED: {
    label: 'Disabled',
    icon: Ban,
    classes: 'bg-ink-200 text-ink-500 dark:bg-navy-700 dark:text-ink-400',
  },
}

export function TemplateStatusBadge({ status }) {
  const cfg = STATUS_STYLES[status] || STATUS_STYLES.DRAFT
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.classes}`}>
      <Icon className="h-3.5 w-3.5" />
      {cfg.label}
    </span>
  )
}

const CATEGORY_STYLES = {
  MARKETING: 'bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400',
  UTILITY: 'bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400',
  AUTHENTICATION: 'bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400',
}

export function TemplateCategoryBadge({ category }) {
  const classes = CATEGORY_STYLES[category] || 'bg-ink-100 text-ink-600 dark:bg-navy-800 dark:text-ink-300'
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ${classes}`}>
      {category?.toLowerCase()}
    </span>
  )
}

export function QualityDot({ rating }) {
  if (!rating || rating === 'UNKNOWN') return null
  const colors = { GREEN: 'bg-emerald-500', YELLOW: 'bg-amber-500', RED: 'bg-rose-500' }
  const labels = { GREEN: 'High quality', YELLOW: 'Medium quality', RED: 'Low quality' }
  return (
    <span className="inline-flex items-center gap-1.5" title={labels[rating]}>
      <span className={`h-2 w-2 rounded-full ${colors[rating]}`} />
      <span className="text-xs text-ink-500 dark:text-ink-400">{labels[rating]}</span>
    </span>
  )
}
