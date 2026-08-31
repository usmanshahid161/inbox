import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import presenceApi from '../../services/presenceApi'
import { addLogoutReset } from '../../utils/resetOnLogout'

const initialState = {
  // agentId -> { status: 'ONLINE'|'OFFLINE', breaks: [] }
  byAgentId: {},
  myBreaks: [],
  starting: false,
  startError: null
}

export const fetchPresence = createAsyncThunk('presence/fetchAll', async (agentIds, { rejectWithValue }) => {
  try {
    return await presenceApi.list(agentIds)
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not load presence.')
  }
})

export const fetchMyActiveBreaks = createAsyncThunk('presence/fetchMyBreaks', async (_, { rejectWithValue }) => {
  try {
    return await presenceApi.myActiveBreaks()
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not load your breaks.')
  }
})

export const startBreak = createAsyncThunk('presence/startBreak', async (payload, { rejectWithValue }) => {
  try {
    return await presenceApi.startBreak(payload)
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not start break.')
  }
})

export const endBreak = createAsyncThunk('presence/endBreak', async (id, { rejectWithValue }) => {
  try {
    await presenceApi.endBreak(id)
    return id
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not end break.')
  }
})

const presenceSlice = createSlice({
  name: 'presence',
  initialState,
  reducers: {
    // Driven by realtime "presence" channel events.
    presenceStatusChanged(state, action) {
      const { agentId, status } = action.payload
      if (!state.byAgentId[agentId]) state.byAgentId[agentId] = { status: 'OFFLINE', breaks: [] }
      state.byAgentId[agentId].status = status
    },
    presenceBreakStarted(state, action) {
      const { agentId, break: brk } = action.payload
      if (!state.byAgentId[agentId]) state.byAgentId[agentId] = { status: 'OFFLINE', breaks: [] }
      state.byAgentId[agentId].breaks.push(brk)
    },
    presenceBreakEnded(state, action) {
      const { agentId, breakId } = action.payload
      if (state.byAgentId[agentId]) {
        state.byAgentId[agentId].breaks = state.byAgentId[agentId].breaks.filter((b) => b._id !== breakId)
      }
    },
    clearStartBreakError(state) {
      state.startError = null
    }
  },
  extraReducers(builder) {
    builder
      .addCase(fetchPresence.fulfilled, (state, action) => {
        const list = action.payload?.data || []
        list.forEach((p) => {
          state.byAgentId[p.agentId] = { status: p.status, breaks: p.breaks || [] }
        })
      })
      .addCase(fetchMyActiveBreaks.fulfilled, (state, action) => {
        state.myBreaks = action.payload?.data || []
      })
      .addCase(startBreak.pending, (state) => {
        state.starting = true
        state.startError = null
      })
      .addCase(startBreak.fulfilled, (state, action) => {
        state.starting = false
        state.myBreaks.push(action.payload?.data)
      })
      .addCase(startBreak.rejected, (state, action) => {
        state.starting = false
        state.startError = action.payload
      })
      .addCase(endBreak.fulfilled, (state, action) => {
        state.myBreaks = state.myBreaks.filter((b) => b._id !== action.payload)
      })

    addLogoutReset(builder, () => initialState)
  }
})

export const { presenceStatusChanged, presenceBreakStarted, presenceBreakEnded, clearStartBreakError } =
  presenceSlice.actions

export const selectPresenceByAgentId = (state) => state.presence.byAgentId
export const selectAgentPresence = (state, agentId) => state.presence.byAgentId[agentId] || { status: 'OFFLINE', breaks: [] }
export const selectMyActiveBreaks = (state) => state.presence.myBreaks
export const selectStartingBreak = (state) => state.presence.starting
export const selectStartBreakError = (state) => state.presence.startError

// Is this agent unavailable for a given channel+queue right now — either
// fully offline, on an overall break, or on a break scoped to exactly
// this channel+queue.
export const selectIsAgentAvailableFor = (state, agentId, channel, queueId) => {
  const presence = state.presence.byAgentId[agentId]
  if (!presence || presence.status !== 'ONLINE') return false
  const blocked = presence.breaks.some(
    (b) => b.overall || (String(b.channel) === String(channel) && String(b.queue) === String(queueId))
  )
  return !blocked
}

export default presenceSlice.reducer
