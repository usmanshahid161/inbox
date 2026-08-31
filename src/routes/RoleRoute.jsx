import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

// Wrap a <Route element> with this to restrict it by role. Sits inside
// ProtectedRoute (so isAuthenticated is already guaranteed) — this only
// adds the role check on top. An agent hitting an admin-only URL directly
// (or vice versa) lands on their own home instead of the page rendering,
// same as DefaultRedirect's role split.
export default function RoleRoute({ allow, children }) {
  const { isAdmin } = useAuth()
  const role = isAdmin ? 'ADMIN' : 'AGENT'

  if (!allow.includes(role)) {
    return <Navigate to={isAdmin ? '/app/analytics' : '/app/inbox'} replace />
  }

  return children
}