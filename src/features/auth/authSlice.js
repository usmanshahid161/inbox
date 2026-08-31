import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import authApi from '../../services/authApi'
import { centrifugeService } from '../../services/centrifuge'

const STORAGE_KEY = 'support_inbox_session'

function loadPersistedSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function persistSession(session) {
  if (session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

const persisted = loadPersistedSession()

const initialState = {
  token: persisted?.token || null,
  user: persisted?.user || null,
  tenant: persisted?.tenant || null,
  status: 'idle', // idle | loading | succeeded | failed
  error: null,
  refreshToken: persisted?.refreshToken || null
}

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const data = await authApi.login(credentials)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Unable to sign in. Check your credentials and try again.')
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Explicit, user-initiated sign-out.
    logout(state) {
      resetAuthState(state)
      persistSession(null)
      centrifugeService.disconnect()
    },
    // Fired by the axios response interceptor on a 401. Other slices listen
    // for this same action type (and `auth/logout`) to clear their own
    // tenant-scoped state — see the `resettableSlice` helper below.
    sessionExpired(state) {
      resetAuthState(state)
      state.error = 'Your session has expired. Please sign in again.'
      persistSession(null)
      centrifugeService.disconnect()
    },
    clearAuthError(state) {
      state.error = null
    }
  },
  extraReducers(builder) {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.token = action.payload.data?.accessToken
        state.refreshToken = action.payload.data?.refreshToken
        state.user = action.payload.data.user
        state.tenant = action.payload.data.tenant
        persistSession({ token: state.token, user: state.user, tenant: state.tenant })
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload || 'Something went wrong. Please try again.'
      })
  }
})

function resetAuthState(state) {
  state.token = null
  state.user = null
  state.tenant = null
  state.status = 'idle'
  state.error = null
}

export const { logout, sessionExpired, clearAuthError } = authSlice.actions

export const selectAuth = (state) => state.auth
export const selectIsAuthenticated = (state) => Boolean(state.auth.token)
export const selectCurrentUser = (state) => state.auth.user
export const selectCurrentTenant = (state) => state.auth.tenant

export default authSlice.reducer
