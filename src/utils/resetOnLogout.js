// Shared helper so every tenant-scoped slice clears itself the same way when
// the user logs out or their session expires (see authSlice's `logout` and
// `sessionExpired` actions). This is what guarantees no tenant data can
// leak into the next login on the same browser tab.
export function addLogoutReset(builder, getInitialState) {
  builder.addMatcher(
    (action) => action.type === 'auth/logout' || action.type === 'auth/sessionExpired',
    () => getInitialState()
  )
}
