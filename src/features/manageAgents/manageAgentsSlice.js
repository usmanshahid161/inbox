import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit'
import manageAgentApi from '../../services/manageAgentApi'
import { addLogoutReset } from '../../utils/resetOnLogout'

const initialState = {
  items: [],
  status: 'idle',
  error: null,
  saving: false,
  saveError: null,
  search: '',

  // "Change password" stays a quick modal action rather than a page —
  // everything else (create/edit) now lives on its own route.
  isPasswordFormOpen: false,
  passwordAgentId: null,
  passwordSaving: false,
  passwordSaveError: null
}

export const fetchManagedAgents = createAsyncThunk('manageAgents/fetchAll', async (_, { rejectWithValue }) => {
  try {
    return await manageAgentApi.list()
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not load agents.')
  }
})

export const createManagedAgent = createAsyncThunk('manageAgents/create', async (payload, { rejectWithValue }) => {
  try {
    return await manageAgentApi.create(payload)
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not create agent.')
  }
})

export const updateManagedAgent = createAsyncThunk(
  'manageAgents/update',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await manageAgentApi.update(id, payload)
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || 'Could not update agent.')
    }
  }
)

export const updateManagedAgentPassword = createAsyncThunk(
  'manageAgents/updatePassword',
  async ({ id, password }, { rejectWithValue }) => {
    try {
      await manageAgentApi.updatePassword(id, password)
      return id
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || 'Could not update password.')
    }
  }
)

export const deleteManagedAgent = createAsyncThunk('manageAgents/delete', async (id, { rejectWithValue }) => {
  try {
    await manageAgentApi.remove(id)
    return id
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not delete agent.')
  }
})

const manageAgentsSlice = createSlice({
  name: 'manageAgents',
  initialState,
  reducers: {
    clearAgentSaveError(state) {
      state.saveError = null
    },
    openPasswordForm(state, action) {
      state.isPasswordFormOpen = true
      state.passwordAgentId = action.payload
      state.passwordSaveError = null
    },
    closePasswordForm(state) {
      state.isPasswordFormOpen = false
      state.passwordAgentId = null
      state.passwordSaveError = null
    },
    setManagedAgentSearch(state, action) {
      state.search = action.payload
    }
  },
  extraReducers(builder) {
    builder
      .addCase(fetchManagedAgents.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchManagedAgents.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload?.data || []
      })
      .addCase(fetchManagedAgents.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })

      .addCase(createManagedAgent.pending, (state) => {
        state.saving = true
        state.saveError = null
      })
      .addCase(createManagedAgent.fulfilled, (state, action) => {
        state.saving = false
        state.items.unshift(action.payload?.data)
      })
      .addCase(createManagedAgent.rejected, (state, action) => {
        state.saving = false
        state.saveError = action.payload
      })

      .addCase(updateManagedAgent.pending, (state) => {
        state.saving = true
        state.saveError = null
      })
      .addCase(updateManagedAgent.fulfilled, (state, action) => {
        state.saving = false
        const idx = state.items.findIndex((a) => a._id === action.payload?.data?._id)
        if (idx !== -1) state.items[idx] = action.payload.data
      })
      .addCase(updateManagedAgent.rejected, (state, action) => {
        state.saving = false
        state.saveError = action.payload
      })

      .addCase(updateManagedAgentPassword.pending, (state) => {
        state.passwordSaving = true
        state.passwordSaveError = null
      })
      .addCase(updateManagedAgentPassword.fulfilled, (state) => {
        state.passwordSaving = false
        state.isPasswordFormOpen = false
        state.passwordAgentId = null
      })
      .addCase(updateManagedAgentPassword.rejected, (state, action) => {
        state.passwordSaving = false
        state.passwordSaveError = action.payload
      })

      .addCase(deleteManagedAgent.fulfilled, (state, action) => {
        state.items = state.items.filter((a) => a._id !== action.payload)
      })

    addLogoutReset(builder, () => initialState)
  }
})

export const {
  clearAgentSaveError,
  openPasswordForm,
  closePasswordForm,
  setManagedAgentSearch
} = manageAgentsSlice.actions

export const selectAllManagedAgents = (state) => state.manageAgents.items
export const selectManagedAgentsStatus = (state) => state.manageAgents.status
export const selectManagedAgentsSaving = (state) => state.manageAgents.saving
export const selectManagedAgentsSaveError = (state) => state.manageAgents.saveError
export const selectManagedAgentSearch = (state) => state.manageAgents.search

export const selectIsPasswordFormOpen = (state) => state.manageAgents.isPasswordFormOpen
export const selectPasswordAgentId = (state) => state.manageAgents.passwordAgentId
export const selectPasswordSaving = (state) => state.manageAgents.passwordSaving
export const selectPasswordSaveError = (state) => state.manageAgents.passwordSaveError

export const selectManagedAgentById = (state, id) => state.manageAgents.items.find((a) => a._id === id) || null

export const selectFilteredManagedAgents = createSelector(
  [selectAllManagedAgents, selectManagedAgentSearch],
  (items, search) => {
    if (!search) return items
    const q = search.toLowerCase()
    return items.filter(
      (a) => a.name?.toLowerCase().includes(q) || a.username?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q)
    )
  }
)

// Handy for dropdowns elsewhere (e.g. Team form) — admins are excluded since
// they can't be assigned to queues/teams/groups.
export const selectManagedAgentOptions = createSelector([selectAllManagedAgents], (items) =>
  items.filter((a) => a.role !== 'ADMIN').map((a) => ({ id: a._id, label: a.name || a.username }))
)

export default manageAgentsSlice.reducer
