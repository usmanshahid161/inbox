// src/features/templates/templatesSlice.js
import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit'
import templatesAPI from '../../services/templatesAPI'

const initialState = {
  items: [],
  status: 'idle', // idle | loading | succeeded | failed
  error: null,
  saving: false,
  saveError: null,
  filters: {
    search: '',
    status: 'ALL',
    category: 'ALL',
  },
  selectedTemplateId: null,
  isFormOpen: false,
  editingTemplateId: null, // null = creating new
}

export const fetchTemplates = createAsyncThunk('templates/fetchAll', async () => {
  return await templatesAPI.list()
})

export const createTemplate = createAsyncThunk(
  'templates/create',
  async (payload, { rejectWithValue }) => {
    try {
      return await templatesAPI.create(payload)
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || 'Failed to create template')
    }
  }
)

export const updateTemplate = createAsyncThunk(
  'templates/update',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      return await templatesAPI.update(id, payload)
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || 'Failed to update template')
    }
  }
)

export const deleteTemplate = createAsyncThunk(
  'templates/delete',
  async (id, { rejectWithValue }) => {
    try {
      await templatesAPI.remove(id)
      return id
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || 'Failed to delete template')
    }
  }
)

export const submitTemplateForReview = createAsyncThunk(
  'templates/submit',
  async (id, { rejectWithValue }) => {
    try {
      return await templatesAPI.submit(id)
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || 'Failed to submit template')
    }
  }
)

export const syncTemplateStatuses = createAsyncThunk('templates/sync', async () => {
  return await templatesAPI.sync()
})

const templatesSlice = createSlice({
  name: 'templates',
  initialState,
  reducers: {
    openCreateForm(state) {
      state.isFormOpen = true
      state.editingTemplateId = null
    },
    openEditForm(state, action) {
      state.isFormOpen = true
      state.editingTemplateId = action.payload
    },
    closeForm(state) {
      state.isFormOpen = false
      state.editingTemplateId = null
      state.saveError = null
    },
    setSearchFilter(state, action) {
      state.filters.search = action.payload
    },
    setStatusFilter(state, action) {
      state.filters.status = action.payload
    },
    setCategoryFilter(state, action) {
      state.filters.category = action.payload
    },
    selectTemplate(state, action) {
      state.selectedTemplateId = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTemplates.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchTemplates.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload?.data
      })
      .addCase(fetchTemplates.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.error.message
      })

      .addCase(createTemplate.pending, (state) => {
        state.saving = true
        state.saveError = null
      })
      .addCase(createTemplate.fulfilled, (state, action) => {
        state.saving = false
        state.items.unshift(action.payload?.data)
        state.isFormOpen = false
      })
      .addCase(createTemplate.rejected, (state, action) => {
        state.saving = false
        state.saveError = action.payload || action.error.message
      })

      .addCase(updateTemplate.pending, (state) => {
        state.saving = true
        state.saveError = null
      })
      .addCase(updateTemplate.fulfilled, (state, action) => {
        state.saving = false
        const idx = state.items.findIndex((t) => t._id === action.payload._id)
        if (idx !== -1) state.items[idx] = action.payload
        state.isFormOpen = false
        state.editingTemplateId = null
      })
      .addCase(updateTemplate.rejected, (state, action) => {
        state.saving = false
        state.saveError = action.payload || action.error.message
      })

      .addCase(deleteTemplate.fulfilled, (state, action) => {
        state.items = state.items.filter((t) => t._id !== action.payload)
        if (state.selectedTemplateId === action.payload) state.selectedTemplateId = null
      })

      .addCase(submitTemplateForReview.fulfilled, (state, action) => {
        const idx = state.items.findIndex((t) => t._id === action.payload._id)
        if (idx !== -1) state.items[idx] = action.payload
      })

      .addCase(syncTemplateStatuses.fulfilled, (state, action) => {
        state.items = action.payload?.data
      })
  },
})

export const {
  openCreateForm,
  openEditForm,
  closeForm,
  setSearchFilter,
  setStatusFilter,
  setCategoryFilter,
  selectTemplate,
} = templatesSlice.actions

// ---- Selectors ----
export const selectTemplatesState = (state) => state.templates
export const selectAllTemplates = (state) => state.templates?.items
export const selectTemplatesStatus = (state) => state.templates?.status
export const selectTemplatesFilters = (state) => state.templates?.filters
export const selectIsFormOpen = (state) => state.templates?.isFormOpen
export const selectEditingTemplateId = (state) => state.templates?.editingTemplateId
export const selectSaving = (state) => state.templates?.saving
export const selectSaveError = (state) => state.templates?.saveError
export const selectSelectedTemplateId = (state) => state.templates?.selectedTemplateId

export const selectEditingTemplate = createSelector(
  [selectAllTemplates, selectEditingTemplateId],
  (items, id) => items?.find((t) => t?._id === id) || null
)

export const selectFilteredTemplates = createSelector(
  [selectAllTemplates, selectTemplatesFilters],
  (items, filters) => {
    return items?.filter((t) => {
      const matchesSearch = !filters?.search || t?.name.toLowerCase().includes(filters?.search.toLowerCase())
      const matchesStatus = filters?.status === 'ALL' || t?.status === filters?.status
      const matchesCategory = filters?.category === 'ALL' || t?.category === filters?.category
      return matchesSearch && matchesStatus && matchesCategory
    })
  }
)

export const selectTemplateCounts = createSelector([selectAllTemplates], (items) => {
  return items?.reduce(
    (acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1
      acc.ALL += 1
      return acc
    },
    { ALL: 0 }
  )
})

export default templatesSlice?.reducer
