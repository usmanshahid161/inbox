import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import interactionRequestApi from '../../services/interactionRequestApi'
import { addLogoutReset } from '../../utils/resetOnLogout'

const initialState = {
  // Pending transfer/share invites this agent has received, shown as
  // toasts with Accept/Reject — see components/inbox/RequestToast.jsx
  incoming: [],
  proposing: false,
  proposeError: null
}

export const transferInteraction = createAsyncThunk(
  'interactionRequests/transfer',
  async ({ interactionId, toAgentId, fromAgentName }, { rejectWithValue }) => {
    try {
      return await interactionRequestApi.transfer(interactionId, { toAgentId, fromAgentName })
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || 'Could not transfer this conversation.')
    }
  }
)

export const shareInteraction = createAsyncThunk(
  'interactionRequests/share',
  async ({ interactionId, toAgentId, fromAgentName }, { rejectWithValue }) => {
    try {
      return await interactionRequestApi.share(interactionId, { toAgentId, fromAgentName })
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || 'Could not share this conversation.')
    }
  }
)

export const acceptRequest = createAsyncThunk(
  'interactionRequests/accept',
  async (requestId, { rejectWithValue }) => {
    try {
      await interactionRequestApi.accept(requestId)
      return requestId
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || 'Could not accept.')
    }
  }
)

export const rejectRequest = createAsyncThunk(
  'interactionRequests/reject',
  async (requestId, { rejectWithValue }) => {
    try {
      await interactionRequestApi.reject(requestId)
      return requestId
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || 'Could not reject.')
    }
  }
)

const interactionRequestsSlice = createSlice({
  name: 'interactionRequests',
  initialState,
  reducers: {
    // Driven by the realtime personal-channel event when someone
    // transfers/shares a conversation with this agent.
    requestReceived(state, action) {
      state.incoming.push(action.payload)
    },
    requestDismissed(state, action) {
      state.incoming = state.incoming.filter((r) => r.requestId !== action.payload)
    },
    clearProposeError(state) {
      state.proposeError = null
    }
  },
  extraReducers(builder) {
    builder
      .addCase(transferInteraction.pending, (state) => {
        state.proposing = true
        state.proposeError = null
      })
      .addCase(transferInteraction.fulfilled, (state) => {
        state.proposing = false
      })
      .addCase(transferInteraction.rejected, (state, action) => {
        state.proposing = false
        state.proposeError = action.payload
      })
      .addCase(shareInteraction.pending, (state) => {
        state.proposing = true
        state.proposeError = null
      })
      .addCase(shareInteraction.fulfilled, (state) => {
        state.proposing = false
      })
      .addCase(shareInteraction.rejected, (state, action) => {
        state.proposing = false
        state.proposeError = action.payload
      })
      .addCase(acceptRequest.fulfilled, (state, action) => {
        state.incoming = state.incoming.filter((r) => r.requestId !== action.payload)
      })
      .addCase(rejectRequest.fulfilled, (state, action) => {
        state.incoming = state.incoming.filter((r) => r.requestId !== action.payload)
      })

    addLogoutReset(builder, () => initialState)
  }
})

export const { requestReceived, requestDismissed, clearProposeError } = interactionRequestsSlice.actions

export const selectIncomingRequests = (state) => state.interactionRequests.incoming
export const selectProposing = (state) => state.interactionRequests.proposing
export const selectProposeError = (state) => state.interactionRequests.proposeError

export default interactionRequestsSlice.reducer
