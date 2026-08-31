import { createSlice } from '@reduxjs/toolkit'
import { login } from '../auth/authSlice'
import { addLogoutReset } from '../../utils/resetOnLogout'

const initialState = {
  tenant: null
}

const tenantSlice = createSlice({
  name: 'tenant',
  initialState,
  reducers: {
    updateTenantProfile(state, action) {
      if (state.tenant) {
        state.tenant = { ...state.tenant, ...action.payload }
      }
    }
  },
  extraReducers(builder) {
    builder.addCase(login.fulfilled, (state, action) => {
      // Tenant context always comes from the authenticated login response —
      // never from a route or query parameter.
      state.tenant = action.payload.tenant
    })
    addLogoutReset(builder, () => initialState)
  }
})

export const { updateTenantProfile } = tenantSlice.actions
export const selectTenant = (state) => state.tenant.tenant
export default tenantSlice.reducer
