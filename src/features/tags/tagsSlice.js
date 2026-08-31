import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit'
import tagApi from '../../services/tagApi'
import { addLogoutReset } from '../../utils/resetOnLogout'

const initialState = {
  items: [],
  status: 'idle', // idle | loading | succeeded | failed
  error: null,
  saving: false,
  saveError: null,
  search: ''
}

export const fetchTags = createAsyncThunk('tags/fetchAll', async (_, { rejectWithValue }) => {
  try {
    return await tagApi.list()
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not load tags.')
  }
})

export const createTag = createAsyncThunk('tags/create', async (payload, { rejectWithValue }) => {
  try {
    return await tagApi.create(payload)
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not create tag.')
  }
})

export const updateTag = createAsyncThunk('tags/update', async ({ id, payload }, { rejectWithValue }) => {
  try {
    return await tagApi.update(id, payload)
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not update tag.')
  }
})

export const deleteTag = createAsyncThunk('tags/delete', async (id, { rejectWithValue }) => {
  try {
    await tagApi.remove(id)
    return id
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not delete tag.')
  }
})

const tagsSlice = createSlice({
  name: 'tags',
  initialState,
  reducers: {
    setTagSearch(state, action) {
      state.search = action.payload
    },
    clearTagSaveError(state) {
      state.saveError = null
    }
  },
  extraReducers(builder) {
    builder
      .addCase(fetchTags.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchTags.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload?.data || []
      })
      .addCase(fetchTags.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })

      .addCase(createTag.pending, (state) => {
        state.saving = true
        state.saveError = null
      })
      .addCase(createTag.fulfilled, (state, action) => {
        state.saving = false
        state.items.unshift(action.payload?.data)
      })
      .addCase(createTag.rejected, (state, action) => {
        state.saving = false
        state.saveError = action.payload
      })

      .addCase(updateTag.pending, (state) => {
        state.saving = true
        state.saveError = null
      })
      .addCase(updateTag.fulfilled, (state, action) => {
        state.saving = false
        const idx = state.items.findIndex((t) => t._id === action.payload?.data?._id)
        if (idx !== -1) state.items[idx] = action.payload.data
      })
      .addCase(updateTag.rejected, (state, action) => {
        state.saving = false
        state.saveError = action.payload
      })

      .addCase(deleteTag.fulfilled, (state, action) => {
        state.items = state.items.filter((t) => t._id !== action.payload)
      })

    addLogoutReset(builder, () => initialState)
  }
})

export const { setTagSearch, clearTagSaveError } = tagsSlice.actions

export const selectAllTags = (state) => state.tags.items
export const selectTagsStatus = (state) => state.tags.status
export const selectTagsSaving = (state) => state.tags.saving
export const selectTagsSaveError = (state) => state.tags.saveError
export const selectTagSearch = (state) => state.tags.search

export const selectTagById = (state, id) => state.tags.items.find((t) => t._id === id) || null

export const selectFilteredTags = createSelector([selectAllTags, selectTagSearch], (items, search) =>
  !search ? items : items.filter((t) => t.name?.toLowerCase().includes(search.toLowerCase()))
)

export default tagsSlice.reducer
