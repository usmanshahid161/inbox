import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Inbox as InboxIcon } from 'lucide-react'
import ConversationItem from './ConversationItem'
import InboxFilters from './InboxFilters'
import EmptyState from '../common/EmptyState'
import InfiniteScrollList from '../common/InfiniteScrollList'
import { Skeleton } from '../common/Loader'
import {
  fetchInteractions,
  selectAssignmentFilter,
  selectStatusFilter,
  selectUnreadOnly,
  selectInboxSearch,
  selectInteractions,
  selectInteractionsStatus,
  selectSelectedInteractionId,
  selectInteraction,
  setAssignmentFilter,
  setStatusFilter,
  setUnreadOnly,
  setInboxSearch,
  markInteractionRead
} from '../../features/interactions/interactionsSlice'
import { useDebounce } from '../../hooks/useDebounce'

const LIMIT = 20
const emptyPagination = { page: 1, limit: LIMIT, total: 0, totalPages: 1 }

function ListSkeleton() {
  return (
    <div className="space-y-0 px-3 py-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 border-b border-ink-50 py-3 dark:border-navy-800">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function ConversationList({ onSelect }) {
  const dispatch = useDispatch()
  const interactions = useSelector(selectInteractions)
  const status = useSelector(selectInteractionsStatus)
  const assignmentFilter = useSelector(selectAssignmentFilter)
  const statusFilter = useSelector(selectStatusFilter)
  const unreadOnly = useSelector(selectUnreadOnly)
  const search = useSelector(selectInboxSearch)
  const selectedId = useSelector(selectSelectedInteractionId)
  const [sort, setSort] = useState('newest')

  const [pagination, setPagination] = useState({
    ALL: emptyPagination,
    MINE: emptyPagination,
    UNASSIGNED: emptyPagination
  })
  const [isFetchingMore, setIsFetchingMore] = useState(false)

  const currentPagination = pagination[assignmentFilter] ?? emptyPagination
  const hasMore = currentPagination.page < currentPagination.totalPages

  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      [assignmentFilter]: emptyPagination
    }))

    dispatch(
      fetchInteractions({
        assignmentFilter,
        statusFilter,
        unreadOnly,
        search: debouncedSearch,
        limit: LIMIT,
        page: 1
      })
    )
      .unwrap?.()
      .then((res) => {
        if (res?.pagination) {
          setPagination((prev) => ({ ...prev, [assignmentFilter]: res.pagination }))
        }
      })
      .catch(() => {})
  }, [dispatch, assignmentFilter, statusFilter, unreadOnly, debouncedSearch])

  const handleAssignmentChange = (filter) => {
    dispatch(setAssignmentFilter(filter))
  }

  const loadMoreInteractions = () => {
    if (isFetchingMore || !hasMore || status === 'loading') return
    setIsFetchingMore(true)
    const nextPage = currentPagination.page + 1

    dispatch(
      fetchInteractions({
        assignmentFilter,
        statusFilter,
        unreadOnly,
        search: debouncedSearch,
        limit: LIMIT,
        page: nextPage
      })
    )
      .unwrap?.()
      .then((res) => {
        if (res?.pagination) {
          setPagination((prev) => ({ ...prev, [assignmentFilter]: res.pagination }))
        }
      })
      .catch(() => {})
      .finally(() => setIsFetchingMore(false))
  }

  const sorted = useMemo(() => {
    const items = [...interactions]
    items.sort((a, b) =>
      sort === 'newest' ? new Date(b.updatedAt) - new Date(a.updatedAt) : new Date(a.updatedAt) - new Date(b.updatedAt)
    )
    return items
  }, [interactions, sort])

  return (
    <div className="flex h-full flex-col bg-white dark:bg-navy-900">
      <InboxFilters
        search={search}
        onSearchChange={(v) => dispatch(setInboxSearch(v))}
        assignmentFilter={assignmentFilter}
        onAssignmentChange={handleAssignmentChange}
        statusFilter={statusFilter}
        onStatusChange={(v) => dispatch(setStatusFilter(v))}
        sort={sort}
        onSortChange={setSort}
        unreadOnly={unreadOnly}
        onUnreadOnlyChange={(v) => dispatch(setUnreadOnly(v))}
      />

      {status === 'loading' && interactions.length === 0 && <ListSkeleton />}

      {status !== 'loading' && sorted.length === 0 && (
        <EmptyState
          icon={InboxIcon}
          title="No conversations"
          description="Nothing matches this filter yet. Try a different filter or search term."
        />
      )}

      {sorted.length > 0 && (
        <InfiniteScrollList
          key={`${assignmentFilter}-${statusFilter}-${unreadOnly}-${debouncedSearch}`}
          items={sorted}
          getItemId={(i) => i?._id}
          direction="bottom"
          hasMore={hasMore}
          loading={isFetchingMore}
          onLoadMore={loadMoreInteractions}
          className="flex-1 overflow-y-auto scroll-thin"
          loader={
            <div className="space-y-0 px-3 py-2">
              <div className="flex items-start gap-3 py-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            </div>
          }
          renderItem={(interaction) => (
            <ConversationItem
              interaction={interaction}
              active={interaction.id === selectedId}
              onClick={async () => {
                await dispatch(selectInteraction(interaction?._id))
                await dispatch(markInteractionRead(interaction?._id))
                onSelect?.(interaction?._id)
              }}
            />
          )}
        />
      )}
    </div>
  )
}