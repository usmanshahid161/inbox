import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import channelApi from '../../services/channelApi'
import { addLogoutReset } from '../../utils/resetOnLogout'

const initialState = {
  items: [],
  status: 'idle', // idle | loading | succeeded | failed
  error: null
}

export const fetchChannels = createAsyncThunk('channels/fetch', async (_, { rejectWithValue }) => {
  try {
    return await channelApi.list()
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not load channels.')
  }
})

export const toggleChannel = createAsyncThunk('channels/toggle', async ({ channelId, enabled }, { rejectWithValue }) => {
  try {
    return await channelApi.toggle(channelId, enabled)
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not update channel.')
  }
})

const channelsSlice = createSlice({
  name: 'channels',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchChannels.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchChannels.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.items = action.payload
      })
      .addCase(fetchChannels.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
      .addCase(toggleChannel.fulfilled, (state, action) => {
        const idx = state.items.findIndex((c) => c.id === action.payload.id)
        if (idx !== -1) state.items[idx] = action.payload
      })
    addLogoutReset(builder, () => initialState)
  }
})

export const selectChannels = (state) => state.channels.items
export const selectChannelsStatus = (state) => state.channels.status
export const selectChannelById = (state, id) => state.channels.items.find((c) => c.id === id)
export default channelsSlice.reducer
