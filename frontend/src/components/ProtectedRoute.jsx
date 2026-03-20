import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export function ProtectedRoute({ children, requireBusiness = true }) {
  const { user, business, loading } = useAuth()

  if (loading) return null

  // not logged in → login page
  if (!user) return <Navigate to="/login" replace />

  // logged in but no business → setup page
  if (requireBusiness && !business) return <Navigate to="/setup" replace />

  return children
}

export function PublicRoute({ children }) {
  const { user, business, loading } = useAuth()

  if (loading) return null

  // already logged in + has business → dashboard
  if (user && business) return <Navigate to="/dashboard" replace />

  // logged in but no business yet → setup
  if (user && !business) return <Navigate to="/setup" replace />

  return children
}