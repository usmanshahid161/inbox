import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import contactApi from '../../services/contactApi'
import { addLogoutReset } from '../../utils/resetOnLogout'

const initialState = {
  items: [],
  status: 'idle',
  search: '',
  saving: false,
  saveError: null,

  // Activity log + assign/unassign state for whichever contact is
  // currently open (detail page, or the Inbox Contacts tab).
  activityByContactId: {},
  assigning: false,
  assignError: null
}

export const fetchContacts = createAsyncThunk('contacts/fetchAll', async (params, { rejectWithValue }) => {
  try {
    return await contactApi.list(params)
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not load contacts.')
  }
})

export const fetchContactActivity = createAsyncThunk(
  'contacts/fetchActivity',
  async (contactId, { rejectWithValue }) => {
    try {
      const res = await contactApi.listActivity(contactId)
      return { contactId, activity: res?.data || [] }
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || 'Could not load activity.')
    }
  }
)

export const createContact = createAsyncThunk('contacts/create', async (payload, { rejectWithValue }) => {
  try {
    return await contactApi.create(payload)
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not create contact.')
  }
})

export const updateContact = createAsyncThunk('contacts/update', async ({ id, payload }, { rejectWithValue }) => {
  try {
    return await contactApi.update(id, payload)
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not update contact.')
  }
})

export const deleteContact = createAsyncThunk('contacts/delete', async (id, { rejectWithValue }) => {
  try {
    await contactApi.remove(id)
    return id
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not delete contact.')
  }
})

export const assignContactToInteraction = createAsyncThunk(
  'contacts/assignInteraction',
  async ({ contactId, interactionId, channel, previousContactId, actorName }, { rejectWithValue }) => {
    try {
      return await contactApi.assignInteraction(contactId, { interactionId, channel, previousContactId, actorName })
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || 'Could not assign this contact.')
    }
  }
)

export const unassignContactFromInteraction = createAsyncThunk(
  'contacts/unassignInteraction',
  async ({ contactId, interactionId, channel, actorName }, { rejectWithValue }) => {
    try {
      return await contactApi.unassignInteraction(contactId, interactionId, { channel, actorName })
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || 'Could not remove this contact.')
    }
  }
)

const contactsSlice = createSlice({
  name: 'contacts',
  initialState,
  reducers: {
    setContactSearch(state, action) {
      state.search = action.payload
    },
    clearContactSaveError(state) {
      state.saveError = null
    },
    clearAssignError(state) {
      state.assignError = null
    }
  },
  extraReducers(builder) {
    builder
      .addCase(fetchContacts.pending, (state) => {
        state.status = 'loading'
      })
      .addCase(fetchContacts.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload?.data || []
      })
      .addCase(fetchContacts.rejected, (state) => {
        state.status = 'failed'
      })

      .addCase(fetchContactActivity.fulfilled, (state, action) => {
        state.activityByContactId[action.payload.contactId] = action.payload.activity
      })

      .addCase(createContact.pending, (state) => {
        state.saving = true
        state.saveError = null
      })
      .addCase(createContact.fulfilled, (state, action) => {
        state.saving = false
        state.items.unshift(action.payload?.data)
      })
      .addCase(createContact.rejected, (state, action) => {
        state.saving = false
        state.saveError = action.payload
      })

      .addCase(updateContact.pending, (state) => {
        state.saving = true
        state.saveError = null
      })
      .addCase(updateContact.fulfilled, (state, action) => {
        state.saving = false
        const idx = state.items.findIndex((c) => c._id === action.payload?.data?._id)
        if (idx !== -1) state.items[idx] = action.payload.data
      })
      .addCase(updateContact.rejected, (state, action) => {
        state.saving = false
        state.saveError = action.payload
      })

      .addCase(deleteContact.fulfilled, (state, action) => {
        state.items = state.items.filter((c) => c._id !== action.payload)
      })

      .addCase(assignContactToInteraction.pending, (state) => {
        state.assigning = true
        state.assignError = null
      })
      .addCase(assignContactToInteraction.fulfilled, (state, action) => {
        state.assigning = false
        const idx = state.items.findIndex((c) => c._id === action.payload?.data?._id)
        if (idx !== -1) state.items[idx] = action.payload.data
      })
      .addCase(assignContactToInteraction.rejected, (state, action) => {
        state.assigning = false
        state.assignError = action.payload
      })

      .addCase(unassignContactFromInteraction.fulfilled, (state, action) => {
        const idx = state.items.findIndex((c) => c._id === action.payload?.data?._id)
        if (idx !== -1) state.items[idx] = action.payload.data
      })

    addLogoutReset(builder, () => initialState)
  }
})

export const { setContactSearch, clearContactSaveError, clearAssignError } = contactsSlice.actions

export const selectAllContacts = (state) => state.contacts.items
export const selectContactsStatus = (state) => state.contacts.status
export const selectContactSaving = (state) => state.contacts.saving
export const selectContactSaveError = (state) => state.contacts.saveError
export const selectContactById = (state, id) => state.contacts.items.find((c) => c._id === id) || null
export const selectContactActivity = (state, id) => state.contacts.activityByContactId[id] || []
export const selectAssigning = (state) => state.contacts.assigning
export const selectAssignError = (state) => state.contacts.assignError

// Which contact (if any) is linked to a given interaction — used by the
// Inbox Contacts tab to show "currently linked" vs offering to assign one.
export const selectContactByInteractionId = (state, interactionId) =>
  state.contacts.items.find((c) => c.interactions?.some((i) => i.interactionId === interactionId)) || null

export default contactsSlice.reducer