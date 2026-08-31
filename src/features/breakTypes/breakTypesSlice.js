import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit'
import breakTypeApi from '../../services/breakTypeApi'
import { addLogoutReset } from '../../utils/resetOnLogout'

const initialState = {
  items: [],
  status: 'idle',
  saving: false,
  saveError: null
}

export const fetchBreakTypes = createAsyncThunk('breakTypes/fetchAll', async (_, { rejectWithValue }) => {
  try {
    return await breakTypeApi.list()
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not load break types.')
  }
})

export const createBreakType = createAsyncThunk('breakTypes/create', async (payload, { rejectWithValue }) => {
  try {
    return await breakTypeApi.create(payload)
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not create break type.')
  }
})

export const updateBreakType = createAsyncThunk('breakTypes/update', async ({ id, payload }, { rejectWithValue }) => {
  try {
    return await breakTypeApi.update(id, payload)
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not update break type.')
  }
})

export const deleteBreakType = createAsyncThunk('breakTypes/delete', async (id, { rejectWithValue }) => {
  try {
    await breakTypeApi.remove(id)
    return id
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not delete break type.')
  }
})

const breakTypesSlice = createSlice({
  name: 'breakTypes',
  initialState,
  reducers: {
    clearBreakTypeSaveError(state) {
      state.saveError = null
    }
  },
  extraReducers(builder) {
    builder
      .addCase(fetchBreakTypes.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchBreakTypes.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload?.data || []
      })
      .addCase(fetchBreakTypes.rejected, (state) => {
        state.status = 'failed'
      })
      .addCase(createBreakType.pending, (state) => {
        state.saving = true
        state.saveError = null
      })
      .addCase(createBreakType.fulfilled, (state, action) => {
        state.saving = false
        state.items.unshift(action.payload?.data)
      })
      .addCase(createBreakType.rejected, (state, action) => {
        state.saving = false
        state.saveError = action.payload
      })
      .addCase(updateBreakType.pending, (state) => {
        state.saving = true
        state.saveError = null
      })
      .addCase(updateBreakType.fulfilled, (state, action) => {
        state.saving = false
        const idx = state.items.findIndex((b) => b._id === action.payload?.data?._id)
        if (idx !== -1) state.items[idx] = action.payload.data
      })
      .addCase(updateBreakType.rejected, (state, action) => {
        state.saving = false
        state.saveError = action.payload
      })
      .addCase(deleteBreakType.fulfilled, (state, action) => {
        state.items = state.items.filter((b) => b._id !== action.payload)
      })

    addLogoutReset(builder, () => initialState)
  }
})

export const { clearBreakTypeSaveError } = breakTypesSlice.actions

export const selectAllBreakTypes = (state) => state.breakTypes.items
export const selectBreakTypesStatus = (state) => state.breakTypes.status
export const selectBreakTypesSaving = (state) => state.breakTypes.saving
export const selectBreakTypesSaveError = (state) => state.breakTypes.saveError
export const selectBreakTypeById = (state, id) => state.breakTypes.items.find((b) => b._id === id) || null

export const selectBreakTypeOptions = createSelector([selectAllBreakTypes], (items) =>
  items.map((b) => ({ id: b._id, label: b.name }))
)

export default breakTypesSlice.reducer
