import { useEffect, useState, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { MessageSquare } from 'lucide-react'
import InfiniteScrollList from '../common/InfiniteScrollList'
import MessageBubble from './MessageBubble'
import EmptyState from '../common/EmptyState'
import Loader, { Skeleton } from '../common/Loader'
import { formatClockTime } from '../../utils/formatters'
import {
  fetchMessages,
  selectMessagesForInteraction,
  selectMessagesStatus,
  selectTypingForInteraction
} from '../../features/messages/messagesSlice'

function dateGroupLabel(dateInput) {
  const date = new Date(dateInput)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
}

function TypingIndicator({ typers }) {
  if (typers.length === 0) return null
  return (
    <div className="flex items-center gap-2 px-1 text-xs text-ink-400">
      <span className="flex gap-0.5">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-300 [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-300 [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-300" />
      </span>
      {typers[0].name} is typing&hellip;
    </div>
  )
}

export default function MessageList({ interactionId }) {
  const dispatch = useDispatch()

  let messages = useSelector((state) => selectMessagesForInteraction(state, interactionId))
  const status = useSelector((state) => selectMessagesStatus(state, interactionId))
  const typers = useSelector((state) => selectTypingForInteraction(state, interactionId))

  messages = useMemo(() => {
    return [...messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  }, [messages])

  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 })
  const [isFetchingMore, setIsFetchingMore] = useState(false)

  const hasMore = pagination.page < pagination.totalPages

  useEffect(() => {
    setPagination({ page: 1, limit: 20, total: 0, totalPages: 1 })
    dispatch(fetchMessages({ interactionId, offset: 20, page: 1 }))
      .unwrap?.()
      .then((res) => {
        if (res?.pagination) setPagination(res.pagination)
      })
      .catch(() => {})
  }, [dispatch, interactionId])

  const loadMoreMessages = () => {
    if (isFetchingMore || !hasMore) return
    setIsFetchingMore(true)
    dispatch(fetchMessages({ interactionId, offset: pagination.limit, page: pagination.page + 1 }))
      .unwrap?.()
      .then((res) => {
        if (res?.pagination) setPagination(res.pagination)
      })
      .catch(() => {})
      .finally(() => setIsFetchingMore(false))
  }

  if (status === 'loading' && messages.length === 0) {
    return (
      <div className="flex-1 space-y-4 overflow-hidden px-4 py-4">
        <Skeleton className="ml-auto h-10 w-2/5" />
        <Skeleton className="h-14 w-1/2" />
        <Skeleton className="ml-auto h-10 w-1/3" />
      </div>
    )
  }

  if (status === 'failed') return <Loader label="Could not load messages" />

  if (messages.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No messages yet"
        description="Send the first message below to start this conversation."
      />
    )
  }

  let lastDateLabel = null

  return (
    <InfiniteScrollList
      key={interactionId} // interaction badalne par fresh remount + state reset
      items={messages}
      getItemId={(m) => m._id}
      direction="top"
      stickToBottom
      hasMore={hasMore}
      loading={isFetchingMore}
      onLoadMore={loadMoreMessages}
      className="flex-1 space-y-3 overflow-y-auto scroll-thin bg-ink-50 px-3 py-4 dark:bg-navy-950/40 sm:px-5"
      loader={
        <div className="flex justify-center py-2">
          <Skeleton className="h-6 w-24" />
        </div>
      }
      endMessage={
        <div className="flex justify-center py-1">
          <span className="text-[11px] text-ink-400">Start of conversation</span>
        </div>
      }
      footer={<TypingIndicator typers={typers} />}
      renderItem={(message) => {
        const label = dateGroupLabel(message?.createdAt)
        const showDivider = label !== lastDateLabel
        lastDateLabel = label
        return (
          <>
            {showDivider && (
              <div className="my-3 flex items-center justify-center">
                <span className="rounded-full bg-ink-200/70 px-2.5 py-0.5 text-[11px] font-medium text-ink-500 dark:bg-navy-800 dark:text-navy-300">
                  {label}
                </span>
              </div>
            )}
            {message.messageType === 'notification' ? (
              <div className="my-2 flex items-center justify-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-100 px-3 py-1 text-center text-[11px] text-ink-500 dark:bg-navy-800/70 dark:text-navy-400">
                  <span className="text-ink-400 dark:text-navy-500">·</span>
                  <span>{message.message}</span>
                  <span className="text-ink-400 dark:text-navy-500">·</span>
                  <span>{formatClockTime(message.createdAt)}</span>
                </span>
              </div>
            ) : (
              <MessageBubble message={message} />
            )}
          </>
        )
      }}
    />
  )
}