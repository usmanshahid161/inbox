import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import agentApi from '../../services/agentApi'
import { addLogoutReset } from '../../utils/resetOnLogout'

const initialState = {
  items: [],
  status: 'idle',
  error: null,
  mutationStatus: 'idle' // tracks create/update/deactivate in flight, for form UIs
}

export const fetchAgents = createAsyncThunk('agents/fetch', async (_, { rejectWithValue }) => {
  try {
    return await agentApi.list()
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not load agents.')
  }
})

export const createAgent = createAsyncThunk('agents/create', async (payload, { rejectWithValue }) => {
  try {
    return await agentApi.create(payload)
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not create agent.')
  }
})

export const updateAgent = createAsyncThunk('agents/update', async ({ agentId, changes }, { rejectWithValue }) => {
  try {
    return await agentApi.update(agentId, changes)
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not update agent.')
  }
})

export const deactivateAgent = createAsyncThunk('agents/deactivate', async (agentId, { rejectWithValue }) => {
  try {
    return await agentApi.deactivate(agentId)
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not deactivate agent.')
  }
})

const agentsSlice = createSlice({
  name: 'agents',
  initialState,
  reducers: {
    // Driven by a realtime "agent.status_changed" event over Centrifuge.
    agentStatusChanged(state, action) {
      const { agentId, status } = action.payload
      const agent = state.items.find((a) => a.id === agentId)
      if (agent) agent.status = status
    }
  },
  extraReducers(builder) {
    builder
      .addCase(fetchAgents.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchAgents.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchAgents.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      .addCase(createAgent.pending, (state) => {
        state.mutationStatus = 'loading'
      })
      .addCase(createAgent.fulfilled, (state, action) => {
        state.mutationStatus = 'succeeded'
        state.items.push(action.payload)
      })
      .addCase(createAgent.rejected, (state, action) => {
        state.mutationStatus = 'failed'
        state.error = action.payload
      })
      .addCase(updateAgent.fulfilled, (state, action) => {
        const idx = state.items.findIndex((a) => a.id === action.payload.id)
        if (idx !== -1) state.items[idx] = action.payload
      })
      .addCase(deactivateAgent.fulfilled, (state, action) => {
        const idx = state.items.findIndex((a) => a.id === action.payload.id)
        if (idx !== -1) state.items[idx] = action.payload
      })
    addLogoutReset(builder, () => initialState)
  }
})

export const { agentStatusChanged } = agentsSlice.actions
export const selectAgents = (state) => state.agents.items
export const selectAgentsStatus = (state) => state.agents.status
export const selectAgentById = (state, id) => state.agents.items.find((a) => a.id === id)
export default agentsSlice.reducer
