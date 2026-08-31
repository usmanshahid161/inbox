import { useDispatch, useSelector } from 'react-redux'
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react'
import { dismissToast, selectToasts } from '../../features/ui/uiSlice'
import { useEffect } from 'react'

const ICONS = {
  default: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle
}

const TONE_CLASSES = {
  default: 'border-ink-200 text-ink-800',
  success: 'border-emerald-200 text-emerald-800',
  warning: 'border-amber-200 text-amber-800',
  danger: 'border-red-200 text-red-800'
}

function ToastItem({ toast }) {
  const dispatch = useDispatch()
  const Icon = ICONS[toast.tone] || Info

  useEffect(() => {
    const timer = setTimeout(() => dispatch(dismissToast(toast.id)), 4000)
    return () => clearTimeout(timer)
  }, [toast.id, dispatch])

  return (
    <div
      className={`flex w-80 items-start gap-2.5 rounded-lg border bg-white px-3.5 py-3 shadow-popover animate-slide-up ${TONE_CLASSES[toast.tone] || TONE_CLASSES.default}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p className="flex-1 text-sm">{toast.message}</p>
      <button onClick={() => dispatch(dismissToast(toast.id))} className="text-ink-400 hover:text-ink-700">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

export default function ToastContainer() {
  const toasts = useSelector(selectToasts)
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}
