import { createSlice, nanoid } from '@reduxjs/toolkit'

const THEME_STORAGE_KEY = 'support_inbox_theme'

function loadInitialTheme() {
  const stored = typeof window !== 'undefined' ? localStorage.getItem(THEME_STORAGE_KEY) : null
  if (stored === 'light' || stored === 'dark') return stored
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

const initialState = {
  theme: loadInitialTheme(), // 'light' | 'dark'
  isMobileSidebarOpen: false,
  isCustomerDetailsCollapsed: false,
  isCustomerDetailsDrawerOpen: false, // mobile drawer
  connectionState: 'disconnected', // connecting | connected | disconnected
  toasts: [],
  confirmDialog: null // { title, description, confirmLabel, tone, onConfirmActionType }
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme(state, action) {
      state.theme = action.payload
      if (typeof window !== 'undefined') localStorage.setItem(THEME_STORAGE_KEY, action.payload)
    },
    toggleTheme(state) {
      state.theme = state.theme === 'dark' ? 'light' : 'dark'
      if (typeof window !== 'undefined') localStorage.setItem(THEME_STORAGE_KEY, state.theme)
    },
    openMobileSidebar(state) {
      state.isMobileSidebarOpen = true
    },
    closeMobileSidebar(state) {
      state.isMobileSidebarOpen = false
    },
    toggleCustomerDetails(state) {
      state.isCustomerDetailsCollapsed = !state.isCustomerDetailsCollapsed
    },
    openCustomerDetailsDrawer(state) {
      state.isCustomerDetailsDrawerOpen = true
    },
    closeCustomerDetailsDrawer(state) {
      state.isCustomerDetailsDrawerOpen = false
    },
    setConnectionState(state, action) {
      state.connectionState = action.payload
    },
    showToast: {
      reducer(state, action) {
        state.toasts.push(action.payload)
      },
      prepare({ message, tone = 'default' }) {
        return { payload: { id: nanoid(), message, tone } }
      }
    },
    dismissToast(state, action) {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload)
    },
    openConfirmDialog(state, action) {
      state.confirmDialog = action.payload
    },
    closeConfirmDialog(state) {
      state.confirmDialog = null
    }
  }
})

export const {
  setTheme,
  toggleTheme,
  openMobileSidebar,
  closeMobileSidebar,
  toggleCustomerDetails,
  openCustomerDetailsDrawer,
  closeCustomerDetailsDrawer,
  setConnectionState,
  showToast,
  dismissToast,
  openConfirmDialog,
  closeConfirmDialog
} = uiSlice.actions

export const selectTheme = (state) => state.ui.theme
export const selectIsMobileSidebarOpen = (state) => state.ui.isMobileSidebarOpen
export const selectIsCustomerDetailsCollapsed = (state) => state.ui.isCustomerDetailsCollapsed
export const selectIsCustomerDetailsDrawerOpen = (state) => state.ui.isCustomerDetailsDrawerOpen
export const selectConnectionState = (state) => state.ui.connectionState
export const selectToasts = (state) => state.ui.toasts
export const selectConfirmDialog = (state) => state.ui.confirmDialog

export default uiSlice.reducer
