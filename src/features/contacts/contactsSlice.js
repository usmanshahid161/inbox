import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import contactApi from '../../services/contactApi'
import { addLogoutReset } from '../../utils/resetOnLogout'

const initialState = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 10,
  search: '',
  channelFilter: 'ALL',
  status: 'idle',
  error: null
}

export const fetchContacts = createAsyncThunk('contacts/fetch', async (_, { getState, rejectWithValue }) => {
  try {
    const { page, pageSize, search, channelFilter } = getState().contacts
    return await contactApi.list({ page, pageSize, search, channel: channelFilter })
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not load contacts.')
  }
})

const contactsSlice = createSlice({
  name: 'contacts',
  initialState,
  reducers: {
    setContactsSearch(state, action) {
      state.search = action.payload
      state.page = 1
    },
    setContactsChannelFilter(state, action) {
      state.channelFilter = action.payload
      state.page = 1
    },
    setContactsPage(state, action) {
      state.page = action.payload
    }
  },
  extraReducers(builder) {
    builder
      .addCase(fetchContacts.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchContacts.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload.items
        state.total = action.payload.total
      })
      .addCase(fetchContacts.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
    addLogoutReset(builder, () => initialState)
  }
})

export const { setContactsSearch, setContactsChannelFilter, setContactsPage } = contactsSlice.actions
export const selectContacts = (state) => state.contacts.items
export const selectContactsMeta = (state) => state.contacts
export default contactsSlice.reducer
