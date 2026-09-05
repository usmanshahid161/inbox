import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import interactionApi from '../../services/interactionApi'
import { addLogoutReset } from '../../utils/resetOnLogout'

const initialState = {
  items: [],
  selectedInteractionId: null,
  assignmentFilter: 'ALL', // ALL | MINE | UNASSIGNED
  statusFilter: 'ALL', // ALL | OPEN | CLOSED
  unreadOnly: false,
  search: '',
  status: 'idle', // idle | loading | succeeded | failed
  error: null
}

export const fetchInteractions = createAsyncThunk(
  'interactions/fetch',
  async ({ page, offset }, { getState, rejectWithValue }) => {
    try {
      const { assignmentFilter, statusFilter, unreadOnly, search,  } =
        getState().interactions

      const currentAgent = getState()?.auth?.user?.id || getState()?.auth?.user?._id

      let params = {
        page,
        offset,
        filter: {
          ...(search && { search })
        }
      };

      if (statusFilter !== 'ALL') {
        params.filter.status = statusFilter
      }

      if (assignmentFilter === 'MINE') {
        params.filter.participants = {
          "$elemMatch": {
            id: currentAgent,
            // id: currentAgent,
            status: true,
          }
        }
        params.filter.connect = true
      }

      if (assignmentFilter === 'UNASSIGNED') {
        params.filter.connect = false
      }

      if (unreadOnly) {
        params.filter.unreadCount = {
          $gt: 0
        };
      }

      return await interactionApi.list(params)
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || 'Could not load conversations.'
      )
    }
  }
)


export const addNotes = createAsyncThunk(
  'interactions/addNote',
  async ({ interactionId, note }, { getState, rejectWithValue }) => {
    try {
      const agent = getState()?.auth?.user
      const notes = {
        text: note?.text,
        agentId: agent._id,
        agentName: agent?.name,
        id: note?.id
      }

      const response = await interactionApi.addNote(interactionId, notes)
      return { interactionId, note: response }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Could not add note.')
    }
  }
)

export const updateNote = createAsyncThunk(
  'interactions/updateNote',
  async ({ interactionId, noteId, text }, { rejectWithValue }) => {
    try {
      const notes = {
        text,
        interactionId,
        id: noteId
      }

      const note = await interactionApi.updateNote(notes)
      return { interactionId, note }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Could not update note.')
    }
  }
)

export const deleteNote = createAsyncThunk(
  'interactions/deleteNote',
  async ({ interactionId, noteId }, { rejectWithValue }) => {
    try {
      const note = await interactionApi.deleteNote(interactionId, noteId)
      return { interactionId, note }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Could not delete note.')
    }
  }
)

export const addWorkCode = createAsyncThunk(
  'interactions/addWorkCode',
  async ({ interactionId, workCode }, { getState, rejectWithValue }) => {
    try {
      const agent = getState()?.auth?.user
      const body = {
        text: workCode?.text,
        agentId: agent?._id,
        agentName: agent?.name,
        id: workCode?.id
      }

      const workCodes = await interactionApi.addWorkCode(interactionId, body)
      return { interactionId, workCodes }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Could not add workcode.')
    }
  }
)

export const deleteWorkCode = createAsyncThunk(
  'interactions/deleteWorkCode',
  async ({ interactionId, id }, { rejectWithValue }) => {
    try {
      const workCodes = await interactionApi.deleteWorkCode(interactionId, id)
      return { interactionId, workCodes }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Could delete workcode.')
    }
  }
)

export const assignInteraction = createAsyncThunk(
  'interactions/assign',
  async ({ interactionId }, { getState, rejectWithValue }) => {
    try {
      const agent = getState()?.auth?.user
      await interactionApi.assign(interactionId, agent)
      return { interactionId, agent }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Could not assign conversation.')
    }
  }
)

export const interactionActions = createAsyncThunk(
  'interactions/actions',
  async ({ interactionId, type }, { getState, rejectWithValue }) => {
    try {
      const currentAgent = getState()?.auth?.user
      const agent = {
        role:"agent",
        id: currentAgent?._id,
        email: currentAgent?.email,
        name: currentAgent?.name,
      }

      const body = {
         agent, type
      }
      const interaction = await interactionApi.interactionActions(interactionId, body)

      return { interactionId, interaction }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Could not assign conversation.')
    }
  }
)

export const closeInteraction = createAsyncThunk('interactions/close', async (interactionId, { rejectWithValue }) => {
  try {
    await interactionApi.close(interactionId)
    return interactionId
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not close conversation.')
  }
})

export const reopenInteraction = createAsyncThunk('interactions/reopen', async (interactionId, { rejectWithValue }) => {
  try {
    await interactionApi.reopen(interactionId)
    return interactionId
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not reopen conversation.')
  }
})

// Agent-initiated conversation start — the result gets upserted into the
// list the same way a websocket interaction.created event would (see
// interactionUpserted below), so it shows up immediately without a
// refetch.
export const startOutboundConversation = createAsyncThunk(
  'interactions/startOutbound',
  async ({ queue, phone }, { rejectWithValue }) => {
    try {
      return await interactionApi.startOutbound({ queue, phone })
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Could not start conversation.')
    }
  }
)



export const markInteractionRead = createAsyncThunk('interactions/markRead', async (interactionId, {getState}) => {
  const currentUser = getState()?.auth?.user
  await interactionApi.markRead(interactionId, currentUser?._id)
  return interactionId
})

const interactionsSlice = createSlice({
  name: 'interactions',
  initialState,
  reducers: {
    selectInteraction(state, action) {
      state.selectedInteractionId = action.payload
      const itx = state.items.find((i) => i?._id === action.payload)
      if (itx) itx.unreadCount = 0
    },
    setAssignmentFilter(state, action) {
      state.assignmentFilter = action.payload
    },
    setStatusFilter(state, action) {
      state.statusFilter = action.payload
    },
    setUnreadOnly(state, action) {
      state.unreadOnly = action.payload
    },
    setInboxSearch(state, action) {
      state.search = action.payload
    },
    // --- Realtime handlers (dispatched from useCentrifugeSubscription) ---
    interactionUpserted(state, action) {
      const incoming = action.payload
      const idx = state.items.findIndex((i) => i._id === incoming._id)
      if (idx !== -1) {
        state.items[idx] = { ...state.items[idx], ...incoming }
      } else {
        state.items.unshift(incoming)
      }
    },
    // interactionAssigned(state, action) {
    //   const { interactionId, agent } = action.payload
    //   const itx = state.items.find((i) => i.id === interactionId)
    //   if (itx) itx.assignedAgent = agent
    // },
    // Bumps a conversation's preview + unread count when a new message
    // arrives for it (called from the messages realtime handler).
    bumpLastMessage(state, action) {
      const { interactionId, lastMessage, incrementUnread, role  } = action.payload
      const itx = state.items.find((i) => i._id === interactionId)
      if (!itx) return
      itx.lastMessage = lastMessage
      itx.updatedAt = lastMessage.createdAt
      console.log(action.payload, "27363636")
      if(role === "customer") {
        itx.lastCustomerMessageAt = lastMessage?.createdAt
      }
      if (incrementUnread && state.selectedInteractionId !== interactionId) {
        itx.unreadCount = (itx.unreadCount || 0) + 1
      }
    }
  },
  extraReducers(builder) {
    builder
      .addCase(startOutboundConversation.fulfilled, (state, action) => {
        const incoming = action.payload
        const idx = state.items.findIndex((i) => i._id === incoming._id)
        if (idx !== -1) {
          state.items[idx] = { ...state.items[idx], ...incoming }
        } else {
          state.items.unshift(incoming)
        }
      })
      .addCase(fetchInteractions.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchInteractions.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload.data
      })
      .addCase(fetchInteractions.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      .addCase(assignInteraction.fulfilled, (state, action) => {
        const itx = state.items.find((i) => i.id === action.payload.interactionId)
        if (itx) itx.assignedAgent = action.payload.agent
      })
      .addCase(closeInteraction.fulfilled, (state, action) => {
        const itx = state.items.find((i) => i.id === action.payload)
        if (itx) itx.status = 'CLOSED'
      })
      .addCase(interactionActions.fulfilled, (state, action) => {
        const interaction = action.payload?.interaction?.data

        if (!interaction) return

        const index = state.items.findIndex(
          (i) => i._id === interaction._id
        )

        if (index !== -1) {
          state.items[index] = interaction
        }
      })
      .addCase(reopenInteraction.fulfilled, (state, action) => {
        const itx = state.items.find((i) => i.id === action.payload)
        if (itx) itx.status = 'OPEN'
      })
      .addCase(markInteractionRead.fulfilled, (state, action) => {
        const itx = state.items.find((i) => i.id === action.payload)
        if (itx) itx.unreadCount = 0
      })
      .addCase(addNotes.fulfilled, (state, action) => {
        const itx = state?.items.find((i) => i?._id === action.payload?.interactionId)
        if (itx) itx.notes = action?.payload?.note?.data
      })
      .addCase(updateNote.fulfilled, (state, action) => {
        const itx = state?.items.find((i) => i?._id === action.payload?.interactionId)
        if (itx) itx.notes = action?.payload?.note?.data
      })
      .addCase(deleteNote.fulfilled, (state, action) => {
        const itx = state?.items.find((i) => i?._id === action.payload?.interactionId)
        if (itx) itx.notes = action?.payload?.note?.data
      })
      .addCase(addWorkCode.fulfilled, (state, action) => {
        const itx = state?.items.find((i) => i?._id === action.payload?.interactionId)
        if (itx) itx.workCodes = action?.payload?.workCodes?.data
      })
      .addCase(deleteWorkCode.fulfilled, (state, action) => {
        const itx = state?.items.find((i) => i?._id === action.payload?.interactionId)
        if (itx) itx.workCodes = action?.payload?.workCodes?.data
      })
    addLogoutReset(builder, () => initialState)
  }
})

export const {
  selectInteraction,
  setAssignmentFilter,
  setStatusFilter,
  setUnreadOnly,
  setInboxSearch,
  interactionUpserted,
  interactionAssigned,
  bumpLastMessage
} = interactionsSlice.actions

export const selectInteractions = (state) => state.interactions.items
export const selectSelectedInteractionId = (state) => state.interactions.selectedInteractionId
export const selectSelectedInteraction = (state) =>
  state.interactions.items.find((i) => i._id === state.interactions.selectedInteractionId) || null
export const selectAssignmentFilter = (state) => state.interactions.assignmentFilter
export const selectStatusFilter = (state) => state.interactions.statusFilter
export const selectUnreadOnly = (state) => state.interactions.unreadOnly
export const selectInboxSearch = (state) => state.interactions.search
export const selectInteractionsStatus = (state) => state.interactions.status
export const selectTotalUnreadCount = (state) =>
  state.interactions.items.reduce((sum, i) => sum + (i.unreadCount || 0), 0)

export default interactionsSlice.reducer
