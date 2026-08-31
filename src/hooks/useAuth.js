import { useDispatch, useSelector } from 'react-redux'
import { logout as logoutAction, selectAuth, selectIsAuthenticated } from '../features/auth/authSlice'

export function useAuth() {
  const dispatch = useDispatch()
  const { user, tenant, status, error } = useSelector(selectAuth)
  const isAuthenticated = useSelector(selectIsAuthenticated)

  return {
    user,
    tenant,
    status,
    error,
    isAuthenticated,
    isAdmin: user?.role === 'ADMIN',
    logout: () => dispatch(logoutAction())
  }
}
