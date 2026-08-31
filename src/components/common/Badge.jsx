const TONES = {
  neutral: 'bg-ink-100 text-ink-700 dark:bg-navy-700 dark:text-navy-200',
  brand: 'bg-brand-100 text-brand-800 dark:bg-brand-900/50 dark:text-brand-300',
  accent: 'bg-accent-100 text-accent-800 dark:bg-accent-900/50 dark:text-accent-300',
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
}

export default function Badge({ children, tone = 'neutral', className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
