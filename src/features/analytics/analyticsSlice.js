import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import analyticsApi from '../../services/analyticsApi'
import { addLogoutReset } from '../../utils/resetOnLogout'

const initialState = {
  data: null,
  status: 'idle',
  error: null
}

export const fetchAnalytics = createAsyncThunk('analytics/fetch', async (_, { rejectWithValue }) => {
  try {
    return await analyticsApi.summary()
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not load analytics.')
  }
})

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(fetchAnalytics.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.data = action.payload
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload
      })
    addLogoutReset(builder, () => initialState)
  }
})

export const selectAnalyticsData = (state) => state.analytics.data
export const selectAnalyticsStatus = (state) => state.analytics.status
export default analyticsSlice.reducer
