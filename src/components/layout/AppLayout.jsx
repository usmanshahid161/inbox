import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Sidebar from './Sidebar'
import MobileSidebar from './MobileSidebar'
import Header from './Header'
import ToastContainer from '../common/ToastContainer'
import ConfirmDialog from '../common/ConfirmDialog'
import { useCentrifugeSubscription } from '../../hooks/useCentrifugeSubscription'
import { usePresenceHeartbeat } from '../../hooks/usePresenceHeartbeat'
import { useThemeEffect } from '../../hooks/useThemeEffect'
import { fetchInteractions } from '../../features/interactions/interactionsSlice'
import { fetchTags } from '../../features/tags/tagsSlice'
import { fetchQuickReplies } from '../../features/quickReplies/quickRepliesSlice'
import { fetchQueues } from '../../features/queues/queuesSlice'
import { selectIsAuthenticated } from '../../features/auth/authSlice'
import RequestToastStack from '../inbox/RequestToastStack'

export default function AppLayout() {
  const dispatch = useDispatch()
  const isAuthenticated = useSelector(selectIsAuthenticated)

  useThemeEffect()

  // One realtime connection, scoped to the authenticated tenant, for the
  // whole authenticated section of the app.
  useCentrifugeSubscription()

  // Keeps this agent's presence marked online while the tab is open.
  usePresenceHeartbeat(isAuthenticated)

  // Loaded once here so the unread badge in the sidebar nav is accurate on
  // every screen, not just while viewing the inbox.
  useEffect(() => {
    dispatch(fetchInteractions())
  }, [dispatch])

  // Tenant's tags, loaded once at login rather than only when the admin
  // Tags page is visited — agents need the full list available the moment
  // they open a conversation to tag it (ConversationHeader).
  useEffect(() => {
    dispatch(fetchTags())
  }, [dispatch])

  // Same reasoning as tags — the composer's "/" picker needs these
  // available immediately, not just after visiting the admin page.
  useEffect(() => {
    dispatch(fetchQuickReplies())
  }, [dispatch])

  // Needed to show queue names on new-interaction toasts, and for the
  // transfer/share picker to know which queue a conversation is in.
  useEffect(() => {
    dispatch(fetchQueues())
  }, [dispatch])

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-ink-50 dark:bg-navy-900">
      <Sidebar />
      <MobileSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="min-h-0 flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
      <ConfirmDialog />
      <RequestToastStack />
    </div>
  )
}
