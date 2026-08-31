import { createSlice, createAsyncThunk, nanoid } from '@reduxjs/toolkit'
import messageApi from '../../services/messageApi'
import { addLogoutReset } from '../../utils/resetOnLogout'
import { MESSAGE_STATUS } from '../../utils/constants'

const initialState = {
  byInteractionId: {}, // { [interactionId]: { items: [], status, error } }
  typingByInteractionId: {} // { [interactionId]: { userId, name, expiresAt }[] }
}

function ensureThread(state, interactionId) {
  if (!state.byInteractionId[interactionId]) {
    state.byInteractionId[interactionId] = { items: [], status: 'idle', error: null }
  }

  return state.byInteractionId[interactionId]
}

export const fetchMessages = createAsyncThunk(
  'messages/fetch',
  async ({ interactionId, offset, page }, { rejectWithValue }) => {
    try {
      const items = await messageApi.list(interactionId, { offset, page })
      return { interactionId, items: items?.data, pagination: items.pagination }
    } catch (err) {
      return rejectWithValue({ interactionId, message: err.response?.data?.message || 'Could not load messages.' })
    }
  }
)

export const sendMessage = createAsyncThunk(
  'messages/send',
  async ({ message }, { rejectWithValue }) => {
    const interactionId = message?.interactionId
    try {
      const sent = await messageApi.send( message )
      return { interactionId, message: sent?.data }
    } catch (err) {
      return rejectWithValue({ interactionId, message: err.response?.data?.message || 'Message failed to send.' })
    }
  }
)

const messagesSlice = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    // Optimistically insert a locally composed message with a temp id so the
    // composer feels instant; sendMessage.fulfilled reconciles it below.
    addOptimisticMessage: {
      reducer(state, action) {
        const thread = ensureThread(state, action.payload.interactionId)
        thread.items.push(action.payload)
      },
      prepare({ interactionId, message, messageType, attachments, author }) {
        return {
          payload: {
            id: `optimistic-${nanoid()}`,
            interactionId,
            message,
            messageType,
            direction: 1,
            author,
            attachments: attachments || [],
            status: {
              message: MESSAGE_STATUS.SENDING
            },
            createdAt: new Date().toISOString(),
            optimistic: true,
          }
        }
      }
    },
    // --- Realtime handlers ---
    messageReceived(state, action) {
      const msg = action.payload
      const thread = ensureThread(state, msg.interactionId)

      // Replace the matching optimistic placeholder (same author + text,
      // still marked SENDING) instead of appending — otherwise the
      // confirmed message from the server shows up as a second, duplicate
      // bubble alongside the one added instantly when the agent hit send.
      const optimisticIndex = thread.items.findIndex(
        (m) =>
          m?.optimistic &&
          String(m.author?.id) === String(msg.author?.id) &&
          m.message === msg.message
      )

      if (optimisticIndex !== -1) {
        thread.items[optimisticIndex] = msg
        return
      }

      if (!thread.items.some((m) => m?._id === msg?._id)) {
        thread.items.push(msg)
      }
    },
    messageStatusChanged(state, action) {
      const { interactionId, messageId, status } = action.payload
      const thread = state.byInteractionId[interactionId]
      const msg = thread?.items.find((m) => m?._id === messageId)
      if (msg) msg.status = status
    },
    messageUpdate(state, action) {
      const message = action.payload

      const thread = state.byInteractionId[message?.interactionId]

      if (!thread) return

      const index = thread.items.findIndex(
        (m) => m?._id === message?._id
      )

      if (index !== -1) {
        thread.items[index] = message
      }
    },
    typingReceived(state, action) {
      const { interactionId, userId, name, expiresAt } = action.payload
      const current = state.typingByInteractionId[interactionId] || []
      const withoutUser = current.filter((t) => t.userId !== userId)
      state.typingByInteractionId[interactionId] = [...withoutUser, { userId, name, expiresAt }]
    },
    clearExpiredTyping(state, action) {
      const { interactionId, now } = action.payload
      const current = state.typingByInteractionId[interactionId]
      if (!current) return
      state.typingByInteractionId[interactionId] = current.filter((t) => t.expiresAt > now)
    }
  },
  extraReducers(builder) {
    builder
      .addCase(fetchMessages.pending, (state, action) => {
        const thread = ensureThread(state, action.meta.arg)
        thread.status = 'loading'
        thread.error = null
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const thread = ensureThread(state, action.payload?.interactionId)
        thread.status = 'succeeded'

        const { items, pagination } = action.payload

        // page 1 = fresh load (replace), page > 1 = load more (prepend older msgs)
        if (pagination.page === 1) {
          thread.items = items
        } else {
          // purane messages hain, list ke shuru me lagao (duplicate se bacho)
          const existingIds = new Set(thread.items.map((m) => m._id))
          const newOnes = items.filter((m) => !existingIds.has(m._id))
          thread.items = [...newOnes, ...thread.items]
        }

        thread.pagination = { ...pagination }
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        const { interactionId, message } = action.payload?.data || {}
        const thread = ensureThread(state, interactionId)
        thread.status = 'failed'
        thread.error = message
      })
      .addCase(sendMessage.fulfilled, (state, action) => {

        const thread = ensureThread(state, action.payload.interactionId)
        // Replace the most recent optimistic outbound message with the
        // confirmed one from the server.
        const optimisticIdx = [...thread.items].reverse().findIndex((m) => m.optimistic)
        if (optimisticIdx !== -1) {
          const realIdx = thread.items.length - 1 - optimisticIdx
          thread.items[realIdx] = action.payload.message
        } else {
          thread.items.push(action.payload.message)
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        const { interactionId } = action.payload || {}
        const thread = state.byInteractionId[interactionId]
        const optimistic = thread?.items.find((m) => m.optimistic && m.status === MESSAGE_STATUS.SENDING)
        if (optimistic) optimistic.status = MESSAGE_STATUS.FAILED
      })
    addLogoutReset(builder, () => initialState)
  }
})

export const { addOptimisticMessage, messageReceived, messageStatusChanged, typingReceived, messageUpdate, clearExpiredTyping } =
  messagesSlice.actions

export const selectMessagesForInteraction = (state, interactionId) =>
  state.messages.byInteractionId[interactionId]?.items || []
export const selectMessagesStatus = (state, interactionId) =>
  state.messages.byInteractionId[interactionId]?.status || 'idle'
export const selectTypingForInteraction = (state, interactionId) =>
  state.messages.typingByInteractionId[interactionId] || []

export default messagesSlice.reducer