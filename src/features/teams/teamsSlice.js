import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit'
import teamApi from '../../services/teamApi'
import { addLogoutReset } from '../../utils/resetOnLogout'

const initialState = {
  items: [],
  status: 'idle',
  error: null,
  saving: false,
  saveError: null,
  search: ''
}

export const fetchTeams = createAsyncThunk('teams/fetchAll', async (_, { rejectWithValue }) => {
  try {
    return await teamApi.list()
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not load teams.')
  }
})

export const createTeam = createAsyncThunk('teams/create', async (payload, { rejectWithValue }) => {
  try {
    return await teamApi.create(payload)
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not create team.')
  }
})

export const updateTeam = createAsyncThunk('teams/update', async ({ id, payload }, { rejectWithValue }) => {
  try {
    return await teamApi.update(id, payload)
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not update team.')
  }
})

export const deleteTeam = createAsyncThunk('teams/delete', async (id, { rejectWithValue }) => {
  try {
    await teamApi.remove(id)
    return id
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not delete team.')
  }
})

const teamsSlice = createSlice({
  name: 'teams',
  initialState,
  reducers: {
    setTeamSearch(state, action) {
      state.search = action.payload
    },
    clearTeamSaveError(state) {
      state.saveError = null
    }
  },
  extraReducers(builder) {
    builder
      .addCase(fetchTeams.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchTeams.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload?.data || []
      })
      .addCase(fetchTeams.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })

      .addCase(createTeam.pending, (state) => {
        state.saving = true
        state.saveError = null
      })
      .addCase(createTeam.fulfilled, (state, action) => {
        state.saving = false
        state.items.unshift(action.payload?.data)
      })
      .addCase(createTeam.rejected, (state, action) => {
        state.saving = false
        state.saveError = action.payload
      })

      .addCase(updateTeam.pending, (state) => {
        state.saving = true
        state.saveError = null
      })
      .addCase(updateTeam.fulfilled, (state, action) => {
        state.saving = false
        const idx = state.items.findIndex((t) => t._id === action.payload?.data?._id)
        if (idx !== -1) state.items[idx] = action.payload.data
      })
      .addCase(updateTeam.rejected, (state, action) => {
        state.saving = false
        state.saveError = action.payload
      })

      .addCase(deleteTeam.fulfilled, (state, action) => {
        state.items = state.items.filter((t) => t._id !== action.payload)
      })

    addLogoutReset(builder, () => initialState)
  }
})

export const { setTeamSearch, clearTeamSaveError } = teamsSlice.actions

export const selectAllTeams = (state) => state.teams.items
export const selectTeamsStatus = (state) => state.teams.status
export const selectTeamsSaving = (state) => state.teams.saving
export const selectTeamsSaveError = (state) => state.teams.saveError
export const selectTeamSearch = (state) => state.teams.search

export const selectTeamById = (state, id) => state.teams.items.find((t) => t._id === id) || null

export const selectFilteredTeams = createSelector([selectAllTeams, selectTeamSearch], (items, search) =>
  !search ? items : items.filter((t) => t.name?.toLowerCase().includes(search.toLowerCase()))
)

// Handy for dropdowns elsewhere (e.g. Agent form)
export const selectTeamOptions = createSelector([selectAllTeams], (items) =>
  items.map((t) => ({ id: t._id, label: t.name }))
)

export default teamsSlice.reducer
