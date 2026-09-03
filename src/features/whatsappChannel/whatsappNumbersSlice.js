import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit'
import whatsappChannelApi from '../../services/whatsappChannelApi.js'
import { addLogoutReset } from '../../utils/resetOnLogout'

const initialState = {
  items: [],
  status: 'idle', // idle | loading | succeeded | failed
  error: null,

  // "Add number" (phone + display name only)
  isAddFormOpen: false,
  adding: false,
  addError: null,

  // "Configure" (queues + flow assignment, and subscribe)
  isConfigureFormOpen: false,
  configuringId: null,
  saving: false,
  saveError: null,
  subscribing: false,
  subscribeError: null
}

export const fetchWhatsappNumbers = createAsyncThunk('whatsappNumbers/fetchAll', async (_, { rejectWithValue }) => {
  try {
    return await whatsappChannelApi.list()
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not load WhatsApp numbers.')
  }
})

export const createWhatsappNumber = createAsyncThunk(
  'whatsappNumbers/create',
  async (payload, { rejectWithValue }) => {
    try {
      return await whatsappChannelApi.create(payload)
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || 'Could not add number.')
    }
  }
)

export const updateWhatsappNumberAssignment = createAsyncThunk(
  'whatsappNumbers/updateAssignment',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await whatsappChannelApi.updateAssignment(id, payload)
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || 'Could not save queue/flow assignment.')
    }
  }
)

export const subscribeWhatsappNumber = createAsyncThunk(
  'whatsappNumbers/subscribe',
  async (id, { rejectWithValue }) => {
    try {
      return await whatsappChannelApi.subscribe(id)
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || 'Could not subscribe this number.')
    }
  }
)

export const unsubscribeWhatsappNumber = createAsyncThunk(
  'whatsappNumbers/unsubscribe',
  async (id, { rejectWithValue }) => {
    try {
      return await whatsappChannelApi.unsubscribe(id)
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || 'Could not unsubscribe this number.')
    }
  }
)

export const completeEmbeddedSignup = createAsyncThunk(
  'whatsappNumbers/completeEmbeddedSignup',
  async ({ code, wabaId, phoneNumberId }, { dispatch, rejectWithValue }) => {
    try {
      const result = await whatsappChannelApi.completeEmbeddedSignup({ code, wabaId, phoneNumberId })
      // The connected number now exists (or was updated) — refresh the
      // list so it shows up without a manual reload.
      dispatch(fetchWhatsappNumbers())
      return result
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || 'Could not finish connecting WhatsApp.')
    }
  }
)

export const deleteWhatsappNumber = createAsyncThunk(
  'whatsappNumbers/delete',
  async (id, { rejectWithValue }) => {
    try {
      await whatsappChannelApi.remove(id)
      return id
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || 'Could not remove this number.')
    }
  }
)

const whatsappNumbersSlice = createSlice({
  name: 'whatsappNumbers',
  initialState,
  reducers: {
    openAddNumberForm(state) {
      state.isAddFormOpen = true
      state.addError = null
    },
    closeAddNumberForm(state) {
      state.isAddFormOpen = false
      state.addError = null
    },
    openConfigureForm(state, action) {
      state.isConfigureFormOpen = true
      state.configuringId = action.payload
      state.saveError = null
      state.subscribeError = null
    },
    closeConfigureForm(state) {
      state.isConfigureFormOpen = false
      state.configuringId = null
      state.saveError = null
      state.subscribeError = null
    }
  },
  extraReducers(builder) {
    builder
      .addCase(fetchWhatsappNumbers.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchWhatsappNumbers.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload?.data || []
      })
      .addCase(fetchWhatsappNumbers.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })

      .addCase(createWhatsappNumber.pending, (state) => {
        state.adding = true
        state.addError = null
      })
      .addCase(createWhatsappNumber.fulfilled, (state, action) => {
        state.adding = false
        state.items.unshift(action.payload?.data)
        state.isAddFormOpen = false
        // Straight into "assign queue/flow" for the number just created —
        // matches the intended add -> assign -> subscribe flow.
        state.isConfigureFormOpen = true
        state.configuringId = action.payload?.data?._id
      })
      .addCase(createWhatsappNumber.rejected, (state, action) => {
        state.adding = false
        state.addError = action.payload
      })

      .addCase(updateWhatsappNumberAssignment.pending, (state) => {
        state.saving = true
        state.saveError = null
      })
      .addCase(updateWhatsappNumberAssignment.fulfilled, (state, action) => {
        state.saving = false
        const idx = state.items.findIndex((n) => n._id === action.payload?.data?._id)
        if (idx !== -1) state.items[idx] = action.payload.data
      })
      .addCase(updateWhatsappNumberAssignment.rejected, (state, action) => {
        state.saving = false
        state.saveError = action.payload
      })

      .addCase(subscribeWhatsappNumber.pending, (state) => {
        state.subscribing = true
        state.subscribeError = null
      })
      .addCase(subscribeWhatsappNumber.fulfilled, (state, action) => {
        state.subscribing = false
        const idx = state.items.findIndex((n) => n._id === action.payload?.data?._id)
        if (idx !== -1) state.items[idx] = action.payload.data
      })
      .addCase(subscribeWhatsappNumber.rejected, (state, action) => {
        state.subscribing = false
        state.subscribeError = action.payload
      })

      .addCase(unsubscribeWhatsappNumber.pending, (state) => {
        state.subscribing = true
        state.subscribeError = null
      })
      .addCase(unsubscribeWhatsappNumber.fulfilled, (state, action) => {
        state.subscribing = false
        const idx = state.items.findIndex((n) => n._id === action.payload?.data?._id)
        if (idx !== -1) state.items[idx] = action.payload.data
      })
      .addCase(unsubscribeWhatsappNumber.rejected, (state, action) => {
        state.subscribing = false
        state.subscribeError = action.payload
      })

      .addCase(deleteWhatsappNumber.fulfilled, (state, action) => {
        state.items = state.items.filter((n) => n._id !== action.payload)
        if (state.configuringId === action.payload) {
          state.isConfigureFormOpen = false
          state.configuringId = null
        }
      })

    addLogoutReset(builder, () => initialState)
  }
})

export const { openAddNumberForm, closeAddNumberForm, openConfigureForm, closeConfigureForm } =
  whatsappNumbersSlice.actions

export const selectWhatsappNumbers = (state) => state.whatsappNumbers.items
export const selectWhatsappNumbersStatus = (state) => state.whatsappNumbers.status

export const selectIsAddNumberFormOpen = (state) => state.whatsappNumbers.isAddFormOpen
export const selectAddingNumber = (state) => state.whatsappNumbers.adding
export const selectAddNumberError = (state) => state.whatsappNumbers.addError

export const selectIsConfigureFormOpen = (state) => state.whatsappNumbers.isConfigureFormOpen
export const selectConfiguringId = (state) => state.whatsappNumbers.configuringId
export const selectAssignmentSaving = (state) => state.whatsappNumbers.saving
export const selectAssignmentSaveError = (state) => state.whatsappNumbers.saveError
export const selectSubscribing = (state) => state.whatsappNumbers.subscribing
export const selectSubscribeError = (state) => state.whatsappNumbers.subscribeError

export const selectConfiguringNumber = createSelector(
  [selectWhatsappNumbers, selectConfiguringId],
  (items, id) => items.find((n) => n._id === id) || null
)

export default whatsappNumbersSlice.reducer