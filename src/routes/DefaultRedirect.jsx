import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function DefaultRedirect() {
  const { isAuthenticated, isAdmin } = useAuth()

  if (!isAuthenticated) return <Navigate to="/login" replace />

  return <Navigate to={isAdmin ? '/app/analytics' : '/app/inbox'} replace />
}
