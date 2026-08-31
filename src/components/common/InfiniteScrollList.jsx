import { useRef, useLayoutEffect, useEffect } from 'react'

/**
 * Generic infinite-scroll list with scroll-position anchoring.
 *
 * direction="top"    -> chat-jaisa: purane items UPAR se load hote hain,
 *                        scroll position exactly wahi rehti hai jahan user tha.
 * direction="bottom" -> feed-jaisa: naye items NEECHE se load hote hain
 *                        (normal infinite scroll, jump ka masla nahi hota).
 *
 * stickToBottom={true} (sirf direction="top" ke sath meaningful) ->
 *   initial load par aur naya item end pe aane par auto bottom scroll
 *   (chat / live-message use case).
 *
 * Props:
 * - items: array (already sorted jis order me render karna hai)
 * - getItemId: (item) => string|number   (dedupe/track ke liye)
 * - renderItem: (item, index) => ReactNode
 * - hasMore: boolean
 * - loading: boolean          (fetch in-flight hai ya nahi)
 * - onLoadMore: () => void    (threshold cross hote hi call hoga)
 * - direction: 'top' | 'bottom'  (default 'bottom')
 * - stickToBottom: boolean       (default false)
 * - threshold: number in px      (default 60) - kitne paas jaane par onLoadMore fire ho
 * - loader: ReactNode            (loading state ke dauran dikhane ke liye)
 * - endMessage: ReactNode        (jab hasMore false ho)
 * - className: string
 * - footer: ReactNode            (list ke bilkul end me, e.g. typing indicator)
 */
export default function InfiniteScrollList({
                                             items,
                                             getItemId,
                                             renderItem,
                                             hasMore,
                                             loading,
                                             onLoadMore,
                                             direction = 'bottom',
                                             stickToBottom = false,
                                             threshold = 60,
                                             loader = null,
                                             endMessage = null,
                                             className = '',
                                             footer = null
                                           }) {
  const containerRef = useRef(null)
  const bottomRef = useRef(null)

  const isPrependingRef = useRef(false)
  const prevScrollHeightRef = useRef(0)
  const isInitialLoadRef = useRef(true)
  const lastTailIdRef = useRef(null)

  const isTopMode = direction === 'top'

  const triggerLoadMore = () => {
    if (loading || !hasMore) return
    if (isTopMode) {
      const el = containerRef.current
      if (el) prevScrollHeightRef.current = el.scrollHeight
      isPrependingRef.current = true
    }
    onLoadMore?.()
  }

  const handleScroll = () => {
    const el = containerRef.current
    if (!el) return

    if (isTopMode) {
      // upar ke paas pohochte hi purane items load karo
      if (el.scrollTop <= threshold) triggerLoadMore()
    } else {
      // neeche ke paas pohochte hi agle items load karo
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
      if (distanceFromBottom <= threshold) triggerLoadMore()
    }
  }

  // interaction/list source badalne par reset karna ho to parent `key` prop se
  // is component ko remount kara sakta hai (recommended). Yahan bas safety net:
  useEffect(() => {
    isInitialLoadRef.current = true
    lastTailIdRef.current = null
  }, [])

  // --- TOP MODE: prepend ke baad scroll position exactly maintain karo ---
  useLayoutEffect(() => {
    if (!isTopMode) return
    if (!isPrependingRef.current) return
    const el = containerRef.current
    if (el) {
      const newScrollHeight = el.scrollHeight
      el.scrollTop = newScrollHeight - prevScrollHeightRef.current
    }
    isPrependingRef.current = false
  }, [items, isTopMode])

  // --- TOP MODE + stickToBottom: initial load / naya end-item par bottom scroll ---
  useEffect(() => {
    if (!isTopMode || !stickToBottom) return
    if (isPrependingRef.current) return // prepend already handled upar

    const currentTailId = items.length > 0 ? getItemId(items[items.length - 1]) : null
    const isNewTailItem = currentTailId !== lastTailIdRef.current
    lastTailIdRef.current = currentTailId

    if (isInitialLoadRef.current && items.length > 0) {
      bottomRef.current?.scrollIntoView({ block: 'end' })
      isInitialLoadRef.current = false
      return
    }

    if (isNewTailItem) {
      bottomRef.current?.scrollIntoView({ block: 'end' })
    }
  }, [items, isTopMode, stickToBottom, getItemId])

  return (
    <div ref={containerRef} onScroll={handleScroll} className={className}>
      {isTopMode && loading && loader}
      {isTopMode && !hasMore && endMessage}

      {items.map((item, index) => (
        <div key={getItemId(item)}>{renderItem(item, index)}</div>
      ))}

      {!isTopMode && loading && loader}
      {!isTopMode && !hasMore && endMessage}

      {footer}
      {stickToBottom && <div ref={bottomRef} />}
    </div>
  )
}