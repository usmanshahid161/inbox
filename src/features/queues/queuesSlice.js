import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit'
import queueApi from '../../services/queueApi'
import { addLogoutReset } from '../../utils/resetOnLogout'

const initialState = {
  items: [],
  status: 'idle',
  error: null,
  saving: false,
  saveError: null,
  search: ''
}

export const fetchQueues = createAsyncThunk('queues/fetchAll', async (_, { rejectWithValue }) => {
  try {
    return await queueApi.list()
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not load queues.')
  }
})

export const createQueue = createAsyncThunk('queues/create', async (payload, { rejectWithValue }) => {
  try {
    return await queueApi.create(payload)
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not create queue.')
  }
})

export const updateQueue = createAsyncThunk('queues/update', async ({ id, payload }, { rejectWithValue }) => {
  try {
    return await queueApi.update(id, payload)
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not update queue.')
  }
})

export const deleteQueue = createAsyncThunk('queues/delete', async (id, { rejectWithValue }) => {
  try {
    await queueApi.remove(id)
    return id
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not delete queue.')
  }
})

const queuesSlice = createSlice({
  name: 'queues',
  initialState,
  reducers: {
    setQueueSearch(state, action) {
      state.search = action.payload
    },
    clearQueueSaveError(state) {
      state.saveError = null
    }
  },
  extraReducers(builder) {
    builder
      .addCase(fetchQueues.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchQueues.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload?.data || []
      })
      .addCase(fetchQueues.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })

      .addCase(createQueue.pending, (state) => {
        state.saving = true
        state.saveError = null
      })
      .addCase(createQueue.fulfilled, (state, action) => {
        state.saving = false
        state.items.unshift(action.payload?.data)
      })
      .addCase(createQueue.rejected, (state, action) => {
        state.saving = false
        state.saveError = action.payload
      })

      .addCase(updateQueue.pending, (state) => {
        state.saving = true
        state.saveError = null
      })
      .addCase(updateQueue.fulfilled, (state, action) => {
        state.saving = false
        const idx = state.items.findIndex((q) => q._id === action.payload?.data?._id)
        if (idx !== -1) state.items[idx] = action.payload.data
      })
      .addCase(updateQueue.rejected, (state, action) => {
        state.saving = false
        state.saveError = action.payload
      })

      .addCase(deleteQueue.fulfilled, (state, action) => {
        state.items = state.items.filter((q) => q._id !== action.payload)
      })

    addLogoutReset(builder, () => initialState)
  }
})

export const { setQueueSearch, clearQueueSaveError } = queuesSlice.actions

export const selectAllQueues = (state) => state.queues.items
export const selectQueuesStatus = (state) => state.queues.status
export const selectQueuesSaving = (state) => state.queues.saving
export const selectQueuesSaveError = (state) => state.queues.saveError
export const selectQueueSearch = (state) => state.queues.search

export const selectQueueById = (state, id) => state.queues.items.find((q) => q._id === id) || null

export const selectFilteredQueues = createSelector([selectAllQueues, selectQueueSearch], (items, search) =>
  !search ? items : items.filter((q) => q.name?.toLowerCase().includes(search.toLowerCase()))
)

// Handy for dropdowns elsewhere (e.g. Team / Agent forms)
export const selectQueueOptions = createSelector([selectAllQueues], (items) =>
  items.map((q) => ({ id: q.slug, label: q.name }))
)

export default queuesSlice.reducer
