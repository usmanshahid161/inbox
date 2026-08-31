import { useDispatch, useSelector } from 'react-redux'
import { ArrowRightLeft, Users, Check, X } from 'lucide-react'
import {
  selectIncomingRequests,
  acceptRequest,
  rejectRequest,
  requestDismissed
} from '../../features/interactionRequests/interactionRequestsSlice'
import { selectQueueById } from '../../features/queues/queuesSlice'
import { channelLabel } from '../common/ChannelIcon'
import { showToast } from '../../features/ui/uiSlice'

function RequestToast({ request }) {
  const dispatch = useDispatch()
  const queue = useSelector((state) => selectQueueById(state, request.queue))

  const isTransfer = request.type === 'TRANSFER'
  const Icon = isTransfer ? ArrowRightLeft : Users

  const handleAccept = () => {
    dispatch(acceptRequest(request.requestId)).then((res) => {
      if (!res.error) dispatch(showToast({ message: `${isTransfer ? 'Transfer' : 'Share'} accepted`, tone: 'success' }))
    })
  }

  const handleReject = () => {
    dispatch(rejectRequest(request.requestId)).then((res) => {
      if (!res.error) dispatch(requestDismissed(request.requestId))
    })
  }

  return (
    <div className="w-80 rounded-lg border border-ink-200 bg-white p-3.5 shadow-popover animate-slide-up dark:border-navy-700 dark:bg-navy-800">
      <div className="flex items-start gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink-900 dark:text-white">
            {request.fromAgentName} wants to {isTransfer ? 'transfer' : 'share'} a conversation
          </p>
          <p className="mt-0.5 text-xs text-ink-500 dark:text-navy-400">
            {channelLabel(request.channel?.toUpperCase?.())} · {queue?.name || 'Unknown queue'}
          </p>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={handleAccept}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
        >
          <Check className="h-3.5 w-3.5" />
          Accept
        </button>
        <button
          onClick={handleReject}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-50 dark:border-navy-600 dark:text-navy-300 dark:hover:bg-navy-700"
        >
          <X className="h-3.5 w-3.5" />
          Reject
        </button>
      </div>
    </div>
  )
}

export default function RequestToastStack() {
  const requests = useSelector(selectIncomingRequests)
  if (requests.length === 0) return null

  return (
    <div className="fixed bottom-4 left-4 z-[60] flex flex-col gap-2">
      {requests.map((request) => (
        <RequestToast key={request.requestId} request={request} />
      ))}
    </div>
  )
}
