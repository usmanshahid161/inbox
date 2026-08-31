import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit'
import groupApi from '../../services/groupApi'
import { addLogoutReset } from '../../utils/resetOnLogout'

const initialState = {
  items: [],
  status: 'idle',
  error: null,
  saving: false,
  saveError: null,
  search: ''
}

export const fetchGroups = createAsyncThunk('groups/fetchAll', async (_, { rejectWithValue }) => {
  try {
    return await groupApi.list()
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not load groups.')
  }
})

export const createGroup = createAsyncThunk('groups/create', async (payload, { rejectWithValue }) => {
  try {
    return await groupApi.create(payload)
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not create group.')
  }
})

export const updateGroup = createAsyncThunk('groups/update', async ({ id, payload }, { rejectWithValue }) => {
  try {
    return await groupApi.update(id, payload)
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not update group.')
  }
})

export const deleteGroup = createAsyncThunk('groups/delete', async (id, { rejectWithValue }) => {
  try {
    await groupApi.remove(id)
    return id
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not delete group.')
  }
})

const groupsSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    setGroupSearch(state, action) {
      state.search = action.payload
    },
    clearGroupSaveError(state) {
      state.saveError = null
    }
  },
  extraReducers(builder) {
    builder
      .addCase(fetchGroups.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchGroups.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload?.data || []
      })
      .addCase(fetchGroups.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })

      .addCase(createGroup.pending, (state) => {
        state.saving = true
        state.saveError = null
      })
      .addCase(createGroup.fulfilled, (state, action) => {
        state.saving = false
        state.items.unshift(action.payload?.data)
      })
      .addCase(createGroup.rejected, (state, action) => {
        state.saving = false
        state.saveError = action.payload
      })

      .addCase(updateGroup.pending, (state) => {
        state.saving = true
        state.saveError = null
      })
      .addCase(updateGroup.fulfilled, (state, action) => {
        state.saving = false
        const idx = state.items.findIndex((g) => g._id === action.payload?.data?._id)
        if (idx !== -1) state.items[idx] = action.payload.data
      })
      .addCase(updateGroup.rejected, (state, action) => {
        state.saving = false
        state.saveError = action.payload
      })

      .addCase(deleteGroup.fulfilled, (state, action) => {
        state.items = state.items.filter((g) => g._id !== action.payload)
      })

    addLogoutReset(builder, () => initialState)
  }
})

export const { setGroupSearch, clearGroupSaveError } = groupsSlice.actions

export const selectAllGroups = (state) => state.groups.items
export const selectGroupsStatus = (state) => state.groups.status
export const selectGroupsSaving = (state) => state.groups.saving
export const selectGroupsSaveError = (state) => state.groups.saveError
export const selectGroupSearch = (state) => state.groups.search

export const selectGroupById = (state, id) => state.groups.items.find((g) => g._id === id) || null

export const selectFilteredGroups = createSelector([selectAllGroups, selectGroupSearch], (items, search) =>
  !search ? items : items.filter((g) => g.name?.toLowerCase().includes(search.toLowerCase()))
)

// Handy for dropdowns elsewhere (e.g. Team / Agent forms)
export const selectGroupOptions = createSelector([selectAllGroups], (items) =>
  items.map((g) => ({ id: g._id, label: g.name }))
)

export default groupsSlice.reducer
