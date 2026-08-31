import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit'
import quickReplyApi from '../../services/quickReplyApi'
import { addLogoutReset } from '../../utils/resetOnLogout'

const initialState = {
  items: [],
  status: 'idle',
  error: null,
  saving: false,
  saveError: null,
  search: ''
}

export const fetchQuickReplies = createAsyncThunk('quickReplies/fetchAll', async (_, { rejectWithValue }) => {
  try {
    return await quickReplyApi.list()
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not load quick replies.')
  }
})

export const createQuickReply = createAsyncThunk('quickReplies/create', async (payload, { rejectWithValue }) => {
  try {
    return await quickReplyApi.create(payload)
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not create quick reply.')
  }
})

export const updateQuickReply = createAsyncThunk('quickReplies/update', async ({ id, payload }, { rejectWithValue }) => {
  try {
    return await quickReplyApi.update(id, payload)
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not update quick reply.')
  }
})

export const deleteQuickReply = createAsyncThunk('quickReplies/delete', async (id, { rejectWithValue }) => {
  try {
    await quickReplyApi.remove(id)
    return id
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not delete quick reply.')
  }
})

const quickRepliesSlice = createSlice({
  name: 'quickReplies',
  initialState,
  reducers: {
    setQuickReplySearch(state, action) {
      state.search = action.payload
    },
    clearQuickReplySaveError(state) {
      state.saveError = null
    }
  },
  extraReducers(builder) {
    builder
      .addCase(fetchQuickReplies.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchQuickReplies.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload?.data || []
      })
      .addCase(fetchQuickReplies.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })

      .addCase(createQuickReply.pending, (state) => {
        state.saving = true
        state.saveError = null
      })
      .addCase(createQuickReply.fulfilled, (state, action) => {
        state.saving = false
        state.items.unshift(action.payload?.data)
      })
      .addCase(createQuickReply.rejected, (state, action) => {
        state.saving = false
        state.saveError = action.payload
      })

      .addCase(updateQuickReply.pending, (state) => {
        state.saving = true
        state.saveError = null
      })
      .addCase(updateQuickReply.fulfilled, (state, action) => {
        state.saving = false
        const idx = state.items.findIndex((r) => r._id === action.payload?.data?._id)
        if (idx !== -1) state.items[idx] = action.payload.data
      })
      .addCase(updateQuickReply.rejected, (state, action) => {
        state.saving = false
        state.saveError = action.payload
      })

      .addCase(deleteQuickReply.fulfilled, (state, action) => {
        state.items = state.items.filter((r) => r._id !== action.payload)
      })

    addLogoutReset(builder, () => initialState)
  }
})

export const { setQuickReplySearch, clearQuickReplySaveError } = quickRepliesSlice.actions

export const selectAllQuickReplies = (state) => state.quickReplies.items
export const selectQuickRepliesStatus = (state) => state.quickReplies.status
export const selectQuickRepliesSaving = (state) => state.quickReplies.saving
export const selectQuickRepliesSaveError = (state) => state.quickReplies.saveError
export const selectQuickReplySearch = (state) => state.quickReplies.search

export const selectQuickReplyById = (state, id) => state.quickReplies.items.find((r) => r._id === id) || null

export const selectFilteredQuickReplies = createSelector(
  [selectAllQuickReplies, selectQuickReplySearch],
  (items, search) => {
    if (!search) return items
    const q = search.toLowerCase()
    return items.filter((r) => r.title?.toLowerCase().includes(q) || r.shortcut?.toLowerCase().includes(q))
  }
)

export default quickRepliesSlice.reducer
