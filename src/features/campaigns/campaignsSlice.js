import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import campaignApi from '../../services/campaignApi'
import { addLogoutReset } from '../../utils/resetOnLogout'

const initialState = {
  contactLists: [],
  contactListsStatus: 'idle',

  contacts: { items: [], total: 0, page: 1, limit: 50 },
  contactsStatus: 'idle',

  campaigns: [],
  campaignsStatus: 'idle',

  currentCampaign: null,
  currentCampaignStatus: 'idle',

  recipients: { items: [], total: 0, page: 1, limit: 50 },
  recipientsStatus: 'idle',

  optOuts: [],
  optOutsStatus: 'idle',

  saving: false,
  saveError: null,

  importResult: null,
  importing: false
}

// ---- Contact lists ----
export const fetchContactLists = createAsyncThunk('campaigns/fetchContactLists', async (_, { rejectWithValue }) => {
  try {
    return await campaignApi.listContactLists()
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not load contact lists.')
  }
})

export const createContactList = createAsyncThunk('campaigns/createContactList', async (payload, { dispatch, rejectWithValue }) => {
  try {
    const list = await campaignApi.createContactList(payload)
    dispatch(fetchContactLists())
    return list
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not create list.')
  }
})

export const updateContactList = createAsyncThunk('campaigns/updateContactList', async ({ id, payload }, { dispatch, rejectWithValue }) => {
  try {
    const list = await campaignApi.updateContactList(id, payload)
    dispatch(fetchContactLists())
    return list
  } catch (err) {
    // 409 here means "this needs confirmReset:true" — surfaced with its
    // details intact so the caller can show the count and re-submit with
    // confirmation, instead of a flat error message swallowing that.
    if (err?.response?.status === 409 && err.response.data?.details?.requiresConfirmation) {
      return rejectWithValue({ requiresConfirmation: true, existingCount: err.response.data.details.existingCount })
    }
    return rejectWithValue({ message: err?.response?.data?.message || 'Could not update list.' })
  }
})

export const deleteContactList = createAsyncThunk('campaigns/deleteContactList', async (id, { rejectWithValue }) => {
  try {
    await campaignApi.deleteContactList(id)
    return id
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not delete list.')
  }
})

export const fetchContacts = createAsyncThunk('campaigns/fetchContacts', async ({ listId, page = 1 }, { rejectWithValue }) => {
  try {
    return await campaignApi.listContacts(listId, { page })
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not load contacts.')
  }
})

export const addContact = createAsyncThunk('campaigns/addContact', async ({ listId, payload }, { dispatch, rejectWithValue }) => {
  try {
    const entry = await campaignApi.addContact(listId, payload)
    dispatch(fetchContacts({ listId }))
    dispatch(fetchContactLists())
    return entry
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not add contact.')
  }
})

export const removeContact = createAsyncThunk('campaigns/removeContact', async ({ listId, entryId }, { dispatch, rejectWithValue }) => {
  try {
    await campaignApi.removeContact(listId, entryId)
    dispatch(fetchContacts({ listId }))
    dispatch(fetchContactLists())
    return entryId
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not remove contact.')
  }
})

export const importCsv = createAsyncThunk('campaigns/importCsv', async ({ listId, file }, { dispatch, rejectWithValue }) => {
  try {
    const result = await campaignApi.importCsv(listId, file)
    dispatch(fetchContacts({ listId }))
    dispatch(fetchContactLists())
    return result
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not import CSV.')
  }
})

// ---- Campaigns ----
export const fetchCampaigns = createAsyncThunk('campaigns/fetchCampaigns', async (_, { rejectWithValue }) => {
  try {
    return await campaignApi.listCampaigns()
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not load campaigns.')
  }
})

export const fetchCampaign = createAsyncThunk('campaigns/fetchCampaign', async (id, { rejectWithValue }) => {
  try {
    return await campaignApi.getCampaign(id)
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not load campaign.')
  }
})

export const createCampaign = createAsyncThunk('campaigns/createCampaign', async (payload, { rejectWithValue }) => {
  try {
    return await campaignApi.createCampaign(payload)
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not create campaign.')
  }
})

export const updateCampaign = createAsyncThunk('campaigns/updateCampaign', async ({ id, payload }, { rejectWithValue }) => {
  try {
    return await campaignApi.updateCampaign(id, payload)
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not update campaign.')
  }
})

export const scheduleCampaign = createAsyncThunk('campaigns/scheduleCampaign', async (id, { rejectWithValue }) => {
  try {
    return await campaignApi.scheduleCampaign(id)
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not schedule campaign.')
  }
})

export const pauseCampaign = createAsyncThunk('campaigns/pauseCampaign', async (id, { rejectWithValue }) => {
  try {
    return await campaignApi.pauseCampaign(id)
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not pause campaign.')
  }
})

export const resumeCampaign = createAsyncThunk('campaigns/resumeCampaign', async (id, { rejectWithValue }) => {
  try {
    return await campaignApi.resumeCampaign(id)
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not resume campaign.')
  }
})

export const cancelCampaign = createAsyncThunk('campaigns/cancelCampaign', async (id, { rejectWithValue }) => {
  try {
    return await campaignApi.cancelCampaign(id)
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not cancel campaign.')
  }
})

export const deleteCampaign = createAsyncThunk('campaigns/deleteCampaign', async (id, { rejectWithValue }) => {
  try {
    await campaignApi.deleteCampaign(id)
    return id
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not delete campaign.')
  }
})

export const fetchRecipients = createAsyncThunk(
  'campaigns/fetchRecipients',
  async ({ id, status, page = 1 }, { rejectWithValue }) => {
    try {
      return await campaignApi.listRecipients(id, { status, page })
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || 'Could not load recipients.')
    }
  }
)

// ---- Opt-outs ----
export const fetchOptOuts = createAsyncThunk('campaigns/fetchOptOuts', async (_, { rejectWithValue }) => {
  try {
    return await campaignApi.listOptOuts()
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not load opt-outs.')
  }
})

export const removeOptOut = createAsyncThunk('campaigns/removeOptOut', async (phone, { dispatch, rejectWithValue }) => {
  try {
    await campaignApi.removeOptOut(phone)
    dispatch(fetchOptOuts())
    return phone
  } catch (err) {
    return rejectWithValue(err?.response?.data?.message || 'Could not remove opt-out.')
  }
})

const campaignsSlice = createSlice({
  name: 'campaigns',
  initialState,
  reducers: {
    clearImportResult(state) {
      state.importResult = null
    },
    clearCurrentCampaign(state) {
      state.currentCampaign = null
    }
  },
  extraReducers(builder) {
    builder
      .addCase(fetchContactLists.pending, (state) => { state.contactListsStatus = 'loading' })
      .addCase(fetchContactLists.fulfilled, (state, action) => {
        state.contactListsStatus = 'succeeded'
        state.contactLists = action.payload
      })
      .addCase(fetchContactLists.rejected, (state) => { state.contactListsStatus = 'failed' })

      .addCase(fetchContacts.pending, (state) => { state.contactsStatus = 'loading' })
      .addCase(fetchContacts.fulfilled, (state, action) => {
        state.contactsStatus = 'succeeded'
        state.contacts = action.payload
      })
      .addCase(fetchContacts.rejected, (state) => { state.contactsStatus = 'failed' })

      .addCase(importCsv.pending, (state) => { state.importing = true })
      .addCase(importCsv.fulfilled, (state, action) => {
        state.importing = false
        state.importResult = action.payload
      })
      .addCase(importCsv.rejected, (state, action) => {
        state.importing = false
        state.importResult = { error: action.payload }
      })

      .addCase(fetchCampaigns.pending, (state) => { state.campaignsStatus = 'loading' })
      .addCase(fetchCampaigns.fulfilled, (state, action) => {
        state.campaignsStatus = 'succeeded'
        state.campaigns = action.payload
      })
      .addCase(fetchCampaigns.rejected, (state) => { state.campaignsStatus = 'failed' })

      .addCase(fetchCampaign.pending, (state) => { state.currentCampaignStatus = 'loading' })
      .addCase(fetchCampaign.fulfilled, (state, action) => {
        state.currentCampaignStatus = 'succeeded'
        state.currentCampaign = action.payload
      })
      .addCase(fetchCampaign.rejected, (state) => { state.currentCampaignStatus = 'failed' })

      .addCase(createCampaign.pending, (state) => { state.saving = true; state.saveError = null })
      .addCase(createCampaign.fulfilled, (state, action) => {
        state.saving = false
        state.campaigns.unshift(action.payload)
      })
      .addCase(createCampaign.rejected, (state, action) => {
        state.saving = false
        state.saveError = action.payload
      })

      .addCase(updateCampaign.pending, (state) => { state.saving = true; state.saveError = null })
      .addCase(updateCampaign.fulfilled, (state, action) => {
        state.saving = false
        updateCampaignInPlace(state, action)
      })
      .addCase(updateCampaign.rejected, (state, action) => {
        state.saving = false
        state.saveError = action.payload
      })

      .addCase(pauseCampaign.fulfilled, updateCampaignInPlace)
      .addCase(resumeCampaign.fulfilled, updateCampaignInPlace)
      .addCase(cancelCampaign.fulfilled, updateCampaignInPlace)
      .addCase(scheduleCampaign.fulfilled, updateCampaignInPlace)

      .addCase(deleteCampaign.fulfilled, (state, action) => {
        state.campaigns = state.campaigns.filter((c) => c._id !== action.payload)
      })

      .addCase(fetchRecipients.pending, (state) => { state.recipientsStatus = 'loading' })
      .addCase(fetchRecipients.fulfilled, (state, action) => {
        state.recipientsStatus = 'succeeded'
        state.recipients = action.payload
      })
      .addCase(fetchRecipients.rejected, (state) => { state.recipientsStatus = 'failed' })

      .addCase(fetchOptOuts.pending, (state) => { state.optOutsStatus = 'loading' })
      .addCase(fetchOptOuts.fulfilled, (state, action) => {
        state.optOutsStatus = 'succeeded'
        state.optOuts = action.payload
      })
      .addCase(fetchOptOuts.rejected, (state) => { state.optOutsStatus = 'failed' })

    addLogoutReset(builder, () => initialState)
  }
})

function updateCampaignInPlace(state, action) {
  const idx = state.campaigns.findIndex((c) => c._id === action.payload._id)
  if (idx !== -1) state.campaigns[idx] = action.payload
  if (state.currentCampaign?._id === action.payload._id) state.currentCampaign = action.payload
}

export const { clearImportResult, clearCurrentCampaign } = campaignsSlice.actions

export const selectContactLists = (state) => state.campaigns.contactLists
export const selectContactListsStatus = (state) => state.campaigns.contactListsStatus
export const selectContacts = (state) => state.campaigns.contacts
export const selectContactsStatus = (state) => state.campaigns.contactsStatus
export const selectImportResult = (state) => state.campaigns.importResult
export const selectImporting = (state) => state.campaigns.importing

export const selectCampaigns = (state) => state.campaigns.campaigns
export const selectCampaignsStatus = (state) => state.campaigns.campaignsStatus
export const selectCurrentCampaign = (state) => state.campaigns.currentCampaign
export const selectCurrentCampaignStatus = (state) => state.campaigns.currentCampaignStatus
export const selectRecipients = (state) => state.campaigns.recipients
export const selectRecipientsStatus = (state) => state.campaigns.recipientsStatus
export const selectSaving = (state) => state.campaigns.saving
export const selectSaveError = (state) => state.campaigns.saveError

export const selectOptOuts = (state) => state.campaigns.optOuts
export const selectOptOutsStatus = (state) => state.campaigns.optOutsStatus

export default campaignsSlice.reducer
