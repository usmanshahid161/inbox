// src/features/flows/flowsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import flowsAPI from '../../services/flowsApi.js'

const initialState = {
  items: [],           // list view (name, status, timestamps only)
  status: 'idle',       // list fetch status
  currentFlow: null,     // full flow (nodes+edges) loaded into the builder
  currentFlowStatus: 'idle',
  saving: false,
  saveError: null,
}

export const fetchFlows = createAsyncThunk('flows/fetchAll', async () => {
  return await flowsAPI.list()
})

export const fetchFlowById = createAsyncThunk('flows/fetchOne', async (id) => {
  return await flowsAPI.get(id)
})

export const createFlow = createAsyncThunk('flows/create', async (payload, { rejectWithValue }) => {
  try {
    return await flowsAPI.create(payload)
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Failed to create flow')
  }
})

export const updateFlow = createAsyncThunk('flows/update', async ({ id, payload }, { rejectWithValue }) => {
  try {
    return await flowsAPI.update(id, payload)
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Failed to save flow')
  }
})

export const deleteFlow = createAsyncThunk('flows/delete', async (id, { rejectWithValue }) => {
  try {
    await flowsAPI.remove(id)
    return id
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Failed to delete flow')
  }
})

export const duplicateFlow = createAsyncThunk('flows/duplicate', async (id, { rejectWithValue }) => {
  try {
    return await flowsAPI.duplicate(id)
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Failed to duplicate flow')
  }
})

const flowsSlice = createSlice({
  name: 'flows',
  initialState,
  reducers: {
    clearCurrentFlow(state) {
      state.currentFlow = null
      state.currentFlowStatus = 'idle'
      state.saveError = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFlows.pending, (state) => { state.status = 'loading' })
      .addCase(fetchFlows.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload?.data
      })
      .addCase(fetchFlows.rejected, (state) => { state.status = 'failed' })

      .addCase(fetchFlowById.pending, (state) => { state.currentFlowStatus = 'loading' })
      .addCase(fetchFlowById.fulfilled, (state, action) => {
        state.currentFlowStatus = 'succeeded'
        state.currentFlow = action.payload?.data
      })
      .addCase(fetchFlowById.rejected, (state) => { state.currentFlowStatus = 'failed' })

      .addCase(createFlow.pending, (state) => { state.saving = true; state.saveError = null })
      .addCase(createFlow.fulfilled, (state, action) => {
        state.saving = false
        state.currentFlow = action.payload?.data
        state.items.unshift(action.payload?.data)
      })
      .addCase(createFlow.rejected, (state, action) => {
        state.saving = false
        state.saveError = action.payload || action.error.message
      })

      .addCase(updateFlow.pending, (state) => { state.saving = true; state.saveError = null })
      .addCase(updateFlow.fulfilled, (state, action) => {
        state.saving = false
        state.currentFlow = action.payload
        const idx = state.items.findIndex((f) => f._id === action.payload._id)
        if (idx !== -1) state.items[idx] = { ...state.items[idx], ...action.payload }
      })
      .addCase(updateFlow.rejected, (state, action) => {
        state.saving = false
        state.saveError = action.payload || action.error.message
      })

      .addCase(deleteFlow.fulfilled, (state, action) => {
        state.items = state.items.filter((f) => f._id !== action.payload)
      })

      .addCase(duplicateFlow.fulfilled, (state, action) => {
        state.items.unshift(action?.payload?.data)
      })
  },
})

export const { clearCurrentFlow } = flowsSlice.actions
export default flowsSlice.reducer

// Selectors
export const selectFlowsList = (state) => state.flows.items
export const selectFlowsListStatus = (state) => state.flows.status
export const selectCurrentFlow = (state) => state.flows.currentFlow
export const selectCurrentFlowStatus = (state) => state.flows.currentFlowStatus
export const selectFlowSaving = (state) => state.flows.saving
export const selectFlowSaveError = (state) => state.flows.saveError