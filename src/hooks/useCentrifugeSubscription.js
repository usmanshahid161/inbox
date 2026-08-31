import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { centrifugeService } from '../services/centrifuge'
import { selectAuth } from '../features/auth/authSlice'
import { setConnectionState, showToast } from '../features/ui/uiSlice'
import {
  interactionUpserted,
  interactionAssigned,
  bumpLastMessage,
  markInteractionRead,
  selectSelectedInteractionId
} from '../features/interactions/interactionsSlice'
import { messageReceived, messageStatusChanged, typingReceived, messageUpdate } from '../features/messages/messagesSlice'
import { presenceStatusChanged, presenceBreakStarted, presenceBreakEnded } from '../features/presence/presenceSlice'
import { requestReceived } from '../features/interactionRequests/interactionRequestsSlice'
import { selectQueueById } from '../features/queues/queuesSlice'
import { CHANNEL_TYPE } from '../utils/constants'

/**
 * Mount once near the root of the authenticated app. Opens a single
 * Centrifuge connection scoped to the current tenant and fans incoming
 * events out into the relevant Redux slices.
 */
export function useCentrifugeSubscription() {
  const dispatch = useDispatch()
  const { token, user, tenant } = useSelector(selectAuth)
  const selectedInteractionIdRef = useRef(null)
  const selectedInteractionId = useSelector(selectSelectedInteractionId)
  const queuesRef = useRef([])
  const allQueues = useSelector((state) => state.queues.items)

  // ref me hamesha latest value rakho taake stale closure na ho
  // aur event handlers ke andar selector ki bajaye ref use karo
  useEffect(() => {
    selectedInteractionIdRef.current = selectedInteractionId
  }, [selectedInteractionId])

  useEffect(() => {
    queuesRef.current = allQueues
  }, [allQueues])

  useEffect(() => {
    if (!token || !tenant?.id) return undefined

    // dispatch ko current call-stack se bahar nikal do (defer)
    // taake ye kisi bhi in-progress reducer execution ke sath overlap na kare
    const safeDispatch = (action) => {
      queueMicrotask(() => dispatch(action))
    }

    const unsubscribeState = centrifugeService.onConnectionStateChange((state) => {
      safeDispatch(setConnectionState(state))
    })

    centrifugeService.connect({ token, tenantId: tenant.id })

    const handleMessagesEvent = (data) => {
      console.log("Event: ", data?.event, "Queue: ", data?.message?.queue, "Message: ", data?.message )
      switch (data.event) {
        case 'message.created':
          safeDispatch(messageReceived(data.message))
          safeDispatch(
            bumpLastMessage({
              interactionId: data?.message?.interactionId,
              lastMessage: {
                message: data.message.messageType === 'TEXT' ? data?.message?.message : 'Multimedia',
                createdAt: data?.message?.createdAt,
                direction: data?.message?.direction
              },
              incrementUnread: data?.message?.direction === 0
            })
          )

          if (selectedInteractionIdRef.current === data?.message?.interactionId) {
            safeDispatch(markInteractionRead(selectedInteractionIdRef.current))
          }
          break

        case 'message.update':
          safeDispatch(messageUpdate(data?.message))
          break
        case 'message.status_changed':
          safeDispatch(
            messageStatusChanged({
              interactionId: data.interactionId,
              messageId: data.messageId,
              status: data.status
            })
          )
          break
        case 'message.typing':
          safeDispatch(
            typingReceived({
              interactionId: data.interactionId,
              userId: data.userId,
              name: data.name,
              expiresAt: Date.now() + 5000
            })
          )
          break
        default:
          break
      }
    }

    const handleInteractionsEvent = (data) => {
      console.log("Event: ", data?.event, "Queue: ", data?.interaction?.queue, "Interaction: ", data?.interaction )
      switch (data.event) {
        case 'interaction.created': {
          safeDispatch(interactionUpserted(data.interaction))

          // New conversation this agent is eligible to see — surface it
          // as a toast (channel + queue), not just a silent list update.
          const queueName = queuesRef.current.find((q) => q._id === data.interaction?.queue)?.name
          const channelLabel =
            data.interaction?.channel?.toUpperCase?.() === CHANNEL_TYPE.WHATSAPP ? 'WhatsApp' : data.interaction?.channel
          safeDispatch(
            showToast({
              message: `New ${channelLabel || ''} conversation${queueName ? ` — ${queueName}` : ''}`.trim(),
              tone: 'default'
            })
          )
          break
        }
        case 'interaction.updated':
          safeDispatch(interactionUpserted(data.interaction))
          break
        default:
          break
      }
    }

    const handlePresenceEvent = (data) => {
      switch (data.event) {
        case 'agent.status_changed':
          safeDispatch(presenceStatusChanged({ agentId: data.agentId, status: data.status }))
          break
        case 'agent.break_started':
          safeDispatch(presenceBreakStarted({ agentId: data.agentId, break: data.break }))
          break
        case 'agent.break_ended':
          safeDispatch(presenceBreakEnded({ agentId: data.agentId, breakId: data.breakId }))
          break
        default:
          break
      }
    }

    // Personal channel — transfer/share invites addressed to exactly this
    // agent land here as toasts with Accept/Reject (see RequestToast.jsx).
    const handleNotificationEvent = (data) => {
      switch (data.event) {
        case 'interaction.transfer_requested':
        case 'interaction.share_requested':
          safeDispatch(
            requestReceived({
              requestId: data.requestId,
              interactionId: data.interactionId,
              type: data.event === 'interaction.transfer_requested' ? 'TRANSFER' : 'SHARE',
              fromAgentId: data.fromAgentId,
              fromAgentName: data.fromAgentName,
              channel: data.channel,
              queue: data.queue
            })
          )
          break
        case 'interaction.request_accepted':
          safeDispatch(showToast({ message: 'Your transfer/share request was accepted', tone: 'success' }))
          break
        case 'interaction.request_rejected':
          safeDispatch(showToast({ message: 'Your transfer/share request was declined', tone: 'default' }))
          break
        default:
          break
      }
    }

    // Agents with queues assigned only see conversations routed to those
    // queues — they subscribe to the queue-scoped channels INSTEAD of the
    // tenant-wide ones, otherwise the tenant-wide subscription alone would
    // still hand them everything and the whole point of scoping is lost.
    // Admins carry no queues by design, so they keep getting the
    // tenant-wide firehose (they need oversight of everything).
    const agentQueues = user?.role === 'AGENT' ? user?.queues || [] : []

    if (agentQueues.length > 0) {
      agentQueues.forEach((queueId) => {
        centrifugeService.subscribeToTenantChannel(`queue_${queueId}_messages`, { onPublication: handleMessagesEvent })
        centrifugeService.subscribeToTenantChannel(`queue_${queueId}_interactions`, {
          onPublication: handleInteractionsEvent
        })
      })
    } else {
      centrifugeService.subscribeToTenantChannel('messages', { onPublication: handleMessagesEvent })
      centrifugeService.subscribeToTenantChannel('interactions', { onPublication: handleInteractionsEvent })
    }

    centrifugeService.subscribeToTenantChannel('presence', { onPublication: handlePresenceEvent })

    if (user?._id) {
      centrifugeService.subscribeToTenantChannel(`agent_${user._id}_notifications`, {
        onPublication: handleNotificationEvent
      })
    }

    return () => {
      unsubscribeState()
      centrifugeService.disconnect()
    }
    // Reconnect whenever the authenticated identity changes (login/logout).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, tenant?.id, user?.id, dispatch])
}