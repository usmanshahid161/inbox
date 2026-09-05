import { useDispatch, useSelector } from 'react-redux'
import { MessagesSquare } from 'lucide-react'
import ConversationList from '../components/inbox/ConversationList'
import ConversationHeader from '../components/inbox/ConversationHeader'
import MessageList from '../components/inbox/MessageList'
import MessageComposer from '../components/inbox/MessageComposer'
import CustomerDetails from '../components/inbox/CustomerDetails'
import EmptyState from '../components/common/EmptyState'
import { selectCurrentUser }        from '../features/auth/authSlice.js';
import { selectSelectedInteraction, selectInteraction } from '../features/interactions/interactionsSlice'
import { selectIsCustomerDetailsCollapsed } from '../features/ui/uiSlice'
import { useIsMobile } from '../hooks/useMediaQuery'

export default function Inbox() {
  const dispatch = useDispatch()
  const selectedInteraction = useSelector(selectSelectedInteraction)
  const detailsCollapsed = useSelector(selectIsCustomerDetailsCollapsed)
  const isMobile = useIsMobile()
  const currentUser = useSelector(selectCurrentUser)
  const isIamIn = selectedInteraction?.participants?.length > 0 && selectedInteraction?.participants.find(participant => participant?.status && participant?.id === currentUser?._id && (participant.role === "agent" || participant.role === "AGENT"))

  const handleBack = () => dispatch(selectInteraction(null))

  return (
    <div className="flex h-full">
      {/* Conversation list: hidden on mobile once a conversation is open */}
      <div
        className={`w-full shrink-0 border-r border-ink-100 dark:border-navy-800 sm:w-80 md:w-96 lg:w-80 xl:w-96 ${
          isMobile && selectedInteraction ? 'hidden' : 'block'
        }`}
      >
        <ConversationList />
      </div>

      {/* Conversation thread */}
      <div className={`flex min-w-0 flex-1 flex-col bg-ink-50 dark:bg-navy-950/40 ${isMobile && !selectedInteraction ? 'hidden' : 'flex'}`}>
        {selectedInteraction ? (
          <>
            <ConversationHeader interaction={selectedInteraction} onBack={handleBack} />
            <MessageList interactionId={selectedInteraction?._id} />
            {
              isIamIn && <MessageComposer interactionId={ selectedInteraction?._id }
                               interactionStatus={ selectedInteraction?.connect }/> }
          </>
        ) : (
          <EmptyState
            icon={MessagesSquare}
            title="Select a conversation"
            description="Choose a conversation from the list to view messages and reply."
          />
        )}
      </div>

      {/* Customer details column, collapsible on desktop */}
      {selectedInteraction && !detailsCollapsed && <CustomerDetails interaction={selectedInteraction} />}
    </div>
  )
}
