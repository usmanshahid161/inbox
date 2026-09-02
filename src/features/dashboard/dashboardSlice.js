import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import dashboardApi from '../../services/dashboardApi'
import { addLogoutReset } from '../../utils/resetOnLogout'

function todayRange() {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 6) // last 7 days, inclusive
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) }
}

const initialState = {
  filters: {
    ...todayRange(),
    channel: '',
    queues: [], // slugs, e.g. ["billing_information"] — empty = all queues
    agentId: ''
  },
  stats: null,
  agents: [],
  status: 'idle',
  error: null,

  unassigned: {
    open: false,
    items: [],
    total: 0,
    page: 1,
    limit: 20,
    status: 'idle'
  }
}

const serializeFilters = (filters) => ({
  from: filters.from,
  to: filters.to,
  channel: filters.channel || undefined,
  queues: filters.queues?.length ? filters.queues.join(',') : undefined,
  agentId: filters.agentId || undefined
})

export const fetchDashboard = createAsyncThunk('dashboard/fetch', async (_, { getState, rejectWithValue }) => {
  try {
    const filters = getState().dashboard.filters
    return await dashboardApi.get(serializeFilters(filters))
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not load dashboard.')
  }
})

export const fetchUnassigned = createAsyncThunk(
  'dashboard/fetchUnassigned',
  async (page = 1, { getState, rejectWithValue }) => {
    try {
      const filters = getState().dashboard.filters
      const limit = getState().dashboard.unassigned.limit
      return await dashboardApi.getUnassigned({ ...serializeFilters(filters), page, limit })
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || 'Could not load unassigned conversations.')
    }
  }
)

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setDateRange(state, action) {
      state.filters.from = action.payload.from
      state.filters.to = action.payload.to
    },
    setChannelFilter(state, action) {
      state.filters.channel = action.payload
    },
    setQueueFilter(state, action) {
      state.filters.queues = action.payload
    },
    setAgentFilter(state, action) {
      state.filters.agentId = action.payload
    },
    openUnassignedModal(state) {
      state.unassigned.open = true
      state.unassigned.page = 1
    },
    closeUnassignedModal(state) {
      state.unassigned.open = false
    }
  },
  extraReducers(builder) {
    builder
      .addCase(fetchDashboard.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.stats = action.payload?.data?.stats || null
        state.agents = action.payload?.data?.agents || []
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })

      .addCase(fetchUnassigned.pending, (state) => {
        state.unassigned.status = 'loading'
      })
      .addCase(fetchUnassigned.fulfilled, (state, action) => {
        state.unassigned.status = 'succeeded'
        state.unassigned.items = action.payload?.data?.items || []
        state.unassigned.total = action.payload?.data?.total || 0
        state.unassigned.page = action.payload?.data?.page || 1
      })
      .addCase(fetchUnassigned.rejected, (state) => {
        state.unassigned.status = 'failed'
      })

    addLogoutReset(builder, () => initialState)
  }
})

export const {
  setDateRange,
  setChannelFilter,
  setQueueFilter,
  setAgentFilter,
  openUnassignedModal,
  closeUnassignedModal
} = dashboardSlice.actions

export const selectDashboardFilters = (state) => state.dashboard.filters
export const selectDashboardStats = (state) => state.dashboard.stats
export const selectDashboardAgents = (state) => state.dashboard.agents
export const selectDashboardStatus = (state) => state.dashboard.status
export const selectOnlineAgentsCount = (state) => state.dashboard.agents.filter((a) => a.status === 'ONLINE').length
export const selectUnassignedModal = (state) => state.dashboard.unassigned

export default dashboardSlice.reducer